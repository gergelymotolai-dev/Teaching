// Fallback app list, used when the TV doesn't let this app read the installed
// launch points. Edit freely: `id` is the webOS app id, `color` the tile colour.
// To find an app's id, run: ares-launch -d tv --running  (while it is open)
var DEFAULT_APPS = [
  { id: "netflix",                                     title: "Netflix",     color: "#b20710" },
  { id: "youtube.leanback.v4",                         title: "YouTube",     color: "#cc0000" },
  { id: "amazon",                                      title: "Prime Video", color: "#00a8e1" },
  { id: "com.disney.disneyplus-prod",                  title: "Disney+",     color: "#0b2a6f" },
  { id: "hulu",                                        title: "Hulu",        color: "#1a8f4f" },
  { id: "com.apple.appletv",                           title: "Apple TV",    color: "#2b2b2e" },
  { id: "com.movenetworks.app.sling-tv-sling-production", title: "Sling",    color: "#1167b1" },
  { id: "com.webos.app.livetv",                        title: "Live TV",     color: "#3a3f4b" },
  { id: "com.webos.app.hdmi1",                         title: "HDMI 1",      color: "#3a3f4b" },
  { id: "com.webos.app.hdmi2",                         title: "HDMI 2",      color: "#3a3f4b" },
  { id: "com.webos.app.browser",                       title: "Browser",     color: "#3a3f4b" },
  { id: "com.palm.app.settings",                       title: "Settings",    color: "#3a3f4b" }
];
