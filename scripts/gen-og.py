#!/usr/bin/env python3
"""
Generate a personalized og.png (1200x630) from ./data.js.

Reads the data shape produced by `tokenfolio init` and renders a social
preview card. Output goes to ./og.png by default; override with --output PATH.

Requires: Python 3.9+, Pillow (`pip install Pillow`).

Run:
    python3 scripts/gen-og.py
    python3 scripts/gen-og.py --output share/preview.png
or via the CLI:
    tokenfolio og
    tokenfolio og --output share/preview.png
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("× Pillow not installed. Run: pip install Pillow", file=sys.stderr)
    sys.exit(1)


def find_data_js() -> Path:
    """
    Look for data.js in the current working directory ONLY.

    Earlier versions fell back to the package's bundled demo data, which
    silently produced a personalized-looking og.png filled with the demo
    persona's numbers — making users believe they had succeeded when they
    were actually publishing someone else's stats. Hard fail instead.
    """
    p = Path.cwd() / "data.js"
    if p.exists():
        return p
    print("× ./data.js not found in cwd.", file=sys.stderr)
    print("  run `tokenfolio init` first, or cd into a directory containing data.js.",
          file=sys.stderr)
    sys.exit(1)


def parse_resume_data(text: str) -> dict:
    """
    Extract `window.RESUME_DATA = { ... }` and parse it.

    Tolerates both shapes that exist in the wild:
      - JS object literal (the hand-written demo data.js — unquoted keys)
      - JSON.stringify output (what `tokenfolio init` writes — quoted keys)
    """
    i = text.find("window.RESUME_DATA")
    if i < 0:
        raise SystemExit("× no window.RESUME_DATA assignment in data.js")
    i = text.find("{", i)

    # walk braces honoring strings/escapes
    depth, in_str, escape = 0, False, False
    end = -1
    for j in range(i, len(text)):
        c = text[j]
        if escape:
            escape = False
            continue
        if c == "\\":
            escape = True
            continue
        if c == '"':
            in_str = not in_str
            continue
        if in_str:
            continue
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                end = j + 1
                break
    if end < 0:
        raise SystemExit("× unmatched braces in window.RESUME_DATA")

    raw = text[i:end]

    # normalize JS-literal shape to JSON:
    #   1. quote bare identifier keys:   `{ user: ...}` → `{ "user": ...}`
    #   2. drop trailing commas:         `[1, 2, 3,]`  → `[1, 2, 3]`
    raw = re.sub(r'([{,]\s*)([A-Za-z_$][\w$]*)(\s*):', r'\1"\2"\3:', raw)
    raw = re.sub(r',(\s*[}\]])', r'\1', raw)

    return json.loads(raw)


def fmt_num(n: float) -> str:
    if n >= 1e9:
        return f"{n/1e9:.1f}B"
    if n >= 1e6:
        return f"{n/1e6:.1f}M"
    if n >= 1e3:
        return f"{n/1e3:.1f}k"
    return str(int(n))


def pick_font(size: int, mono: bool = False):
    candidates = [
        "/System/Library/Fonts/Supplemental/Helvetica.ttc",
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/SFNSMono.ttf" if mono else None,
        "/System/Library/Fonts/Menlo.ttc" if mono else None,
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf" if mono else None,
    ]
    for c in candidates:
        if c and os.path.exists(c):
            try:
                return ImageFont.truetype(c, size)
            except Exception:
                pass
    return ImageFont.load_default()


def render(data: dict, out_path: Path) -> None:
    user = data.get("user", {})
    totals = data.get("totals", {})
    year = data.get("year", "")
    by_model = data.get("by_model", [])

    W, H = 1200, 630

    # background — dark base + soft color blobs
    base = Image.new("RGB", (W, H), (10, 10, 15))
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.ellipse((-200, -200, 700, 700),  fill=(131, 56, 236, 90))   # purple
    od.ellipse((600,  250, 1400, 950),  fill=(166, 226, 46, 70))   # green
    od.ellipse((900, -100, 1300, 300),  fill=(255,   0, 110, 60))  # pink accent
    img = Image.alpha_composite(base.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(img)

    # — top: kicker —
    kicker = f"YOUR  AI  YEAR  ·  {year}".upper()
    draw.text((72, 72), kicker, font=pick_font(20, mono=True), fill=(166, 226, 46))

    # — name —
    name = user.get("name") or "Your Name"
    draw.text((68, 110), name, font=pick_font(72), fill=(245, 245, 247))

    # — sub: title + handle —
    title  = user.get("title") or "AI Pair Programmer"
    handle = user.get("handle") or ""
    sub = f"{title}   {handle}".strip()
    draw.text((72, 200), sub, font=pick_font(24), fill=(180, 180, 190))

    # — big number —
    tokens_str = fmt_num(totals.get("tokens", 0))
    draw.text((72, 280), tokens_str, font=pick_font(170), fill=(166, 226, 46))

    # — caption —
    sessions = totals.get("sessions", 0)
    projects = totals.get("projects", 0)
    cap = f"tokens  ·  {sessions:,} conversations  ·  {projects} projects"
    draw.text((76, 480), cap, font=pick_font(26), fill=(200, 200, 210))

    # — model strip —
    if by_model:
        names = "  /  ".join(m.get("name", "") for m in by_model[:4])
        draw.text((76, 525), f"models · {names}", font=pick_font(18, mono=True), fill=(140, 140, 150))

    # — footer brand —
    draw.text((W - 380, H - 50), "github.com/tt-a1i/tokenfolio",
              font=pick_font(18, mono=True), fill=(120, 120, 130))

    img.save(out_path, "PNG", optimize=True)


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate og.png from ./data.js")
    parser.add_argument("--output", "-o", default="./og.png",
                        help="output path (default: ./og.png)")
    args = parser.parse_args()

    data_js = find_data_js()
    # explicit utf-8 — Path.read_text uses platform default which on Windows
    # is cp1252 and chokes on non-ASCII in user.name / location / etc.
    data = parse_resume_data(data_js.read_text(encoding="utf-8"))

    out = Path(args.output)
    render(data, out)

    user = data.get("user", {})
    totals = data.get("totals", {})
    print(f"✓ wrote {out} ({out.stat().st_size:,} bytes)", file=sys.stderr)
    print(
        f"  {user.get('name', 'unknown')} · {fmt_num(totals.get('tokens', 0))} tokens · "
        f"{totals.get('sessions', 0):,} sessions · {totals.get('projects', 0)} projects",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
