// Current weather from Open-Meteo: free, no API key, allows cross-origin
// requests. Location comes from CONFIG.city, or is guessed from the TV's
// internet connection when that is empty.
(function () {
  "use strict";

  var CONFIG = {
    city: "",          // e.g. "Chicago" or "Toronto, CA"; empty = automatic
    units: "",         // "fahrenheit", "celsius", or empty = from TV language
    refreshMinutes: 15
  };

  var STORE = "minilauncher.weather.v1";
  var box = document.getElementById("weather");
  var iconEl = document.getElementById("w-icon");
  var tempEl = document.getElementById("w-temp");
  var descEl = document.getElementById("w-desc");
  var rangeEl = document.getElementById("w-range");

  var units = CONFIG.units ||
    (/^en-(US|LR|MM)$/i.test(navigator.language || "") ? "fahrenheit" : "celsius");

  // 24x24 line icons, drawn in currentColor.
  var SUN = '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/>';
  var MOON = '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>';
  var CLOUD = '<path d="M7 18.5h10a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 7.1 9.6 4.5 4.5 0 0 0 7 18.5z"/>';
  var ICONS = {
    sun: SUN,
    moon: MOON,
    partSun: '<g transform="translate(-3 -4) scale(.7)">' + SUN + '</g>' + CLOUD,
    partMoon: '<g transform="translate(-2 -4) scale(.7)">' + MOON + '</g>' + CLOUD,
    cloud: CLOUD,
    fog: '<path d="M4 9h16M3 13h18M5 17h14"/>',
    rain: '<g transform="translate(0 -3)">' + CLOUD + '</g><path d="M9 18.5l-1 2.5M13 18.5l-1 2.5M17 18.5l-1 2.5"/>',
    snow: '<g transform="translate(0 -3)">' + CLOUD + '</g><path d="M9 19.5h.01M13 21h.01M17 19.5h.01" stroke-width="2.6"/>',
    storm: '<g transform="translate(0 -3)">' + CLOUD + '</g><path d="M13 15l-2.5 3.5h3L11 22"/>'
  };

  // WMO weather codes used by Open-Meteo.
  function describe(code, isDay) {
    var clear = isDay ? "sun" : "moon";
    var part = isDay ? "partSun" : "partMoon";
    if (code === 0) return ["Clear", clear];
    if (code === 1) return ["Mostly clear", clear];
    if (code === 2) return ["Partly cloudy", part];
    if (code === 3) return ["Cloudy", "cloud"];
    if (code === 45 || code === 48) return ["Fog", "fog"];
    if (code >= 51 && code <= 57) return ["Drizzle", "rain"];
    if (code === 61 || code === 80) return ["Light rain", "rain"];
    if (code === 63 || code === 81) return ["Rain", "rain"];
    if (code === 65 || code === 82) return ["Heavy rain", "rain"];
    if (code === 66 || code === 67) return ["Freezing rain", "rain"];
    if (code >= 71 && code <= 77) return ["Snow", "snow"];
    if (code === 85 || code === 86) return ["Snow showers", "snow"];
    if (code >= 95) return ["Thunderstorms", "storm"];
    return ["", "cloud"];
  }

  function getJSON(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    });
  }

  function loadCache() {
    try { return JSON.parse(localStorage.getItem(STORE)) || {}; }
    catch (e) { return {}; }
  }
  var cache = loadCache();
  function saveCache() {
    try { localStorage.setItem(STORE, JSON.stringify(cache)); } catch (e) { /* ignore */ }
  }

  function locate() {
    var key = CONFIG.city || "auto";
    if (cache.place && cache.place.key === key &&
        Date.now() - cache.place.at < 7 * 864e5) {
      return Promise.resolve(cache.place);
    }
    var found;
    if (CONFIG.city) {
      found = getJSON("https://geocoding-api.open-meteo.com/v1/search?count=1&name=" +
                      encodeURIComponent(CONFIG.city.split(",")[0]))
        .then(function (d) {
          var r = d.results[0];
          return { lat: r.latitude, lon: r.longitude, name: r.name };
        });
    } else {
      found = getJSON("https://ipapi.co/json/")
        .then(function (d) { return { lat: d.latitude, lon: d.longitude, name: d.city }; })
        .catch(function () {
          return getJSON("https://get.geojs.io/v1/ip/geo.json").then(function (d) {
            return { lat: +d.latitude, lon: +d.longitude, name: d.city };
          });
        });
    }
    return found.then(function (p) {
      if (typeof p.lat !== "number" || isNaN(p.lat)) throw new Error("no location");
      p.key = key;
      p.at = Date.now();
      cache.place = p;
      saveCache();
      return p;
    });
  }

  function paint(w) {
    var d = describe(w.code, w.isDay);
    iconEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' + ICONS[d[1]] + "</svg>";
    tempEl.textContent = Math.round(w.temp) + "°";
    descEl.textContent = d[0];
    rangeEl.textContent = "H " + Math.round(w.hi) + "°  L " + Math.round(w.lo) + "°" +
      (w.place ? "  ·  " + w.place : "");
    box.hidden = false;
  }

  function refresh() {
    return locate().then(function (p) {
      return getJSON("https://api.open-meteo.com/v1/forecast?latitude=" + p.lat +
        "&longitude=" + p.lon +
        "&current=temperature_2m,weather_code,is_day" +
        "&daily=temperature_2m_max,temperature_2m_min&forecast_days=1" +
        "&timezone=auto&temperature_unit=" + units)
        .then(function (d) {
          cache.weather = {
            at: Date.now(), units: units, place: p.name,
            temp: d.current.temperature_2m, code: d.current.weather_code,
            isDay: d.current.is_day === 1,
            hi: d.daily.temperature_2m_max[0], lo: d.daily.temperature_2m_min[0]
          };
          saveCache();
          paint(cache.weather);
        });
    }).catch(function (err) { console.warn("weather unavailable", err); });
  }

  function stale() {
    var w = cache.weather;
    return !w || w.units !== units || Date.now() - w.at > CONFIG.refreshMinutes * 60e3;
  }

  // Show the last reading instantly (if under 3 hours old), then update.
  if (cache.weather && cache.weather.units === units &&
      Date.now() - cache.weather.at < 3 * 3600e3) {
    paint(cache.weather);
  }
  if (stale()) refresh();

  // Only poll while the launcher is on screen; catch up when it returns.
  setInterval(function () { if (!document.hidden && stale()) refresh(); }, 60e3);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && stale()) refresh();
  });
})();
