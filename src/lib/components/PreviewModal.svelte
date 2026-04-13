<script>
  import { appState } from "$lib/stores/scan.svelte.js";
</script>

{#if appState.previewImg}
<div
  class="overlay"
  role="presentation"
  onclick={() => appState.closePreview()}
  onkeydown={(e) => e.key === "Escape" && appState.closePreview()}
>
  <div
    class="preview-modal"
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.stopPropagation()}
  >
    <button class="preview-close" onclick={() => appState.closePreview()}>✕</button>
    {#if appState.previewSrc}
      <img src={appState.previewSrc} alt="" class="preview-img" draggable="false" />
    {:else}
      <div class="preview-loading">
        <div class="scan-spinner"></div>
      </div>
    {/if}
    <div class="preview-info">
      {appState.previewImg.split(/[\\/]/).pop()}
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

  .preview-modal {
    position: relative;
    background: var(--surface);
    border: 1px solid var(--border2);
    border-radius: 12px;
    max-width: 90vw;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0,0,0,.45);
  }

  .preview-img {
    max-width: 80vw;
    max-height: 78vh;
    object-fit: contain;
    display: block;
  }

  .preview-close {
    position: absolute;
    top: 8px; right: 8px;
    background: rgba(0,0,0,.45);
    border: none;
    color: #fff;
    border-radius: 50%;
    width: 28px; height: 28px;
    font-size: .85rem;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    z-index: 1;
    transition: background .15s;
  }
  .preview-close:hover { background: rgba(0,0,0,.65); }

  .preview-info {
    padding: 8px 14px;
    font-size: .78rem;
    color: var(--text-2);
    border-top: 1px solid var(--border);
    text-align: center;
    flex-shrink: 0;
  }

  .preview-loading {
    width: 100%; min-width: 320px;
    min-height: 240px;
    display: flex; align-items: center; justify-content: center;
    flex: 1;
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
