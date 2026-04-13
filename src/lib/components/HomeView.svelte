<script>
  import { appState, getSensitivityInfo, SENSITIVITY_LABELS } from "$lib/stores/scan.svelte.js";
</script>

<div class="home">
  <div class="home-card {appState.isDragOver ? 'drag-over' : ''}">
    <div class="app-logo">
      <svg viewBox="0 0 48 48" fill="none">
        <rect x="3" y="8" width="28" height="34" rx="3" fill="var(--accent)" opacity="0.12" stroke="var(--accent)" stroke-width="1.5"/>
        <rect x="17" y="14" width="28" height="34" rx="3" fill="var(--accent2)" opacity="0.12" stroke="var(--accent2)" stroke-width="1.5"/>
        <circle cx="12" cy="20" r="3" fill="var(--accent)" opacity="0.5"/>
        <path d="M5 36 l7-8 5 5 4-5 5 8" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>
        <path d="M19 36 l7-8 5 5 4-5 5 8" stroke="var(--accent2)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>
      </svg>
    </div>
    <h1>Ditto</h1>
    <p class="tagline">Find and remove duplicate photos</p>

    <div class="field-label">Folder to scan</div>
    <button class="folder-row" onclick={() => appState.pickFolder()}>
      <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
        <path d="M2 6a2 2 0 012-2h3.586a1 1 0 01.707.293L9.707 5.707A1 1 0 0010.414 6H16a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
      </svg>
      {#if appState.selectedFolder}
        <span class="folder-path">{appState.selectedFolder}</span>
      {:else}
        <span class="folder-hint">Click to select a folder…</span>
      {/if}
      <span class="folder-btn-label">Change</span>
    </button>

    <div class="field-label" style="width:100%; margin-top:2px">Detection Sensitivity</div>
    <div class="sensitivity-wrap">
      <div class="sensitivity-header">
        <span class="sensitivity-label-text">{getSensitivityInfo(appState.sensitivity).label}</span>
        <span class="sensitivity-val">{appState.sensitivity}</span>
      </div>
      <input
        type="range"
        min="1"
        max="15"
        bind:value={appState.sensitivity}
        class="sensitivity-slider"
        title={getSensitivityInfo(appState.sensitivity).desc}
      />
      <div class="sensitivity-ticks">
        <span>Strict</span>
        <span>Loose</span>
      </div>
      <p class="sensitivity-desc">{getSensitivityInfo(appState.sensitivity).desc}</p>
    </div>

    <div class="field-label" style="width:100%; margin-top:2px">File Types</div>
    <div class="filetype-group">
      {#each [
        { value: "all",     label: "All",      desc: "JPEG, PNG, RAW, and more" },
        { value: "non_raw", label: "Non-RAW",  desc: "JPEG, PNG, TIFF, WebP…"   },
        { value: "raw",     label: "RAW Only", desc: "CR2, CR3, NEF, ARW…"      },
      ] as opt}
        <button
          class="filetype-btn {appState.fileTypes === opt.value ? 'active' : ''}"
          onclick={() => (appState.fileTypes = /** @type {"all"|"non_raw"|"raw"} */ (opt.value))}
          title={opt.desc}
        >
          {opt.label}
        </button>
      {/each}
    </div>

    {#if appState.error}
      <div class="error-box">{appState.error}</div>
    {/if}

    <button class="btn-primary" onclick={() => appState.startScan()} disabled={!appState.selectedFolder}>
      Start Scan
    </button>
  </div>
</div>

<style>
  .home {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    background: var(--bg);
  }

  .home-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 40px 44px;
    width: 420px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    box-shadow: var(--shadow);
    transition: border-color .2s, box-shadow .2s;
  }

  .home-card.drag-over {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-bg), var(--shadow);
  }

  .app-logo { width: 64px; height: 64px; margin-bottom: 4px; }
  .app-logo svg { width: 100%; height: 100%; }

  h1 {
    font-size: 1.6rem;
    font-weight: 700;
    letter-spacing: -.04em;
    color: var(--text);
  }

  .tagline { color: var(--text-3); font-size: 0.82rem; margin-top: -6px; }

  .field-label {
    width: 100%;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .06em;
    color: var(--text-3);
    margin-top: 6px;
  }

  .folder-row {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 9px 12px;
    cursor: pointer;
    color: var(--text-2);
    transition: border-color .15s;
    text-align: left;
  }
  .folder-row:hover { border-color: var(--accent); }

  .folder-path {
    flex: 1;
    font-size: 0.8rem;
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    direction: rtl;
    text-align: left;
  }
  .folder-hint { flex: 1; font-size: 0.8rem; color: var(--text-3); }
  .folder-btn-label {
    font-size: 0.72rem;
    color: var(--accent);
    font-weight: 600;
    flex-shrink: 0;
  }

  .sensitivity-wrap {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .sensitivity-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .sensitivity-label-text { font-size: .8rem; font-weight: 600; color: var(--accent); }

  .sensitivity-val {
    font-size: .72rem;
    color: var(--text-3);
    font-variant-numeric: tabular-nums;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 1px 6px;
  }

  .sensitivity-slider {
    width: 100%;
    accent-color: var(--accent);
    cursor: pointer;
    height: 4px;
  }

  .sensitivity-ticks {
    display: flex;
    justify-content: space-between;
    font-size: .67rem;
    color: var(--text-3);
    margin-top: -2px;
  }

  .sensitivity-desc {
    font-size: .74rem;
    color: var(--text-2);
    line-height: 1.5;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 7px;
    padding: 7px 10px;
    min-height: 44px;
  }

  .filetype-group {
    display: flex;
    width: 100%;
    gap: 6px;
  }

  .filetype-btn {
    flex: 1;
    padding: 7px 0;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 7px;
    color: var(--text-2);
    font-size: .78rem;
    font-weight: 500;
    cursor: pointer;
    transition: all .15s;
  }
  .filetype-btn:hover { border-color: var(--accent); color: var(--accent); }
  .filetype-btn.active {
    background: var(--accent-bg);
    border-color: var(--accent);
    color: var(--accent);
    font-weight: 700;
  }

  .error-box {
    width: 100%;
    background: var(--red-bg);
    border: 1px solid var(--red);
    border-radius: 8px;
    color: var(--red);
    font-size: 0.8rem;
    padding: 8px 12px;
    text-align: center;
  }

  .btn-primary {
    width: 100%;
    padding: 11px;
    background: var(--accent);
    border: none;
    border-radius: 8px;
    color: #fff;
    font-size: 0.88rem;
    font-weight: 600;
    cursor: pointer;
    margin-top: 4px;
    transition: opacity .15s, transform .1s;
  }
  .btn-primary:hover:not(:disabled) { opacity: .88; transform: translateY(-1px); }
  .btn-primary:active:not(:disabled) { transform: none; }
  .btn-primary:disabled { opacity: .35; cursor: not-allowed; }
</style>
