"""Build dist/landscape-designer.html: one self-contained page.

Bundles src/plants.js (plant library), src/render.js (symbols and rendering) and
src/app.js (the app) into one script scope, and injects it plus data/core.json
(base plan geometry) into src/template.html at the __APP__ and __CORE__ placeholders.

    python3 scripts/build.py
"""
import json, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
tpl = (SRC / "template.html").read_text()
core = json.loads((ROOT / "data" / "core.json").read_text())
parts = [(SRC / f).read_text() for f in ("plants.js", "render.js", "app.js")]
app = "(function () {\n'use strict';\n" + "\n".join(parts) + "\n})();"

assert "__CORE__" in tpl and "__APP__" in tpl, "template placeholders missing"
out = tpl.replace("__CORE__", json.dumps(core)).replace("__APP__", app)
dist = ROOT / "dist"
dist.mkdir(exist_ok=True)
(dist / "landscape-designer.html").write_text(out)
print(f"wrote {dist / 'landscape-designer.html'} ({len(out):,} bytes)")
