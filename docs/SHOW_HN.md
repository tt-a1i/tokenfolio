# Show HN draft

Edit and post when ready. Keep it short — HN audiences punish long-form pitching.

## Title (one of these)

- `Show HN: Tokenfolio – your Claude Code usage as a portfolio page`
- `Show HN: Turn your AI coding usage into a deployable resume page`
- `Show HN: Tokenfolio – 9 templates for showing your AI usage`

## Body

> "AI Pair Programmer" on a resume tells you nothing. Numbers do.
>
> Tokenfolio is a static-HTML template gallery. Drop your token counts into
> `data.js`, push to GitHub Pages, send the link with your resume.
>
> **Templates (so far):**
> - **wrapped** — Spotify-Wrapped style color blocks
> - **cosmos** — each month a constellation, each session a star
> - **almanac** — gothic-masthead newspaper, monthly dispatches
> - **terminal** — boot sequence, ASCII bar charts, Unicode boxes
> - **aurora** — dark glassmorphism, Apple Vision-style
> - **holo** — mouse-tracked holographic trading card
> - **pixel** — 8-bit RPG character sheet
> - **pass** — vintage airline boarding pass
> - **brutalist** — Wired-magazine-cover-meets-1968-poster
>
> A small CLI (`npx tokenfolio init`) auto-extracts your numbers from
> `~/.claude/projects/` (via ccusage) and `~/.codex/sessions/` (built-in
> parser). Cursor and Aider next.
>
> Privacy red line: only counts, models, project paths, dates. Prompt
> contents are never parsed — the Codex parser explicitly skips
> `response_item` lines.
>
> All static. No backend. No tracking. MIT.
>
> **Live demo:** https://tt-a1i.github.io/tokenfolio/
> **GitHub:** https://github.com/tt-a1i/tokenfolio
>
> Built it after seeing one too many resumes claim "5+ years AI experience"
> with nothing to back it up. Curious whether this resonates — feedback on
> aesthetics, the CLI, or the niche itself is welcome.

## Posting checklist

- [ ] Pick the strongest template as the og:image hero (or generate a custom share image)
- [ ] Have a screenshot ready for the comments (HN allows images via imgur)
- [ ] Pin a comment with the data shape, in case people ask about adapting to non-Claude data
- [ ] Time the post for **8–10 AM PT on a Tuesday/Wednesday** (Show HN's most engaged window)
- [ ] First comment should be substance, not "thanks for reading" — common follow-ups:
      "How do I add my own template?" / "Does it work with X?" / "Why not [competitor]?"

## Pre-launch reminders

If submitting to HN:

1. Confirm `is_template: true` on the repo (already done)
2. Confirm GitHub Pages live at https://tt-a1i.github.io/tokenfolio/
3. Run `node bin/tokenfolio.js init --dry` to confirm CLI works on the maintainer's data
4. Leave one templated default deploy button working in README
5. Don't crosspost to Reddit / Twitter the same hour as HN — let one platform's
   algorithm pick it up cleanly

## Possible angles for follow-up posts

- A blog post on the design process behind the 9 templates
- A "how I built the holographic card with @property --angle" deep-dive
- A roundup of similar tools (ccusage, tokscale, claude-code-leaderboard)
