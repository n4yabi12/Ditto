# Ditto

A desktop application for detecting and removing duplicate photos. Built with Tauri v2 and SvelteKit.

---

## Overview

Ditto scans a folder recursively, groups visually similar images using perceptual hashing, and lets you review and delete duplicates — keeping the highest-resolution copy by default.

Supported formats: JPEG, PNG, WebP, TIFF, BMP, GIF, HEIC, and major RAW formats (CR2, CR3, NEF, ARW, DNG, RAF, and more).

RAW files are displayed using their embedded JPEG preview, which preserves original color and exposure. Scanning can be filtered to All, Non-RAW, or RAW-only before starting.

---

## Features

- Perceptual duplicate detection via Difference Hash (dHash)
- Adjustable sensitivity — from near-identical copies to loosely similar scenes
- File type filter — scan All, Non-RAW, or RAW-only before starting
- Thumbnail grid with full-size image preview on click
- Side-by-side image comparison modal
- Auto-select duplicates, keeping the best-resolution image per group
- Sort images within groups by date, resolution, file size, or name
- Move to Trash or permanently delete selected files
- Reveal any file in Finder / Explorer
- Drag-and-drop folder selection
- Keyboard shortcuts (⌘A / Ctrl+A to auto-select all, ⌘D / Ctrl+D to clear, Delete/Backspace to delete)
- Dark mode support
- Hash cache — previously scanned files are cached and skipped on re-scan
- Skips Lightroom preview directories (`.lrdata`) automatically

---

## Requirements

### macOS

- macOS 10.15 or later
- [Node.js](https://nodejs.org) 18+
- [Rust](https://rustup.rs) (stable toolchain)
- Xcode Command Line Tools

  ```bash
  xcode-select --install
  ```

### Windows

- Windows 10 or later (WebView2 is included by default on Windows 11; on Windows 10 it installs automatically)
- [Node.js](https://nodejs.org) 18+
- [Rust](https://rustup.rs) (stable toolchain, MSVC target)
- [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) — select the "Desktop development with C++" workload

### Linux (untested)

> **Note:** Linux support has been implemented but has not been tested. Bug reports and feedback are welcome.

- A modern Linux distribution with WebKitGTK 4.1+
- [Node.js](https://nodejs.org) 18+
- [Rust](https://rustup.rs) (stable toolchain)
- System dependencies (Debian/Ubuntu):

  ```bash
  sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
  ```

---

## Development

Install dependencies:

```bash
npm install
```

Run in development mode:

```bash
npm run tauri dev
```

Build for production:

```bash
npm run tauri build
```

The compiled application will be in `src-tauri/target/release/`.
Installers (`.dmg` on macOS, `.msi` / `.exe` on Windows) are placed in `src-tauri/target/release/bundle/`.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | SvelteKit + Vite |
| State management | Svelte 5 runes (`$state`, `$derived`) |
| Backend | Rust (Tauri v2) |
| Image processing | `image` crate, `rawler` for RAW, `rayon` for parallel hashing |
| Duplicate detection | Difference Hash (dHash), complete-linkage clustering |

---

## Project Structure

```
src/
├── app.html                        # HTML shell
├── routes/
│   ├── +layout.js                  # SSR disabled, prerender enabled
│   ├── +layout.svelte              # Global CSS tokens & dark mode
│   └── +page.svelte                # Route shell + global event handlers
└── lib/
    ├── utils.js                    # fmt, fmtDate, basename utilities
    ├── stores/
    │   └── scan.svelte.js          # AppState class (all reactive state & actions)
    └── components/
        ├── HomeView.svelte         # Home screen (folder picker, sensitivity, file type filter)
        ├── ScanningView.svelte     # Scan progress screen
        ├── ResultsView.svelte      # Results grid, topbar, bottombar
        ├── ImageCard.svelte        # Individual image card
        ├── PreviewModal.svelte     # Full-size image preview
        └── CompareModal.svelte     # Side-by-side comparison

src-tauri/
├── src/
│   ├── main.rs                     # Entry point
│   └── lib.rs                      # All Tauri commands & image processing logic
├── capabilities/
│   └── default.json                # Minimal Tauri API permissions
└── tauri.conf.json                 # App config, CSP, window settings
```

---

## How It Works

1. The selected folder is walked recursively. Lightroom preview directories (`.lrdata`) are skipped automatically. Files are filtered by the chosen file type setting (All / Non-RAW / RAW Only).
2. Each image is loaded in parallel via Rayon. For RAW files, the embedded JPEG preview is extracted first (fast, color-correct); the raw Bayer data is only decoded as a fallback.
3. Each image is resized to 9×8 pixels, converted to grayscale, and a 64-bit perceptual hash is computed by comparing adjacent pixel brightness (dHash).
4. Previously seen files are served from a hash cache (keyed by path + size + mtime) and skipped entirely. The cache is capped at 50,000 entries.
5. Images are grouped with complete-linkage clustering: an image joins a group only if it is within the sensitivity threshold of every existing member, preventing false-positive chaining.
6. Groups with two or more images are shown in the results view, sorted by group size. The highest-resolution image in each group is marked as Best.

---

## Acknowledgements

This project was built with the assistance of AI (Claude, Anthropic). All code has been reviewed and tested by the maintainer.
