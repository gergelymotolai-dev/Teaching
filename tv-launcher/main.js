(function () {
  "use strict";

  var KEY = { LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, OK: 13, BACK: 461,
              RED: 403, YELLOW: 405, BLUE: 406, ESC: 27 };
  var COLS = 6;
  var STORE = "minilauncher.v1";

  var grid = document.getElementById("grid");
  var modeEl = document.getElementById("mode");

  var apps = [];        // full ordered list of { id, title, color, icon }
  var visible = [];     // apps currently drawn
  var hidden = {};      // id -> true
  var focus = 0;
  var moving = false;
  var showHidden = false;

  // ---- Luna service bridge (no webOSTV.js dependency) ----------------------

  var pending = [];     // keep bridges referenced until they answer
  function luna(uri, params) {
    return new Promise(function (resolve, reject) {
      if (typeof window.PalmServiceBridge !== "function") {
        reject(new Error("Not running on webOS"));
        return;
      }
      var bridge = new window.PalmServiceBridge();
      pending.push(bridge);
      bridge.onservicecallback = function (msg) {
        pending.splice(pending.indexOf(bridge), 1);
        var res;
        try { res = JSON.parse(msg); } catch (e) { res = { returnValue: false }; }
        if (res.returnValue === false) reject(res); else resolve(res);
      };
      bridge.call(uri, JSON.stringify(params || {}));
    });
  }

  function launch(id) {
    return luna("luna://com.webos.applicationManager/launch", { id: id })
      .catch(function () {
        return luna("luna://com.webos.service.applicationmanager/launch", { id: id });
      })
      .catch(function (err) { console.warn("launch failed", id, err); });
  }

  // Installed apps, or null when the TV doesn't allow listing them.
  function loadInstalled() {
    return luna("luna://com.webos.applicationManager/listLaunchPoints", {})
      .then(function (res) {
        var list = (res.launchPoints || [])
          .filter(function (lp) { return lp.id !== "com.motolai.minilauncher"; })
          .map(function (lp) {
            return { id: lp.id, title: lp.title,
                     color: lp.bgColor || "#1a1d24",
                     icon: lp.largeIcon || lp.icon };
          });
        if (!list.length) throw new Error("empty");
        return list;
      })
      .catch(function () { return null; });
  }

  // ---- Persistence ----------------------------------------------------------

  function loadPrefs() {
    try { return JSON.parse(localStorage.getItem(STORE)) || {}; }
    catch (e) { return {}; }
  }

  function savePrefs() {
    try {
      localStorage.setItem(STORE, JSON.stringify({
        order: apps.map(function (a) { return a.id; }),
        hidden: hidden
      }));
    } catch (e) { /* storage unavailable; settings just won't persist */ }
  }

  function applyPrefs(list, prefs) {
    hidden = prefs.hidden || {};
    var order = prefs.order || [];
    var rank = {};
    order.forEach(function (id, i) { rank[id] = i; });
    // Saved apps keep their position; newly installed ones go to the end.
    return list.slice().sort(function (a, b) {
      var ra = a.id in rank ? rank[a.id] : 1e6;
      var rb = b.id in rank ? rank[b.id] : 1e6;
      return ra - rb;
    });
  }

  // ---- Rendering ------------------------------------------------------------

  function tile(app) {
    var el = document.createElement("div");
    el.className = "tile" + (hidden[app.id] ? " hidden-app" : "");
    el.style.background = app.color;
    if (app.icon) {
      var img = document.createElement("img");
      img.src = app.icon;
      img.alt = "";
      el.appendChild(img);
    } else {
      var g = document.createElement("div");
      g.className = "glyph";
      g.textContent = app.title.charAt(0);
      el.appendChild(g);
    }
    var name = document.createElement("div");
    name.className = "name";
    name.textContent = app.title;
    el.appendChild(name);
    return el;
  }

  function render() {
    visible = apps.filter(function (a) { return showHidden || !hidden[a.id]; });
    var frag = document.createDocumentFragment();
    visible.forEach(function (app, i) {
      var el = tile(app);
      el.dataset.index = i;
      frag.appendChild(el);
    });
    grid.textContent = "";
    grid.appendChild(frag);
    focus = Math.max(0, Math.min(focus, visible.length - 1));
    paintFocus();
  }

  function paintFocus() {
    var prev = grid.querySelector(".focus");
    if (prev) prev.classList.remove("focus", "moving");
    var el = grid.children[focus];
    if (!el) return;
    el.classList.add("focus");
    el.scrollIntoView({ block: "nearest" });
    if (moving) el.classList.add("moving");
  }

  function setMode() {
    var label = moving ? "Moving — arrows to place, OK to drop"
              : showHidden ? "Showing hidden apps" : "";
    modeEl.textContent = label;
    modeEl.hidden = !label;
  }

  // ---- Actions --------------------------------------------------------------

  function step(delta) {
    var next = focus + delta;
    if (next < 0 || next >= visible.length) return;
    if (moving) {
      // Swap within the full list so hidden apps keep their place.
      var a = apps.indexOf(visible[focus]);
      var b = apps.indexOf(visible[next]);
      var tmp = apps[a]; apps[a] = apps[b]; apps[b] = tmp;
      focus = next;
      render();
      return;
    }
    focus = next;
    paintFocus();
  }

  function toggleMove() {
    moving = !moving;
    if (!moving) savePrefs();
    setMode();
    paintFocus();
  }

  function toggleHidden() {
    var app = visible[focus];
    if (!app) return;
    if (hidden[app.id]) delete hidden[app.id]; else hidden[app.id] = true;
    savePrefs();
    render();
  }

  function toggleShowHidden() {
    showHidden = !showHidden;
    setMode();
    render();
  }

  document.addEventListener("keydown", function (e) {
    switch (e.keyCode) {
      case KEY.LEFT:  step(-1); break;
      case KEY.RIGHT: step(1); break;
      case KEY.UP:    step(-COLS); break;
      case KEY.DOWN:  step(COLS); break;
      case KEY.OK:
        if (moving) toggleMove();
        else if (visible[focus]) launch(visible[focus].id);
        break;
      case KEY.RED:    toggleMove(); break;
      case KEY.YELLOW: if (!moving) toggleHidden(); break;
      case KEY.BLUE:   if (!moving) toggleShowHidden(); break;
      case KEY.BACK:
      case KEY.ESC:
        if (moving) toggleMove();
        else if (showHidden) toggleShowHidden();
        else window.close();
        break;
      default: return;
    }
    e.preventDefault();
  });

  // Magic Remote pointer: hover focuses, click launches.
  grid.addEventListener("mouseover", function (e) {
    var el = e.target.closest(".tile");
    if (!el || moving) return;
    focus = +el.dataset.index;
    paintFocus();
  });
  grid.addEventListener("click", function (e) {
    var el = e.target.closest(".tile");
    if (el && !moving) launch(visible[+el.dataset.index].id);
  });

  // ---- Clock ----------------------------------------------------------------

  var clockEl = document.getElementById("clock");
  var dateEl = document.getElementById("date");
  function tick() {
    var d = new Date();
    clockEl.textContent = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    dateEl.textContent = d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
    setTimeout(tick, (60 - d.getSeconds()) * 1000);
  }

  // ---- Boot -----------------------------------------------------------------

  tick();
  var prefs = loadPrefs();
  // Draw the fallback list immediately, then swap in installed apps if available.
  apps = applyPrefs(DEFAULT_APPS, prefs);
  render();
  loadInstalled().then(function (list) {
    if (!list) return;
    apps = applyPrefs(list, prefs);
    render();
  });
})();
