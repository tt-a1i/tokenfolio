# Releasing tokenfolio

Single-file CLI + static template gallery, published as one npm package.

## Pre-flight

```bash
# 1. Sanity-check the CLI on real data — no crashes, sensible numbers
node bin/tokenfolio.js init --dry --year $(date +%Y) | head -40

# 2. Lint the templates locally — every page returns 200
python3 -m http.server 8765 &
for t in wrapped cosmos almanac terminal aurora holo pixel pass brutalist; do
  curl -s -o /dev/null -w "$t: %{http_code}\n" http://localhost:8765/templates/$t/
done
kill %1

# 3. Confirm package.json `version` was bumped, README + roadmap reflect reality
git diff HEAD~1 -- package.json README.md
```

## Publish to npm

First time on a new machine:

```bash
npm login
```

Then:

```bash
# Make sure git is clean and on main
git status
git pull origin main

# Publish (dist files defined in package.json `files` field)
npm publish --access public

# Tag the release in git so GitHub shows it
git tag v$(node -p "require('./package.json').version")
git push --tags
```

## After publish

- Verify on https://www.npmjs.com/package/tokenfolio
- Smoke test from a clean dir: `npx tokenfolio init --dry --help`
- Update README's CLI snippet from `npx github:tt-a1i/tokenfolio init` to `npx tokenfolio init`
- Optional: write a short release note in a GitHub Release for v0.X

## Versioning

Follow [SemVer](https://semver.org/) loosely:

- **Patch** (0.x.Y) — bug fixes, template polish, doc tweaks
- **Minor** (0.X.0) — new templates, new CLI flags, new sources
- **Major** (X.0.0) — `data.js` shape changes, breaking template contracts

The `data.js` shape is a contract between CLI and templates. Bumping it
is a major change.

## What's included in the npm tarball

`package.json`'s `files` array controls this. As of v0.4.0:

- `bin/`             CLI entrypoint
- `templates/`       all 9 template HTMLs
- `data.js`          demo data (Ada Lovelace persona)
- `index.html`       gallery
- `favicon.svg`, `og.png`
- `README.md`, `LICENSE`

Excluded via `.npmignore`: `docs/`, `.superpowers/`, git files.
