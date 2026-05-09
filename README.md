# tokenfolio

> An AI-usage portfolio, made readable. Drop in your numbers, deploy a page, show recruiters what working with machines actually looks like.

[![Use this template](https://img.shields.io/badge/use_this-template-2ea44f?style=for-the-badge&logo=github)](https://github.com/tt-a1i/tokenfolio/generate)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/tt-a1i/tokenfolio)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/tt-a1i/tokenfolio)

Pick a template. Edit one `data.js`. Deploy. Done.

**Live demo:** https://tt-a1i.github.io/tokenfolio/

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

More coming. Contributions welcome.

## Quick start

1. Click **[Use this template](https://github.com/tt-a1i/tokenfolio/generate)** — gets you a fresh repo with clean history that counts toward your contribution graph.
2. Clone your new repo locally.
3. Auto-generate `data.js` from your Claude Code usage (see CLI below). Or hand-edit it.
4. Click a Deploy button above, or enable GitHub Pages (Settings → Pages → `main` branch, `/`).

### CLI (`tokenfolio init`)

```bash
# preview without writing — recommended first run
npx github:tt-a1i/tokenfolio init --dry

# both sources merged (default)
npx github:tt-a1i/tokenfolio init --force

# narrow to one source / one year
npx github:tt-a1i/tokenfolio init --source codex  --year 2026 --dry
npx github:tt-a1i/tokenfolio init --source claude --year 2025 --dry

# override identity (defaults pull from `git config`)
npx github:tt-a1i/tokenfolio init \
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

After `tokenfolio init`, generate a `og.png` containing your numbers so social previews on X / LinkedIn / 飞书 show your stats instead of the generic brand image:

```bash
npx github:tt-a1i/tokenfolio og
# → writes ./og.png  (1200×630, ready for og:image)
```

Requires Python 3.9+ and Pillow (`pip install Pillow`). The Python step is decoupled from `init` so the install footprint stays minimal for users who don't want OG.

### Run locally

```bash
git clone https://github.com/<you>/<your-repo>.git
cd <your-repo>
python3 -m http.server 8765
open http://localhost:8765
```

### Pick one template as the homepage

The root `index.html` is a gallery of all templates. Once you've picked one, copy its files to the root or add a `<meta http-equiv="refresh" content="0; url=templates/wrapped/">` redirect at the root.

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

- [x] 9 templates (wrapped, cosmos, almanac, terminal, aurora, holo, pixel, pass, brutalist)
- [x] `tokenfolio init` CLI for Claude Code (via ccusage)
- [x] CLI: Codex (`~/.codex/sessions/`) parser
- [x] CLI: `tokenfolio og` for personalized OG image (Pillow)
- [ ] CLI: Cursor / Aider / Continue.dev support (where token counts exist)
- [ ] More templates: synthwave, manga, trading-floor
- [ ] Edge-rendered dynamic OG image (Vercel + Satori) for zero-install users
- [ ] Dark/light mode toggle on each template
- [ ] PNG/PDF export for sharing
- [ ] i18n (中 / EN at minimum)

## Contributing

Want to add a template? Drop a folder under `templates/<your-name>/` with one `index.html` that loads `../../data.js` and renders the same data shape. PRs welcome.

## License

MIT — do whatever, just don't sue us.
