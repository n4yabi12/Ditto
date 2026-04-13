use base64::{engine::general_purpose, Engine as _};
use image::GenericImageView;
use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
#[cfg(target_os = "macos")]
use std::sync::atomic::AtomicU64;
use std::sync::Arc;
use tauri::{AppHandle, Emitter, Manager};
use walkdir::WalkDir;

// ── Constants ────────────────────────────────────────────────────────────────

/// Maximum number of entries to keep in the hash cache.
const MAX_CACHE_ENTRIES: usize = 50_000;

/// Maximum size (bytes) for the cache JSON file. Entries are trimmed to stay under this.
const MAX_CACHE_FILE_BYTES: usize = 32 * 1024 * 1024; // 32 MB

/// Global counter for unique HEIC temp-file names (avoids race on subsec_nanos).
#[cfg(target_os = "macos")]
static HEIC_COUNTER: AtomicU64 = AtomicU64::new(0);

const SUPPORTED_EXTENSIONS: &[&str] = &[
    "jpg", "jpeg", "png", "gif", "bmp", "webp", "tiff", "tif", "heic", "heif",
    "cr2", "cr3", "nef", "nrw", "arw", "srf", "sr2",
    "raf", "orf", "rw2", "rwl", "pef", "ptx", "dng",
    "3fr", "fff", "mef", "mrw", "erf", "kdc", "dcr", "srw",
];

const RAW_EXTENSIONS: &[&str] = &[
    "cr2", "cr3", "nef", "nrw", "arw", "srf", "sr2",
    "raf", "orf", "rw2", "rwl", "pef", "ptx", "dng",
    "3fr", "fff", "mef", "mrw", "erf", "kdc", "dcr", "srw",
];

// ── App state ────────────────────────────────────────────────────────────────

pub struct ScanState {
    pub cancelled: Arc<AtomicBool>,
}

// ── Hash cache ───────────────────────────────────────────────────────────────

#[derive(Serialize, Deserialize, Default)]
struct HashCache {
    entries: HashMap<String, CacheEntry>,
}

#[derive(Serialize, Deserialize, Clone)]
struct CacheEntry {
    hash: u64,
    size: u64,
    modified: u64,
    width: u32,
    height: u32,
}

fn cache_path(app: &AppHandle) -> Option<std::path::PathBuf> {
    app.path().app_data_dir().ok().map(|p| p.join("hash_cache.json"))
}

fn load_cache(app: &AppHandle) -> HashCache {
    cache_path(app)
        .and_then(|p| std::fs::read_to_string(p).ok())
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

fn save_cache(app: &AppHandle, cache: &HashCache) {
    if let Some(path) = cache_path(app) {
        if let Some(parent) = path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }
        // Trim to MAX_CACHE_ENTRIES keeping the most recently modified files.
        let mut trimmed_entries = cache.entries.clone();
        if trimmed_entries.len() > MAX_CACHE_ENTRIES {
            let mut keys: Vec<_> = trimmed_entries.keys().cloned().collect();
            keys.sort_by_key(|k| trimmed_entries[k].modified);
            let remove_count = trimmed_entries.len() - MAX_CACHE_ENTRIES;
            for k in keys.into_iter().take(remove_count) {
                trimmed_entries.remove(&k);
            }
        }
        let trimmed = HashCache { entries: trimmed_entries };
        if let Ok(json) = serde_json::to_string(&trimmed) {
            // Guard against oversized cache files by dropping oldest entries
            // until the serialized size is within the limit.
            if json.len() > MAX_CACHE_FILE_BYTES {
                let mut reduced = trimmed;
                loop {
                    let entry_count = reduced.entries.len();
                    if entry_count == 0 { break; }
                    let drop_count = (entry_count / 4).max(1);
                    let mut keys: Vec<_> = reduced.entries.keys().cloned().collect();
                    keys.sort_by_key(|k| reduced.entries[k].modified);
                    for k in keys.into_iter().take(drop_count) {
                        reduced.entries.remove(&k);
                    }
                    if let Ok(smaller) = serde_json::to_string(&reduced) {
                        if smaller.len() <= MAX_CACHE_FILE_BYTES {
                            let _ = std::fs::write(path, smaller);
                            return;
                        }
                    } else {
                        break;
                    }
                }
            } else {
                let _ = std::fs::write(path, json);
            }
        }
    }
}

// ── Data types ───────────────────────────────────────────────────────────────

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ImageInfo {
    pub path: String,
    pub size: u64,
    pub width: u32,
    pub height: u32,
    pub modified: u64,
}

#[derive(Serialize, Clone, Debug)]
pub struct DuplicateGroup {
    pub id: usize,
    pub images: Vec<ImageInfo>,
}

#[derive(Serialize, Clone)]
struct ScanProgress {
    current: usize,
    total: usize,
    phase: String,
}

// ── Image loading ─────────────────────────────────────────────────────────────

fn load_image(path: &std::path::Path) -> Option<image::DynamicImage> {
    if let Ok(img) = image::open(path) {
        return Some(img);
    }
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_lowercase())
        .unwrap_or_default();

    #[cfg(target_os = "macos")]
    if matches!(ext.as_str(), "heic" | "heif") {
        return decode_heic_sips(path).ok();
    }

    if RAW_EXTENSIONS.contains(&ext.as_str()) {
        return decode_raw(path).ok();
    }
    None
}

/// macOS: convert HEIC → JPEG in temp dir via sips, then decode.
#[cfg(target_os = "macos")]
fn decode_heic_sips(path: &std::path::Path) -> Result<image::DynamicImage, String> {
    // Use a monotonic counter so parallel Rayon threads never collide on the tmp filename.
    let id = HEIC_COUNTER.fetch_add(1, Ordering::Relaxed);
    let tmp = std::env::temp_dir().join(format!("ditto_heic_{}.jpg", id));
    let status = std::process::Command::new("sips")
        .args([
            "-s", "format", "jpeg",
            path.to_str().ok_or("invalid path")?,
            "--out",
            tmp.to_str().ok_or("invalid tmp path")?,
        ])
        .status()
        .map_err(|e| e.to_string())?;
    if !status.success() {
        return Err("sips conversion failed".into());
    }
    let img = image::open(&tmp).map_err(|e| e.to_string())?;
    if let Err(e) = std::fs::remove_file(&tmp) {
        eprintln!("[ditto] Warning: failed to clean up HEIC temp file {:?}: {}", tmp, e);
    }
    Ok(img)
}

/// Extract the largest JPEG preview embedded in a RAW file.
///
/// Nearly all modern RAW formats (CR3, NEF, ARW, RAF, DNG, …) embed one or
/// more processed JPEG previews that already have white balance and tone curves
/// applied.  Decoding the embedded JPEG is also 5-10× faster than running a
/// full RAW pipeline through rawler.
///
/// Strategy: scan the first 64 MB of the file for JPEG SOI + marker sequences
/// (0xFF 0xD8 0xFF), attempt to decode each candidate, and return the image
/// with the largest pixel area (the full-size or near-full-size preview).
fn extract_embedded_jpeg(path: &std::path::Path) -> Option<image::DynamicImage> {
    // std::fs::read uses the file size as a capacity hint → 1-2 large ReadFile
    // calls per file.  take(N).read_to_end() instead makes ~2,048 small 8 KB
    // reads for a 16 MB limit, which multiplies across Rayon threads into
    // massive I/O syscall overhead on Windows.
    let all = std::fs::read(path).ok()?;
    let data = &all[..all.len().min(16 * 1024 * 1024)];

    let mut best: Option<image::DynamicImage> = None;
    let mut best_area: u64 = 0;
    let mut i = 0;

    while i + 3 < data.len() {
        // A valid JPEG must start with SOI (FF D8) followed by another marker byte (FF).
        if data[i] == 0xFF && data[i + 1] == 0xD8 && data[i + 2] == 0xFF {
            if let Ok(img) = image::load_from_memory_with_format(
                &data[i..],
                image::ImageFormat::Jpeg,
            ) {
                let area = img.width() as u64 * img.height() as u64;
                if area > best_area {
                    best_area = area;
                    best = Some(img);
                    // A preview larger than 2 MP is plenty for hashing and thumbnails.
                    if area >= 2_000_000 {
                        break;
                    }
                }
            }
            i += 2;
        } else {
            i += 1;
        }
    }
    best
}

/// Decode a RAW file to a DynamicImage.
///
/// Tries embedded JPEG first (color, fast, tone-mapped).
/// Falls back to rawler's bayer decode only when no embedded preview is found.
fn decode_raw(path: &std::path::Path) -> Result<image::DynamicImage, String> {
    // Prefer the embedded JPEG: it is in color, already tone-mapped, and faster.
    if let Some(img) = extract_embedded_jpeg(path) {
        return Ok(img);
    }

    // Fallback: decode raw bayer data via rawler (grayscale, linear light).
    let raw = rawler::decode_file(path).map_err(|e| format!("{:?}", e))?;
    let width = raw.width as u32;
    let height = raw.height as u32;

    let pixels: Vec<u8> = match raw.data {
        rawler::RawImageData::Integer(data) => {
            let max = data.iter().copied().max().unwrap_or(65535) as f32;
            let min = data.iter().copied().min().unwrap_or(0) as f32;
            let range = (max - min).max(1.0);
            data.iter()
                .map(|&v| (((v as f32 - min) / range) * 255.0) as u8)
                .collect()
        }
        rawler::RawImageData::Float(data) => {
            data.iter().map(|&v| (v.clamp(0.0, 1.0) * 255.0) as u8).collect()
        }
    };

    image::GrayImage::from_raw(width, height, pixels)
        .map(image::DynamicImage::ImageLuma8)
        .ok_or_else(|| "Buffer size mismatch".to_string())
}

// ── Hashing ───────────────────────────────────────────────────────────────────

fn dhash(img: &image::DynamicImage) -> u64 {
    let resized = img
        .resize_exact(9, 8, image::imageops::FilterType::Lanczos3)
        .grayscale();
    let pixels = resized.to_luma8().into_raw();
    let mut hash: u64 = 0;
    for row in 0..8usize {
        for col in 0..8usize {
            if pixels[row * 9 + col] > pixels[row * 9 + col + 1] {
                hash |= 1u64 << (row * 8 + col);
            }
        }
    }
    hash
}

fn hamming_distance(a: u64, b: u64) -> u32 {
    (a ^ b).count_ones()
}

// ── Error helpers ─────────────────────────────────────────────────────────────

/// Converts an std::io::ErrorKind into a user-facing message.
fn friendly_io_error(kind: std::io::ErrorKind) -> &'static str {
    match kind {
        std::io::ErrorKind::NotFound        => "File not found",
        std::io::ErrorKind::PermissionDenied => "Permission denied",
        std::io::ErrorKind::AlreadyExists   => "File already exists",
        _                                   => "Could not access file",
    }
}

// ── Scanning ──────────────────────────────────────────────────────────────────

fn scan_sync(
    app: AppHandle,
    path: String,
    threshold: u32,
    file_types: String,
    cancelled: Arc<AtomicBool>,
) -> Result<Vec<DuplicateGroup>, String> {
    // Clamp threshold to the valid Hamming distance range [0, 64].
    // Values above 64 would produce incorrect similarity% calculations.
    let threshold = threshold.min(64);

    // Build the active extension list from the file_types filter.
    // "all"     → everything in SUPPORTED_EXTENSIONS
    // "non_raw" → SUPPORTED_EXTENSIONS minus RAW_EXTENSIONS
    // "raw"     → RAW_EXTENSIONS only
    let active_exts: Vec<&str> = match file_types.as_str() {
        "raw"     => RAW_EXTENSIONS.to_vec(),
        "non_raw" => SUPPORTED_EXTENSIONS
            .iter()
            .copied()
            .filter(|e| !RAW_EXTENSIONS.contains(e))
            .collect(),
        _         => SUPPORTED_EXTENSIONS.to_vec(), // "all" or unknown → all
    };

    // 1. Collect image paths
    let image_paths: Vec<std::path::PathBuf> = WalkDir::new(&path)
        .follow_links(true)
        .into_iter()
        .filter_entry(|e| {
            // Skip Lightroom preview/cache directories (.lrdata contains Smart Preview DNGs
            // which are low-res proxies of originals — scanning them causes false duplicates
            // and dramatically inflates file counts).
            if e.depth() > 0 && e.file_type().is_dir() {
                let name = e.file_name().to_string_lossy();
                if name.ends_with(".lrdata") {
                    return false;
                }
            }
            true
        })
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
        .filter(|e| {
            e.path()
                .extension()
                .and_then(|ext| ext.to_str())
                .map(|ext| active_exts.contains(&ext.to_lowercase().as_str()))
                .unwrap_or(false)
        })
        .map(|e| e.path().to_owned())
        .collect();

    let total = image_paths.len();
    let _ = app.emit("scan_progress", ScanProgress { current: 0, total, phase: "Scanning images...".to_string() });

    if total == 0 {
        return Ok(vec![]);
    }

    // 2. Load hash cache
    let cache = load_cache(&app);
    let counter = Arc::new(AtomicUsize::new(0));
    let cancelled2 = Arc::clone(&cancelled);

    // 3. Compute hashes (parallel, cache-aware)
    struct HashResult {
        path: std::path::PathBuf,
        hash: u64,
        size: u64,
        width: u32,
        height: u32,
        modified: u64,
        new_entry: Option<(String, CacheEntry)>,
    }

    let raw_results: Vec<Option<HashResult>> = image_paths
        .par_iter()
        .map(|p| {
            if cancelled2.load(Ordering::Relaxed) {
                return None;
            }
            let metadata = std::fs::metadata(p).ok()?;
            let size = metadata.len();
            let modified = metadata
                .modified()
                .ok()
                .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                .map(|d| d.as_secs())
                .unwrap_or(0);
            let path_str = p.to_string_lossy().to_string();

            // Use cached hash if file hasn't changed
            let cached = cache.entries.get(&path_str)
                .filter(|e| e.size == size && e.modified == modified);

            let (hash, width, height, new_entry) = if let Some(c) = cached {
                (c.hash, c.width, c.height, None)
            } else {
                let img = load_image(p)?;
                let h = dhash(&img);
                let (w, dh) = img.dimensions();
                let entry = CacheEntry { hash: h, size, modified, width: w, height: dh };
                (h, w, dh, Some((path_str.clone(), entry)))
            };

            let count = counter.fetch_add(1, Ordering::Relaxed) + 1;
            if count % 20 == 0 || count == total {
                let _ = app.emit("scan_progress", ScanProgress {
                    current: count,
                    total,
                    phase: "Computing hashes...".to_string(),
                });
            }

            Some(HashResult { path: p.clone(), hash, size, width, height, modified, new_entry })
        })
        .collect();

    if cancelled.load(Ordering::Relaxed) {
        return Err("cancelled".to_string());
    }

    // 4. Flatten results + update cache
    let mut updated_cache = cache;
    let mut cache_dirty = false;
    let mut entries: Vec<(std::path::PathBuf, u64, u64, u32, u32, u64)> = Vec::new(); // path, hash, size, w, h, modified

    for r in raw_results.into_iter().flatten() {
        if let Some((key, entry)) = r.new_entry {
            updated_cache.entries.insert(key, entry);
            cache_dirty = true;
        }
        entries.push((r.path, r.hash, r.size, r.width, r.height, r.modified));
    }

    // Prune stale entries within the scan path only.
    // Calling .exists() on every cache entry is expensive (one syscall each).
    // Instead, compare against the set of paths we actually found this scan.
    let scanned_set: std::collections::HashSet<&str> = entries
        .iter()
        .filter_map(|(p, ..)| p.to_str())
        .collect();
    let before = updated_cache.entries.len();
    updated_cache.entries.retain(|cached_path, _| {
        if cached_path.starts_with(&path) {
            scanned_set.contains(cached_path.as_str())
        } else {
            true // outside scan scope — keep as-is
        }
    });
    if updated_cache.entries.len() != before {
        cache_dirty = true;
    }

    if cache_dirty {
        save_cache(&app, &updated_cache);
    }

    let n = entries.len();
    let _ = app.emit("scan_progress", ScanProgress {
        current: 0,
        total: n,
        phase: "Analyzing duplicates...".to_string(),
    });

    // 5. Complete-linkage clustering
    // An image joins a group only if it is within `threshold` of ALL existing
    // members — prevents the transitive false-positive chaining of Union-Find.
    //
    // Performance: `rep_hashes` stores each group's representative (first member)
    // hash as a flat Vec<u64>.  This lets the outer loop iterate contiguous memory
    // (CPU-cache friendly) and skip the inner Vec<usize> dereference for most
    // groups — a group can only accept image i if its representative is already
    // within threshold (complete-linkage invariant), so any group whose rep hash
    // is too far is skipped immediately without touching its member list.
    let mut groups: Vec<Vec<usize>> = Vec::new();
    let mut rep_hashes: Vec<u64> = Vec::new();

    for i in 0..n {
        if i % 500 == 0 {
            if cancelled.load(Ordering::Relaxed) {
                return Err("cancelled".to_string());
            }
            let _ = app.emit("scan_progress", ScanProgress {
                current: i,
                total: n,
                phase: "Analyzing duplicates...".to_string(),
            });
        }

        let hash_i = entries[i].1;
        let mut placed = false;

        for gid in 0..groups.len() {
            // Fast pre-check: if the representative hash is already outside threshold,
            // no member of this group can satisfy complete-linkage — skip entirely.
            if hamming_distance(hash_i, rep_hashes[gid]) > threshold {
                continue;
            }
            // Full complete-linkage check against all members.
            let all_close = groups[gid]
                .iter()
                .all(|&j| hamming_distance(hash_i, entries[j].1) <= threshold);
            if all_close {
                groups[gid].push(i);
                placed = true;
                break;
            }
        }

        if !placed {
            rep_hashes.push(hash_i);
            groups.push(vec![i]);
        }
    }

    // 6. Build output — only groups with 2+ images
    // Sort by size FIRST so that IDs are assigned in final display order.
    // (Assigning IDs before sorting caused the largest group to appear at the
    //  top while still labelled "Group 8" or whichever clustering index it had.)
    let mut raw_groups: Vec<Vec<usize>> = groups
        .into_iter()
        .filter(|g| g.len() > 1)
        .collect();

    raw_groups.sort_by(|a, b| b.len().cmp(&a.len()));

    let duplicate_groups: Vec<DuplicateGroup> = raw_groups
        .into_iter()
        .enumerate()
        .map(|(id, indices)| {
            let mut images: Vec<ImageInfo> = indices
                .iter()
                .map(|&i| ImageInfo {
                    path: entries[i].0.to_string_lossy().to_string(),
                    size: entries[i].2,
                    width: entries[i].3,
                    height: entries[i].4,
                    modified: entries[i].5,
                })
                .collect();

            images.sort_by(|a, b| b.modified.cmp(&a.modified));
            DuplicateGroup { id, images }
        })
        .collect();

    Ok(duplicate_groups)
}

// ── Data structures for command results ─────────────────────────────────────

/// Returned by delete commands so the frontend knows exactly which files
/// succeeded and which failed, preventing UI/filesystem state divergence.
#[derive(Serialize)]
pub struct DeleteResult {
    pub deleted: Vec<String>,
    pub failed: Vec<(String, String)>, // (path, user_friendly_error_message)
}

// ── Tauri commands ────────────────────────────────────────────────────────────

#[tauri::command]
async fn scan_directory(
    app: AppHandle,
    state: tauri::State<'_, ScanState>,
    path: String,
    threshold: u32,
    file_types: String,
) -> Result<Vec<DuplicateGroup>, String> {
    state.cancelled.store(false, Ordering::Relaxed);
    let cancelled = Arc::clone(&state.cancelled);
    tokio::task::spawn_blocking(move || scan_sync(app, path, threshold, file_types, cancelled))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
async fn cancel_scan(state: tauri::State<'_, ScanState>) -> Result<(), String> {
    state.cancelled.store(true, Ordering::Relaxed);
    Ok(())
}

#[tauri::command]
async fn get_thumbnail(path: String, max_size: u32) -> Result<String, String> {
    tokio::task::spawn_blocking(move || {
        let img = load_image(std::path::Path::new(&path))
            .ok_or_else(|| format!("Failed to load image: {}", path))?;
        let thumb = img.thumbnail(max_size, max_size);
        let mut buf = Vec::new();
        thumb
            .write_to(&mut std::io::Cursor::new(&mut buf), image::ImageFormat::Jpeg)
            .map_err(|e| e.to_string())?;
        Ok(general_purpose::STANDARD.encode(&buf))
    })
    .await
    .map_err(|e| e.to_string())?
}

/// Move files to the OS trash/recycle bin.
///
/// Paths are canonicalized before deletion to resolve symlinks and confirm
/// existence. Errors are converted to user-friendly messages.
#[tauri::command]
async fn move_to_trash(paths: Vec<String>) -> Result<DeleteResult, String> {
    tokio::task::spawn_blocking(move || {
        let mut deleted = Vec::new();
        let mut failed = Vec::new();
        for path in &paths {
            let p = std::path::Path::new(path);
            match std::fs::canonicalize(p) {
                Ok(canonical) => {
                    match trash::delete(&canonical) {
                        Ok(_) => deleted.push(path.clone()),
                        Err(e) => {
                            // Map trash errors to user-friendly messages.
                            // trash::Error doesn't implement io::ErrorKind, so
                            // we inspect the Display string as a fallback.
                            let msg = e.to_string();
                            let friendly = if msg.contains("Permission") || msg.contains("Access is denied") {
                                "Permission denied"
                            } else if msg.contains("not found") || msg.contains("No such file") {
                                "File not found"
                            } else {
                                "Could not move to trash"
                            };
                            failed.push((path.clone(), friendly.to_string()));
                        }
                    }
                }
                Err(e) => {
                    failed.push((path.clone(), friendly_io_error(e.kind()).to_string()));
                }
            }
        }
        Ok(DeleteResult { deleted, failed })
    })
    .await
    .map_err(|e| e.to_string())?
}

/// Check whether a path points to an existing directory.
/// Used by the frontend to validate drag-and-drop targets before accepting them.
#[tauri::command]
async fn validate_folder(path: String) -> Result<bool, String> {
    Ok(std::path::Path::new(&path).is_dir())
}

#[tauri::command]
async fn reveal_in_finder(path: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    std::process::Command::new("open")
        .args(["-R", &path])
        .spawn()
        .map_err(|e| e.to_string())?;

    #[cfg(target_os = "windows")]
    std::process::Command::new("explorer")
        .args(["/select,", &path])
        .spawn()
        .map_err(|e| e.to_string())?;

    Ok(())
}

// ── Entry point ───────────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(ScanState {
            cancelled: Arc::new(AtomicBool::new(false)),
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            scan_directory,
            cancel_scan,
            get_thumbnail,
            move_to_trash,
            validate_folder,
            reveal_in_finder,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
