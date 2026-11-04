"""Build dist/landscape-designer.html: one self-contained page that works offline
(USB drive, Blackboard, any web server). Everything is inlined: fonts, jsPDF, data.

Bundles src/plants.js (plant library), src/render.js (symbols and rendering) and
src/app.js (the app) into one script scope, and injects it plus data/core.json
(base plan geometry) into src/template.html at the __APP__ and __CORE__ placeholders.

    python3 scripts/build.py
"""
import base64, json, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
tpl = (SRC / "template.html").read_text()
core = json.loads((ROOT / "data" / "core.json").read_text())
parts = [(SRC / f).read_text() for f in ("plants.js", "render.js", "app.js")]
app = "(function () {\n'use strict';\n" + "\n".join(parts) + "\n})();"

VENDOR = SRC / "vendor"
def font(family, file, weight, style="normal"):
    b64 = base64.b64encode((VENDOR / file).read_bytes()).decode()
    return (f"@font-face{{font-family:'{family}';font-style:{style};font-weight:{weight};font-display:swap;"
            f"src:url(data:font/woff2;base64,{b64}) format('woff2')}}")
fonts = "\n".join([
    font("Oswald", "oswald-latin-wght-normal.woff2", "200 700"),
    font("Source Sans 3", "source-sans-3-latin-wght-normal.woff2", "200 900"),
    font("Source Sans 3", "source-sans-3-latin-wght-italic.woff2", "200 900", "italic"),
])
jspdf = (VENDOR / "jspdf.umd.min.js").read_text()
jspdf = jspdf.replace("//# sourceMappingURL=jspdf.umd.min.js.map", "").replace("</script", "<\\/script")

assert "__CORE__" in tpl and "__APP__" in tpl, "template placeholders missing"
assert "__FONTS__" in tpl and "__JSPDF__" in tpl, "vendor placeholders missing"
out = (tpl.replace("__FONTS__", fonts).replace("__JSPDF__", jspdf)
          .replace("__CORE__", json.dumps(core)).replace("__APP__", app))
import re
assert not re.search(r'<link[^>]+href="https?:|<script[^>]+src="https?:', out), "external resource left in the page"
dist = ROOT / "dist"
dist.mkdir(exist_ok=True)
(dist / "landscape-designer.html").write_text(out)
print(f"wrote {dist / 'landscape-designer.html'} ({len(out):,} bytes)")
