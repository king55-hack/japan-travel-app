# Japan Travel (hackathon prototype)

"Nihon no ryokou wa kono hitotsu no apuri de" - one mobile web app for travelling in Japan.
Languages: English, Nepali, Japanese, simple hiragana-only Japanese.

Not a real product: the AI guide, menu translation, wait times and trip planner are rule-based demos.

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
