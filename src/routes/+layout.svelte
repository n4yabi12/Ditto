<script>
  let { children } = $props();
</script>

{@render children()}

<style>
  /* ── Theme tokens ───────────────────────────────────────────── */
  :global(:root) {
    --bg:         #f4f4f6;
    --surface:    #ffffff;
    --surface2:   #f9f9fb;
    --border:     #e2e2e8;
    --border2:    #d0d0da;
    --text:       #18181c;
    --text-2:     #505060;
    --text-3:     #8888a0;
    --accent:     #4f6ef7;
    --accent2:    #7c5cf6;
    --accent-bg:  rgba(79,110,247,.08);
    --red:        #e03535;
    --red-bg:     rgba(224,53,53,.08);
    --radius:     10px;
    --shadow:     0 1px 3px rgba(0,0,0,.08), 0 4px 16px rgba(0,0,0,.06);
  }

  @media (prefers-color-scheme: dark) {
    :global(:root) {
      --bg:         #111115;
      --surface:    #1c1c22;
      --surface2:   #17171d;
      --border:     #2a2a34;
      --border2:    #35353f;
      --text:       #e8e8f0;
      --text-2:     #9090a8;
      --text-3:     #55556a;
      --accent:     #6b85f8;
      --accent2:    #9b7cf7;
      --accent-bg:  rgba(107,133,248,.1);
      --red:        #f05555;
      --red-bg:     rgba(240,85,85,.1);
      --shadow:     0 1px 3px rgba(0,0,0,.3), 0 4px 16px rgba(0,0,0,.25);
    }
  }

  :global(*) { box-sizing: border-box; margin: 0; padding: 0; }

  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 13px;
    background: var(--bg);
    color: var(--text);
    height: 100vh;
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
  }

  :global(button) { font-family: inherit; font-size: inherit; }
</style>
