<script>
  import { listen } from "@tauri-apps/api/event";
  import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
  import { onMount, onDestroy } from "svelte";

  import { appState } from "$lib/stores/scan.svelte.js";
  import HomeView    from "$lib/components/HomeView.svelte";
  import ScanningView from "$lib/components/ScanningView.svelte";
  import ResultsView  from "$lib/components/ResultsView.svelte";
  import PreviewModal from "$lib/components/PreviewModal.svelte";
  import CompareModal from "$lib/components/CompareModal.svelte";

  /** @type {(()=>void)|null} */
  let unlisten     = null;
  /** @type {(()=>void)|null} */
  let unlistenDrop = null;

  onMount(async () => {
    // Restore persisted preferences (folder, sensitivity, sortKey)
    appState.restorePrefs();

    // Scan progress events from Rust backend
    unlisten = await listen("scan_progress", (e) => {
      appState.scanProgress = e.payload;
    });

    // Folder drag-and-drop onto the window
    const appWindow = getCurrentWebviewWindow();
    unlistenDrop = await appWindow.onDragDropEvent((e) => {
      if (e.payload.type === "over") {
        appState.isDragOver = true;
      } else if (e.payload.type === "leave" || e.payload.type === "drop" && !e.payload.paths?.length) {
        appState.isDragOver = false;
      } else if (e.payload.type === "drop" && e.payload.paths?.length > 0) {
        appState.isDragOver = false;
        if (appState.view === "home") appState.setFolderFromDrop(e.payload.paths[0]);
      }
    });

    window.addEventListener("keydown", handleGlobalKey);
  });

  onDestroy(() => {
    if (unlisten)     unlisten();
    if (unlistenDrop) unlistenDrop();
    window.removeEventListener("keydown", handleGlobalKey);
  });

  function handleGlobalKey(/** @type {KeyboardEvent} */ e) {
    // Escape: close modals in priority order
    if (e.key === "Escape") {
      if (appState.compareModal)    { appState.closeCompare();             return; }
      if (appState.previewImg)      { appState.closePreview();             return; }
      if (appState.confirmingDelete){ appState.confirmingDelete = false;   return; }
    }
    if (appState.view !== "results") return;
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    if (e.key === "a" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      appState.autoSelectAll();
    } else if (e.key === "d" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      appState.clearAll();
    } else if ((e.key === "Delete" || e.key === "Backspace") && appState.totalSelected > 0) {
      e.preventDefault();
      appState.confirmingDelete = true;
    }
  }
</script>

{#if appState.view === "home"}
  <HomeView />
{:else if appState.view === "scanning"}
  <ScanningView />
{:else if appState.view === "results"}
  <ResultsView />
{/if}

<!-- Global modals (rendered on top of any view) -->
<PreviewModal />
<CompareModal />

<!-- Error toast -->
{#if appState.error}
  <button class="toast" onclick={() => (appState.error = "")}>{appState.error}</button>
{/if}

<style>
  .toast {
    position: fixed;
    bottom: 18px; left: 50%;
    transform: translateX(-50%);
    background: var(--red);
    border: none;
    color: #fff;
    padding: 8px 18px;
    border-radius: 8px;
    font-size: .82rem;
    cursor: pointer;
    z-index: 200;
    max-width: 480px;
    text-align: center;
  }
</style>
