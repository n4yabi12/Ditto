import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { basename } from "$lib/utils.js";
import { t } from "$lib/i18n.svelte.js";

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * @typedef {{ path: string, size: number, width: number, height: number, modified: number }} ImageInfo
 * @typedef {{ id: number, images: ImageInfo[] }} DuplicateGroup
 * @typedef {{ img: ImageInfo, groupId: number }} CompareFirst
 * @typedef {{ imgA: ImageInfo, imgB: ImageInfo, srcA: string|null, srcB: string|null, groupIdA: number, groupIdB: number }} CompareModal
 */

// ── Sensitivity labels ────────────────────────────────────────────────────────

/** @type {Record<number, { labelKey: string, descKey: string }>} */
export const SENSITIVITY_KEYS = {
  1:  { labelKey: "sens_strictest", descKey: "sens_strictest_desc" },
  3:  { labelKey: "sens_strict",    descKey: "sens_strict_desc" },
  5:  { labelKey: "sens_balanced",  descKey: "sens_balanced_desc" },
  8:  { labelKey: "sens_loose",     descKey: "sens_loose_desc" },
  12: { labelKey: "sens_loosest",   descKey: "sens_loosest_desc" },
};

/** @param {number} val */
export function getSensitivityInfo(val) {
  const keys = Object.keys(SENSITIVITY_KEYS).map(Number).sort((a, b) => a - b);
  let best = keys[0];
  for (const k of keys) {
    if (val >= k) best = k;
  }
  const entry = SENSITIVITY_KEYS[best];
  return { label: t(entry.labelKey), desc: t(entry.descKey) };
}

// ── AppState ──────────────────────────────────────────────────────────────────

class AppState {
  // ── View
  view = $state(/** @type {"home"|"scanning"|"results"} */ ("home"));

  // ── Home
  selectedFolder = $state(/** @type {string} */ (""));
  sensitivity = $state(/** @type {number} */ (4));
  isDragOver = $state(/** @type {boolean} */ (false));
  error = $state(/** @type {string} */ (""));

  // ── Scan
  scanProgress = $state(/** @type {{ current: number, total: number, phase: string }} */ ({ current: 0, total: 0, phase: "" }));

  // ── Results
  groups = $state(/** @type {DuplicateGroup[]} */ ([]));
  /** @type {Record<number, Set<string>>} */
  selections = $state(/** @type {Record<number, Set<string>>} */ ({}));
  /** @type {Record<string, string|null>} */
  thumbnails = $state(/** @type {Record<string, string|null>} */ ({}));
  fileTypes = $state(/** @type {"all"|"non_raw"|"raw"} */ ("all"));
  confirmingDelete = $state(/** @type {boolean} */ (false));
  sortKey = $state(/** @type {"modified"|"resolution"|"size"|"name"} */ ("modified"));

  // ── Thumbnail concurrency limiter
  // Loading all RAW thumbnails simultaneously causes disk I/O thrashing.
  // Cap at 6 concurrent loads — each finishes faster than 20+ competing at once.
  #thumbActive = 0;
  #thumbQueue = /** @type {Array<() => void>} */ ([]);

  // ── Preview
  previewImg = $state(/** @type {string|null} */ (/** @type {string|null} */ (null)));
  previewSrc = $state(/** @type {string|null} */ (null));

  // ── Compare
  compareFirst = $state(/** @type {CompareFirst|null} */ (null));
  compareModal = $state(/** @type {CompareModal|null} */ (null));

  // ── Derived ──────────────────────────────────────────────────────────────

  pathSizeMap = $derived(
    new Map(this.groups.flatMap(g => g.images.map(i => [i.path, i.size])))
  );

  totalSelected = $derived(
    Object.values(this.selections).reduce((s, set) => s + set.size, 0)
  );

  totalDuplicates = $derived(
    this.groups.reduce((s, g) => s + g.images.length - 1, 0)
  );

  wasted = $derived.by(() => {
    const map = this.pathSizeMap;
    return Object.values(this.selections).reduce((sum, set) => {
      for (const p of set) sum += map.get(p) ?? 0;
      return sum;
    }, 0);
  });

  pct = $derived(
    this.scanProgress.total
      ? Math.round((this.scanProgress.current / this.scanProgress.total) * 100)
      : 0
  );

  // ── Persistence ───────────────────────────────────────────────────────────

  /** Restore all persisted preferences from localStorage. Called once on mount. */
  restorePrefs() {
    const folder = localStorage.getItem("ditto_last_folder");
    if (folder) this.selectedFolder = folder;

    const sens = localStorage.getItem("ditto_sensitivity");
    if (sens) {
      const n = parseInt(sens, 10);
      if (n >= 1 && n <= 15) this.sensitivity = n;
    }

    const sort = localStorage.getItem("ditto_sort_key");
    if (sort && ["modified", "resolution", "size", "name"].includes(sort)) {
      this.sortKey = /** @type {"modified"|"resolution"|"size"|"name"} */ (sort);
    }

    const ft = localStorage.getItem("ditto_file_types");
    if (ft && ["all", "non_raw", "raw"].includes(ft)) {
      this.fileTypes = /** @type {"all"|"non_raw"|"raw"} */ (ft);
    }
  }

  // ── Actions ──────────────────────────────────────────────────────────────

  async pickFolder() {
    const dir = await open({ directory: true, multiple: false });
    if (dir) this.selectedFolder = /** @type {string} */ (dir);
  }

  /**
   * Validate and set the selected folder from a drag-and-drop event.
   * Calls the Rust backend to confirm the path is an actual directory.
   * @param {string} path
   */
  async setFolderFromDrop(path) {
    try {
      const isDir = /** @type {boolean} */ (await invoke("validate_folder", { path }));
      if (isDir) {
        this.selectedFolder = path;
        this.error = "";
      } else {
        this.error = t("err_not_folder");
      }
    } catch {
      this.error = t("err_validate_folder");
    }
  }

  async startScan() {
    if (!this.selectedFolder) return;
    localStorage.setItem("ditto_last_folder", this.selectedFolder);
    localStorage.setItem("ditto_sensitivity", String(this.sensitivity));
    localStorage.setItem("ditto_sort_key", this.sortKey);
    localStorage.setItem("ditto_file_types", this.fileTypes);
    this.error = "";
    this.groups = [];
    this.selections = {};
    this.thumbnails = {};
    this.view = "scanning";
    this.scanProgress = { current: 0, total: 0, phase: "" };
    try {
      const result = /** @type {DuplicateGroup[]} */ (await invoke("scan_directory", {
        path: this.selectedFolder,
        threshold: this.sensitivity,
        fileTypes: this.fileTypes,
      }));
      this.groups = result;
      /** @type {Record<number, Set<string>>} */
      const newSel = {};
      for (const g of this.groups) newSel[g.id] = new Set();
      this.selections = newSel;
      this.view = "results";
    } catch (e) {
      const msg = String(e);
      this.view = "home";
      if (msg !== "cancelled") this.error = msg;
    }
  }

  async cancelScan() {
    await invoke("cancel_scan");
  }

  /** @param {string} path */
  async loadThumbnail(path) {
    if (this.thumbnails[path] !== undefined) return;
    this.thumbnails[path] = null; // mark as in-progress immediately

    // Wait for a slot if already at the concurrency limit.
    if (this.#thumbActive >= 6) {
      await new Promise(resolve => this.#thumbQueue.push(() => resolve(undefined)));
    }
    this.#thumbActive++;

    try {
      const b64 = /** @type {string} */ (await invoke("get_thumbnail", { path, maxSize: 320 }));
      this.thumbnails[path] = "data:image/jpeg;base64," + b64;
    } catch {
      this.thumbnails[path] = null;
    } finally {
      this.#thumbActive--;
      // Release the next queued load.
      const next = this.#thumbQueue.shift();
      if (next) next();
    }
  }

  /**
   * @param {number} groupId
   * @param {string} path
   */
  toggleSelect(groupId, path) {
    const s = new Set(this.selections[groupId] ?? []);
    s.has(path) ? s.delete(path) : s.add(path);
    this.selections = { ...this.selections, [groupId]: s };
  }

  /** @param {number} groupId */
  autoSelect(groupId) {
    const g = this.groups.find(g => g.id === groupId);
    if (!g) return;
    const best = g.images.reduce((a, b) =>
      a.width * a.height >= b.width * b.height ? a : b
    );
    this.selections = {
      ...this.selections,
      [groupId]: new Set(g.images.filter(i => i.path !== best.path).map(i => i.path)),
    };
  }

  /** @param {number} groupId */
  clearGroupSelection(groupId) {
    this.selections = { ...this.selections, [groupId]: new Set() };
  }

  autoSelectAll() {
    /** @type {Record<number, Set<string>>} */
    const newSel = { ...this.selections };
    for (const g of this.groups) {
      const best = g.images.reduce((a, b) =>
        a.width * a.height >= b.width * b.height ? a : b
      );
      newSel[g.id] = new Set(g.images.filter(i => i.path !== best.path).map(i => i.path));
    }
    this.selections = newSel;
  }

  clearAll() {
    /** @type {Record<number, Set<string>>} */
    const newSel = {};
    for (const g of this.groups) newSel[g.id] = new Set();
    this.selections = newSel;
  }

  async deleteSelected() {
    this.confirmingDelete = false;
    const allSelected = Object.entries(this.selections).flatMap(([, s]) => [...s]);
    if (!allSelected.length) return;
    try {
      const result = /** @type {{ deleted: string[], failed: [string, string][] }} */ (
        await invoke("move_to_trash", { paths: allSelected })
      );
      const deletedPaths = result.deleted;
      if (result.failed.length > 0) {
        const reason = result.failed[0][1];
        this.error = `${result.failed.length} file(s): ${reason}`;
      }
      const deleted = new Set(deletedPaths);
      this.groups = this.groups
        .map(g => ({ ...g, images: g.images.filter(i => !deleted.has(i.path)) }))
        .filter(g => g.images.length > 1);
      /** @type {Record<number, Set<string>>} */
      const newSel = {};
      for (const g of this.groups) {
        newSel[g.id] = new Set([...(this.selections[g.id] ?? [])].filter(p => !deleted.has(p)));
      }
      this.selections = newSel;
    } catch (e) {
      this.error = t("err_trash_failed");
    }
  }

  /** @param {string} path */
  async revealInFinder(path) {
    await invoke("reveal_in_finder", { path });
  }

  /** @param {string} path */
  async openPreview(path) {
    this.previewImg = path;
    this.previewSrc = null;
    try {
      const b64 = /** @type {string} */ (await invoke("get_thumbnail", { path, maxSize: 1200 }));
      this.previewSrc = "data:image/jpeg;base64," + b64;
    } catch {
      this.previewSrc = null;
    }
  }

  closePreview() {
    this.previewImg = null;
    this.previewSrc = null;
  }

  /**
   * @param {ImageInfo} img
   * @param {number} groupId
   */
  async pickCompare(img, groupId) {
    if (!this.compareFirst) {
      this.compareFirst = { img, groupId };
      return;
    }
    if (this.compareFirst.img.path === img.path) {
      this.compareFirst = null;
      return;
    }
    const a = this.compareFirst.img;
    const aGroupId = this.compareFirst.groupId;
    this.compareFirst = null;
    this.compareModal = {
      imgA: a, imgB: img,
      srcA: null, srcB: null,
      groupIdA: aGroupId, groupIdB: groupId,
    };
    const [b64A, b64B] = await Promise.all([
      invoke("get_thumbnail", { path: a.path, maxSize: 1200 }).catch(() => null),
      invoke("get_thumbnail", { path: img.path, maxSize: 1200 }).catch(() => null),
    ]);
    if (this.compareModal) {
      this.compareModal = {
        ...this.compareModal,
        srcA: b64A ? "data:image/jpeg;base64," + b64A : null,
        srcB: b64B ? "data:image/jpeg;base64," + b64B : null,
      };
    }
  }

  closeCompare() {
    this.compareModal = null;
    this.compareFirst = null;
  }

  /** @param {ImageInfo[]} images */
  sortImages(images) {
    const arr = [...images];
    switch (this.sortKey) {
      case "resolution": arr.sort((a, b) => (b.width * b.height) - (a.width * a.height)); break;
      case "size":       arr.sort((a, b) => b.size - a.size); break;
      case "name":       arr.sort((a, b) => basename(a.path).localeCompare(basename(b.path))); break;
      default:           arr.sort((a, b) => b.modified - a.modified); break;
    }
    return arr;
  }
}

export const appState = new AppState();
