<script>
  import { appState } from "$lib/stores/scan.svelte.js";
  import { fmt, fmtDate, basename, fileManagerLabel } from "$lib/utils.js";

  let { img, groupId } = $props();

  let selected = $derived((appState.selections[groupId] ?? new Set()).has(img.path));
  let thumbnail = $derived(appState.thumbnails[img.path]);
  let isCompareFirst = $derived(appState.compareFirst?.img.path === img.path);
</script>

<div class="img-card {selected ? 'marked' : ''}">
  <!-- Thumbnail -->
  <div
    class="thumb-wrap"
    role="button"
    tabindex="0"
    onclick={() => appState.openPreview(img.path)}
    onkeydown={(e) => e.key === "Enter" && appState.openPreview(img.path)}
    title="Click to enlarge"
  >
    {#if thumbnail}
      <img src={thumbnail} alt="" draggable="false" />
    {:else}
      <div class="thumb-loading">
        <div class="mini-spin"></div>
      </div>
    {/if}


    {#if selected}
      <div class="mark-overlay">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
    {/if}
  </div>

  <!-- Info -->
  <div class="img-info">
    <div class="img-name" title={img.path}>{basename(img.path)}</div>
    <div class="img-meta-row">
      <span class="meta-item">{img.width}×{img.height}</span>
      <span class="meta-item">{fmt(img.size)}</span>
      <span class="meta-item">{fmtDate(img.modified)}</span>
    </div>
    <div class="img-actions">
      <label class="check-label {selected ? 'checked' : ''}">
        <input
          type="checkbox"
          checked={selected}
          onchange={() => appState.toggleSelect(groupId, img.path)}
        />
        {selected ? "Marked" : "Mark"}
      </label>
      <div class="action-btns">
        <button class="btn-link" onclick={() => appState.revealInFinder(img.path)}>
          {fileManagerLabel}
        </button>
        <button
          class="btn-link {isCompareFirst ? 'compare-active' : ''}"
          onclick={() => appState.pickCompare(img, groupId)}
        >{isCompareFirst ? "Cancel" : "Compare"}</button>
      </div>
    </div>
  </div>
</div>

<style>
  .img-card {
    display: flex;
    flex-direction: column;
    width: 200px;
    flex-shrink: 0;
    flex-grow: 0;
    border: 1.5px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
    background: var(--surface2);
    transition: border-color .15s;
  }

  .img-card.marked {
    border-color: var(--red);
    background: var(--red-bg);
  }

  .thumb-wrap {
    position: relative;
    width: 100%;
    height: 150px; /* explicit height — aspect-ratio:4/3 collapses to 0 in WebView2
                      when height:100% children are present (circular dependency) */
    flex-shrink: 0;
    background: var(--border);
    overflow: hidden;
    cursor: pointer;
  }

  .thumb-wrap img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .img-card.marked .thumb-wrap img { opacity: .5; }

  .thumb-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 150px;
  }
  .mini-spin {
    width: 20px; height: 20px;
    border: 2px solid var(--border2);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin .7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

.mark-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(224, 53, 53, .18);
  }

  .img-info {
    padding: 8px 10px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .img-name {
    font-size: .75rem;
    font-weight: 500;
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .img-meta-row {
    display: flex;
    align-items: center;
    gap: 3px 0;
    font-size: .68rem;
    color: var(--text-3);
    flex-wrap: wrap;
    line-height: 1.3;
  }
  .meta-item { white-space: nowrap; }
  .meta-item:not(:last-child)::after {
    content: "·";
    margin: 0 4px;
    color: var(--border2);
  }

  .img-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 4px;
    gap: 4px;
  }

  .action-btns {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .check-label {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: .75rem;
    color: var(--text-2);
    cursor: pointer;
    user-select: none;
  }
  .check-label input { accent-color: var(--red); cursor: pointer; }
  .check-label.checked { color: var(--red); font-weight: 600; }

  .btn-link {
    background: none;
    border: none;
    color: var(--text-3);
    font-size: .74rem;
    cursor: pointer;
    padding: 0;
    transition: color .15s;
  }
  .btn-link:hover { color: var(--accent); }
  .compare-active { color: var(--accent) !important; font-weight: 600; }
</style>
