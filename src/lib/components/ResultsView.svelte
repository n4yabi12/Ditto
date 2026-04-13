<script>
  import { appState } from "$lib/stores/scan.svelte.js";
  import { fmt, basename } from "$lib/utils.js";
  import ImageCard from "$lib/components/ImageCard.svelte";

  // Load thumbnails for all visible images reactively
  $effect(() => {
    for (const g of appState.groups) {
      for (const img of g.images) {
        if (appState.thumbnails[img.path] === undefined) {
          appState.loadThumbnail(img.path);
        }
      }
    }
  });
</script>

<div class="app">

  <!-- Top bar -->
  <header class="topbar">
    <div class="topbar-left">
      <button class="btn-ghost" onclick={() => (appState.view = "home")}>
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="10 13 5 8 10 3"/>
        </svg>
        New Scan
      </button>
      <span class="topbar-divider"></span>
      <span class="folder-label" title={appState.selectedFolder}>
        <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" style="flex-shrink:0">
          <path d="M1.5 5A1.5 1.5 0 013 3.5h2.879a1.5 1.5 0 011.06.44l.622.621A1.5 1.5 0 008.621 5H13A1.5 1.5 0 0114.5 6.5v6A1.5 1.5 0 0113 14H3a1.5 1.5 0 01-1.5-1.5V5z"/>
        </svg>
        {basename(appState.selectedFolder) || appState.selectedFolder}
      </span>
    </div>

    <div class="topbar-stats">
      <span class="stat-pill"><strong>{appState.groups.length}</strong>&nbsp;{appState.groups.length === 1 ? 'group' : 'groups'}</span>
      <span class="stat-pill"><strong>{appState.totalDuplicates}</strong>&nbsp;{appState.totalDuplicates === 1 ? 'duplicate' : 'duplicates'}</span>
      {#if appState.totalSelected > 0}
        <span class="stat-pill accent"><strong>{appState.totalSelected}</strong>&nbsp;selected ({fmt(appState.wasted)})</span>
      {/if}
    </div>

    <div class="topbar-right">
      <!-- Sort selector -->
      <select class="sort-select" bind:value={appState.sortKey} title="Sort images within groups">
        <option value="modified">Sort: Date</option>
        <option value="resolution">Sort: Resolution</option>
        <option value="size">Sort: File Size</option>
        <option value="name">Sort: Name</option>
      </select>
      <button class="btn-sm" onclick={() => appState.autoSelectAll()}>Auto-select All</button>
      <button class="btn-sm" onclick={() => appState.clearAll()}>Clear All</button>
    </div>
  </header>

  <!-- Results list -->
  <main class="results">
    {#if appState.groups.length === 0}
      <div class="empty">
        <svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="24" cy="24" r="20"/>
          <polyline points="14 24 21 31 34 17"/>
        </svg>
        <p>No duplicate photos found.</p>
        <button class="btn-primary" onclick={() => (appState.view = "home")}>Scan Another Folder</button>
      </div>
    {:else}
      {#each appState.groups as g (g.id)}
        {@const sel = appState.selections[g.id] ?? new Set()}
        <section class="group">
          <div class="group-header">
            <span class="group-title">
              Group {g.id + 1}
              <span class="group-count">{g.images.length} {g.images.length === 1 ? 'image' : 'images'}</span>
            </span>
            <div class="group-actions">
              <button class="btn-xs" onclick={() => appState.autoSelect(g.id)}>Auto-select</button>
              <button class="btn-xs muted" onclick={() => appState.clearGroupSelection(g.id)}>Clear</button>
            </div>
          </div>

          {#if appState.compareFirst && appState.compareFirst.groupId === g.id}
            <div class="compare-banner">
              <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" style="flex-shrink:0">
                <path d="M2 2h5v12H2zm7 0h5v12h-5z"/>
              </svg>
              <span>Now click another image to compare side by side</span>
              <button class="btn-link" onclick={() => { appState.compareFirst = null; }}>Cancel</button>
            </div>
          {/if}

          <div class="img-row">
            {#each appState.sortImages(g.images) as img (img.path)}
              <ImageCard {img} groupId={g.id} />
            {/each}
          </div>
        </section>
      {/each}
    {/if}
  </main>

  <!-- Bottom action bar -->
  {#if appState.totalSelected > 0}
  <footer class="bottombar">
    <div class="bottombar-info">
      <strong>{appState.totalSelected}</strong> files selected &nbsp;·&nbsp; {fmt(appState.wasted)} reclaimable
    </div>
    <div class="bottombar-actions">
      <button
        class="btn-delete"
        onclick={() => (appState.confirmingDelete = true)}
      >
        Move to Trash
      </button>
      <button class="btn-ghost" onclick={() => appState.clearAll()}>Clear All</button>
    </div>
  </footer>
  {/if}

</div>

<!-- Confirm dialog -->
{#if appState.confirmingDelete}
<div
  class="overlay"
  role="presentation"
  onclick={() => (appState.confirmingDelete = false)}
  onkeydown={(e) => e.key === "Escape" && (appState.confirmingDelete = false)}
>
  <div
    class="dialog"
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.stopPropagation()}
  >
    <h3>Move to Trash</h3>
    <p>
      <strong>{appState.totalSelected}</strong> {appState.totalSelected === 1 ? "file" : "files"} will be moved to trash.
      You can restore them from the trash if needed.
    </p>
    <div class="dialog-btns">
      <button class="btn-ghost" onclick={() => (appState.confirmingDelete = false)}>Cancel</button>
      <button
        class="btn-delete"
        onclick={() => appState.deleteSelected()}
      >Move to Trash</button>
    </div>
  </div>
</div>
{/if}

<style>
  /* ── App shell ─────────────────────────────────── */
  .app {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
    background: var(--bg);
  }

  .topbar {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    height: 44px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .topbar-left { display: flex; align-items: center; gap: 10px; }
  .topbar-divider { width: 1px; height: 16px; background: var(--border); }

  .folder-label {
    display: flex; align-items: center; gap: 5px;
    font-size: .8rem; color: var(--text-2);
    max-width: 220px;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  .topbar-stats {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    display: flex; align-items: center; gap: 6px;
    pointer-events: none;
  }
  .stat-pill {
    pointer-events: auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 4px 12px 2px;
    font-size: .72rem;
    color: var(--text-2);
    white-space: nowrap;
  }
  .stat-pill strong {
    color: var(--text);
    font-weight: 700;
  }
  .stat-pill.accent {
    background: var(--accent-bg);
    border-color: var(--accent);
    color: var(--accent);
    font-weight: 600;
  }

  .topbar-right { display: flex; align-items: center; gap: 6px; }

  .sort-select {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 7px;
    color: var(--text-2);
    font-size: .75rem;
    padding: 3px 8px;
    height: 26px;
    box-sizing: border-box;
    cursor: pointer;
    transition: border-color .15s;
    outline: none;
  }
  .sort-select:hover { border-color: var(--accent); }

  /* ── Results ───────────────────────────────────── */
  .results {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .results::-webkit-scrollbar { width: 5px; }
  .results::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 3px; }
  .results::-webkit-scrollbar-track { background: transparent; }

  .empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    color: var(--text-3);
    height: 100%;
    min-height: 300px;
  }
  .empty svg { opacity: .4; }
  .empty p { font-size: .9rem; }

  .btn-primary {
    padding: 9px 20px;
    background: var(--accent);
    border: none;
    border-radius: 8px;
    color: #fff;
    font-size: 0.88rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity .15s, transform .1s;
  }
  .btn-primary:hover { opacity: .88; transform: translateY(-1px); }

  /* ── Group ─────────────────────────────────────── */
  .group {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    flex-shrink: 0; /* prevent groups from compressing to fit viewport height */
  }

  .group-header {
    display: flex;
    align-items: center;
    padding: 8px 14px;
    border-bottom: 1px solid var(--border);
    background: var(--surface2);
    gap: 10px;
  }

  .group-title {
    flex: 1;
    font-size: .8rem;
    font-weight: 600;
    color: var(--text-2);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .group-count {
    background: var(--accent-bg);
    color: var(--accent);
    border-radius: 10px;
    padding: 1px 7px;
    font-size: .7rem;
    font-weight: 700;
  }

  .group-actions { display: flex; gap: 5px; }

  /* ── Compare banner ────────────────────────────── */
  .compare-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--accent-bg);
    border: 1px solid var(--accent);
    border-radius: 7px;
    padding: 6px 12px;
    margin: 8px 12px 0;
    font-size: .78rem;
    color: var(--accent);
  }
  .compare-banner span { flex: 1; }

  /* ── Image row ─────────────────────────────────── */
  .img-row {
    display: flex;
    flex-wrap: wrap;
    padding: 12px;
    gap: 10px;
  }

  /* ── Bottom bar ────────────────────────────────── */
  .bottombar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    height: 50px;
    background: var(--surface);
    border-top: 1px solid var(--border);
    flex-shrink: 0;
    gap: 12px;
  }

  .bottombar-info { font-size: .82rem; color: var(--text-2); white-space: nowrap; }
  .bottombar-actions { display: flex; align-items: center; gap: 8px; }

  /* ── Overlay / Dialog ──────────────────────────── */
  .overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,.4);
    display: flex; align-items: center; justify-content: center;
    z-index: 100;
    backdrop-filter: blur(3px);
  }

  .dialog {
    background: var(--surface);
    border: 1px solid var(--border2);
    border-radius: 14px;
    padding: 24px 28px;
    width: 340px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    box-shadow: 0 20px 60px rgba(0,0,0,.25);
  }

  .dialog h3 { font-size: .98rem; font-weight: 700; }
  .dialog p { font-size: .84rem; color: var(--text-2); line-height: 1.6; }
  .dialog-btns { display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; }

  /* ── Shared buttons ────────────────────────────── */
  .btn-ghost {
    display: inline-flex; align-items: center; gap: 5px;
    background: none;
    border: 1px solid var(--border);
    border-radius: 7px;
    color: var(--text-2);
    font-size: .78rem;
    padding: 5px 10px;
    cursor: pointer;
    transition: all .15s;
    white-space: nowrap;
  }
  .btn-ghost:hover { border-color: var(--border2); color: var(--text); background: var(--surface2); }

  .btn-sm {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 7px;
    color: var(--text-2);
    font-size: .75rem;
    padding: 0 10px;
    height: 26px;
    box-sizing: border-box;
    display: inline-flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: all .15s;
    white-space: nowrap;
  }
  .btn-sm:hover { border-color: var(--accent); color: var(--accent); }

  .btn-xs {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 5px;
    color: var(--text-2);
    font-size: .7rem;
    padding: 3px 8px;
    cursor: pointer;
    transition: all .12s;
  }
  .btn-xs:hover { border-color: var(--accent); color: var(--accent); }
  .btn-xs.muted:hover { border-color: var(--border2); color: var(--text-3); }

  .btn-delete {
    background: var(--accent);
    border: none;
    border-radius: 7px;
    color: #fff;
    font-size: .8rem;
    font-weight: 600;
    padding: 6px 14px;
    cursor: pointer;
    transition: opacity .15s;
    white-space: nowrap;
  }
  .btn-delete:hover { opacity: .85; }

  .btn-link {
    background: none; border: none;
    color: var(--accent); font-size: .78rem; font-weight: 600;
    cursor: pointer; padding: 0; transition: color .15s;
  }
  .btn-link:hover { opacity: .75; }
</style>
