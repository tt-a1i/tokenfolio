# tokenfolio

> An AI-usage portfolio, made readable. Drop in your numbers, deploy a page, show recruiters what working with machines actually looks like.

[![npm](https://img.shields.io/npm/v/tokenfolio?style=for-the-badge&color=cb3837&logo=npm)](https://www.npmjs.com/package/tokenfolio)
[![Use this template](https://img.shields.io/badge/use_this-template-2ea44f?style=for-the-badge&logo=github)](https://github.com/tt-a1i/tokenfolio/generate)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/tt-a1i/tokenfolio)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/tt-a1i/tokenfolio)

> **Read in:** [中文](./README.md) · **English**

Pick a template. Edit one `data.js`. Deploy. Done.

**Live demo:** https://tt-a1i.github.io/tokenfolio/

<p align="center"><img src="previews/demo.svg" alt="tokenfolio CLI demo: init → pick → deploy" width="720"></p>

<table>
<tr>
  <td align="center"><a href="https://tt-a1i.github.io/tokenfolio/templates/wrapped/"><img src="previews/wrapped.jpg" alt="wrapped" width="280"></a><br><sub><b>wrapped</b> · social</sub></td>
  <td align="center"><a href="https://tt-a1i.github.io/tokenfolio/templates/cosmos/"><img src="previews/cosmos.jpg" alt="cosmos" width="280"></a><br><sub><b>cosmos</b> · constellations</sub></td>
  <td align="center"><a href="https://tt-a1i.github.io/tokenfolio/templates/almanac/"><img src="previews/almanac.jpg" alt="almanac" width="280"></a><br><sub><b>almanac</b> · gothic broadsheet</sub></td>
</tr>
<tr>
  <td align="center"><a href="https://tt-a1i.github.io/tokenfolio/templates/terminal/"><img src="previews/terminal.jpg" alt="terminal" width="280"></a><br><sub><b>terminal</b> · hacker</sub></td>
  <td align="center"><a href="https://tt-a1i.github.io/tokenfolio/templates/aurora/"><img src="previews/aurora.jpg" alt="aurora" width="280"></a><br><sub><b>aurora</b> · glassmorphism</sub></td>
  <td align="center"><a href="https://tt-a1i.github.io/tokenfolio/templates/holo/"><img src="previews/holo.jpg" alt="holo" width="280"></a><br><sub><b>holo</b> · trading card</sub></td>
</tr>
<tr>
  <td align="center"><a href="https://tt-a1i.github.io/tokenfolio/templates/pixel/"><img src="previews/pixel.jpg" alt="pixel" width="280"></a><br><sub><b>pixel</b> · 8-bit RPG</sub></td>
  <td align="center"><a href="https://tt-a1i.github.io/tokenfolio/templates/pass/"><img src="previews/pass.jpg" alt="pass" width="280"></a><br><sub><b>pass</b> · boarding pass</sub></td>
  <td align="center"><a href="https://tt-a1i.github.io/tokenfolio/templates/brutalist/"><img src="previews/brutalist.jpg" alt="brutalist" width="280"></a><br><sub><b>brutalist</b> · Wired cover</sub></td>
</tr>
<tr>
  <td align="center"><a href="https://tt-a1i.github.io/tokenfolio/templates/tcg/"><img src="previews/tcg.jpg" alt="tcg" width="280"></a><br><sub><b>tcg</b> · TCG card</sub></td>
  <td align="center"><a href="https://tt-a1i.github.io/tokenfolio/templates/vinyl/"><img src="previews/vinyl.jpg" alt="vinyl" width="280"></a><br><sub><b>vinyl</b> · LP liner notes</sub></td>
  <td align="center"><a href="https://tt-a1i.github.io/tokenfolio/templates/synthwave/"><img src="previews/synthwave.jpg" alt="synthwave" width="280"></a><br><sub><b>synthwave</b> · 1985 arcade</sub></td>
</tr>
</table>

> 🆕 **v0.9** — 12th template **synthwave** (1985 arcade: wireframe-grid horizon, banded Outrun sun, CRT scanlines, cycling `INSERT COIN`). Animated SVG demo at the top of the README walks the init → pick → deploy flow.
> **v0.8** — 11 high-quality JPEG previews under `previews/` + bilingual README hero grid + iframe gallery replaced with static images (cold-load 5–10 s → instant).
> **v0.7** — **vinyl** template (back of an LP sleeve, square 1:1, IG-ready) and `tokenfolio share` one-liner that opens X / LinkedIn pre-filled with your stats.
> **v0.6** — every template ships a one-tap **PNG export + Web Share** button + "Built with tokenfolio" chip top-right that survives screenshot crops. `tokenfolio badge` mints an SVG for your GitHub profile README. `tokenfolio pick` picks your homepage. **TCG** template added (Pokémon-style trading card).

## Templates

| | name | vibe |
|---|---|---|
| 🟢 | **wrapped**   | Spotify-Wrapped style — bold color blocks, peak month highlighted, made to be posted |
| 🌌 | **cosmos**    | Each month a constellation, each session a star — premium, generative, unique-per-user |
| 📰 | **almanac**   | "The Token Almanac" — gothic masthead, monthly dispatches, classified ads — literary |
| 💻 | **terminal**  | Black on green. Boot sequence + ASCII bar charts + Unicode boxes — hacker dense |
| 🌈 | **aurora**    | Aurora gradients + frosted-glass cards. Apple Vision / Linear polish — HR-friendly |
| ✨ | **holo**      | Your résumé as a holographic trading card. Mouse-tracked tilt + rainbow sheen |
| 🎮 | **pixel**     | An 8-bit RPG character sheet. HP/MP bars, star stats, quest log, "Press A to recruit" |
| ✈️ | **pass**      | A 1980s airline boarding pass — perforations, barcode, passport stamps per month |
| 🟨 | **brutalist** | Wired magazine cover meets 1968 protest poster. Helvetica Black 200px, hard edges |
| 🃏 | **tcg**       | A Pokémon-style trading card. Gold border, psychic frame, attacks, mouse-tracked foil |
| 💿 | **vinyl**     | Back of a vinyl LP sleeve — square 1:1, track listing, "Produced by" credits, barcode |
| 🌆 | **synthwave** | 1985 arcade outrun — wireframe horizon, banded sun, CRT scanlines, cycling `INSERT COIN` (**new**) |

More coming. Contributions welcome.

## Built-in sharing (v0.6+)

Every template ships with:

- **Bottom-right floating buttons**: 💾 Save as PNG (uses html2canvas to export the current view, filename includes your handle) + 🔗 Share (Web Share API on mobile, X intent fallback on desktop)
- **Top-right chip**: `● Built with tokenfolio` — survives screenshot crops, so every shared image carries the source link

Opt out by setting `data-tf-fab="false"` or `data-tf-chip="false"` on `<body>`.

## Quick start

1. Click **[Use this template](https://github.com/tt-a1i/tokenfolio/generate)** — gets you a fresh repo with clean history that counts toward your contribution graph.
2. Clone your new repo locally.
3. Auto-generate `data.js` from your Claude Code / Codex usage (see CLI below). Or hand-edit it.
4. Click a Deploy button above, or enable GitHub Pages (Settings → Pages → `main` branch, `/`).

### CLI (`tokenfolio init`)

```bash
# preview without writing — recommended first run
npx tokenfolio init --dry

# both sources merged (default)
npx tokenfolio init --force

# narrow to one source / one year
npx tokenfolio init --source codex  --year 2026 --dry
npx tokenfolio init --source claude --year 2025 --dry

# override identity (defaults pull from `git config`)
npx tokenfolio init \
  --name "Ada Lovelace" --handle "@ada" --location "London"
```

The CLI uses [`ccusage`](https://github.com/ryoppippi/ccusage) for Claude Code and a built-in JSONL parser for Codex.

**Currently supported sources:**

| source | location | mechanism |
|---|---|---|
| Claude Code | `~/.claude/projects/` | `ccusage` (auto-fetched via npx) |
| Codex       | `~/.codex/sessions/`  | built-in parser |

**Coming next:** Cursor, Aider, Continue.dev (where token counts exist).

**Privacy red line:** only token counts, model names, project paths, and dates are read. Prompt content (`response_item` lines in Codex, `message` lines in Claude JSONL) is never parsed.

### Personalized OG image (`tokenfolio og`)

After `tokenfolio init`, generate a `og.png` containing your numbers so social previews on X / LinkedIn / Lark show your stats instead of the generic brand image:

```bash
npx tokenfolio og
# → writes ./og.png  (1200×630, ready for og:image)

# Force the Node/Satori renderer (no Python needed):
npx tokenfolio og --js

# Force the Python/Pillow renderer:
npx tokenfolio og --python
```

Default behavior: the JS/Satori renderer is tried first; if `satori` is not installed, it falls back to Python/Pillow automatically.

- **JS path** (preferred for users without Python): requires `satori` and `@resvg/resvg-js` — `npm i -g satori @resvg/resvg-js`
- **Python path** (no behavior change for users with Pillow installed): requires Python 3.9+ and Pillow (`pip install Pillow`)

The OG step is decoupled from `init` so the install footprint stays minimal for users who don't want an OG image.

### Run locally

```bash
git clone https://github.com/<you>/<your-repo>.git
cd <your-repo>
python3 -m http.server 8765
open http://localhost:8765
```

### Pick one template as the homepage (`tokenfolio pick`)

The root `index.html` ships as a gallery of all 10 templates. To make one of them your real homepage:

```bash
npx tokenfolio pick wrapped --force
# rewrites ./index.html as a redirect to templates/wrapped/
# git add index.html && git commit -m "pick wrapped"
```

Available: `wrapped` / `cosmos` / `almanac` / `terminal` / `aurora` / `holo` / `pixel` / `pass` / `brutalist` / `tcg`.

> ⚠️ **Don't copy template files to the root directly** — they reference `<script src="../../data.js">` with a relative path. Copying to the root turns that into a 404. `tokenfolio pick` uses a redirect to sidestep this.

### One-line share (`tokenfolio share`)

After deploying, ship a post in one command:

```bash
npx tokenfolio share
# auto-detects your GitHub Pages URL, then opens (in your browser):
#   1. your tokenfolio deploy
#   2. an X intent pre-filled with your stats
# also prints a LinkedIn share URL to copy
npx tokenfolio share --no-open    # print URLs only
npx tokenfolio share --text "burned 47M tokens this year, you?"
```

### GitHub profile badge (`tokenfolio badge`)

After `init`, mint an SVG badge for your GitHub profile README:

```bash
npx tokenfolio badge
# → writes ./badge.svg (shields-style) and ./card.svg (github-readme-stats-style with monthly sparkline)
# CLI prints a markdown snippet ready to paste into your profile README
```

Effect (paste into your profile README):

```markdown
[![tokenfolio](https://raw.githubusercontent.com/<you>/<your-repo>/main/badge.svg)](https://<you>.github.io/<your-repo>/)
[![tokenfolio card](https://raw.githubusercontent.com/<you>/<your-repo>/main/card.svg)](https://<you>.github.io/<your-repo>/)
```

Re-run `tokenfolio init && tokenfolio badge && git push` to refresh. Pure static, zero server, zero dependencies.

### Hand-editing `data.js` (when you don't use Claude / Codex)

If your AI tool isn't in the CLI's supported list, fill `data.js` by hand using the shape below. Where to find your token counts:

- **Cursor**: Settings → Usage (monthly prompt / completion breakdown)
- **GitHub Copilot**: [github.com/settings/billing](https://github.com/settings/billing) → Plans and usage (quarterly statements show token usage)
- **Aider**: prints `Tokens: X sent, Y received` at the end of each session — sum them up
- **Continue.dev**: no aggregate view yet — read the VS Code extension logs

Then run `tokenfolio og` (or skip it) and deploy. PRs adding new sources to the CLI are welcome.

## The data shape

`data.js` is a single file that defines `window.RESUME_DATA`. The shape:

```js
window.RESUME_DATA = {
  user:    { name, handle, title, location, since, avatar_initials, bio, links },
  year:    2025,
  totals:  { tokens, input_tokens, output_tokens, sessions, projects, cost_usd, avg_session_tokens },
  by_month:    [{ month, label, tokens, sessions, top_project, top_model, note, peak? }],
  by_model:    [{ name, tokens, sessions, color }],
  top_projects:[{ name, tokens, sessions, language, description }],
  highlights:  [{ label, value, detail }]
};
```

Every template reads from the same data object. Switch templates with zero data changes.

## Roadmap

- [x] 12 templates (wrapped, cosmos, almanac, terminal, aurora, holo, pixel, pass, brutalist, tcg, vinyl, synthwave)
- [x] `tokenfolio init` CLI for Claude Code (via ccusage)
- [x] CLI: Codex (`~/.codex/sessions/`) parser
- [x] CLI: `tokenfolio og` for personalized OG image (Pillow + Node/Satori dual-engine, `--js` / `--python`)
- [x] CLI: `tokenfolio badge` README badge + sparkline card (pure Node, zero deps)
- [x] CLI: `tokenfolio pick <template>` for homepage redirect
- [x] CLI: `tokenfolio share` opens browser with pre-filled X / LinkedIn intent
- [x] In-page PNG export + one-tap social sharing (v0.6)
- [x] Bilingual README (中 / EN)
- [ ] CLI: Cursor / Aider / Continue.dev support (where token counts exist)
- [ ] More templates: synthwave, manga, trading-floor, vinyl
- [x] CLI: `tokenfolio og --js` Node/Satori renderer, no Python required
- [ ] Edge-rendered dynamic OG image (Vercel + Satori) for zero-install users
- [ ] Dark/light mode toggle on each template
- [ ] CLI output i18n
- [ ] GitHub Action: monthly auto `tokenfolio init` + commit + push

## Contributing

Want to add a template? Drop a folder under `templates/<your-name>/` with one `index.html` that loads `../../data.js` and renders the same data shape. PRs welcome.

## License

MIT — do whatever, just don't sue us.
