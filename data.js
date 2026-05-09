/**
 * Sample data for tokenfolio templates.
 * Replace the values below with your own — the templates read `window.RESUME_DATA`
 * and `window.RESUME_FMT` to render. The shape is documented in README.md.
 *
 * In a future release, `tokenfolio init` will auto-generate this file from
 * your local Claude Code / Codex usage logs.
 */
window.RESUME_DATA = {
  user: {
    name: "Ada Lovelace",
    handle: "@ada-lovelace",
    title: "AI Pair Programmer",
    location: "London · Remote",
    since: "2024-05",
    avatar_initials: "AL",
    bio: "Building tools at the seam between humans and language models.",
    links: [
      { label: "GitHub", url: "https://github.com/ada-lovelace" },
      { label: "Site",   url: "https://example.com" }
    ]
  },

  year: 2025,

  totals: {
    tokens: 47221890,
    input_tokens: 38132440,
    output_tokens: 9089450,
    sessions: 312,
    projects: 28,
    cost_usd: 1247.50,
    avg_session_tokens: 151352
  },

  by_month: [
    { month: "2025-01", label: "Jan", tokens: 2100000, sessions: 19, top_project: "lark-cli",          top_model: "sonnet-4.6", note: "Quiet refactor pass on lark-cli." },
    { month: "2025-02", label: "Feb", tokens: 3000000, sessions: 22, top_project: "squad-orchestrator", top_model: "opus-4.7",   note: "First serious work on squad-orchestrator." },
    { month: "2025-03", label: "Mar", tokens: 8400000, sessions: 41, top_project: "token-resume",       top_model: "opus-4.7",   note: "Peak month — token-resume shipped end-to-end.", peak: true },
    { month: "2025-04", label: "Apr", tokens: 5900000, sessions: 32, top_project: "lark-base",          top_model: "opus-4.7",   note: "Field reorganization across multiple Bases." },
    { month: "2025-05", label: "May", tokens: 4200000, sessions: 28, top_project: "field-guide",        top_model: "sonnet-4.6", note: "Built the field-guide aesthetic system." },
    { month: "2025-06", label: "Jun", tokens: 3800000, sessions: 26, top_project: "archify",            top_model: "sonnet-4.6", note: "Three weeks on archify; CLI ergonomics rest of the month." },
    { month: "2025-07", label: "Jul", tokens: 4600000, sessions: 30, top_project: "lark-cli",           top_model: "opus-4.7",   note: "lark-cli plugin overhaul + skill registry." },
    { month: "2025-08", label: "Aug", tokens: 6100000, sessions: 37, top_project: "lark-base",          top_model: "opus-4.7",   note: "Schema migrations and cross-table formula work." },
    { month: "2025-09", label: "Sep", tokens: 3200000, sessions: 25, top_project: "squad-orchestrator", top_model: "opus-4.7",   note: "Concurrency & blocking semantics in squad." },
    { month: "2025-10", label: "Oct", tokens: 2500000, sessions: 19, top_project: "polish",             top_model: "haiku-4.5",  note: "A month of small ergonomic improvements." },
    { month: "2025-11", label: "Nov", tokens: 1800000, sessions: 17, top_project: "bugfix-sprint",      top_model: "haiku-4.5",  note: "Bug-fix sprint across the toolchain." },
    { month: "2025-12", label: "Dec", tokens: 1600000, sessions: 16, top_project: "rest",               top_model: "haiku-4.5",  note: "Slow month; documentation and rest." }
  ],

  by_model: [
    { name: "opus-4.7",   tokens: 24000000, sessions: 142, color: "#c084fc" },
    { name: "sonnet-4.6", tokens: 18221890, sessions: 121, color: "#4facff" },
    { name: "haiku-4.5",  tokens:  5000000, sessions:  49, color: "#a6e22e" }
  ],

  top_projects: [
    { name: "lark-cli",            tokens: 12400000, sessions: 78, language: "TypeScript", description: "Feishu/Lark CLI with skill-driven AI agents." },
    { name: "squad-orchestrator",  tokens:  8100000, sessions: 42, language: "Python",     description: "Multi-agent collaboration runtime." },
    { name: "token-resume",        tokens:  6800000, sessions: 38, language: "TypeScript", description: "AI usage portfolio generator (this thing)." },
    { name: "field-guide",         tokens:  4200000, sessions: 28, language: "HTML/CSS",   description: "Long-form HTML explainer aesthetic." },
    { name: "archify",             tokens:  3800000, sessions: 26, language: "TypeScript", description: "Architecture diagram generator." },
    { name: "lark-base",           tokens:  3500000, sessions: 24, language: "TypeScript", description: "Bitable / multidim. table tooling." },
    { name: "agent-inspect",       tokens:  2400000, sessions: 18, language: "TypeScript", description: "Multi-agent project audit tool." },
    { name: "evermemos-mcp",       tokens:  1500000, sessions: 12, language: "TypeScript", description: "Long-term memory MCP server." }
  ],

  highlights: [
    { label: "Peak month",     value: "March",      detail: "8.4M tokens · 41 sessions" },
    { label: "Longest streak", value: "47 days",    detail: "Without skipping a session" },
    { label: "Top language",   value: "TypeScript", detail: "63% of tokens" },
    { label: "Avg session",    value: "151k",       detail: "Tokens per session" }
  ]
};

// Tiny helpers shared by all templates
window.RESUME_FMT = {
  num(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
    if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1) + "k";
    return String(n);
  },
  pct(n, total) {
    return ((n / total) * 100).toFixed(0) + "%";
  },
  comma(n) {
    return n.toLocaleString("en-US");
  }
};
