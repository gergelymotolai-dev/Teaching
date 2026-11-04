"""Build dist/landscape-designer.html: one self-contained page.

Injects data/core.json (base plan geometry) and src/app.js into src/template.html
at the __CORE__ and __APP__ placeholders.

    python3 scripts/build.py
"""
import json, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
tpl = (ROOT / "src" / "template.html").read_text()
core = json.loads((ROOT / "data" / "core.json").read_text())
app = (ROOT / "src" / "app.js").read_text()

assert "__CORE__" in tpl and "__APP__" in tpl, "template placeholders missing"
out = tpl.replace("__CORE__", json.dumps(core)).replace("__APP__", app)
dist = ROOT / "dist"
dist.mkdir(exist_ok=True)
(dist / "landscape-designer.html").write_text(out)
print(f"wrote {dist / 'landscape-designer.html'} ({len(out):,} bytes)")
