<script>
  import { appState } from "$lib/stores/scan.svelte.js";
  import { fmt, fmtDate, basename, isWindows } from "$lib/utils.js";
</script>

{#if appState.compareModal}
{@const cm = appState.compareModal}
<div
  class="overlay"
  role="presentation"
  onclick={() => appState.closeCompare()}
  onkeydown={(e) => e.key === "Escape" && appState.closeCompare()}
>
  <div
    class="compare-modal"
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.stopPropagation()}
  >
    <div class="compare-header">
      <span class="compare-title">Compare</span>
      <button class="preview-close" onclick={() => appState.closeCompare()}>✕</button>
    </div>
    <div class="compare-body">
      <!-- Each panel uses its OWN groupId so toggleSelect targets the correct group (P1-C fix) -->
      {#each [
        { img: cm.imgA, src: cm.srcA, groupId: cm.groupIdA },
        { img: cm.imgB, src: cm.srcB, groupId: cm.groupIdB }
      ] as panel}
        {@const isMarked = (appState.selections[panel.groupId] ?? new Set()).has(panel.img.path)}
        <div class="compare-panel">
          <div class="compare-thumb">
            {#if panel.src}
              <img src={panel.src} alt="" draggable="false" />
            {:else}
              <div class="preview-loading">
                <div class="scan-spinner"></div>
              </div>
            {/if}
          </div>
          <div class="compare-info">
            <div class="img-name" title={panel.img.path}>{basename(panel.img.path)}</div>
            <div class="img-meta-row">
              <span class="meta-item">{panel.img.width}×{panel.img.height}</span>
              <span class="meta-item">{fmt(panel.img.size)}</span>
              <span class="meta-item">{fmtDate(panel.img.modified)}</span>
            </div>
            <div class="compare-actions">
              <button class="btn-link" onclick={() => appState.revealInFinder(panel.img.path)}>
                {isWindows ? "Explorer" : "Finder"}
              </button>
              <label class="check-label {isMarked ? 'checked' : ''}">
                <input
                  type="checkbox"
                  checked={isMarked}
                  onchange={() => appState.toggleSelect(panel.groupId, panel.img.path)}
                />
                {isMarked ? "Marked for deletion" : "Mark for deletion"}
              </label>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>
{/if}

<style>
  .overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,.45);
    display: flex; align-items: center; justify-content: center;
    z-index: 100;
    backdrop-filter: blur(4px);
  }

  .compare-modal {
    background: var(--surface);
    border: 1px solid var(--border2);
    border-radius: 14px;
    width: min(92vw, 1000px);
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0,0,0,.45);
  }

  .compare-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px 12px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }
  .compare-title { font-size: .9rem; font-weight: 700; color: var(--text); }

  .compare-body {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1px;
    background: var(--border);
    overflow: auto;
    flex: 1;
    min-height: 0;
  }

  .compare-panel {
    background: var(--surface);
    display: flex;
    flex-direction: column;
  }

  .compare-thumb {
    position: relative;
    background: var(--surface2);
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .compare-thumb img {
    max-width: 100%;
    max-height: 60vh;
    object-fit: contain;
    display: block;
  }

  .compare-info {
    padding: 10px 14px 12px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    border-top: 1px solid var(--border);
    flex-shrink: 0;
  }

  .compare-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 2px;
  }

.preview-close {
    position: static;
    background: rgba(0,0,0,.1);
    border: none; color: var(--text-2);
    border-radius: 50%;
    width: 28px; height: 28px;
    font-size: .85rem; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background .15s;
  }
  .preview-close:hover { background: rgba(0,0,0,.2); }

  .img-name {
    font-size: .75rem; font-weight: 500; color: var(--text);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .img-meta-row {
    display: flex; align-items: center; gap: 3px 0;
    font-size: .68rem; color: var(--text-3); flex-wrap: wrap;
    line-height: 1.3;
  }
  .meta-item { white-space: nowrap; }
  .meta-item:not(:last-child)::after {
    content: "·"; margin: 0 4px; color: var(--border2);
  }

  .check-label {
    display: flex; align-items: center; gap: 5px;
    font-size: .75rem; color: var(--text-2);
    cursor: pointer; user-select: none;
  }
  .check-label input { accent-color: var(--red); cursor: pointer; }
  .check-label.checked { color: var(--red); font-weight: 600; }

  .btn-link {
    background: none; border: none;
    color: var(--text-3); font-size: .74rem;
    cursor: pointer; padding: 0; transition: color .15s;
  }
  .btn-link:hover { color: var(--accent); }

  .preview-loading {
    width: 240px; height: 180px;
    display: flex; align-items: center; justify-content: center;
  }
  .scan-spinner {
    width: 36px; height: 36px;
    border: 3px solid var(--border2);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin .75s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
