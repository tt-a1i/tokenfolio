#!/usr/bin/env node
/**
 * tokenfolio · auto-extract your AI usage and write data.js
 *
 * Sources (init):
 *   --source claude   Claude Code (~/.claude/projects/) — via ccusage
 *   --source codex    Codex       (~/.codex/sessions/)  — own JSONL parser
 *   --source all      both        (default)
 *
 * Privacy: only token counts, model names, project paths, and dates are read.
 * The Codex parser uses an explicit allowlist on `event_msg.payload.type`
 * (token_count + turn_context only) — `user_message`, `agent_message`,
 * `agent_reasoning`, and `response_item` lines are all dropped before any
 * field access happens.
 */

import { spawnSync } from "node:child_process";
import { writeFileSync, existsSync, statSync, readdirSync, readFileSync } from "node:fs";
import { join, basename, dirname, resolve, isAbsolute, relative } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

// ─── help text + arg parsing ──────────────────────────────────────────────

const HELP = `tokenfolio · generate data.js / og.png from your AI tool usage

USAGE
  tokenfolio init  [options]    aggregate AI usage → data.js
  tokenfolio og    [options]    render personalized og.png from data.js
  tokenfolio brand [options]    point templates' og:meta at your deploy URL

INIT OPTIONS
  --source NAME      claude | codex | all   (default: all)
  --year YYYY        year to summarize      (default: current year)
  --output PATH      write to PATH          (default: ./data.js)
  --name NAME        override user.name     (else: git config user.name)
  --handle HANDLE    override user.handle   (else: from git email)
  --title TITLE      override user.title    (default: "AI Pair Programmer")
  --location LOC     override user.location
  --bio TEXT         override user.bio      (default: a sensible placeholder)
  --force            overwrite existing output file
  --dry              print to stdout, don't write

OG OPTIONS
  --output PATH      write to PATH          (default: ./og.png)

BRAND OPTIONS
  --site-url URL     deploy URL (default: inferred from \`git remote origin\`)

GLOBAL
  -h, --help

EXAMPLES
  tokenfolio init --dry
  tokenfolio init --year 2025 --force
  tokenfolio init --source codex --year 2026 --dry
  tokenfolio og                                                    # writes ./og.png
  tokenfolio brand                                                 # auto-detect
  tokenfolio brand --site-url https://you.github.io/tokenfolio/    # explicit

REQUIREMENTS
  init:  Node ≥18; ccusage (auto-fetched via npx) for Claude Code source
  og:    Python 3.9+ with Pillow (\`pip install Pillow\`)
  brand: writes to template HTML files in cwd (idempotent)

PRIVACY
  Only numeric / path / date fields are read. Prompt content is never extracted.
  See top-of-file comment for the explicit allowlist.
`;

const MONTH_LABELS = [
  "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"
];

// The original deploy URL hardcoded in template <meta> tags. `tokenfolio brand`
// rewrites away from this. Pinning the prefix here means we have one source of
// truth for "what we replace from".
const ORIGINAL_SITE = "https://tt-a1i.github.io/tokenfolio";

// Pinned ccusage major. Bump deliberately when a new schema lands.
const CCUSAGE_SPEC = "ccusage@^18";

// Codex `event_msg.payload.type` values we'll ever read. Anything else is
// dropped without field access — this is the privacy red line, structurally.
const CODEX_ALLOWED_PAYLOAD_TYPES = new Set(["token_count", "turn_context"]);

const TEMPLATE_DIRS = [
  "wrapped", "cosmos", "almanac", "terminal",
  "aurora", "holo", "pixel", "pass", "brutalist"
];

function parseArgs(argv) {
  const o = {
    cmd: "",
    source: "all",
    year: new Date().getFullYear(),
    output: null,             // resolved per-cmd later
    force: false,
    dry: false,
    overrides: {}
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-h" || a === "--help") { console.log(HELP); process.exit(0); }
    else if (["init", "og", "brand"].includes(a)) o.cmd = a;
    else if (a === "--source")        o.source = argv[++i];
    else if (a === "--year")          o.year = parseYearArg(argv[++i]);
    else if (a === "--output" || a === "-o") o.output = argv[++i];
    else if (a === "--name")          o.overrides.name = argv[++i];
    else if (a === "--handle")        o.overrides.handle = argv[++i];
    else if (a === "--title")         o.overrides.title = argv[++i];
    else if (a === "--location")      o.overrides.location = argv[++i];
    else if (a === "--bio")           o.overrides.bio = argv[++i];
    else if (a === "--site-url")      o.overrides.siteUrl = argv[++i];
    else if (a === "--force")         o.force = true;
    else if (a === "--dry")           o.dry = true;
    else { console.error(`unknown arg: ${a}\n${HELP}`); process.exit(2); }
  }
  if (!o.cmd) { console.error(HELP); process.exit(2); }
  if (o.cmd === "init" && !["all", "claude", "codex"].includes(o.source)) {
    console.error(`× --source must be one of: all, claude, codex`); process.exit(2);
  }
  // resolve default output per-cmd
  if (o.output == null) o.output = o.cmd === "og" ? "./og.png" : "./data.js";
  return o;
}

function parseYearArg(raw) {
  const n = +raw;
  if (!Number.isInteger(n) || n < 2000 || n > 2200) {
    console.error(`× --year must be a 4-digit year (got: ${raw})`);
    process.exit(2);
  }
  return n;
}

// ─── shared helpers ───────────────────────────────────────────────────────

function gitConf(key) {
  const r = spawnSync("git", ["config", "--global", key], { encoding: "utf8" });
  return r.status === 0 ? r.stdout.trim() : "";
}

function gitRemoteUrl() {
  const r = spawnSync("git", ["remote", "get-url", "origin"], { encoding: "utf8" });
  return r.status === 0 ? r.stdout.trim() : "";
}

function simplifyClaudeModel(name) {
  let m = (name || "").replace(/^claude-/, "");
  m = m.replace(/-\d{8}$/, "");
  m = m.replace(/-(\d+)-(\d+)$/, "-$1.$2");
  return m;
}

function simplifyCodexModel(name) {
  return (name || "").replace(/^openai\//, "") || "openai";
}

function modelColor(name) {
  if (/opus/i.test(name))   return "#c084fc";
  if (/sonnet/i.test(name)) return "#4facff";
  if (/haiku/i.test(name))  return "#a6e22e";
  if (/codex/i.test(name) || /gpt/i.test(name)) return "#10a37f";
  if (/o1|o3|o4/.test(name)) return "#ff6ec7";
  return "#9ca3af";
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
      yield { path: p, mtime: s.mtime, parent: basename(root) };
    }
  }
}

// ─── Claude Code via ccusage ──────────────────────────────────────────────

function ccusage(sub) {
  for (const [cmd, args] of [
    ["ccusage", [sub, "--json"]],
    ["npx",     ["--yes", CCUSAGE_SPEC, sub, "--json"]]
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

function decodeClaudeProject(sessionId) {
  if (!sessionId || sessionId === "Unknown Project") {
    return { name: "unknown", path: "" };
  }
  const path = "/" + sessionId.replace(/^-/, "").replace(/-/g, "/");
  return { name: basename(path) || "root", path };
}

function aggregateClaude(year) {
  const monthly = ccusage("monthly");
  const session = ccusage("session");
  if (!monthly || !session) return null;

  const monthsInYear = (monthly.monthly || []).filter(m =>
    typeof m.month === "string" && m.month.startsWith(`${year}-`)
  );

  const root = join(homedir(), ".claude", "projects");
  const conv = { total: 0, byMonth: {}, byProject: {} };
  for (const f of walkJsonlFiles(root)) {
    const y = f.mtime.getFullYear();
    if (y !== year) continue;
    const ym = `${y}-${String(f.mtime.getMonth() + 1).padStart(2, "0")}`;
    conv.total++;
    conv.byMonth[ym] = (conv.byMonth[ym] || 0) + 1;
    conv.byProject[f.parent] = (conv.byProject[f.parent] || 0) + 1;
  }

  if (monthsInYear.length === 0 && conv.total === 0) return null;

  const by_month = monthsInYear.map(m => {
    const i = +m.month.slice(5, 7) - 1;
    return {
      month: m.month,
      label: MONTH_LABELS[i],
      tokens: (m.inputTokens || 0) + (m.outputTokens || 0),
      sessions: conv.byMonth[m.month] || 0,
      top_model: m.modelsUsed?.[0] ? simplifyClaudeModel(m.modelsUsed[0]) : "—",
      top_project: ""
    };
  });

  const top_projects = (session.sessions || [])
    .filter(s => +(s.lastActivity || "").slice(0, 4) === year)
    .map(s => {
      const p = decodeClaudeProject(s.sessionId);
      return {
        name: p.name,
        tokens: (s.inputTokens || 0) + (s.outputTokens || 0),
        sessions: conv.byProject[p.name] || 0,
        path: p.path,
        language: ""
      };
    })
    .filter(p => p.tokens > 0 && p.name && p.name !== "unknown");

  const modelMap = new Map();
  for (const m of monthsInYear) {
    for (const mb of (m.modelBreakdowns || [])) {
      const key = simplifyClaudeModel(mb.modelName);
      const e = modelMap.get(key) || { name: key, tokens: 0, sessions: 0, color: modelColor(key) };
      e.tokens += (mb.inputTokens || 0) + (mb.outputTokens || 0);
      modelMap.set(key, e);
    }
  }
  for (const s of (session.sessions || [])) {
    if (+(s.lastActivity || "").slice(0, 4) !== year) continue;
    for (const m of (s.modelsUsed || [])) {
      const key = simplifyClaudeModel(m);
      const e = modelMap.get(key);
      if (e) e.sessions += conv.byProject[decodeClaudeProject(s.sessionId).name] || 1;
    }
  }
  const by_model = [...modelMap.values()];

  const totals = {
    tokens:        by_month.reduce((s, m) => s + m.tokens, 0),
    input_tokens:  monthsInYear.reduce((s, m) => s + (m.inputTokens || 0), 0),
    output_tokens: monthsInYear.reduce((s, m) => s + (m.outputTokens || 0), 0),
    sessions:      conv.total,
    cost_usd:      +monthsInYear.reduce((s, m) => s + (m.totalCost || 0), 0).toFixed(2)
  };

  return { by_month, top_projects, by_model, totals, source: "claude" };
}

// ─── Codex via own JSONL parser ───────────────────────────────────────────

function* walkCodexFiles(root, year) {
  if (!existsSync(root)) return;
  let years;
  try { years = readdirSync(root, { withFileTypes: true }); } catch { return; }
  for (const yEnt of years) {
    if (!yEnt.isDirectory()) continue;
    if (year && +yEnt.name !== year) continue;
    const yPath = join(root, yEnt.name);
    let months;
    try { months = readdirSync(yPath, { withFileTypes: true }); } catch { continue; }
    for (const mEnt of months) {
      if (!mEnt.isDirectory()) continue;
      const mPath = join(yPath, mEnt.name);
      let days;
      try { days = readdirSync(mPath, { withFileTypes: true }); } catch { continue; }
      for (const dEnt of days) {
        if (!dEnt.isDirectory()) continue;
        const dPath = join(mPath, dEnt.name);
        let files;
        try { files = readdirSync(dPath); } catch { continue; }
        for (const f of files) {
          if (!f.endsWith(".jsonl") || !f.startsWith("rollout-")) continue;
          yield {
            path: join(dPath, f),
            ym: `${yEnt.name}-${mEnt.name.padStart(2, "0")}`,
            monthIdx: +mEnt.name - 1
          };
        }
      }
    }
  }
}

function parseCodexFile(filePath) {
  // Privacy contract: this function reads ONLY four kinds of payloads
  //   - top-level type === "session_meta"        → cwd, model
  //   - top-level type === "turn_context"        → model
  //   - event_msg with payload.type === "turn_context"  → model
  //   - event_msg with payload.type === "token_count"   → numeric counts
  // Every other line — including `response_item`, `event_msg.user_message`,
  // `event_msg.agent_message`, `event_msg.agent_reasoning` — is dropped
  // before any field access. No prompt or completion content is ever read
  // beyond an integer counter.
  let content;
  try { content = readFileSync(filePath, "utf8"); } catch { return null; }

  const lines = content.split("\n");
  let cwd = "", model = "";
  let bestRealInput = 0, bestOutput = 0, bestReasoning = 0, bestCached = 0;
  let bestSum = 0;

  if (lines[0]) {
    try {
      const m = JSON.parse(lines[0]);
      if (m.type === "session_meta" && m.payload) {
        cwd = m.payload.cwd || "";
        if (m.payload.model) model = m.payload.model;
      }
    } catch {}
  }

  for (const line of lines) {
    if (!line) continue;
    if (!line.includes('"type"')) continue;
    let obj; try { obj = JSON.parse(line); } catch { continue; }

    // top-level allowlist
    if (obj.type === "session_meta") continue;       // already handled above
    if (obj.type === "turn_context") {
      if (obj.payload?.model) model = obj.payload.model;
      continue;
    }
    if (obj.type !== "event_msg") continue;          // anything else (response_item, …) — drop

    // event_msg payload allowlist — explicit, structurally enforced
    const ptype = obj.payload?.type;
    if (!CODEX_ALLOWED_PAYLOAD_TYPES.has(ptype)) continue;

    if (ptype === "turn_context") {
      const m = obj.payload?.model || obj.payload?.context?.model;
      if (m) model = m;
    } else if (ptype === "token_count") {
      const t = obj.payload?.info?.total_token_usage || {};
      const cached    = t.cached_input_tokens     || 0;
      const realInput = Math.max(0, (t.input_tokens || 0) - cached);
      const out       = t.output_tokens           || 0;
      const reason    = t.reasoning_output_tokens || 0;
      const sum = realInput + out + reason;
      if (sum > bestSum) {
        bestSum       = sum;
        bestRealInput = realInput;
        bestOutput    = out;
        bestReasoning = reason;
        bestCached    = cached;
      }
    }
  }

  if (bestSum === 0 && !cwd) return null;

  return {
    cwd,
    project: cwd ? basename(cwd) || "root" : "unknown",
    model: model || "openai",
    inputTokens:  bestRealInput,
    outputTokens: bestOutput + bestReasoning,
    cachedTokens: bestCached,
    tokens:       bestSum
  };
}

function aggregateCodex(year) {
  const root = join(homedir(), ".codex", "sessions");
  if (!existsSync(root)) return null;

  const monthBucket = new Map();
  const projectBucket = new Map();
  const modelBucket = new Map();
  let totalTokens = 0, totalInput = 0, totalOutput = 0, totalSessions = 0;

  for (const f of walkCodexFiles(root, year)) {
    const s = parseCodexFile(f.path);
    if (!s || s.tokens === 0) continue;

    totalTokens   += s.tokens;
    totalInput    += s.inputTokens;
    totalOutput   += s.outputTokens;
    totalSessions += 1;

    const mb = monthBucket.get(f.ym) || {
      tokens: 0, sessions: 0, models: new Set(), projects: new Map()
    };
    mb.tokens   += s.tokens;
    mb.sessions += 1;
    if (s.model) mb.models.add(s.model);
    mb.projects.set(s.project, (mb.projects.get(s.project) || 0) + s.tokens);
    monthBucket.set(f.ym, mb);

    const pb = projectBucket.get(s.project) || {
      name: s.project, tokens: 0, sessions: 0, path: s.cwd, models: new Set()
    };
    pb.tokens   += s.tokens;
    pb.sessions += 1;
    if (s.model) pb.models.add(s.model);
    projectBucket.set(s.project, pb);

    const key = simplifyCodexModel(s.model);
    const mod = modelBucket.get(key) || { name: key, tokens: 0, sessions: 0, color: modelColor(key) };
    mod.tokens   += s.tokens;
    mod.sessions += 1;
    modelBucket.set(key, mod);
  }

  if (totalSessions === 0) return null;

  const by_month = [];
  for (const [ym, mb] of [...monthBucket.entries()].sort()) {
    const i = +ym.slice(5, 7) - 1;
    let topProj = "", topProjTokens = 0;
    for (const [p, t] of mb.projects.entries()) {
      if (t > topProjTokens) { topProj = p; topProjTokens = t; }
    }
    by_month.push({
      month: ym,
      label: MONTH_LABELS[i],
      tokens: mb.tokens,
      sessions: mb.sessions,
      top_model: [...mb.models][0] ? simplifyCodexModel([...mb.models][0]) : "openai",
      top_project: topProj
    });
  }

  const top_projects = [...projectBucket.values()]
    .filter(p => p.tokens > 0 && p.name && p.name !== "unknown")
    .map(p => ({
      name: p.name,
      tokens: p.tokens,
      sessions: p.sessions,
      path: p.path,
      language: ""
    }));

  return {
    by_month,
    top_projects,
    by_model: [...modelBucket.values()],
    totals: {
      tokens: totalTokens,
      input_tokens: totalInput,
      output_tokens: totalOutput,
      sessions: totalSessions,
      cost_usd: 0
    },
    source: "codex"
  };
}

// ─── merge multiple sources ───────────────────────────────────────────────

function mergeAggregates(sources) {
  if (sources.length === 1) return sources[0];

  const ymMap = new Map();
  for (const s of sources) {
    for (const m of s.by_month) {
      const e = ymMap.get(m.month) || {
        month: m.month, label: m.label,
        tokens: 0, sessions: 0,
        top_project: "", top_model: ""
      };
      e.tokens   += m.tokens;
      e.sessions += m.sessions;
      if (!e.top_project && m.top_project) e.top_project = m.top_project;
      if (!e.top_model   && m.top_model)   e.top_model   = m.top_model;
      ymMap.set(m.month, e);
    }
  }
  const by_month = [...ymMap.values()].sort((a, b) => a.month.localeCompare(b.month));

  const modelMap = new Map();
  for (const s of sources) {
    for (const m of s.by_model) {
      const e = modelMap.get(m.name) || { ...m, tokens: 0, sessions: 0 };
      e.tokens   += m.tokens;
      e.sessions += m.sessions;
      modelMap.set(m.name, e);
    }
  }
  const by_model = [...modelMap.values()];

  const projMap = new Map();
  for (const s of sources) {
    for (const p of s.top_projects) {
      const e = projMap.get(p.name) || { ...p, tokens: 0, sessions: 0 };
      e.tokens   += p.tokens;
      e.sessions += p.sessions;
      if (!e.path && p.path) e.path = p.path;
      projMap.set(p.name, e);
    }
  }
  const top_projects = [...projMap.values()];

  const totals = {
    tokens:        sources.reduce((s, x) => s + x.totals.tokens, 0),
    input_tokens:  sources.reduce((s, x) => s + x.totals.input_tokens, 0),
    output_tokens: sources.reduce((s, x) => s + x.totals.output_tokens, 0),
    sessions:      sources.reduce((s, x) => s + x.totals.sessions, 0),
    cost_usd:      +sources.reduce((s, x) => s + x.totals.cost_usd, 0).toFixed(2)
  };

  return { by_month, top_projects, by_model, totals, source: sources.map(s => s.source).join("+") };
}

// ─── final shape building ─────────────────────────────────────────────────

function buildResumeData(args, agg) {
  const fullName = args.overrides.name || gitConf("user.name") || "Your Name";
  const email    = gitConf("user.email") || "you@example.com";
  const emailHandle = email.split("@")[0];
  const handle   = args.overrides.handle || `@${emailHandle}`;

  // Friendly nudge: numeric-only handles are usually QQ/163 numeric prefixes
  // and look weird on a public résumé. Mention it once, non-fatal.
  if (!args.overrides.handle && /^\d+$/.test(emailHandle)) {
    console.error(`  hint: handle "${handle}" looks numeric — pass --handle "@yourname" to override.`);
  }

  const user = {
    name: fullName,
    handle,
    title:    args.overrides.title    || "AI Pair Programmer",
    location: args.overrides.location || "",
    since:    agg.by_month[0]?.month || `${args.year}-01`,
    avatar_initials: fullName.split(/\s+/).map(p => p[0] || "").join("").slice(0, 2).toUpperCase() || "AL",
    bio: args.overrides.bio ?? "Building tools at the seam between humans and language models.",
    links: []
  };

  const ymMap = new Map(agg.by_month.map(m => [m.month, m]));
  const fullYearMonths = [];
  for (let i = 0; i < 12; i++) {
    const ym = `${args.year}-${String(i + 1).padStart(2, "0")}`;
    const existing = ymMap.get(ym);
    fullYearMonths.push(existing || {
      month: ym, label: MONTH_LABELS[i],
      tokens: 0, sessions: 0,
      top_project: "", top_model: "—",
      note: ""
    });
  }
  const peak = fullYearMonths.reduce((a, b) => a.tokens > b.tokens ? a : b);
  if (peak.tokens > 0) peak.peak = true;
  fullYearMonths.forEach(m => { if (m.note === undefined) m.note = ""; });

  const top_projects = agg.top_projects
    .sort((a, b) => b.tokens - a.tokens)
    .slice(0, 8)
    .map(p => ({
      name: p.name,
      tokens: p.tokens,
      sessions: p.sessions,
      language: p.language || "",
      description: p.path || "—"
    }));

  const by_model = agg.by_model.sort((a, b) => b.tokens - a.tokens);

  const totals = {
    ...agg.totals,
    projects: top_projects.length,
    avg_session_tokens: agg.totals.sessions > 0
      ? Math.round(agg.totals.tokens / agg.totals.sessions)
      : 0
  };

  const highlights = [
    {
      label: "Peak month",
      value: peak.tokens > 0 ? peak.label : "—",
      detail: peak.tokens > 0
        ? `${(peak.tokens / 1e6).toFixed(1)}M tokens · ${peak.sessions} sessions`
        : "no data"
    },
    {
      label: totals.cost_usd > 0 ? "Total spent" : "Sources",
      value: totals.cost_usd > 0 ? `$${totals.cost_usd}` : agg.source,
      detail: totals.cost_usd > 0 ? "API cost (Claude Code)" : "data sources merged"
    },
    {
      label: "Top model",
      value: by_model[0]?.name || "—",
      detail: by_model[0] ? `${(by_model[0].tokens / 1e6).toFixed(1)}M tokens` : "no data"
    },
    {
      label: "Avg session",
      value: totals.avg_session_tokens >= 1000
        ? `${(totals.avg_session_tokens / 1000).toFixed(0)}k`
        : String(totals.avg_session_tokens),
      detail: "Tokens per conversation"
    }
  ];

  return { user, year: args.year, totals, by_month: fullYearMonths, by_model, top_projects, highlights };
}

// ─── og: shell out to scripts/gen-og.py ───────────────────────────────────

function runOg(args) {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    join(here, "..", "scripts", "gen-og.py"),
    join(process.cwd(), "scripts", "gen-og.py")
  ];
  const scriptPath = candidates.find(p => existsSync(p));
  if (!scriptPath) {
    console.error("× scripts/gen-og.py not found");
    console.error("  expected at one of:\n  " + candidates.join("\n  "));
    process.exit(1);
  }
  const r = spawnSync("python3", [scriptPath, "--output", args.output], { stdio: "inherit", cwd: process.cwd() });
  if (r.error && r.error.code === "ENOENT") {
    console.error("× python3 not found in PATH. Install Python 3.9+ to use `tokenfolio og`.");
    process.exit(1);
  }
  process.exit(r.status || 0);
}

// ─── brand: rewrite hardcoded site URL in template HTMLs ──────────────────

function detectSiteUrl() {
  const remote = gitRemoteUrl();
  if (!remote) return "";
  // Match either git@github.com:user/repo(.git) or https://github.com/user/repo(.git)
  const m = remote.match(/[:/]([^/:]+)\/([^/]+?)(?:\.git)?\/?$/);
  if (!m) return "";
  return `https://${m[1]}.github.io/${m[2]}/`;
}

function rebrandTemplates(siteUrl) {
  const newBase = siteUrl.replace(/\/$/, "");
  const cwd = process.cwd();
  const targets = [
    join(cwd, "index.html"),
    ...TEMPLATE_DIRS.map(n => join(cwd, "templates", n, "index.html"))
  ];
  let touched = 0;
  for (const file of targets) {
    if (!existsSync(file)) continue;
    const text = readFileSync(file, "utf8");
    if (!text.includes(ORIGINAL_SITE)) continue;
    const next = text.split(ORIGINAL_SITE).join(newBase);
    if (next === text) continue;
    writeFileSync(file, next, "utf8");
    touched++;
  }
  return touched;
}

function runBrand(args) {
  let siteUrl = args.overrides.siteUrl || detectSiteUrl();
  if (!siteUrl) {
    console.error("× could not detect site URL.");
    console.error("  pass it explicitly:");
    console.error("    tokenfolio brand --site-url https://you.github.io/tokenfolio/");
    process.exit(1);
  }
  if (!siteUrl.endsWith("/")) siteUrl += "/";
  const newBase = siteUrl.replace(/\/$/, "");
  if (newBase === ORIGINAL_SITE) {
    console.error(`▸ already pointing at ${siteUrl} — nothing to do.`);
    return;
  }
  console.error(`▸ rebrand template og:meta → ${siteUrl}`);
  const touched = rebrandTemplates(siteUrl);
  if (touched === 0) {
    console.error(`  no template files in cwd (or no \`${ORIGINAL_SITE}\` references found).`);
  } else {
    console.error(`✓ rewrote ${touched} file(s)`);
  }
}

// ─── output safety ────────────────────────────────────────────────────────

function checkOutputPath(p) {
  // Default cwd-only output. If user passes anything outside cwd or absolute,
  // print a warning so a copy-pasted command can't silently scribble over
  // ~/.zshrc etc. We don't refuse — the user might genuinely want it.
  const abs = isAbsolute(p) ? p : resolve(process.cwd(), p);
  const rel = relative(process.cwd(), abs);
  if (rel.startsWith("..") || isAbsolute(p)) {
    console.error(`! warning: --output "${p}" resolves outside the current directory:`);
    console.error(`  → ${abs}`);
    console.error(`  proceed only if you trust the source of this command.`);
  }
}

// ─── main ─────────────────────────────────────────────────────────────────

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.cmd === "brand") { runBrand(args); return; }
  if (args.cmd === "og")    { checkOutputPath(args.output); runOg(args); return; }

  // === init ===
  const year = args.year;
  console.error(`▸ tokenfolio init · year ${year} · source ${args.source}`);

  const sources = [];

  if (args.source === "all" || args.source === "claude") {
    console.error(`▸ aggregating Claude Code (ccusage)…`);
    const c = aggregateClaude(year);
    if (c) {
      sources.push(c);
      console.error(`  ✓ claude · ${c.totals.tokens.toLocaleString("en-US")} tokens · ${c.totals.sessions} sessions · ${c.top_projects.length} projects`);
    } else {
      console.error(`  ✗ claude unavailable (ccusage missing or no data for ${year})`);
    }
  }

  if (args.source === "all" || args.source === "codex") {
    console.error(`▸ aggregating Codex (~/.codex/sessions)…`);
    const c = aggregateCodex(year);
    if (c) {
      sources.push(c);
      console.error(`  ✓ codex · ${c.totals.tokens.toLocaleString("en-US")} tokens · ${c.totals.sessions} sessions · ${c.top_projects.length} projects`);
    } else {
      console.error(`  ✗ codex unavailable (no ~/.codex/sessions or no data for ${year})`);
    }
  }

  if (sources.length === 0) {
    console.error(`× no data from any source. Try --year ${year - 1} or check your AI tool installs.`);
    process.exit(1);
  }

  const merged = mergeAggregates(sources);
  const data   = buildResumeData(args, merged);

  const banner = `/**
 * Generated by tokenfolio init on ${new Date().toISOString().slice(0, 19)}Z
 * Year ${year} · source ${merged.source} · ${data.totals.sessions} sessions · ${data.by_model.length} models · ${data.top_projects.length} projects
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

  checkOutputPath(args.output);
  if (existsSync(args.output) && !args.force) {
    console.error(`× ${args.output} exists. Use --force to overwrite.`);
    process.exit(1);
  }
  writeFileSync(args.output, js, "utf8");
  console.error(`✓ wrote ${args.output} (${js.length} bytes)`);
  console.error(`  ${data.totals.tokens.toLocaleString("en-US")} tokens · ${data.totals.sessions} sessions · ${data.top_projects.length} projects`);

  // Best-effort auto-rebrand: if the user has a git remote and it's not
  // pointing at the upstream tt-a1i repo, also rewrite the templates'
  // hardcoded og:meta so social shares show the user's deploy URL.
  const inferred = detectSiteUrl();
  if (inferred && !inferred.startsWith(ORIGINAL_SITE)) {
    const touched = rebrandTemplates(inferred);
    if (touched > 0) {
      console.error(`▸ also rebranded ${touched} template og:meta → ${inferred}`);
      console.error(`  (run \`tokenfolio brand --site-url …\` to override)`);
    }
  }
}

main();
