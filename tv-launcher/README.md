# Mini Launcher for LG webOS

A fast, ad-free, minimal app launcher for LG webOS TVs (built and sized for the
UT8000AUA, webOS 10 / 1920×1080). It's plain HTML/CSS/JS with no frameworks, and
it only animates `transform`/`opacity`, so it stays smooth on TV hardware.

## Controls

| Remote button | Action |
|---|---|
| Left / Right, or Magic Remote pointer | Move along the app row |
| OK | Open app |
| 1–9 | Open the 1st–9th app in the row directly |
| 🔴 Red | Start moving the focused tile; arrows place it, OK drops it |
| 🟢 Green | Settings |
| 🟡 Yellow | Hide or unhide the focused app |
| 🔵 Blue | Show hidden apps (so you can unhide them) |
| Back | Cancel the current mode, or exit |

Order and hidden apps are saved on the TV, and the launcher reopens on the app
you used last. The button hints fade after a few seconds and come back when you
press a colour button.

## Settings (Green button)

Change these on the TV, no file editing needed:

- **Weather location**: `City, ST` (e.g. `Eudora, KS`), or blank for automatic.
- **Temperature**: automatic, °F or °C.
- **Clock**: automatic, 12-hour or 24-hour.
- **Change photo**: every 1, 3, 5, 10 or 30 minutes.
- **Photo sources**: Bing image of the day, Wikimedia Picture of the Day, and
  nature photos, each on or off. All off gives a plain dark background.
- **Ambient mode after**: off, or 1–10 idle minutes (see below).
- **Dim photos at night**: darkens the photo from 9 PM to 6 AM.
- **Reset app order and hidden apps.**

## Ambient mode

After a few idle minutes (2 by default) the apps and weather fade out, leaving
just the photo and clock, like Apple TV. Any button brings them back without
doing anything else, so you can't open an app by accident.

## No internet

A red "No internet connection" notice appears at the top while the TV is
offline, and goes away when it reconnects.

## Wallpaper

The background crossfades to a new photo every 3 minutes. Photos come from three
free sources that need no account or API key:

- **Bing image of the day**: the last 8 days. Today's image is shown first.
- **Wikimedia Commons Picture of the Day**: recent picks.
- **Wikimedia Commons featured nature photos**: landscapes, mountains,
  forests, waterfalls, beaches and lakes.

The photo's title and credit show bottom-right. If one source fails, the others
still work, and with no internet the plain dark background is used. Switch
sources on or off and change the timing in Settings.

## Weather

Current temperature, conditions, today's high/low and a 4-day forecast come from
[Open-Meteo](https://open-meteo.com) (free, no key). Set the location and units
in Settings. Blank location means it's guessed from your internet connection.

## Sleep and screen saver

The launcher never asks the TV to stay awake, so the TV's own screen saver,
sleep timer and auto power-off work exactly as before. While the launcher is in
the background or the TV is asleep, photo rotation and weather updates pause.
They catch up when you come back. Ambient mode is the launcher's own feature
and doesn't replace or delay the TV's screen saver.

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
