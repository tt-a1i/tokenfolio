/**
 * tokenfolio · share.js
 *
 * Drop-in floating share/save FAB + always-visible "Built with tokenfolio" chip
 * for every template. The chip survives screenshot crops; the FAB is hidden
 * during capture so it never appears in the exported PNG.
 *
 * Usage in template HTML:
 *   <script src="../../share.js" defer></script>
 *
 * Optional opt-outs (set on <body>):
 *   data-tf-fab="false"           hide the floating buttons
 *   data-tf-chip="false"          hide the brand chip
 *   data-tf-capture="<selector>"  alternate capture root (default: <main>, then <body>)
 *   data-tf-share-text="…"        override default share text
 */
(function () {
  "use strict";
  if (window.__tfShareLoaded) return;
  window.__tfShareLoaded = true;

  const HTML2CANVAS_URL = "https://cdn.jsdelivr.net/npm/html2canvas-pro@1.5.10/dist/html2canvas-pro.min.js";
  const TOKENFOLIO_URL = "https://github.com/tt-a1i/tokenfolio";

  const STYLES = `
    .tf-chip {
      position: fixed; top: 14px; right: 14px;
      z-index: 99998;
      display: inline-flex; align-items: center; gap: 7px;
      padding: 6px 11px 6px 9px;
      background: rgba(15, 15, 20, 0.72);
      -webkit-backdrop-filter: saturate(140%) blur(10px);
      backdrop-filter: saturate(140%) blur(10px);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 999px;
      color: rgba(255,255,255,0.92);
      font: 600 11px/1 -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, "Helvetica Neue", Arial, sans-serif;
      letter-spacing: 0.02em;
      text-decoration: none;
      cursor: pointer;
      transition: transform .18s ease, opacity .18s ease, background .18s ease;
      opacity: .88;
      -webkit-font-smoothing: antialiased;
      pointer-events: auto;
    }
    .tf-chip:hover { opacity: 1; transform: translateY(-1px); background: rgba(20,20,28,.85); }
    .tf-chip-dot {
      width: 7px; height: 7px; border-radius: 999px;
      background: linear-gradient(135deg, #a78bfa 0%, #38bdf8 100%);
      box-shadow: 0 0 8px rgba(167,139,250,.55);
    }

    .tf-fab {
      position: fixed; bottom: 18px; right: 18px;
      z-index: 99999;
      display: flex; flex-direction: column; gap: 8px;
      pointer-events: none;
    }
    .tf-fab > div { position: relative; pointer-events: auto; }
    .tf-fab button {
      width: 44px; height: 44px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.14);
      background: rgba(15,15,20,0.82);
      -webkit-backdrop-filter: blur(12px);
      backdrop-filter: blur(12px);
      color: rgba(255,255,255,0.94);
      cursor: pointer;
      display: grid; place-items: center;
      box-shadow: 0 6px 22px rgba(0,0,0,0.42);
      transition: transform .14s ease, background .14s ease;
      padding: 0;
    }
    .tf-fab button:hover { transform: translateY(-2px); background: rgba(30,30,42,0.94); }
    .tf-fab button:disabled { opacity: .55; cursor: progress; }
    .tf-fab button svg { width: 18px; height: 18px; }
    .tf-fab .tf-tip {
      position: absolute; right: 54px; top: 50%; transform: translateY(-50%);
      padding: 5px 10px;
      background: rgba(15,15,20,0.96);
      color: white;
      font: 500 11px/1 -apple-system, system-ui, sans-serif;
      border-radius: 6px;
      pointer-events: none;
      opacity: 0;
      transition: opacity .15s;
      white-space: nowrap;
      box-shadow: 0 2px 10px rgba(0,0,0,.3);
    }
    .tf-fab > div:hover .tf-tip { opacity: 1; }

    .tf-toast {
      position: fixed; bottom: 80px; right: 18px;
      z-index: 99999;
      padding: 9px 14px;
      background: rgba(15,15,20,0.96);
      color: #fff;
      font: 500 12px/1.4 -apple-system, system-ui, sans-serif;
      border-radius: 8px;
      max-width: 260px;
      box-shadow: 0 4px 18px rgba(0,0,0,.42);
      animation: tf-fade-in .15s ease;
    }
    @keyframes tf-fade-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

    @media (max-width: 540px) {
      .tf-chip { top: 10px; right: 10px; font-size: 10px; padding: 5px 9px 5px 8px; }
      .tf-fab { bottom: 14px; right: 14px; }
      .tf-fab button { width: 40px; height: 40px; }
      .tf-fab .tf-tip { display: none; }
      .tf-toast { bottom: 70px; right: 14px; font-size: 11px; }
    }

    @media print { .tf-chip, .tf-fab, .tf-toast { display: none !important; } }
  `;

  const ICON_SAVE  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
  const ICON_SHARE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>';

  function injectStyles() {
    const s = document.createElement("style");
    s.dataset.tf = "share";
    s.textContent = STYLES;
    document.head.appendChild(s);
  }

  function getData() {
    const D = window.RESUME_DATA || {};
    const fmt = window.RESUME_FMT || {};
    const handle = (D.user && D.user.handle ? String(D.user.handle).replace(/^@/, "") : "me")
      .replace(/[^a-zA-Z0-9_-]/g, "_") || "me";
    const totalRaw = (D.totals && D.totals.tokens) | 0;
    const total = typeof fmt.num === "function" ? fmt.num(totalRaw) : String(totalRaw);
    const year = D.year || new Date().getFullYear();
    return { handle, year, total, totalRaw };
  }

  function buildChip() {
    if (document.body.dataset.tfChip === "false") return;
    const a = document.createElement("a");
    a.className = "tf-chip";
    a.href = TOKENFOLIO_URL;
    a.target = "_blank";
    a.rel = "noopener";
    a.setAttribute("aria-label", "Built with tokenfolio — open the project on GitHub");
    a.innerHTML = '<span class="tf-chip-dot" aria-hidden="true"></span><span>Built with tokenfolio</span>';
    document.body.appendChild(a);
  }

  let h2cPromise = null;
  function loadH2C() {
    if (window.html2canvas) return Promise.resolve(window.html2canvas);
    if (h2cPromise) return h2cPromise;
    h2cPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = HTML2CANVAS_URL;
      s.async = true;
      s.crossOrigin = "anonymous";
      s.onload = () => resolve(window.html2canvas);
      s.onerror = () => { h2cPromise = null; reject(new Error("Failed to load html2canvas")); };
      document.head.appendChild(s);
    });
    return h2cPromise;
  }

  function getCaptureTarget() {
    const sel = document.body.dataset.tfCapture;
    if (sel) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return document.querySelector("main") || document.body;
  }

  function getBgColor() {
    const bg = getComputedStyle(document.body).backgroundColor;
    if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") return bg;
    const html = getComputedStyle(document.documentElement).backgroundColor;
    if (html && html !== "rgba(0, 0, 0, 0)" && html !== "transparent") return html;
    return "#0a0a0f";
  }

  function showToast(text, ms) {
    const t = document.createElement("div");
    t.className = "tf-toast";
    t.textContent = text;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), ms || 2400);
    return t;
  }

  let busyToast = null;
  function busy(text) { if (busyToast) busyToast.remove(); busyToast = showToast(text, 60000); }
  function clearBusy() { if (busyToast) { busyToast.remove(); busyToast = null; } }

  async function capture() {
    const lib = await loadH2C();
    const target = getCaptureTarget();
    const fab = document.querySelector(".tf-fab");
    if (fab) fab.style.visibility = "hidden";
    try {
      return await lib(target, {
        backgroundColor: getBgColor(),
        scale: Math.min(window.devicePixelRatio || 1, 2),
        useCORS: true,
        allowTaint: false,
        logging: false,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
      });
    } finally {
      if (fab) fab.style.visibility = "";
    }
  }

  function disableButtons(disabled) {
    document.querySelectorAll(".tf-fab button").forEach(b => { b.disabled = disabled; });
  }

  async function saveAsPng() {
    disableButtons(true);
    try {
      const { handle, year } = getData();
      busy("Rendering image…");
      const canvas = await capture();
      const blob = await new Promise(r => canvas.toBlob(r, "image/png"));
      clearBusy();
      if (!blob) { showToast("Couldn’t render the image."); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tokenfolio-${handle}-${year}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
      showToast("Saved · drag it onto X / LinkedIn");
    } catch (e) {
      clearBusy();
      console.error("[tokenfolio] save error", e);
      showToast("Couldn’t render. Try a screenshot instead.");
    } finally {
      disableButtons(false);
    }
  }

  function defaultShareText() {
    const explicit = document.body.dataset.tfShareText;
    if (explicit) return explicit;
    const { total, year } = getData();
    return `My ${year} on Claude Code & Codex: ${total} tokens.\nMade with tokenfolio →`;
  }

  function openIntent(text) {
    const url = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(text)
              + "&url=" + encodeURIComponent(location.href);
    window.open(url, "_blank", "noopener,width=560,height=720");
  }

  async function shareSocial() {
    const text = defaultShareText();
    disableButtons(true);
    try {
      if (navigator.share && navigator.canShare) {
        try {
          busy("Rendering image…");
          const canvas = await capture();
          const blob = await new Promise(r => canvas.toBlob(r, "image/png"));
          clearBusy();
          if (blob) {
            const file = new File([blob], "tokenfolio.png", { type: "image/png" });
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({ files: [file], title: "tokenfolio", text, url: location.href });
              return;
            }
          }
        } catch (e) {
          clearBusy();
          if (e && e.name === "AbortError") return;
          console.warn("[tokenfolio] Web Share unavailable, falling back", e);
        }
      }
      openIntent(text);
    } finally {
      disableButtons(false);
    }
  }

  function buildFab() {
    if (document.body.dataset.tfFab === "false") return;
    const wrap = document.createElement("div");
    wrap.className = "tf-fab";
    wrap.innerHTML =
      '<div><button data-act="save" aria-label="Save as PNG">' + ICON_SAVE + '</button><span class="tf-tip">Save as PNG</span></div>' +
      '<div><button data-act="share" aria-label="Share">' + ICON_SHARE + '</button><span class="tf-tip">Share</span></div>';
    document.body.appendChild(wrap);
    wrap.querySelector('[data-act="save"]').addEventListener("click", saveAsPng);
    wrap.querySelector('[data-act="share"]').addEventListener("click", shareSocial);
  }

  function init() {
    injectStyles();
    buildChip();
    buildFab();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
