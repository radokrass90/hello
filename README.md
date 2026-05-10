# PlanetCast Weather

PlanetCast is a small static weather homepage that lets users search for current weather conditions around the world. It uses the Open-Meteo geocoding and forecast APIs directly from the browser, so no API key or backend server is required.

## Features

- Realtime global search for cities, landmarks, and regions.
- Current temperature, condition, wind, wind direction, humidity, feels-like temperature, pressure, cloud cover, precipitation, and coordinates.
- Five-day outlook with high/low temperature, rain probability, and UV index.
- Live camera launch cards for New York City, Los Angeles, and Chicago, the three largest U.S. cities by population.

## Run locally

```bash
python3 -m http.server 4173
```

Then open <http://127.0.0.1:4173/index.html> in a browser.
