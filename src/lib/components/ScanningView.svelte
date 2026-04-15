<script>
  import { appState } from "$lib/stores/scan.svelte.js";
  import { t, i18n } from "$lib/i18n.svelte.js";
</script>

<div class="scanning">
  <div class="scan-wrap">
    <div class="scan-spinner"></div>
    <div class="scan-texts">
      <p class="scan-phase">{i18n.translatePhase(appState.scanProgress.phase)}</p>
      <p class="scan-count">
        {appState.scanProgress.total > 0
          ? `${appState.scanProgress.current.toLocaleString()} / ${appState.scanProgress.total.toLocaleString()} ${t("images")}`
          : t("searching_images")}
      </p>
    </div>
    <div class="prog-track">
      <div class="prog-fill" style="width:{appState.pct}%"></div>
    </div>
    <p class="prog-pct">{appState.pct}%</p>
    <button class="btn-cancel-scan" onclick={() => appState.cancelScan()}>{t("cancel")}</button>
  </div>
</div>

<style>
  .scanning {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    background: var(--bg);
  }

  .scan-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    width: 340px;
  }

  .scan-spinner {
    width: 44px; height: 44px;
    border: 3px solid var(--border2);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin .75s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .scan-texts { text-align: center; }
  .scan-phase { font-size: .9rem; font-weight: 500; }
  .scan-count { font-size: .8rem; color: var(--text-3); margin-top: 4px; font-variant-numeric: tabular-nums; }

  .prog-track {
    width: 100%; height: 3px;
    background: var(--border2);
    border-radius: 2px;
    overflow: hidden;
  }
  .prog-fill {
    height: 100%;
    background: var(--accent);
    border-radius: 2px;
    transition: width .3s ease;
  }
  .prog-pct { font-size: .75rem; color: var(--text-3); font-variant-numeric: tabular-nums; }

  .btn-cancel-scan {
    background: none;
    border: 1px solid var(--border2);
    border-radius: 7px;
    color: var(--text-3);
    font-size: .78rem;
    padding: 5px 16px;
    cursor: pointer;
    margin-top: 4px;
    transition: all .15s;
  }
  .btn-cancel-scan:hover { border-color: var(--red); color: var(--red); }
</style>
