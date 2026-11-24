# Japan Travel

<img src="app/logo.png" alt="Japan Travel logo: a torii gate in front of Mount Fuji with a network of connected dots" width="120" align="right">

**"Nihon no ryokou wa kono hitotsu no apuri de"** (travel in Japan with this one app)

One mobile web app for travelling in Japan, in **English, Nepali, Japanese and simple hiragana-only Japanese**.
A hackathon prototype, built solo.

## Why

Travelling or living in Japan without reading Japanese well means many small problems: who to call when something
goes wrong, how to ask for help, what a menu says, where the nearest hospital or locker is, how much a train or taxi
costs. This app puts those answers in one installable page, in the language the person uses, and always shows what is
real data and what is only an estimate (see the table below).

> Not a real product: the AI guide, menu translation, wait times and trip planner are rule-based demos.

## Run
```
cd app
copy config.example.js config.js   # then add your Google Maps API key (optional)
python -m http.server 8765
```
Open http://127.0.0.1:8765

Without a key the map shows sample locations. `wireframe.html` holds the screen wireframes.

## Features
- 4 languages: English, Nepali, Japanese, hiragana-only Japanese
- "I need help" wizard (lost / sick / stolen / accident / cannot communicate)
- Live location ("Near you"): police, hospital, shops, toilets, ATM via Google Places (New); trash bins via OpenStreetMap + traveller pins
- Phrase book with "Show to staff", quick replies (yes / no / left / right) and speech output
- Listen: Japanese speech to text with a small meaning list (demo, Chrome/Edge)
- SOS numbers, menu photo demo, wait-time simulation, rule-based trip planner and fare estimate
- Installable PWA, phrases and SOS work offline

No real AI is used: chat, menu, wait times and plans are rule-based demos.
Google key needs "Maps JavaScript API" and "Places API (New)"; "Geocoding API" is optional (address text).

## What is real and what is an estimate
| Feature | Status |
|---|---|
| Nearby places (police, hospital, pharmacy, charging, rental, lockers, diet shops) | Real: Google Places (New) |
| Trash bins | Real: OpenStreetMap + traveller pins (stored on the device only) |
| Weather | Real: Open-Meteo |
| Exchange rates and money converter | Real: open.er-api.com (mid-market rate) |
| Walking time and road distance | Real: Google Routes API |
| Train fare and time | Estimate from distance (Google does not return Japan transit routes) |
| Taxi fare | Estimate from real road distance |
| Menu photo | On-device OCR (Tesseract.js), small word list, can misread |
| Listen | Browser speech recognition, small meaning list |
| Wait times | Estimate from Japan time, official holiday list, season and weather. Not a live queue count |
| AI Guide, trip plan | Rule based demo |

Every screen shows a label for this and a reminder to confirm important things with staff or official sources.

## Privacy and limits

- There is no server of its own. Settings, pins and bookings stay in the browser of the device.
- Looking for places near you sends your location to the services listed in the table above (Google Places only if
  you add a key, OpenStreetMap Overpass for trash bins, Open-Meteo for weather).
- Menu photos are read on the device (Tesseract.js) and are not uploaded.
- It is not an official source. For an emergency in Japan call 110 (police) or 119 (fire and ambulance), and confirm
  important things with staff or official sources.
- `app/config.js` (your Google key) is ignored by Git and must never be committed.
