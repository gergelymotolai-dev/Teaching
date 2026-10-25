(function () {
  "use strict";

  var KEY = { LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, OK: 13, BACK: 461,
              RED: 403, YELLOW: 405, BLUE: 406, ESC: 27 };
  var TILE_STEP = 340;  // --tile-w + --gap in style.css
  var EDGE = 120;       // --edge in style.css
  var STORE = "minilauncher.v1";

  var track = document.getElementById("track");
  var modeEl = document.getElementById("mode");
  var hintsEl = document.getElementById("hints");

  var apps = [];        // full ordered list of { id, title, color, icon }
  var visible = [];     // apps currently drawn
  var hidden = {};      // id -> true
  var focus = 0;
  var first = 0;        // index of the leftmost tile in view
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
                     color: lp.bgColor || "#2a2d35",
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
      var logo = document.createElement("div");
      logo.className = "logo";
      logo.textContent = app.title;
      el.appendChild(logo);
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
    track.textContent = "";
    track.appendChild(frag);
    focus = Math.max(0, Math.min(focus, visible.length - 1));
    paintFocus();
  }

  // Slide the row only when focus would leave the screen.
  function scrollRow() {
    var inView = Math.max(1, Math.floor((window.innerWidth - EDGE - 40) / TILE_STEP));
    if (focus < first) first = focus;
    else if (focus >= first + inView) first = focus - inView + 1;
    first = Math.max(0, Math.min(first, Math.max(0, visible.length - inView)));
    track.style.transform = "translateX(" + (-first * TILE_STEP) + "px)";
  }

  function paintFocus() {
    var prev = track.querySelector(".focus");
    if (prev) prev.classList.remove("focus", "moving");
    var el = track.children[focus];
    if (!el) return;
    el.classList.add("focus");
    if (moving) el.classList.add("moving");
    scrollRow();
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

  // Button hints show briefly at launch and whenever a colour key is used.
  var hintTimer;
  function flashHints() {
    hintsEl.classList.remove("faded");
    clearTimeout(hintTimer);
    hintTimer = setTimeout(function () { hintsEl.classList.add("faded"); }, 8000);
  }

  document.addEventListener("keydown", function (e) {
    switch (e.keyCode) {
      case KEY.LEFT:  step(-1); break;
      case KEY.RIGHT: step(1); break;
      case KEY.UP:
      case KEY.DOWN:  break;
      case KEY.OK:
        if (moving) toggleMove();
        else if (visible[focus]) launch(visible[focus].id);
        break;
      case KEY.RED:    toggleMove(); flashHints(); break;
      case KEY.YELLOW: if (!moving) toggleHidden(); flashHints(); break;
      case KEY.BLUE:   if (!moving) toggleShowHidden(); flashHints(); break;
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
  track.addEventListener("mouseover", function (e) {
    var el = e.target.closest(".tile");
    if (!el || moving) return;
    focus = +el.dataset.index;
    paintFocus();
  });
  track.addEventListener("click", function (e) {
    var el = e.target.closest(".tile");
    if (el && !moving) launch(visible[+el.dataset.index].id);
  });

  // ---- Clock ----------------------------------------------------------------

  var clockEl = document.getElementById("clock");
  var dateEl = document.getElementById("date");
  var clockTimer;
  function tick() {
    var d = new Date();
    clockEl.textContent = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
      .replace(/\s?[AP]M$/i, "");
    dateEl.textContent = d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
    clearTimeout(clockTimer);
    clockTimer = setTimeout(tick, (60 - d.getSeconds()) * 1000);
  }

  // Timers can drift while the TV sleeps or the app is in the background.
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) tick();
  });

  // ---- Boot -----------------------------------------------------------------

  tick();
  flashHints();
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
