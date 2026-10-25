// Rotating wallpaper from three free, key-less sources:
//  - Bing's image of the day (the last 8 days)
//  - Wikimedia Commons' Picture of the Day (recent days)
//  - Wikimedia Commons' featured nature photos
// Sources and timing are chosen in Settings (Green button). Any source that
// fails is skipped. With no network the launcher keeps its
// plain gradient.
(function () {
  "use strict";

  var CONFIG = {
    // "Nature photos": any Commons category works; three random ones are
    // used per refresh.
    categories: [
      "Featured pictures of landscapes",
      "Featured pictures of mountains",
      "Featured pictures of forests",
      "Featured pictures of waterfalls",
      "Featured pictures of beaches",
      "Featured pictures of lakes"
    ],
    refreshListHours: 6   // picks up each new image of the day
  };

  var API = "https://commons.wikimedia.org/w/api.php";
  var STORE = "minilauncher.wallpapers.v1";

  var layers = [document.getElementById("wp-a"), document.getElementById("wp-b")];
  var credit = document.getElementById("credit");
  var front = 0;
  var list = [];
  var index = 0;
  var failures = 0;

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

  // Bing's JSON feed; newest first, so today's image leads the rotation.
  function fetchBing() {
    return fetch("https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=8&mkt=" +
                 encodeURIComponent(navigator.language || "en-US"))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        return (data.images || []).map(function (img) {
          return { url: "https://www.bing.com" + img.url, title: img.title || "",
                   artist: img.copyright || "", license: "", daily: true };
        });
      });
  }

  // Commons files the community picked as Picture of the Day this year.
  function fetchPictureOfTheDay() {
    var year = new Date().getFullYear();
    return fetchCategory("Pictures of the day (" + year + ")").then(function (items) {
      items.forEach(function (it) { it.daily = true; });
      return items;
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

  var generation = 0;
  function refreshList() {
    var mine = ++generation;
    var cats = Settings.get("nature") ? CONFIG.categories : [];
    var jobs = shuffle(cats.slice()).slice(0, 3).map(function (c) {
      return function () { return fetchCategory(c); };
    });
    if (Settings.get("potd")) jobs.unshift(fetchPictureOfTheDay);
    if (Settings.get("bing")) jobs.unshift(fetchBing);
    return Promise.all(jobs.map(function (job) {
      return job().catch(function () { return []; });
    })).then(function (groups) {
      if (mine !== generation) return;   // a newer refresh superseded this one
      var seen = {};
      var items = [].concat.apply([], groups).filter(function (it) {
        return seen[it.url] ? false : (seen[it.url] = true);
      });
      if (!items.length) {
        // Every source off (or unreachable): back to the plain background.
        if (!jobs.length) {
          list = [];
          saveCache(list);
          layers.forEach(function (l) { l.classList.remove("on"); });
          credit.textContent = "";
          document.body.classList.remove("has-wallpaper");
        }
        return;
      }
      // Newest image of the day first, everything else mixed after it.
      var lead = items[0].daily ? [items.shift()] : [];
      list = lead.concat(shuffle(items));
      index = 0;
      saveCache(list);
    });
  }

  // Preload fully before swapping, so the crossfade never shows a half image.
  function show(item) {
    var img = new Image();
    img.onload = function () {
      failures = 0;
      var back = layers[1 - front];
      back.style.backgroundImage = "url(\"" + item.url.replace(/"/g, "%22") + "\")";
      back.classList.add("on");
      layers[front].classList.remove("on");
      front = 1 - front;
      credit.textContent = [item.title, item.artist, item.license]
        .filter(Boolean).join(" · ");
      document.body.classList.add("has-wallpaper");
    };
    // Skip broken images, but stop retrying if every one fails (offline).
    img.onerror = function () { if (++failures < list.length) next(); };
    img.src = item.url;
  }

  function next() {
    if (!list.length || document.hidden) return;
    show(list[index]);
    index = (index + 1) % list.length;
  }

  // Start instantly from the saved list; fetch a new one in the background.
  var cache = loadCache();
  var listAt = cache ? cache.at : 0;
  if (cache && cache.items && cache.items.length) {
    var saved = cache.items.slice();
    list = saved[0].daily ? [saved.shift()].concat(shuffle(saved)) : shuffle(saved);
    next();
  }
  function refreshIfStale() {
    if (Date.now() - listAt < CONFIG.refreshListHours * 3600e3) return;
    listAt = Date.now();
    var hadList = list.length > 0;
    refreshList().then(function () { if (!hadList) next(); });
  }
  refreshIfStale();

  // Rotation pauses while the launcher is hidden or the TV is asleep, so it
  // uses no network then; it resumes on the next interval.
  var rotateTimer;
  function startRotation() {
    clearInterval(rotateTimer);
    rotateTimer = setInterval(next, Settings.get("photoMinutes") * 60e3);
  }
  startRotation();
  setInterval(function () { if (!document.hidden) refreshIfStale(); }, 10 * 60e3);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) refreshIfStale();
  });

  Settings.on(function (key) {
    if (key === "photoMinutes") startRotation();
    if (key === "bing" || key === "potd" || key === "nature") {
      // Rebuild the list from the chosen sources and show one right away.
      listAt = Date.now();
      refreshList().then(next);
    }
  });
})();
