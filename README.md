# tokenfolio

> An AI-usage portfolio, made readable. Drop in your numbers, deploy a page, show recruiters what working with machines actually looks like.

Pick a template. Edit one `data.js`. Push to GitHub Pages. Done.

## Templates

| | name | vibe |
|---|---|---|
| 🟢 | **wrapped** | Spotify-Wrapped style — bold color blocks, peak month highlighted, made to be posted |
| 🌌 | **cosmos**  | Each month a constellation, each session a star — premium, generative, unique-per-user |
| 📰 | **almanac** | "The Token Almanac" — gothic masthead, monthly dispatches, classified ads — literary |

More coming. Contributions welcome.

## Quick start

```bash
git clone https://github.com/tt-a1i/tokenfolio.git
cd tokenfolio
python3 -m http.server 8765
open http://localhost:8765
```

Edit `data.js` with your real numbers, then deploy the folder anywhere static — GitHub Pages, Vercel, Netlify, an S3 bucket.

## Deploying to GitHub Pages

1. Fork this repo (or use it as a template)
2. Edit `data.js` with your data
3. Settings → Pages → Source: `main` branch, `/` (root)
4. Your portfolio lives at `https://<your-handle>.github.io/tokenfolio/`

Want a different URL? Pick **one** template and copy its files to the root, or set up a small redirect from `/` to `/templates/<chosen>/`.

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
- [ ] More templates: holo trading card, brutalist editorial, pixel-RPG, boarding pass, synthwave, manga
- [ ] Optional dark/light mode toggle on each template
- [ ] PNG/PDF export for Twitter/LinkedIn sharing
- [ ] i18n (CN/EN at minimum)

## Contributing

Want to add a template? Drop a folder under `templates/<your-name>/` with one `index.html` that loads `../../data.js` and renders the same data shape. PRs welcome.

## License

MIT — do whatever, just don't sue us.
