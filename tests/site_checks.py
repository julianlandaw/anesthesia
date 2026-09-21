#!/usr/bin/env python3
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}


class AuditParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids = []
        self.links = []
        self.controls = []
        self.label_fors = set()
        self.label_depth = 0
        self.h1_count = 0
        self.meta_names = set()
        self.rel_values = set()
        self.scripts = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == "label":
            self.label_depth += 1
            if values.get("for"):
                self.label_fors.add(values["for"])
        if tag == "h1":
            self.h1_count += 1
        if values.get("id"):
            self.ids.append(values["id"])
        if tag in {"a", "link", "script", "img", "source"}:
            target = values.get("href") or values.get("src")
            if target:
                self.links.append(target)
        if tag in {"input", "select", "textarea"} and values.get("type") != "hidden":
            self.controls.append((tag, values, self.label_depth > 0))
        if tag == "meta" and values.get("name"):
            self.meta_names.add(values["name"])
        if tag == "link":
            self.rel_values.update(values.get("rel", "").split())
        if tag == "script" and values.get("src"):
            self.scripts.append(values["src"])

    def handle_endtag(self, tag):
        if tag == "label":
            self.label_depth = max(0, self.label_depth - 1)


def internal_target(page, raw):
    parsed = urlsplit(raw)
    if parsed.scheme or parsed.netloc or raw.startswith(("#", "mailto:", "tel:", "data:")):
        return None
    path = unquote(parsed.path)
    if not path:
        return None
    target = (page.parent / path).resolve()
    if path.endswith("/"):
        target /= "index.html"
    return target


errors = []
html_files = sorted(DOCS.glob("*.html"))
for page in html_files:
    source = page.read_text(encoding="utf-8")
    parser = AuditParser()
    parser.feed(source)

    if not source.rstrip().endswith("</html>"):
        errors.append(f"{page.name}: content appears after </html>")
    if len(parser.ids) != len(set(parser.ids)):
        duplicates = sorted({item for item in parser.ids if parser.ids.count(item) > 1})
        errors.append(f"{page.name}: duplicate IDs: {', '.join(duplicates)}")
    if parser.h1_count != 1:
        errors.append(f"{page.name}: expected one h1, found {parser.h1_count}")
    for required in ("description", "viewport", "theme-color"):
        if required not in parser.meta_names:
            errors.append(f"{page.name}: missing meta name={required}")
    for required in ("icon", "manifest"):
        if required not in parser.rel_values:
            errors.append(f"{page.name}: missing link rel={required}")
    for required in ("theme.js", "pwa.js"):
        if required not in parser.scripts:
            errors.append(f"{page.name}: missing shared {required}")

    for tag, attrs, wrapped in parser.controls:
        control_id = attrs.get("id")
        named = wrapped or bool(attrs.get("aria-label") or attrs.get("aria-labelledby")) or control_id in parser.label_fors
        if not named:
            errors.append(f"{page.name}: unlabeled {tag}#{control_id or '(no id)'}")

    for raw in parser.links:
        target = internal_target(page, raw)
        if target and not target.exists():
            errors.append(f"{page.name}: broken local reference {raw}")

service_worker = (DOCS / "sw.js").read_text(encoding="utf-8")
cached = set(re.findall(r"'\./([^']*)'", service_worker))
expected_cache = {page.name for page in html_files} | {
    "theme.css", "theme.js", "pwa.js", "calculations.js", "styles.css", "enhancements.css",
    "script.js", "manifest.webmanifest", "icon.svg", "social-card.png"
}
missing_cache = sorted(expected_cache - cached)
if missing_cache:
    errors.append(f"sw.js: missing cached files: {', '.join(missing_cache)}")

if errors:
    print("Site checks failed:", file=sys.stderr)
    for error in errors:
        print(f"- {error}", file=sys.stderr)
    raise SystemExit(1)

print(f"Site checks passed for {len(html_files)} HTML pages.")
