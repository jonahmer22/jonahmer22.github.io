#!/usr/bin/env python3
"""Build blog HTML pages from Markdown posts."""
from __future__ import annotations

import datetime as dt
import html
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
POSTS_DIR = ROOT / "posts"
OUTPUT_DIR = ROOT
TEMPLATES_DIR = ROOT / "templates"
POST_TEMPLATE = (TEMPLATES_DIR / "post_template.html").read_text(encoding="utf-8")
INDEX_TEMPLATE = (TEMPLATES_DIR / "index_template.html").read_text(encoding="utf-8")

FRONT_MATTER_RE = re.compile(r"^---\n(.*?)\n---\n(.*)$", re.S)
INLINE_CODE_RE = re.compile(r"`([^`]+)`")
BOLD_RE = re.compile(r"\*\*([^*]+)\*\*")
ITALIC_RE = re.compile(r"(?<!\*)\*([^*]+)\*(?!\*)")
LINK_RE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")


def parse_post(md_path: Path) -> dict:
    raw = md_path.read_text(encoding="utf-8").strip()
    match = FRONT_MATTER_RE.match(raw)
    if not match:
        raise ValueError(f"Post {md_path} missing front matter")
    front_matter, body = match.groups()
    meta = {}
    for line in front_matter.splitlines():
        if not line.strip():
            continue
        if ":" not in line:
            raise ValueError(f"Malformed front matter line in {md_path}: {line}")
        key, value = line.split(":", 1)
        meta[key.strip()] = value.strip()
    if "title" not in meta or "date" not in meta:
        raise ValueError(f"Post {md_path} must define 'title' and 'date'")
    slug = meta.get("slug") or md_path.stem
    summary = meta.get("summary") or body.strip().splitlines()[0]
    date_obj = dt.datetime.strptime(meta["date"], "%Y-%m-%d").date()
    display_date = date_obj.strftime("%B %-d, %Y") if hasattr(date_obj, 'strftime') else meta["date"]
    # In case platform doesn't support %-d (Windows), fall back
    try:
        display_date = date_obj.strftime("%B %-d, %Y")
    except ValueError:
        display_date = date_obj.strftime("%B %d, %Y").replace(" 0", " ")
    content_html = markdown_to_html(body.strip())
    return {
        "slug": slug,
        "title": meta["title"],
        "date": date_obj,
        "display_date": display_date,
        "summary": summary,
        "content_html": content_html,
    }


def render_inline(text: str) -> str:
    placeholders: dict[str, str] = {}

    def link_repl(match: re.Match[str]) -> str:
        token = f"__LINK{len(placeholders)}__"
        label = render_inline(match.group(1))
        url = html.escape(match.group(2), quote=True)
        placeholders[token] = f"<a href=\"{url}\" target=\"_blank\" rel=\"noopener\">{label}</a>"
        return token

    text_with_tokens = LINK_RE.sub(link_repl, text)
    escaped = html.escape(text_with_tokens)
    escaped = INLINE_CODE_RE.sub(lambda m: f"<code>{html.escape(m.group(1))}</code>", escaped)
    escaped = BOLD_RE.sub(lambda m: f"<strong>{m.group(1)}</strong>", escaped)
    escaped = ITALIC_RE.sub(lambda m: f"<em>{m.group(1)}</em>", escaped)
    for token, anchor in placeholders.items():
        escaped = escaped.replace(token, anchor)
    return escaped


def markdown_to_html(md: str) -> str:
    lines = md.splitlines()
    html_parts: list[str] = []
    in_list = False
    in_code = False
    code_lang = ""
    code_lines: list[str] = []

    def close_list() -> None:
        nonlocal in_list
        if in_list:
            html_parts.append("</ul>")
            in_list = False

    def close_code_block() -> None:
        nonlocal in_code, code_lines, code_lang
        if in_code:
            escaped = html.escape("\n".join(code_lines))
            attr = f' class="language-{html.escape(code_lang, quote=True)}"' if code_lang else ""
            html_parts.append(f"<pre><code{attr}>{escaped}</code></pre>")
            in_code = False
            code_lines = []
            code_lang = ""

    for raw_line in lines:
        line = raw_line.rstrip()
        stripped = line.strip()

        if stripped.startswith("```"):
            if in_code:
                close_code_block()
            else:
                close_list()
                in_code = True
                code_lang = stripped[3:].strip()
                code_lines = []
            continue

        if in_code:
            code_lines.append(raw_line)
            continue

        if not stripped:
            close_list()
            html_parts.append("")
            continue
        if stripped.startswith("### "):
            close_list()
            html_parts.append(f"<h3>{render_inline(stripped[4:])}</h3>")
        elif stripped.startswith("## "):
            close_list()
            html_parts.append(f"<h2>{render_inline(stripped[3:])}</h2>")
        elif stripped.startswith("# "):
            close_list()
            html_parts.append(f"<h1>{render_inline(stripped[2:])}</h1>")
        elif stripped.startswith("- "):
            if not in_list:
                html_parts.append("<ul>")
                in_list = True
            html_parts.append(f"<li>{render_inline(stripped[2:].strip())}</li>")
        else:
            close_list()
            html_parts.append(f"<p>{render_inline(stripped)}</p>")
    close_list()
    close_code_block()
    # Remove consecutive blank lines
    cleaned = []
    for part in html_parts:
        if part == "" and (not cleaned or cleaned[-1] == ""):
            continue
        cleaned.append(part)
    return "\n".join(cleaned)


def build_post(post: dict) -> None:
    html_output = POST_TEMPLATE
    html_output = html_output.replace("{{ title }}", html.escape(post["title"]))
    html_output = html_output.replace("{{ summary }}", html.escape(post["summary"]))
    html_output = html_output.replace("{{ display_date }}", post["display_date"])
    html_output = html_output.replace("{{ content }}", post["content_html"])
    (OUTPUT_DIR / f"{post['slug']}.html").write_text(html_output, encoding="utf-8")


def build_index(posts: list[dict]) -> None:
    cards = []
    for post in posts:
        card = (
            f"      <a class=\"card post-card\" href=\"{post['slug']}.html\">\n"
            f"        <h3>{html.escape(post['title'])}</h3>\n"
            f"        <p>{html.escape(post['summary'])}</p>\n"
            f"        <p class=\"post-meta\">Published {post['date'].strftime('%B %d, %Y').replace(' 0', ' ')}</p>\n"
            f"      </a>"
        )
        cards.append(card)
    posts_markup = "\n".join(cards) if cards else "      <p>No posts yet. Check back soon!</p>"
    index_html = INDEX_TEMPLATE.replace("{{ posts }}", posts_markup)
    (OUTPUT_DIR / "index.html").write_text(index_html, encoding="utf-8")


def main() -> None:
    posts = [parse_post(path) for path in sorted(POSTS_DIR.glob("*.md"))]
    posts.sort(key=lambda p: p["date"], reverse=True)
    for post in posts:
        build_post(post)
    build_index(posts)
    print(f"Built {len(posts)} post(s).")


if __name__ == "__main__":
    main()
