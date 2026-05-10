#!/usr/bin/env node
/**
 * gen-og.js — Node ESM OG image renderer for tokenfolio.
 *
 * Renders a 1200×630 og.png from ./data.js using Satori + @resvg/resvg-js.
 * Both are treated as OPTIONAL peer dependencies; the script loads them via
 * dynamic import so the main package install stays dependency-free.
 *
 * Usage (standalone):
 *   node scripts/gen-og.js
 *   node scripts/gen-og.js --output /tmp/og.png
 *   node scripts/gen-og.js --input ./data.js --output ./og.png
 *
 * Or invoked programmatically from bin/tokenfolio.js:
 *   const { runOgJs } = await import(pathToFileURL("scripts/gen-og.js").href);
 *   const result = await runOgJs({ output: "./og.png", input: "./data.js" });
 */

import { existsSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";
import vm from "node:vm";

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtNum(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "k";
  return String(n | 0);
}

/**
 * Try to import `pkgName` first from the script's own resolution context,
 * then from the global npm root (handles `npm i -g satori` on most setups).
 *
 * Note: createRequire().resolve() returns the CJS path; for ESM-native packages
 * like satori we instead locate the package dir via the CJS entry and then load
 * the ESM entry as declared in package.json exports.
 */
async function tryImport(pkgName) {
  // First: normal ESM resolution (works when package is in project node_modules)
  try {
    return await import(pkgName);
  } catch {
    // ignore
  }
  // Second: resolve via global npm root
  try {
    const globalRoot = execSync("npm root -g", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    if (!globalRoot) return null;

    // Read package.json to find the ESM entry point, falling back to the CJS path.
    const pkgDir = join(globalRoot, pkgName);
    const pkgJsonPath = join(pkgDir, "package.json");
    if (!existsSync(pkgJsonPath)) return null;

    let pkgJson;
    try { pkgJson = JSON.parse(readFileSync(pkgJsonPath, "utf8")); } catch { return null; }

    // Prefer the "import" export condition for "." entry, then "module", then "main".
    let esmEntry = null;
    const dotExport = pkgJson.exports?.["."];
    if (dotExport) {
      if (typeof dotExport === "string") {
        esmEntry = dotExport;
      } else if (dotExport["import"]) {
        const imp = dotExport["import"];
        esmEntry = typeof imp === "string" ? imp : (imp.default || imp);
      } else if (dotExport["default"]) {
        esmEntry = dotExport["default"];
      }
    }
    if (!esmEntry) esmEntry = pkgJson.module || pkgJson.main;
    if (!esmEntry) return null;

    const resolved = pathToFileURL(join(pkgDir, esmEntry)).href;
    return await import(resolved);
  } catch {
    // ignore
  }
  return null;
}

// ─── data loading ─────────────────────────────────────────────────────────────

/**
 * Load window.RESUME_DATA from a data.js file using vm sandbox — same
 * approach as loadResumeData() in bin/tokenfolio.js.
 */
function loadDataJs(filepath) {
  const abs = resolve(process.cwd(), filepath);
  if (!existsSync(abs)) {
    return { ok: false, reason: `data.js not found at ${abs}. Run \`tokenfolio init\` first.` };
  }
  const text = readFileSync(abs, "utf8");
  const sandbox = { window: {}, console };
  try {
    vm.runInNewContext(text, sandbox, { timeout: 2000 });
  } catch (e) {
    return { ok: false, reason: `Could not evaluate ${abs}: ${e.message}` };
  }
  const data = sandbox.window.RESUME_DATA;
  if (!data || typeof data !== "object") {
    return { ok: false, reason: `${abs} did not define window.RESUME_DATA` };
  }
  return { ok: true, data };
}

// ─── font loading ─────────────────────────────────────────────────────────────

// Satori requires OTF/TTF or WOFF (not WOFF2). Use the WOFF format from bunny.net.
// Fallback CDN: jsDelivr @fontsource/inter — both serve proper WOFF files.
const FONT_URLS = [
  "https://fonts.bunny.net/inter/files/inter-latin-700-normal.woff",
  "https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-700-normal.woff",
];
const FONT_CACHE = join(tmpdir(), "tokenfolio-inter-bold.woff");

async function loadFont() {
  // Use cached copy if it exists and is non-empty.
  if (existsSync(FONT_CACHE)) {
    try {
      const stat = statSync(FONT_CACHE);
      if (stat.size > 0) {
        return { ok: true, data: readFileSync(FONT_CACHE) };
      }
    } catch {
      // fall through to re-fetch
    }
  }

  // Try each CDN URL in order.
  const errors = [];
  for (const url of FONT_URLS) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) { errors.push(`HTTP ${res.status} from ${url}`); continue; }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length === 0) { errors.push(`empty body from ${url}`); continue; }
      // Cache to tmpdir.
      try { writeFileSync(FONT_CACHE, buf); } catch { /* non-fatal */ }
      return { ok: true, data: buf };
    } catch (e) {
      errors.push(`${e.message} (${url})`);
    }
  }
  return { ok: false, reason: `Font fetch failed: ${errors.join("; ")}` };
}

// ─── SVG composition ──────────────────────────────────────────────────────────

/**
 * Tiny helper so we don't need JSX. Builds a Satori-compatible element tree.
 */
function h(type, props, ...children) {
  const flatChildren = children.flat(Infinity).filter(c => c !== null && c !== undefined && c !== false);
  return {
    type,
    props: {
      ...props,
      children: flatChildren.length === 1 ? flatChildren[0] : flatChildren.length === 0 ? undefined : flatChildren,
    },
  };
}

function buildOgElement(data) {
  const user    = data.user || {};
  const totals  = data.totals || {};
  const year    = data.year || new Date().getFullYear();
  const byMonth = (data.by_month || []).slice(0, 12);

  const tokensStr  = fmtNum(totals.tokens || 0) + " tokens";
  const handle     = user.handle || "";
  const sessions   = (totals.sessions || 0).toLocaleString("en-US");
  const projects   = totals.projects || 0;
  const subtitle   = [handle, `${sessions} sessions`, `${projects} projects`].filter(Boolean).join("  ·  ");

  // Sparkline: find max for peak detection.
  const monthValues = byMonth.map(m => m.tokens || 0);
  const maxMonthVal = Math.max(...monthValues, 1);

  const BAR_W  = 56;
  const BAR_GAP = 6;
  const BAR_AREA_H = 48;
  const BAR_MAX_H  = 44;

  const sparkBars = byMonth.map((m, i) => {
    const val     = m.tokens || 0;
    const barH    = Math.max(4, Math.round((val / maxMonthVal) * BAR_MAX_H));
    const isPeak  = val === maxMonthVal;
    const barColor = isPeak ? "#a78bfa" : "#3a3a5c";
    return h(
      "div",
      {
        key: String(i),
        style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
          width: String(BAR_W) + "px",
          height: String(BAR_AREA_H) + "px",
          marginRight: i < byMonth.length - 1 ? String(BAR_GAP) + "px" : "0",
        },
      },
      h("div", {
        style: {
          width: String(BAR_W) + "px",
          height: String(barH) + "px",
          background: barColor,
          borderRadius: "4px",
        },
      }),
    );
  });

  const monthLabels = byMonth.map((m, i) =>
    h(
      "div",
      {
        key: "lbl-" + i,
        style: {
          display: "flex",
          width: String(BAR_W) + "px",
          justifyContent: "center",
          marginRight: i < byMonth.length - 1 ? String(BAR_GAP) + "px" : "0",
          color: "#55556a",
          fontSize: "11px",
          fontFamily: "Inter Bold, sans-serif",
          marginTop: "4px",
        },
      },
      m.label || "",
    )
  );

  return h(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        width: "1200px",
        height: "630px",
        background: "linear-gradient(135deg, #0a0a0f 0%, #14082a 100%)",
        position: "relative",
        fontFamily: "Inter Bold, sans-serif",
        overflow: "hidden",
      },
    },

    // ── purple radial glow top-left ──
    h("div", {
      style: {
        position: "absolute",
        top: "-180px",
        left: "-180px",
        width: "640px",
        height: "640px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(120,40,220,0.28) 0%, transparent 70%)",
      },
    }),

    // ── cyan radial glow bottom-right ──
    h("div", {
      style: {
        position: "absolute",
        bottom: "-160px",
        right: "-100px",
        width: "560px",
        height: "560px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(34,211,238,0.14) 0%, transparent 70%)",
      },
    }),

    // ── main content column ──
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          flex: "1",
          padding: "56px 72px 48px 72px",
          position: "relative",
        },
      },

      // ── top row: brand + year tag ──
      h(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "0",
          },
        },

        // brand: dot + wordmark
        h(
          "div",
          { style: { display: "flex", flexDirection: "row", alignItems: "center" } },
          h("div", {
            style: {
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #a78bfa, #22d3ee)",
              marginRight: "12px",
              flexShrink: "0",
            },
          }),
          h(
            "span",
            {
              style: {
                color: "#cdcdd6",
                fontSize: "20px",
                fontFamily: "Inter Bold, sans-serif",
                letterSpacing: "0.06em",
              },
            },
            "tokenfolio",
          ),
        ),

        // year tag
        h(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(167,139,250,0.15)",
              border: "1px solid rgba(167,139,250,0.35)",
              borderRadius: "8px",
              padding: "6px 18px",
            },
          },
          h(
            "span",
            {
              style: {
                color: "#a78bfa",
                fontSize: "18px",
                fontFamily: "Inter Bold, sans-serif",
                letterSpacing: "0.12em",
              },
            },
            String(year),
          ),
        ),
      ),

      // ── hero number ──
      h(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "row",
            alignItems: "baseline",
            marginTop: "52px",
          },
        },
        h(
          "span",
          {
            style: {
              color: "#f5f5f7",
              fontSize: "140px",
              fontFamily: "Inter Bold, sans-serif",
              fontWeight: "800",
              lineHeight: "1",
              letterSpacing: "-0.03em",
            },
          },
          tokensStr,
        ),
      ),

      // ── subtitle ──
      h(
        "span",
        {
          style: {
            color: "#7c7c99",
            fontSize: "26px",
            fontFamily: "Inter Bold, sans-serif",
            marginTop: "20px",
            letterSpacing: "0.01em",
          },
        },
        subtitle,
      ),

      // ── spacer ──
      h("div", { style: { display: "flex", flex: "1" } }),

      // ── sparkline: bars ──
      h(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            marginBottom: "8px",
          },
        },
        h(
          "div",
          {
            style: {
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-end",
            },
          },
          ...sparkBars,
        ),
        h(
          "div",
          {
            style: {
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-start",
            },
          },
          ...monthLabels,
        ),
      ),

      // ── bottom row: credit ──
      h(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-end",
            marginTop: "12px",
          },
        },
        h(
          "span",
          {
            style: {
              color: "#3a3a5c",
              fontSize: "14px",
              fontFamily: "Inter Bold, sans-serif",
              letterSpacing: "0.06em",
            },
          },
          "made with tokenfolio",
        ),
      ),
    ),
  );
}

// ─── main render function ─────────────────────────────────────────────────────

/**
 * Render og.png.
 *
 * Returns { ok: true } on success, or { ok: false, reason: string } on failure.
 * Does NOT call process.exit() — callers decide how to handle failure.
 */
export async function runOgJs({ output = "./og.png", input = "./data.js" } = {}) {
  // 1. Data must exist before we try loading heavy deps.
  const dataResult = loadDataJs(input);
  if (!dataResult.ok) return dataResult;
  const { data } = dataResult;

  // 2. Load optional deps.
  const satoriMod = await tryImport("satori");
  if (!satoriMod) {
    return {
      ok: false,
      reason:
        "satori not installed.\n" +
        "  Run `npm i -g satori @resvg/resvg-js` to use the JS renderer,\n" +
        "  or run `tokenfolio og --python` for the Pillow path.",
    };
  }

  const resvgMod = await tryImport("@resvg/resvg-js");
  if (!resvgMod) {
    return {
      ok: false,
      reason:
        "@resvg/resvg-js not installed.\n" +
        "  Run `npm i -g satori @resvg/resvg-js` to use the JS renderer,\n" +
        "  or run `tokenfolio og --python` for the Pillow path.",
    };
  }

  // Satori + resvg-js export shapes vary across resolution paths:
  //   ESM:                       { default: <fn>, init: <fn> }
  //   CJS via createRequire:     { default: { default: <fn>, … }, … }
  // Dig through both layers and bail with a clear error if we can't find
  // a callable.
  function unwrapFn(mod, key) {
    const candidates = [mod?.[key], mod?.default?.[key], mod?.default, mod];
    for (const c of candidates) if (typeof c === "function") return c;
    return null;
  }
  function unwrapClass(mod, name) {
    const candidates = [mod?.[name], mod?.default?.[name], mod?.default];
    for (const c of candidates) if (typeof c === "function") return c;
    return null;
  }
  const satori = typeof satoriMod === "function"
    ? satoriMod
    : (typeof satoriMod.default === "function" ? satoriMod.default
      : (typeof satoriMod.default?.default === "function" ? satoriMod.default.default
        : null));
  const Resvg = unwrapClass(resvgMod, "Resvg");
  if (typeof satori !== "function") {
    return { ok: false, reason: "Satori module loaded but no callable export found." };
  }
  if (typeof Resvg !== "function") {
    return { ok: false, reason: "@resvg/resvg-js loaded but Resvg class not found." };
  }

  // 3. Load font.
  const fontResult = await loadFont();
  if (!fontResult.ok) {
    return {
      ok: false,
      reason:
        fontResult.reason + "\n" +
        "  (Font is required for Satori rendering. Try again with a network connection,\n" +
        "  or use `tokenfolio og --python` for the Pillow path.)",
    };
  }

  // 4. Build element tree and render to SVG.
  let svgString;
  try {
    const element = buildOgElement(data);
    svgString = await satori(element, {
      width:  1200,
      height: 630,
      fonts: [
        {
          name: "Inter Bold",
          data: fontResult.data,
          weight: 800,
          style: "normal",
        },
      ],
    });
  } catch (e) {
    return { ok: false, reason: `Satori render failed: ${e.message}` };
  }

  // 5. Rasterize SVG → PNG.
  let pngBuf;
  try {
    const resvg = new Resvg(svgString, { fitTo: { mode: "width", value: 1200 } });
    pngBuf = resvg.render().asPng();
  } catch (e) {
    return { ok: false, reason: `@resvg/resvg-js rasterization failed: ${e.message}` };
  }

  // 6. Write output.
  const outAbs = resolve(process.cwd(), output);
  try {
    writeFileSync(outAbs, pngBuf);
  } catch (e) {
    return { ok: false, reason: `Could not write ${outAbs}: ${e.message}` };
  }

  const user   = data.user || {};
  const totals = data.totals || {};
  const size   = statSync(outAbs).size;
  console.error(`✓ wrote ${outAbs} (${size.toLocaleString("en-US")} bytes)`);
  console.error(
    `  ${user.name || "unknown"} · ${fmtNum(totals.tokens || 0)} tokens · ` +
    `${(totals.sessions || 0).toLocaleString("en-US")} sessions · ${totals.projects || 0} projects`,
  );
  return { ok: true };
}

// ─── CLI entry point ──────────────────────────────────────────────────────────

function parseCLIArgs(argv) {
  const o = { output: "./og.png", input: "./data.js", help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") { o.help = true; }
    else if (a === "--output" || a === "-o") { o.output = argv[++i]; }
    else if (a === "--input")                 { o.input  = argv[++i]; }
    else { console.error(`unknown arg: ${a}`); process.exit(2); }
  }
  return o;
}

async function main() {
  const args = parseCLIArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`Usage: node scripts/gen-og.js [--output PATH] [--input PATH]

Options:
  --output PATH   output PNG path (default: ./og.png)
  --input  PATH   input data.js   (default: ./data.js)
  --help          show this message

Requires satori and @resvg/resvg-js (npm i -g satori @resvg/resvg-js).
`);
    return;
  }
  const result = await runOgJs(args);
  if (!result.ok) {
    console.error("× " + result.reason);
    process.exit(1);
  }
}

// Run CLI only when executed directly, not when imported.
const isMain = process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  main().catch(e => { console.error("× " + e.message); process.exit(1); });
}
