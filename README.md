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
