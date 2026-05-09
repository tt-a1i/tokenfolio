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
| 🟢 | **wrapped**  | Spotify-Wrapped style — bold color blocks, peak month highlighted, made to be posted |
| 🌌 | **cosmos**   | Each month a constellation, each session a star — premium, generative, unique-per-user |
| 📰 | **almanac**  | "The Token Almanac" — gothic masthead, monthly dispatches, classified ads — literary |
| 💻 | **terminal** | Black on green. Boot sequence + ASCII bar charts + Unicode boxes — hacker dense |
| 🌈 | **aurora**   | Aurora gradients + frosted-glass cards. Apple Vision / Linear polish — HR-friendly |
| ✨ | **holo**     | Your résumé as a holographic trading card. Mouse-tracked tilt + rainbow sheen |

More coming. Contributions welcome.

## Quick start (recommended path)

1. Click **[Use this template](https://github.com/tt-a1i/tokenfolio/generate)** — gets you a fresh repo with a clean history that counts toward your contribution graph.
2. Edit `data.js` with your numbers.
3. Click one of the deploy buttons above (or enable GitHub Pages: Settings → Pages → `main` branch, `/`).
4. Your portfolio lives at `https://<your-handle>.github.io/<repo-name>/` (or a `*.vercel.app` / `*.netlify.app` URL).

### Run locally

```bash
git clone https://github.com/<you>/<your-repo>.git
cd <your-repo>
python3 -m http.server 8765
open http://localhost:8765
```

### Pick one template as the homepage

By default the root `index.html` is a gallery of all templates. Once you've picked one, copy its files to the root or add a `<meta http-equiv="refresh" content="0; url=templates/wrapped/">` redirect.

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

- [ ] CLI to auto-extract numbers from local Claude Code / Codex usage logs (`tokenfolio init`)
- [ ] More templates: brutalist editorial, pixel-RPG, boarding pass, synthwave, manga
- [ ] Optional dark/light mode toggle on each template
- [ ] PNG/PDF export for Twitter/LinkedIn sharing
- [ ] i18n (CN/EN at minimum)

## Contributing

Want to add a template? Drop a folder under `templates/<your-name>/` with one `index.html` that loads `../../data.js` and renders the same data shape. PRs welcome.

## License

MIT — do whatever, just don't sue us.
