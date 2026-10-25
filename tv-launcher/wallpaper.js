// Rotating nature wallpaper from Wikimedia Commons' featured pictures: free,
// no API key, and the API allows cross-origin requests (origin=*).
// Without a network connection the launcher keeps its plain gradient.
(function () {
  "use strict";

  var CONFIG = {
    // Any Commons category works; a random one is used for each refresh.
    categories: [
      "Featured pictures of landscapes",
      "Featured pictures of mountains",
      "Featured pictures of forests",
      "Featured pictures of waterfalls",
      "Featured pictures of beaches",
      "Featured pictures of lakes"
    ],
    rotateMinutes: 3,
    refreshListHours: 24
  };

  var API = "https://commons.wikimedia.org/w/api.php";
  var STORE = "minilauncher.wallpapers.v1";

  var layers = [document.getElementById("wp-a"), document.getElementById("wp-b")];
  var credit = document.getElementById("credit");
  var front = 0;
  var list = [];
  var index = 0;

  function stripTags(html) {
    var d = document.createElement("div");
    d.innerHTML = html || "";
    return (d.textContent || "").trim();
  }

  function fetchCategory(cat) {
    var q = {
      action: "query", format: "json", origin: "*",
      generator: "categorymembers", gcmtitle: "Category:" + cat,
      gcmtype: "file", gcmlimit: "50", gcmsort: "timestamp", gcmdir: "desc",
      prop: "imageinfo", iiprop: "url|size|extmetadata", iiurlwidth: "1920",
      iiextmetadatafilter: "Artist|LicenseShortName|ObjectName"
    };
    var qs = Object.keys(q).map(function (k) {
      return k + "=" + encodeURIComponent(q[k]);
    }).join("&");
    return fetch(API + "?" + qs)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var pages = (data.query && data.query.pages) || {};
        return Object.keys(pages).map(function (k) {
          var info = pages[k].imageinfo && pages[k].imageinfo[0];
          // Landscape-orientation photos only, so they fill the screen nicely.
          if (!info || !info.thumburl || info.width < info.height * 1.3) return null;
          var meta = info.extmetadata || {};
          return {
            url: info.thumburl,
            title: stripTags(meta.ObjectName && meta.ObjectName.value) ||
                   pages[k].title.replace(/^File:|\.\w+$/g, ""),
            artist: stripTags(meta.Artist && meta.Artist.value),
            license: meta.LicenseShortName ? meta.LicenseShortName.value : ""
          };
        }).filter(Boolean);
      });
  }

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function loadCache() {
    try { return JSON.parse(localStorage.getItem(STORE)) || null; }
    catch (e) { return null; }
  }

  function saveCache(items) {
    try { localStorage.setItem(STORE, JSON.stringify({ at: Date.now(), items: items })); }
    catch (e) { /* not persisted; refetched next launch */ }
  }

  function refreshList() {
    var cats = shuffle(CONFIG.categories.slice()).slice(0, 3);
    return Promise.all(cats.map(function (c) {
      return fetchCategory(c).catch(function () { return []; });
    })).then(function (groups) {
      var seen = {};
      var items = [].concat.apply([], groups).filter(function (it) {
        return seen[it.url] ? false : (seen[it.url] = true);
      });
      if (items.length) {
        list = shuffle(items);
        index = 0;
        saveCache(list);
      }
    });
  }

  // Preload fully before swapping, so the crossfade never shows a half image.
  function show(item) {
    var img = new Image();
    img.onload = function () {
      var back = layers[1 - front];
      back.style.backgroundImage = "url(\"" + item.url.replace(/"/g, "%22") + "\")";
      back.classList.add("on");
      layers[front].classList.remove("on");
      front = 1 - front;
      credit.textContent = [item.title, item.artist, item.license]
        .filter(Boolean).join(" · ");
      document.body.classList.add("has-wallpaper");
    };
    img.onerror = next;
    img.src = item.url;
  }

  function next() {
    if (!list.length) return;
    show(list[index]);
    index = (index + 1) % list.length;
  }

  // Start instantly from yesterday's list; fetch a new one in the background.
  var cache = loadCache();
  var cached = !!(cache && cache.items && cache.items.length);
  if (cached) {
    list = shuffle(cache.items);
    next();
  }
  if (!cached || Date.now() - cache.at > CONFIG.refreshListHours * 3600e3) {
    refreshList().then(function () { if (!cached) next(); });
  }

  setInterval(next, CONFIG.rotateMinutes * 60e3);
  setInterval(refreshList, CONFIG.refreshListHours * 3600e3);
})();
