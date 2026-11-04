import math, sys
BLANK = "--blank" in sys.argv
CORE = "--core" in sys.argv
SHOW_KEY = "--nokey" not in sys.argv and not BLANK

S = 9.6            # px per foot  (1 in = 10 ft at 96 px/in)
X0, Y0 = 120, 128  # lot origin (back-left corner) in px
if BLANK and not CORE:
    S, X0, Y0 = 11.0, 77, 100
INK = "#1A1A1A"
FONT = "Oswald, 'Arial Narrow', sans-serif"
out = []

def P(x, y):
    return X0 + x * S, Y0 + y * S

def f(v):
    return f"{v:.1f}"

def line(x1, y1, x2, y2, w=1.2, dash=None, color=INK, ft=True):
    if ft:
        (x1, y1), (x2, y2) = P(x1, y1), P(x2, y2)
    d = f' stroke-dasharray="{dash}"' if dash else ""
    out.append(f'<line x1="{f(x1)}" y1="{f(y1)}" x2="{f(x2)}" y2="{f(y2)}" stroke="{color}" stroke-width="{w}"{d}/>')

def rect(x, y, w, h, fill="none", stroke=INK, sw=1.2, ft=True, extra=""):
    if ft:
        x, y = P(x, y); w, h = w * S, h * S
    out.append(f'<rect x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{extra}/>')

def text(x, y, s, size=12, anchor="start", weight=500, color=INK, ft=True, rot=None, ls="0.04em"):
    if ft:
        x, y = P(x, y)
    r = f' transform="rotate({rot} {f(x)} {f(y)})"' if rot is not None else ""
    out.append(f'<text x="{f(x)}" y="{f(y)}" font-family="{FONT}" font-size="{size}" font-weight="{weight}" fill="{color}" text-anchor="{anchor}" letter-spacing="{ls}"{r}>{s}</text>')

# ---------- street + public sidewalk ----------
sx1, sx2 = (-2, 84) if (BLANK and not CORE) else (-5, 87)
rect(sx1, 112, sx2 - sx1, 9, fill="#E6E7E2", stroke="none")
line(sx1, 112, sx2, 112, w=1.6)                              # curb
line(sx1, 121, sx2, 121, w=1, dash="22 5 3 5")                # street center line
text(41, 117.6, "BUSY STREET", size=20, anchor="middle", weight=600, ls="0.3em")
# sidewalk 3.5 ft, inside the frontage
rect(0, 107, 82, 3.5, fill="#FFFFFF", sw=1.2)
for xj in range(5, 82, 5):
    line(xj, 107, xj, 110.5, w=0.6, color="#555")

# ---------- driveway ----------
a = [P(16, 80), P(32, 80), P(32, 103.5), P(36.5, 112), P(11.5, 112), P(16, 103.5)]
c1 = P(32, 108.5); c2 = P(16, 108.5)
out.append(
    f'<path d="M{f(a[0][0])},{f(a[0][1])} L{f(a[1][0])},{f(a[1][1])} L{f(a[2][0])},{f(a[2][1])} '
    f'Q{f(c1[0])},{f(c1[1])} {f(a[3][0])},{f(a[3][1])} L{f(a[4][0])},{f(a[4][1])} '
    f'Q{f(c2[0])},{f(c2[1])} {f(a[5][0])},{f(a[5][1])} Z" fill="#FFFFFF" stroke="{INK}" stroke-width="1.4"/>')
text(24, 95, "DRIVEWAY", size=13, anchor="middle", weight=500, color="#444")
text(52, 109.4, "PUBLIC SIDEWALK", size=11, anchor="middle", weight=500, color="#444")

# ---------- property line ----------
x, y = P(0, 0)
out.append(f'<rect x="{f(x)}" y="{f(y)}" width="{f(82*S)}" height="{f(111*S)}" fill="none" stroke="{INK}" stroke-width="1.8" stroke-dasharray="26 5 4 5 4 5"/>')

# ---------- dimensions ----------
def dim_h(x1, x2, ypx, label):
    a, _ = P(x1, 0); b, _ = P(x2, 0)
    line(a, ypx, b, ypx, w=0.9, ft=False)
    for t in (a, b):
        line(t, ypx - 7, t, ypx + 7, w=0.9, ft=False)
        line(t - 4, ypx + 4, t + 4, ypx - 4, w=1.6, ft=False)
    m = (a + b) / 2
    out.append(f'<rect x="{f(m-38)}" y="{f(ypx-9)}" width="76" height="18" fill="#FFFFFF"/>')
    text(m, ypx + 5, label, size=14, anchor="middle", ft=False)

def dim_v(y1, y2, xpx, label):
    _, a = P(0, y1); _, b = P(0, y2)
    line(xpx, a, xpx, b, w=0.9, ft=False)
    for t in (a, b):
        line(xpx - 7, t, xpx + 7, t, w=0.9, ft=False)
        line(xpx - 4, t + 4, xpx + 4, t - 4, w=1.6, ft=False)
    m = (a + b) / 2
    out.append(f'<rect x="{f(xpx-9)}" y="{f(m-40)}" width="18" height="80" fill="#FFFFFF"/>')
    text(xpx + 5, m, label, size=14, anchor="middle", ft=False, rot=-90)

_a = len(out)
dim_h(0, 82, Y0 - 34, "82'-0\"")
dim_v(0, 111, X0 - 34, "111'-0\"")

# ---------- overhead electric (back line) + service drop ----------
line(0.6, 1.6, 81.4, 1.6, w=1.1)
for xe in range(8, 80, 10):
    rect(xe - 0.8, 0.9, 1.6, 1.4, fill="#FFFFFF", stroke="none")
    text(xe, 2.15, "E", size=10, anchor="middle", weight=600, ls="0")
text(3, 4.6, "OVERHEAD ELECTRIC — 15 FT HIGH", size=12)

sd = ((81.4, 1.6), (74.6, 47))
line(*sd[0], *sd[1], w=1.1)
for t in (0.3, 0.62):
    ex = sd[0][0] + (sd[1][0] - sd[0][0]) * t
    ey = sd[0][1] + (sd[1][1] - sd[0][1]) * t
    rect(ex - 0.8, ey - 0.75, 1.6, 1.5, fill="#FFFFFF", stroke="none")
    text(ex, ey + 0.55, "E", size=10, anchor="middle", weight=600, ls="0")
text(76.6, 21.2, "SERVICE DROP", size=12, anchor="end")
text(76.6, 22.9, "12 FT HIGH", size=12, anchor="end")

# ---------- underground line ----------
ug = ((75.2, 74.2), (81, 106.6))
line(*ug[0], *ug[1], w=1.1, dash="7 4")
for i in range(1, 6):
    t = i / 6
    ox = ug[0][0] + (ug[1][0] - ug[0][0]) * t
    oy = ug[0][1] + (ug[1][1] - ug[0][1]) * t
    cx, cy = P(ox, oy)
    out.append(f'<circle cx="{f(cx)}" cy="{f(cy)}" r="3.6" fill="#FFFFFF" stroke="{INK}" stroke-width="1.1"/>')
text(76.4, 89.0, "UNDERGROUND LINE", size=12, anchor="end")
text(76.4, 90.7, "2 FT BELOW GRADE", size=12, anchor="end")

if BLANK: del out[_a:]

# ---------- house + garage footprint ----------
HF = "#F1F1EE"
pts = [(34, 44), (59, 44), (59, 47), (75, 47), (75, 74), (34, 74)]
d = " ".join(f"{f(P(*p)[0])},{f(P(*p)[1])}" for p in pts)
out.append(f'<polygon points="{d}" fill="{HF}" stroke="{INK}" stroke-width="4" stroke-linejoin="miter"/>')
rect(14, 53, 20, 27, fill=HF, sw=4)

WT = 0.42  # half wall thickness in ft

def window_h(x1, x2, y):
    rect(x1, y - WT, x2 - x1, 2 * WT, fill="#FFFFFF", sw=1)
    line(x1, y, x2, y, w=0.8)

def window_v(x, y1, y2):
    rect(x - WT, y1, 2 * WT, y2 - y1, fill="#FFFFFF", sw=1)
    line(x, y1, x, y2, w=0.8)

def door_h(x1, x2, y, inward):  # hinge at x1, swings toward +y if inward==+1
    rect(x1, y - WT - 0.05, x2 - x1, 2 * WT + 0.1, fill=HF, stroke="none")
    w = x2 - x1
    line(x1, y, x1, y + inward * w, w=1.4)
    (ax, ay), (bx, by) = P(x1, y + inward * w), P(x2, y)
    sweep = 0 if inward > 0 else 1
    out.append(f'<path d="M{f(ax)},{f(ay)} A{f(w*S)},{f(w*S)} 0 0 {sweep} {f(bx)},{f(by)}" fill="none" stroke="{INK}" stroke-width="0.8"/>')

# windows
window_h(37, 43, 44)        # dining, back
window_h(45, 49.5, 44)      # family, back
window_v(34, 46.5, 50.5)    # dining, side
window_v(75, 50.5, 54)      # living, side
window_v(75, 64.5, 68)      # living, side
window_h(37, 40.5, 74)      # kitchen, front
window_h(60.5, 67.5, 74)    # living, front
# sliding glass doors
rect(65, 47 - WT, 7, 2 * WT, fill="#FFFFFF", sw=1)
line(65, 47 - 0.15, 69, 47 - 0.15, w=1.2)
line(68, 47 + 0.15, 72, 47 + 0.15, w=1.2)
text(68.5, 45.9, "SLIDING DOORS", size=10, anchor="middle", weight=500)
# doors
door_h(50, 53, 74, -1)      # front door, swings in (up)
door_h(52, 55, 44, +1)      # family room back door, swings in (down)
door_h(19, 22, 53, +1)      # garage side door
# garage overhead door
rect(16, 80 - WT - 0.05, 16, 2 * WT + 0.1, fill=HF, stroke="none")
line(16, 80, 32, 80, w=1, dash="6 4")
# chimney
rect(75, 57, 1.6, 6, fill="#FFFFFF", sw=1.6)
for yy in (58, 59, 60, 61, 62):
    line(75.1, yy, 76.5, yy, w=0.6)
# A/C unit and gas meter
rect(76.4, 50.6, 2.4, 2.4, fill="#FFFFFF", sw=1.2)
line(76.4, 50.6, 78.8, 53.0, w=0.6); line(78.8, 50.6, 76.4, 53.0, w=0.6)
text(79.1, 52.4, "A/C", size=11, weight=600, ls="0")
rect(70.3, 74.45, 1.4, 1.0, fill="#FFFFFF", sw=1.2)
text(71, 77.2, "GAS METER", size=11, anchor="middle")

# room labels
RL = "#4A4A4A"
text(38.6, 49.4, "DINING", size=12, anchor="middle", color=RL)
text(50.5, 49.4, "FAMILY ROOM", size=12, anchor="middle", color=RL)
text(39.5, 66.0, "KITCHEN", size=12, anchor="middle", color=RL)
text(55.5, 70.4, "FOYER", size=12, anchor="middle", color=RL)
text(66.5, 59.6, "LIVING ROOM", size=12, anchor="middle", color=RL)
text(54.5, 57.2, "SCOTT RESIDENCE", size=15, anchor="middle", weight=600)
text(54.5, 59.0, "2-STORY", size=11, anchor="middle", color=RL) if (BLANK or CORE) else text(54.5, 59.0, "2-STORY · FF EL. 25.0", size=11, anchor="middle", color=RL)
if CORE and not BLANK: text(54.5, 60.6, "FF EL. 25.0", size=11, anchor="middle", color=RL)
text(24, 66.0, "GARAGE", size=15, anchor="middle", weight=600)
if not BLANK: text(24, 67.8, "SLAB EL. 24.5", size=11, anchor="middle", color=RL)

# spot elevations
def spot(x, y, label, tx, ty, anchor="start"):
    cx, cy = P(x, y)
    line(cx - 5, cy, cx + 5, cy, w=1.2, ft=False); line(cx, cy - 5, cx, cy + 5, w=1.2, ft=False)
    text(tx, ty, label, size=12, anchor=anchor)

if not BLANK: spot(48, 41.5, "EL. 24.0", 48.8, 41.9)
if not BLANK: spot(54.8, 75.8, "EL. 23.5", 55.6, 76.2)

_core_end = len(out)
if CORE:
    import json; print(json.dumps(out[:_core_end])); sys.exit(0)
if SHOW_KEY:
    # ---------- symbol key ----------
    KY = 1312
    text(48, KY, "SYMBOL KEY", size=14, weight=600, ft=False, ls="0.1em")
    line(48, KY + 10, 1008, KY + 10, w=1, ft=False)

    def sym_decid_tree(cx, cy, r):
        out.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{INK}" stroke-width="1.3"/>')
        for k in range(5):
            a = math.radians(-90 + k * 72 + 10)
            line(cx, cy, cx + r * 0.92 * math.cos(a), cy + r * 0.92 * math.sin(a), w=0.8, ft=False)
        out.append(f'<circle cx="{cx}" cy="{cy}" r="1.8" fill="{INK}"/>')

    def sym_conifer(cx, cy, r):
        out.append(f'<circle cx="{cx}" cy="{cy}" r="{r*0.82}" fill="none" stroke="{INK}" stroke-width="1"/>')
        for k in range(28):
            a = math.radians(k * 360 / 28)
            line(cx + r * 0.82 * math.cos(a), cy + r * 0.82 * math.sin(a), cx + r * math.cos(a), cy + r * math.sin(a), w=1, ft=False)
        out.append(f'<circle cx="{cx}" cy="{cy}" r="1.8" fill="{INK}"/>')

    def scallop(cx, cy, r, n=10, sw=1.2):
        pts = [(cx + r * math.cos(2 * math.pi * k / n), cy + r * math.sin(2 * math.pi * k / n)) for k in range(n)]
        d = f"M{f(pts[0][0])},{f(pts[0][1])} "
        for k in range(n):
            p2 = pts[(k + 1) % n]
            am = 2 * math.pi * (k + 0.5) / n
            q = (cx + r * 1.22 * math.cos(am), cy + r * 1.22 * math.sin(am))
            d += f"Q{f(q[0])},{f(q[1])} {f(p2[0])},{f(p2[1])} "
        out.append(f'<path d="{d}Z" fill="none" stroke="{INK}" stroke-width="{sw}"/>')

    def sym_broadleaf(cx, cy, r):
        scallop(cx, cy, r * 0.84)
        out.append(f'<circle cx="{cx}" cy="{cy}" r="1.6" fill="{INK}"/>')

    def sym_decid_shrub(cx, cy, r):
        out.append(f'<circle cx="{cx}" cy="{cy}" r="{r*0.8}" fill="none" stroke="{INK}" stroke-width="1.2"/>')
        out.append(f'<circle cx="{cx}" cy="{cy}" r="{r*0.45}" fill="none" stroke="{INK}" stroke-width="0.7"/>')
        out.append(f'<circle cx="{cx}" cy="{cy}" r="1.6" fill="{INK}"/>')

    def sym_perennial(cx, cy, r):
        out.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{r*1.5}" ry="{r}" fill="none" stroke="{INK}" stroke-width="1.2"/>')
        for (dx, dy) in [(-14, -6), (-2, -9), (11, -5), (-9, 6), (4, 5), (16, 6)]:
            out.append(f'<circle cx="{cx+dx}" cy="{cy+dy}" r="4.6" fill="none" stroke="{INK}" stroke-width="0.9"/>')

    def sym_annual(cx, cy, r):
        out.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{r*1.5}" ry="{r}" fill="none" stroke="{INK}" stroke-width="1.2"/>')
        for gx in range(-24, 25, 6):
            for gy in range(-12, 13, 6):
                if (gx / (r * 1.5 - 4)) ** 2 + (gy / (r - 4)) ** 2 < 1:
                    off = 3 if (gy // 6) % 2 else 0
                    out.append(f'<circle cx="{cx+gx+off}" cy="{cy+gy}" r="1.1" fill="{INK}"/>')

    def sym_groundcover(cx, cy, r):
        w, h = r * 3, r * 1.8
        x, y = cx - w / 2, cy - h / 2
        out.append(f'<rect x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}" rx="10" fill="none" stroke="{INK}" stroke-width="1.2"/>')
        for i in range(1, int(w // 5)):
            line(x + i * 5, y + 4, x + i * 5, y + h - 4, w=0.7, ft=False)

    items = [
        (sym_decid_tree, "DECIDUOUS", "TREE"),
        (sym_conifer, "EVERGREEN", "TREE"),
        (sym_broadleaf, "BROADLEAF", "EVERGREEN"),
        (sym_decid_shrub, "DECIDUOUS", "SHRUB"),
        (sym_perennial, "HERBACEOUS", "PERENNIAL"),
        (sym_annual, "ANNUAL", "BED"),
        (sym_groundcover, "GROUND", "COVER"),
    ]
    cw = 960 / len(items)
    for i, (fn, l1, l2) in enumerate(items):
        cx = 48 + cw * i + cw / 2
        fn(cx, KY + 44, 19)
        text(cx, KY + 82, l1, size=12, anchor="middle", ft=False)
        text(cx, KY + 97, l2, size=12, anchor="middle", ft=False)

    LY = KY + 128
    line(48, LY - 16, 1008, LY - 16, w=0.6, color="#B9BDB2", ft=False)
    def keyline(x, label, dash=None, mark=None):
        out.append(f'<line x1="{x}" y1="{LY}" x2="{x+70}" y2="{LY}" stroke="{INK}" stroke-width="1.4"' + (f' stroke-dasharray="{dash}"' if dash else "") + "/>")
        if mark == "E":
            out.append(f'<rect x="{x+29}" y="{LY-7}" width="12" height="14" fill="#FFFFFF"/>')
            text(x + 35, LY + 4, "E", size=10, anchor="middle", weight=600, ft=False, ls="0")
        if mark == "O":
            out.append(f'<circle cx="{x+35}" cy="{LY}" r="3.6" fill="#FFFFFF" stroke="{INK}" stroke-width="1.1"/>')
        text(x + 82, LY + 4, label, size=12, ft=False)

    keyline(48, "PROPERTY LINE", dash="26 5 4 5 4 5")
    keyline(298, "OVERHEAD ELECTRIC", mark="E")
    keyline(548, "UNDERGROUND LINE", dash="7 4", mark="O")
    out.append(f'<line x1="808" y1="{LY}" x2="820" y2="{LY}" stroke="{INK}" stroke-width="1.2"/><line x1="814" y1="{LY-6}" x2="814" y2="{LY+6}" stroke="{INK}" stroke-width="1.2"/>')
    text(830, LY + 4, "SPOT ELEVATION (FT)", size=12, ft=False)

# ---------- title block ----------
TY, TH = 1476, 108
out.append(f'<rect x="48" y="{TY}" width="960" height="{TH}" fill="#FFFFFF" stroke="{INK}" stroke-width="1.5"/>')
out.append(f'<rect x="48" y="{TY}" width="320" height="{TH}" fill="#1B5633"/>')
text(68, TY + 42, "SCOTT RESIDENCE", size=30, weight=700, color="#FFFFFF", ft=False, ls="0")
text(68, TY + 64, "DESIGN PLAN" if BLANK else "BASE PLAN", size=14, weight=600, color="#FFCE00", ft=False, ls="0.12em")
out.append(f'<rect x="68" y="{TY+74}" width="56" height="3" fill="#FFCE00"/>')
text(68, TY + 96, "AGPS 1024 · ARKANSAS TECH UNIVERSITY", size=11, color="#FFFFFF", ft=False, ls="0.06em")
# name fields
FX2 = 988 if BLANK else 648
text(388, TY + 22, "DESIGNER", size=11, color="#4A4A4A", ft=False, ls="0.08em")
line(388, TY + 48, FX2, TY + 48, w=1, ft=False)
half = (FX2 - 388 - 20) / 2
text(388, TY + 70, "LAB SECTION", size=11, color="#4A4A4A", ft=False, ls="0.08em")
line(388, TY + 96, 388 + half, TY + 96, w=1, ft=False)
text(408 + half, TY + 70, "DATE", size=11, color="#4A4A4A", ft=False, ls="0.08em")
line(408 + half, TY + 96, FX2, TY + 96, w=1, ft=False)
if not BLANK:
    line(668, TY, 668, TY + TH, w=1.2, ft=False)
    line(888, TY, 888, TY + TH, w=1.2, ft=False)
    # graphic scale
    gx = 688
    text(gx, TY + 22, "SCALE IN FEET", size=11, color="#4A4A4A", ft=False, ls="0.08em")
    for (a_, b_, fl) in [(0, 5, True), (5, 10, False), (10, 20, True)]:
        out.append(f'<rect x="{f(gx+a_*S)}" y="{TY+46}" width="{f((b_-a_)*S)}" height="8" fill="{INK if fl else "#FFFFFF"}" stroke="{INK}" stroke-width="1"/>')
    for v in (0, 5, 10, 20):
        text(gx + v * S, TY + 40, str(v), size=11, anchor="middle", ft=False, ls="0")
    text(gx, TY + 78, "1 IN = 10 FT", size=13, weight=600, ft=False)
    text(gx, TY + 96, "WHEN PRINTED ON 11×17", size=11, color="#4A4A4A", ft=False)
    # north arrow (points left: street side is west)
    nx, ny = 948, TY + 62
    text(nx, TY + 22, "NORTH", size=11, anchor="middle", color="#4A4A4A", ft=False, ls="0.08em")
    out.append(f'<circle cx="{nx}" cy="{ny}" r="30" fill="none" stroke="{INK}" stroke-width="1.2"/>')
    out.append(f'<path d="M{nx-26},{ny} L{nx+20},{ny-10} L{nx+11},{ny} Z" fill="{INK}"/>')
    out.append(f'<path d="M{nx-26},{ny} L{nx+20},{ny+10} L{nx+11},{ny} Z" fill="#FFFFFF" stroke="{INK}" stroke-width="1"/>')

svg = "\n".join(out)

SHEET = 'Design Plan' if BLANK else 'Base Plan'
TITLE = 'Scott Residence ' + SHEET
html = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{TITLE}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&amp;display=swap" rel="stylesheet">
<style>
body{{margin:0;background:#FFFFFF}}
</style>
</helmet>
<div style="width: 1056px; height: 1632px; position: relative; overflow: hidden; background: #FFFFFF; font-family: 'Oswald', sans-serif; color: #1A1A1A">
<div style="position: absolute; left: 48px; top: 40px; display: flex; align-items: baseline; gap: 16px">
<div style="font-family: 'Oswald', sans-serif; font-weight: 700; font-size: 26px; text-transform: uppercase; letter-spacing: -0.01em; color: #1B5633">Scott Residence — {SHEET}</div>
<div style="font-family: 'Oswald', sans-serif; font-weight: 500; font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; color: #4A4A4A">Client: The Scott Family</div>
</div>
<svg width="1056" height="1632" viewBox="0 0 1056 1632" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Scaled base plan of the Scott residence lot, 82 by 111 feet, showing house, garage, driveway, utilities, spot elevations and the busy street" style="position: absolute; left: 0; top: 0; pointer-events: none">
{svg}
</svg>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":1056,"height":1632}}}}'>
class Component extends DCLogic {{
renderVals() {{
return {{}};
}}
}}
</script>
</body>
</html>
'''
import sys
open(sys.argv[1], "w").write(html)
