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
        self.tag_stack = []
        self.tag_errors = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag not in VOID:
            self.tag_stack.append(tag)
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

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID and self.tag_stack and self.tag_stack[-1] == tag:
            self.tag_stack.pop()

    def handle_endtag(self, tag):
        if tag == "label":
            self.label_depth = max(0, self.label_depth - 1)
        if tag in VOID:
            return
        if not self.tag_stack:
            self.tag_errors.append(f"unexpected </{tag}>")
            return
        expected = self.tag_stack[-1]
        if expected != tag:
            self.tag_errors.append(f"expected </{expected}> before </{tag}>")
            if tag in self.tag_stack:
                while self.tag_stack and self.tag_stack[-1] != tag:
                    self.tag_stack.pop()
                self.tag_stack.pop()
            return
        self.tag_stack.pop()


def internal_target(page, raw):
    parsed = urlsplit(raw)
    if parsed.scheme or parsed.netloc or raw.startswith(("#", "mailto:", "tel:", "data:")):
        return None
    path = unquote(parsed.path)
    if not path:
        return None
    if path.startswith('/anesthesia/'):
        path = path[len('/anesthesia/'):]
        page = DOCS / 'index.html'
    target = (page.parent / path).resolve()
    if path.endswith("/"):
        target /= "index.html"
    return target


errors = []


def javascript_calls(source, function_name):
    """Extract balanced calls without depending on line wrapping or indentation."""
    for match in re.finditer(r"\b" + re.escape(function_name) + r"\s*\(", source):
        start = match.end()
        depth = 1
        quote = None
        escaped = False
        for index in range(start, len(source)):
            char = source[index]
            if quote:
                if escaped:
                    escaped = False
                elif char == "\\":
                    escaped = True
                elif char == quote:
                    quote = None
                continue
            if char in "'\"`":
                quote = char
            elif char == "(":
                depth += 1
            elif char == ")":
                depth -= 1
                if depth == 0:
                    yield source.count("\n", 0, match.start()) + 1, source[start:index]
                    break


html_files = sorted(page for page in DOCS.glob("*.html") if not page.name.startswith("."))
for page in html_files:
    source = page.read_text(encoding="utf-8")
    parser = AuditParser()
    parser.feed(source)

    for error in parser.tag_errors:
        errors.append(f"{page.name}: {error}")
    if parser.tag_stack:
        errors.append(f"{page.name}: unclosed tags: {', '.join(parser.tag_stack)}")
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

dose_script = (DOCS / "script.js").read_text(encoding="utf-8")
source_block_match = re.search(r"const SOURCES = Object\.freeze\(\{(.*?)\n  \}\);", dose_script, re.DOTALL)
if not source_block_match:
    errors.append("script.js: could not find medication source registry")
    source_keys = set()
else:
    source_entries = dict(re.findall(
        r"\b([A-Za-z0-9]+):\s*\{([^{}]*)\}",
        source_block_match.group(1),
        re.DOTALL,
    ))
    source_keys = set(source_entries)
    source_urls = {
        key: match.group(1)
        for key, entry in source_entries.items()
        if (match := re.search(r"\burl:\s*'(https://[^']+)'", entry))
    }
    missing_urls = sorted(source_keys - source_urls.keys())
    if missing_urls:
        errors.append(f"script.js: medication sources without HTTPS URLs: {', '.join(missing_urls)}")

used_source_keys = set()
for line_number, arguments in javascript_calls(dose_script, "row"):
    source_list_match = re.search(r",\s*\[([^\]]+)\]\s*$", arguments)
    if not source_list_match:
        errors.append(f"script.js:{line_number}: medication row has no source list")
        continue
    row_sources = set(re.findall(r"'([A-Za-z0-9]+)'", source_list_match.group(1)))
    if not row_sources:
        errors.append(f"script.js:{line_number}: medication row has an empty source list")
    used_source_keys.update(row_sources)

undefined_sources = sorted(used_source_keys - source_keys)
if undefined_sources:
    errors.append(f"script.js: undefined medication sources: {', '.join(undefined_sources)}")
unused_sources = sorted(source_keys - used_source_keys)
if unused_sources:
    errors.append(f"script.js: unused medication sources: {', '.join(unused_sources)}")

for required in (
    "Esmolol (laryngoscopy/intubation response; off-label)",
    "0.5–1.5 mg/kg IV before induction/intubation",
    "Esmolol (optional SVT loading dose)",
    "500 mcg/kg over 1 min",
    "Esmolol (SVT maintenance infusion)",
    "50–200 mcg/kg/min",
    "patient.age > 65 ? 0.5 : 1",
    "m.TBW > 1.3 * m.IBW",
    "IBW (label obesity threshold)",
    "Propofol (induction, age ≥65)",
    "Dexmedetomidine (sedation loading, age >65)",
    "anesthesia-dose-favorites",
):
    if required not in dose_script:
        errors.append(f"script.js: missing required dosing logic: {required}")

dose_page = (DOCS / "drugdoses.html").read_text(encoding="utf-8")
for source in ("dailymed.nlm.nih.gov", "pubmed.ncbi.nlm.nih.gov"):
    if source not in f"{dose_page}\n{dose_script}":
        errors.append(f"drugdoses.html: missing esmolol source link for {source}")

content_requirements = {
    "abgcalc.html": (
        "deltaRatio",
        "hendersonHasselbalchPh",
        "Input consistency check",
        "PMC5260542",
    ),
    "cardiacrisk.html": (
        "Low risk (&lt;1% MACE)",
        "Elevated risk (≥1% MACE)",
        "data-dasi=",
        "CIR.0000000000001285",
    ),
    "ponv.html": (
        "2026 Fifth Consensus Guidelines",
        "use two prophylactic interventions",
        "Drug choices remain manual",
        "ANE.0000000000007816",
    ),
    "venthelper.html": (
        "ARDS: 4–8 (start at 6)",
        "drivingPressure",
        "plateau pressure &lt;30",
        "ards-guidelines.pdf",
    ),
    "preopguidelines.html": (
        "ADA Standards of Care in Diabetes—2026",
        "ASRA 2025 antithrombotic guideline",
        "CHEST 2022 Perioperative Management",
    ),
}
for filename, requirements in content_requirements.items():
    source = re.sub(r"\s+", " ", (DOCS / filename).read_text(encoding="utf-8"))
    for required in requirements:
        if required not in source:
            errors.append(f"{filename}: missing reviewed clinical content: {required}")

for filename in ("ponv.html", "cardiacrisk.html"):
    source = (DOCS / filename).read_text(encoding="utf-8")
    if "Avoid identifiers" not in source and "Avoid names/MRNs" not in source:
        errors.append(f"{filename}: free-text notes need an identifier warning")

preop_source = (DOCS / "preopguidelines.html").read_text(encoding="utf-8").lower()
for placeholder in ("placeholder reference", "example.com", "citation needed"):
    if placeholder in preop_source:
        errors.append(f"preopguidelines.html: unresolved source placeholder: {placeholder}")

calculations = (DOCS / "calculations.js").read_text(encoding="utf-8")
for helper in ("devineIdealBodyWeight", "respiratoryCompensation", "deltaRatio", "hendersonHasselbalchPh", "drivingPressure"):
    if helper not in calculations:
        errors.append(f"calculations.js: missing shared clinical helper {helper}")

pwa_source = (DOCS / "pwa.js").read_text(encoding="utf-8")
for required in ("September 24, 2026", "December 24, 2026", "navigator.onLine"):
    if required not in pwa_source:
        errors.append(f"pwa.js: missing review/offline metadata: {required}")
if not re.search(r"const CACHE_NAME = 'anesthesia-toolkit-v\d+'", service_worker):
    errors.append("sw.js: missing versioned toolkit cache")
if not (DOCS / "CLINICAL_REVIEW.md").exists():
    errors.append("docs: missing quarterly clinical review log")

if errors:
    print("Site checks failed:", file=sys.stderr)
    for error in errors:
        print(f"- {error}", file=sys.stderr)
    raise SystemExit(1)

print(f"Site checks passed for {len(html_files)} HTML pages.")
