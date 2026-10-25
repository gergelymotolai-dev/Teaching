// Launcher settings: stored on the TV, edited from an on-screen panel (Green
// button). Other scripts read values with Settings.get() and react to changes
// with Settings.on().
var Settings = (function () {
  "use strict";

  var STORE = "minilauncher.settings.v1";
  var DEFAULTS = {
    city: "Eudora, KS",
    units: "auto",
    clock: "auto",
    photoMinutes: 3,
    bing: true,
    potd: true,
    nature: true,
    ambientMinutes: 2,
    nightDim: true
  };

  var ON_OFF = [[true, "On"], [false, "Off"]];
  var ROWS = [
    { key: "city", label: "Weather location", type: "text",
      hint: "City, ST — leave blank to detect automatically" },
    { key: "units", label: "Temperature",
      choices: [["auto", "Automatic"], ["fahrenheit", "°F"], ["celsius", "°C"]] },
    { key: "clock", label: "Clock",
      choices: [["auto", "Automatic"], ["12", "12-hour"], ["24", "24-hour"]] },
    { key: "photoMinutes", label: "Change photo",
      choices: [[1, "Every minute"], [3, "Every 3 min"], [5, "Every 5 min"],
                [10, "Every 10 min"], [30, "Every 30 min"]] },
    { key: "bing", label: "Bing image of the day", choices: ON_OFF },
    { key: "potd", label: "Wikimedia Picture of the Day", choices: ON_OFF },
    { key: "nature", label: "Nature photos", choices: ON_OFF },
    { key: "ambientMinutes", label: "Ambient mode after",
      choices: [[0, "Off"], [1, "1 min"], [2, "2 min"], [5, "5 min"], [10, "10 min"]] },
    { key: "nightDim", label: "Dim photos at night", choices: ON_OFF },
    { key: "reset", label: "Reset app order and hidden apps", type: "action" }
  ];

  var values = {};
  var listeners = [];
  try { values = JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { values = {}; }

  function get(key) { return key in values ? values[key] : DEFAULTS[key]; }

  function set(key, value) {
    values[key] = value;
    try { localStorage.setItem(STORE, JSON.stringify(values)); } catch (e) { /* ignore */ }
    listeners.forEach(function (fn) { fn(key, value); });
  }

  function on(fn) { listeners.push(fn); }

  // ---- Panel ----------------------------------------------------------------

  var panel = document.getElementById("settings");
  var listEl = document.getElementById("settings-list");
  var focus = 0;
  var rowEls = [];

  function valueLabel(row) {
    var v = get(row.key);
    for (var i = 0; i < row.choices.length; i++) {
      if (row.choices[i][0] === v) return row.choices[i][1];
    }
    return String(v);
  }

  function build() {
    listEl.textContent = "";
    rowEls = ROWS.map(function (row, i) {
      var el = document.createElement("div");
      el.className = "s-row";
      var label = document.createElement("div");
      label.className = "s-label";
      label.textContent = row.label;
      el.appendChild(label);
      if (row.type === "text") {
        var input = document.createElement("input");
        input.type = "text";
        input.value = get(row.key);
        input.placeholder = "Automatic";
        input.addEventListener("change", function () { set(row.key, input.value.trim()); });
        el.appendChild(input);
        if (row.hint) {
          var hint = document.createElement("div");
          hint.className = "s-hint";
          hint.textContent = row.hint;
          el.appendChild(hint);
        }
      } else if (row.type !== "action") {
        var val = document.createElement("div");
        val.className = "s-value";
        val.textContent = valueLabel(row);
        el.appendChild(val);
      }
      el.addEventListener("mouseover", function () { focus = i; paint(); });
      el.addEventListener("click", function () { activate(1); });
      listEl.appendChild(el);
      return el;
    });
    paint();
  }

  function paint() {
    rowEls.forEach(function (el, i) { el.classList.toggle("focus", i === focus); });
    rowEls[focus].scrollIntoView({ block: "nearest" });
  }

  function activate(dir) {
    var row = ROWS[focus];
    var el = rowEls[focus];
    if (row.type === "text") {
      el.querySelector("input").focus();   // brings up the TV keyboard
    } else if (row.type === "action") {
      set(row.key, Date.now());
      el.querySelector(".s-label").textContent = "Done — layout reset";
    } else {
      var idx = 0;
      for (var i = 0; i < row.choices.length; i++) {
        if (row.choices[i][0] === get(row.key)) idx = i;
      }
      idx = (idx + dir + row.choices.length) % row.choices.length;
      set(row.key, row.choices[idx][0]);
      el.querySelector(".s-value").textContent = valueLabel(row);
    }
  }

  function open() {
    focus = 0;
    build();
    panel.hidden = false;
  }

  function close() {
    var active = document.activeElement;
    if (active && active.tagName === "INPUT") active.blur();
    panel.hidden = true;
  }

  function isOpen() { return !panel.hidden; }

  // Called by main.js for every key while the panel is open.
  function handleKey(e) {
    var input = document.activeElement && document.activeElement.tagName === "INPUT"
      ? document.activeElement : null;
    if (input) {
      // Let the text field have its keys; OK or Back finishes editing.
      if (e.keyCode === 13 || e.keyCode === 461 || e.keyCode === 27) {
        input.blur();   // fires "change", which saves the value
        e.preventDefault();
      }
      return;
    }
    switch (e.keyCode) {
      case 38: focus = Math.max(0, focus - 1); paint(); break;
      case 40: focus = Math.min(ROWS.length - 1, focus + 1); paint(); break;
      case 37: if (!ROWS[focus].type) activate(-1); break;
      case 39: if (!ROWS[focus].type) activate(1); break;
      case 13: activate(1); break;
      case 404: case 461: case 27: close(); break;
      default: return;
    }
    e.preventDefault();
  }

  return { get: get, set: set, on: on, open: open, close: close,
           isOpen: isOpen, handleKey: handleKey };
})();
