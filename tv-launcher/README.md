# Mini Launcher for LG webOS

A fast, ad-free, minimal app launcher for LG webOS TVs (built and sized for the
UT8000AUA, webOS 10 / 1920×1080). It's plain HTML/CSS/JS with no frameworks, and
it only animates `transform`/`opacity`, so it stays smooth on TV hardware.

## Controls

| Remote button | Action |
|---|---|
| Arrows / Magic Remote pointer | Move focus |
| OK | Open app |
| 🔴 Red | Start moving the focused tile; arrows place it, OK drops it |
| 🟡 Yellow | Hide or unhide the focused app |
| 🔵 Blue | Show hidden apps (so you can unhide them) |
| Back | Cancel the current mode, or exit |

Order and hidden apps are saved on the TV.

## Wallpaper

The background rotates through nature photos from
[Wikimedia Commons' featured pictures](https://commons.wikimedia.org/wiki/Commons:Featured_pictures)
(landscapes, mountains, forests, waterfalls, beaches and lakes). It needs no
account or API key, and the photographer and license are shown bottom-right.

- A new photo fades in every 3 minutes; the photo list refreshes daily and is
  cached, so the launcher starts instantly.
- Change `categories`, `rotateMinutes` or `refreshListHours` at the top of
  [`wallpaper.js`](wallpaper.js). Any Commons category name works.
- With no internet, the plain dark background is used.

## App list

If the TV lets the app read its installed apps (`listLaunchPoints`), they show
up automatically with their real icons. If not, the launcher uses the list in
[`apps.js`](apps.js). Edit that file to add, remove or recolour apps. To find
an app's id, run `ares-install -d tv --list`.

## Install on the TV (Developer Mode, no root)

1. On a computer, install the webOS CLI: `npm install -g @webos-tools/cli`.
2. Create a free account at <https://webostv.developer.lge.com>.
3. On the TV, install **Developer Mode** from the LG Content Store, sign in,
   turn on **Dev Mode Status** (the TV restarts), then turn on **Key Server**.
4. Register the TV. Its IP is in *Settings → Network*; for this TV it was `192.168.68.55`:
   ```sh
   ares-setup-device -a tv -i "host=192.168.68.55" -i "port=9922" -i "username=prisoner"
   ares-novacom -d tv --getkey   # passphrase is shown in the Developer Mode app
   ```
5. Package, install, and launch:
   ```sh
   ares-package .
   ares-install -d tv com.motolai.minilauncher_1.0.0_all.ipk
   ares-launch -d tv com.motolai.minilauncher
   ```

Developer Mode sessions expire after about 50 hours. Open the Developer Mode
app and press **Extend** before then, or the TV removes sideloaded apps.

## Making it one button away

webOS doesn't let a third-party app replace the stock Home screen unless the TV
is rooted. The closest you can get without root:

- **Quick Access:** open Mini Launcher, then press and hold a number key
  (for example `1`) on the remote to bind it. After that, holding `1` opens it
  from anywhere.
- Move it to the front of the stock Home app list.

## Removing ads from the stock UI

These settings help no matter which launcher you use (names vary a little by
firmware):

- *Settings → General → Home Settings*: turn off **Home Promotion** and
  **Content Recommendation**.
- *Settings → Support → Additional Settings*: turn off **Live Plus**.
- *Settings → General → System → Additional Settings → Home Settings*: turn off
  **Auto Launch** (stops the stock Home from popping up at power-on).
- *Settings → Support → Privacy & Terms → User Agreements*: decline the
  **Viewing Information**, **Voice Information** and **Interest-Based
  Advertising** agreements.
- For full blocking, a network-level DNS blocker (Pi-hole, AdGuard Home or
  NextDNS) with an LG/webOS ad blocklist also works.
