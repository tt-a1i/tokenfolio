#!/usr/bin/env node
/**
 * tokenfolio · auto-extract your AI usage and write data.js
 *
 * Sources (v0.3):
 *   - Claude Code   via ccusage (npm)
 *
 * Coming next:
 *   - Codex (~/.codex/sessions/**)
 *   - Cursor / Aider / Continue.dev (where token counts exist)
 *
 * Privacy: only token counts, model names, project paths, and dates are read.
 *          Prompt contents are NEVER extracted.
 */

import { spawnSync } from "node:child_process";
import { writeFileSync, existsSync, statSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";
import { homedir } from "node:os";

const HELP = `tokenfolio · generate data.js from your AI tool usage

USAGE
  tokenfolio init [options]

OPTIONS
  --year YYYY        year to summarize (default: current year)
  --output PATH      write to PATH (default: ./data.js)
  --name NAME        override user.name      (else: git config user.name)
  --handle HANDLE    override user.handle    (else: from git email)
  --title TITLE      override user.title     (default: "AI Pair Programmer")
  --location LOC     override user.location
  --force            overwrite existing output file
  --dry              print to stdout, don't write
  -h, --help         show this help

EXAMPLES
  tokenfolio init --dry
  tokenfolio init --year 2025 --force
  tokenfolio init --name "Ada Lovelace" --handle "@ada"

PRIVACY
  Only token counts, model names, project paths, and dates are read.
  Prompt contents are never extracted.
`;

const MONTH_LABELS = [
  "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"
];

// ─── arg parsing ──────────────────────────────────────────────────────────

function parseArgs(argv) {
  const o = {
    cmd: "",
    year: new Date().getFullYear(),
    output: "./data.js",
    force: false,
    dry: false,
    overrides: {}
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-h" || a === "--help") { console.log(HELP); process.exit(0); }
    else if (a === "init")            o.cmd = "init";
    else if (a === "--year")          o.year = +argv[++i];
    else if (a === "--output" || a === "-o") o.output = argv[++i];
    else if (a === "--name")          o.overrides.name = argv[++i];
    else if (a === "--handle")        o.overrides.handle = argv[++i];
    else if (a === "--title")         o.overrides.title = argv[++i];
    else if (a === "--location")      o.overrides.location = argv[++i];
    else if (a === "--force")         o.force = true;
    else if (a === "--dry")           o.dry = true;
    else { console.error(`unknown arg: ${a}\n${HELP}`); process.exit(2); }
  }
  if (!o.cmd) { console.error(HELP); process.exit(2); }
  return o;
}

// ─── helpers ──────────────────────────────────────────────────────────────

function gitConf(key) {
  const r = spawnSync("git", ["config", "--global", key], { encoding: "utf8" });
  return r.status === 0 ? r.stdout.trim() : "";
}

function ccusage(subcommand) {
  // Try locally-installed ccusage first, then fall back to npx (slower).
  for (const [cmd, args] of [
    ["ccusage", [subcommand, "--json"]],
    ["npx",     ["--yes", "ccusage@latest", subcommand, "--json"]]
  ]) {
    const r = spawnSync(cmd, args, {
      encoding: "utf8",
      maxBuffer: 200 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"]
    });
    if (r.status === 0 && r.stdout) {
      try { return JSON.parse(r.stdout); } catch { /* try next */ }
    }
  }
  return null;
}

function simplifyModel(name) {
  // claude-opus-4-7              → opus-4.7
  // claude-sonnet-4-6            → sonnet-4.6
  // claude-haiku-4-5-20251001    → haiku-4.5
  let m = (name || "").replace(/^claude-/, "");
  m = m.replace(/-\d{8}$/, "");
  m = m.replace(/-(\d+)-(\d+)$/, "-$1.$2");
  return m;
}

function modelColor(name) {
  if (/opus/i.test(name))   return "#c084fc";
  if (/sonnet/i.test(name)) return "#4facff";
  if (/haiku/i.test(name)) return "#a6e22e";
  return "#9ca3af";
}

function decodeProjectPath(sessionId) {
  if (!sessionId || sessionId === "Unknown Project") {
    return { name: "unknown", path: "" };
  }
  // ccusage encodes cwd by replacing `/` with `-`. Best-effort decode —
  // breaks for paths that contain literal hyphens, but the leaf name is
  // still close enough for display.
  const path = "/" + sessionId.replace(/^-/, "").replace(/-/g, "/");
  return { name: basename(path) || "root", path };
}

function* walkJsonlFiles(root) {
  if (!existsSync(root)) return;
  let entries;
  try { entries = readdirSync(root, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const p = join(root, e.name);
    if (e.isDirectory()) yield* walkJsonlFiles(p);
    else if (e.isFile() && e.name.endsWith(".jsonl")) {
      let s; try { s = statSync(p); } catch { continue; }
      yield { path: p, mtime: s.mtime, project: basename(root) };
    }
  }
}

function countSessions(year) {
  // Each `.jsonl` under ~/.claude/projects/<encoded-cwd>/<uuid>.jsonl
  // is one Claude Code conversation. ccusage's "session" output is
  // aggregated per project, so we still need to walk the tree to get
  // a real conversation count.
  const root = join(homedir(), ".claude", "projects");
  const result = { total: 0, byMonth: {}, byProject: {} };
  for (const f of walkJsonlFiles(root)) {
    const y = f.mtime.getFullYear();
    if (year && y !== year) continue;
    const ym = `${y}-${String(f.mtime.getMonth() + 1).padStart(2, "0")}`;
    result.total++;
    result.byMonth[ym] = (result.byMonth[ym] || 0) + 1;
    result.byProject[f.project] = (result.byProject[f.project] || 0) + 1;
  }
  return result;
}

// ─── main ─────────────────────────────────────────────────────────────────

function main() {
  const args = parseArgs(process.argv.slice(2));
  const year = args.year;

  console.error(`▸ tokenfolio init · year ${year}`);
  console.error(`▸ probing ccusage…`);

  const monthly = ccusage("monthly");
  const session = ccusage("session");
  if (!monthly || !session) {
    console.error("× ccusage not available. Install it with `npm i -g ccusage` and retry.");
    process.exit(1);
  }
  console.error(`▸ ccusage OK · ${(monthly.monthly||[]).length} months · ${(session.sessions||[]).length} projects`);

  const monthsInYear = (monthly.monthly || []).filter(m =>
    typeof m.month === "string" && m.month.startsWith(`${year}-`)
  );
  if (monthsInYear.length === 0) {
    console.error(`× no Claude Code data for ${year}.`);
    console.error(`  available years:`, [...new Set((monthly.monthly||[]).map(m => m.month?.slice(0,4)))].sort());
    process.exit(1);
  }

  const fs = countSessions(year);
  console.error(`▸ scanned ~/.claude/projects · ${fs.total} conversations`);

  // user identity ─────────────────────────────────────
  const fullName = args.overrides.name || gitConf("user.name") || "Your Name";
  const email    = gitConf("user.email") || "you@example.com";
  const handle   = args.overrides.handle || `@${email.split("@")[0]}`;

  const user = {
    name: fullName,
    handle,
    title:    args.overrides.title    || "AI Pair Programmer",
    location: args.overrides.location || "",
    since:    monthsInYear[0]?.month || `${year}-01`,
    avatar_initials: fullName.split(/\s+/).map(p => p[0] || "").join("").slice(0, 2).toUpperCase() || "AL",
    bio: "Building tools at the seam between humans and language models.",
    links: []
  };

  // by_month ──────────────────────────────────────────
  const by_month = [];
  for (let i = 0; i < 12; i++) {
    const ym = `${year}-${String(i + 1).padStart(2, "0")}`;
    const m  = monthsInYear.find(x => x.month === ym);
    if (m) {
      by_month.push({
        month: ym,
        label: MONTH_LABELS[i],
        tokens: (m.inputTokens || 0) + (m.outputTokens || 0),
        sessions: fs.byMonth[ym] || 0,
        top_project: "",
        top_model:   m.modelsUsed?.[0] ? simplifyModel(m.modelsUsed[0]) : "—",
        note: ""
      });
    } else {
      by_month.push({
        month: ym, label: MONTH_LABELS[i],
        tokens: 0, sessions: 0,
        top_project: "", top_model: "—", note: ""
      });
    }
  }
  // peak
  const peak = by_month.reduce((a, b) => a.tokens > b.tokens ? a : b, by_month[0]);
  if (peak && peak.tokens > 0) peak.peak = true;

  // top_projects ─────────────────────────────────────
  const top_projects = (session.sessions || [])
    .map(s => {
      const p = decodeProjectPath(s.sessionId);
      return {
        name: p.name,
        tokens: (s.inputTokens || 0) + (s.outputTokens || 0),
        sessions: fs.byProject[p.name] || 0,
        language: "",
        description: p.path || "—"
      };
    })
    .filter(p => p.tokens > 0 && p.name && p.name !== "unknown")
    .sort((a, b) => b.tokens - a.tokens)
    .slice(0, 8);

  // by_model ─────────────────────────────────────────
  const modelMap = new Map();
  for (const m of monthsInYear) {
    for (const mb of (m.modelBreakdowns || [])) {
      const key = simplifyModel(mb.modelName);
      const e   = modelMap.get(key) || { name: key, tokens: 0, sessions: 0, color: modelColor(key) };
      e.tokens += (mb.inputTokens || 0) + (mb.outputTokens || 0);
      modelMap.set(key, e);
    }
  }
  // session counts per model (by lastActivity year filter)
  for (const s of (session.sessions || [])) {
    const yr = +(s.lastActivity || "").slice(0, 4);
    if (yr && yr !== year) continue;
    for (const m of (s.modelsUsed || [])) {
      const e = modelMap.get(simplifyModel(m));
      if (e) e.sessions += fs.byProject[decodeProjectPath(s.sessionId).name] || 1;
    }
  }
  const by_model = [...modelMap.values()].sort((a, b) => b.tokens - a.tokens);

  // totals ───────────────────────────────────────────
  const totals = {
    tokens:        by_month.reduce((s, m) => s + m.tokens, 0),
    input_tokens:  monthsInYear.reduce((s, m) => s + (m.inputTokens  || 0), 0),
    output_tokens: monthsInYear.reduce((s, m) => s + (m.outputTokens || 0), 0),
    sessions:      fs.total,
    projects:      top_projects.length,
    cost_usd:      +monthsInYear.reduce((s, m) => s + (m.totalCost || 0), 0).toFixed(2),
    avg_session_tokens: 0
  };
  totals.avg_session_tokens = totals.sessions > 0
    ? Math.round(totals.tokens / totals.sessions)
    : 0;

  // highlights ───────────────────────────────────────
  const highlights = [
    {
      label: "Peak month",
      value: peak?.tokens > 0 ? peak.label : "—",
      detail: peak?.tokens > 0
        ? `${(peak.tokens / 1e6).toFixed(1)}M tokens · ${peak.sessions} sessions`
        : "no data"
    },
    {
      label: "Total spent",
      value: `$${totals.cost_usd}`,
      detail: "API cost across all models"
    },
    {
      label: "Top model",
      value: by_model[0]?.name || "—",
      detail: by_model[0]
        ? `${(by_model[0].tokens / 1e6).toFixed(1)}M tokens`
        : "no data"
    },
    {
      label: "Avg session",
      value: totals.avg_session_tokens >= 1000
        ? `${(totals.avg_session_tokens / 1000).toFixed(0)}k`
        : String(totals.avg_session_tokens),
      detail: "Tokens per conversation"
    }
  ];

  const data = { user, year, totals, by_month, by_model, top_projects, highlights };

  const banner = `/**
 * Generated by tokenfolio init on ${new Date().toISOString().slice(0, 19)}Z
 * Year: ${year} · ${totals.sessions} sessions · ${by_model.length} models · ${top_projects.length} projects
 *
 * Edit freely — this is your data. Re-run \`tokenfolio init --force\` to refresh.
 */`;

  const helpers = `
// Tiny formatters reused by every template.
window.RESUME_FMT = {
  num(n) { if (n >= 1e9) return (n/1e9).toFixed(1)+"B"; if (n >= 1e6) return (n/1e6).toFixed(1)+"M"; if (n >= 1e3) return (n/1e3).toFixed(1)+"k"; return String(n); },
  pct(n, total) { return total ? ((n/total)*100).toFixed(0) + "%" : "0%"; },
  comma(n) { return n.toLocaleString("en-US"); }
};
`;

  const js = `${banner}\nwindow.RESUME_DATA = ${JSON.stringify(data, null, 2)};\n${helpers}`;

  if (args.dry) {
    process.stdout.write(js);
    return;
  }
  if (existsSync(args.output) && !args.force) {
    console.error(`× ${args.output} exists. Use --force to overwrite.`);
    process.exit(1);
  }
  writeFileSync(args.output, js, "utf8");
  console.error(`✓ wrote ${args.output} (${js.length} bytes)`);
  console.error(`  ${totals.tokens.toLocaleString("en-US")} tokens · ${totals.sessions} sessions · ${totals.projects} projects · $${totals.cost_usd}`);
}

main();
