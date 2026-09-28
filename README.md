# Skycast — Weather Forecast App

A responsive weather app built with plain HTML, CSS and JavaScript. Search any city worldwide or use your current location to see live conditions and a 6-day forecast.

## Features

- Search weather by city name (geocoded via Open-Meteo)
- "Use my location" button with browser geolocation + reverse geocoding
- Current conditions: temperature, feels-like, humidity, wind speed, pressure, rain chance
- 6-day forecast with daily highs/lows and weather icons
- °C / °F unit toggle (persisted with localStorage)
- Recent searches saved locally for quick access
- Background gradient and icon change dynamically based on live weather condition (clear, cloudy, rain, snow, storm, night)
- Fully responsive, no build tooling — plain static site

## Tech Stack

- HTML5, CSS3, JavaScript (ES6+)
- [Open-Meteo](https://open-meteo.com/) — free weather + geocoding API, no API key required

## Getting Started

Just open `index.html` in a browser, or serve the folder with any static file server:

```bash
npx serve .
```

## Why Open-Meteo

No API key management or secrets needed on the client, which keeps this a genuinely backend-free static app while still using live, real-world weather data.
