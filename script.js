const searchForm = document.getElementById('searchForm');
const cityInput = document.getElementById('cityInput');
const geoBtn = document.getElementById('geoBtn');
const unitToggle = document.getElementById('unitToggle');
const recentChips = document.getElementById('recentChips');
const statusEl = document.getElementById('status');
const content = document.getElementById('content');
const emptyState = document.getElementById('emptyState');

const cityNameEl = document.getElementById('cityName');
const dateTimeEl = document.getElementById('dateTime');
const weatherIconEl = document.getElementById('weatherIcon');
const tempEl = document.getElementById('temp');
const descriptionEl = document.getElementById('description');
const feelsLikeEl = document.getElementById('feelsLike');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind');
const pressureEl = document.getElementById('pressure');
const rainChanceEl = document.getElementById('rainChance');
const forecastListEl = document.getElementById('forecastList');

let unit = localStorage.getItem('skycast-unit') || 'C';
let lastData = null;

const WEATHER_CODES = {
    0: { text: 'Clear sky', icon: '☀️', mood: 'clear' },
    1: { text: 'Mainly clear', icon: '🌤️', mood: 'clear' },
    2: { text: 'Partly cloudy', icon: '⛅', mood: 'cloudy' },
    3: { text: 'Overcast', icon: '☁️', mood: 'cloudy' },
    45: { text: 'Fog', icon: '🌫️', mood: 'cloudy' },
    48: { text: 'Depositing rime fog', icon: '🌫️', mood: 'cloudy' },
    51: { text: 'Light drizzle', icon: '🌦️', mood: 'rain' },
    53: { text: 'Moderate drizzle', icon: '🌦️', mood: 'rain' },
    55: { text: 'Dense drizzle', icon: '🌧️', mood: 'rain' },
    56: { text: 'Freezing drizzle', icon: '🌧️', mood: 'rain' },
    57: { text: 'Freezing drizzle', icon: '🌧️', mood: 'rain' },
    61: { text: 'Slight rain', icon: '🌦️', mood: 'rain' },
    63: { text: 'Moderate rain', icon: '🌧️', mood: 'rain' },
    65: { text: 'Heavy rain', icon: '🌧️', mood: 'rain' },
    66: { text: 'Freezing rain', icon: '🌧️', mood: 'rain' },
    67: { text: 'Freezing rain', icon: '🌧️', mood: 'rain' },
    71: { text: 'Slight snow fall', icon: '🌨️', mood: 'snow' },
    73: { text: 'Moderate snow fall', icon: '❄️', mood: 'snow' },
    75: { text: 'Heavy snow fall', icon: '❄️', mood: 'snow' },
    77: { text: 'Snow grains', icon: '❄️', mood: 'snow' },
    80: { text: 'Slight rain showers', icon: '🌦️', mood: 'rain' },
    81: { text: 'Moderate rain showers', icon: '🌧️', mood: 'rain' },
    82: { text: 'Violent rain showers', icon: '⛈️', mood: 'storm' },
    85: { text: 'Slight snow showers', icon: '🌨️', mood: 'snow' },
    86: { text: 'Heavy snow showers', icon: '❄️', mood: 'snow' },
    95: { text: 'Thunderstorm', icon: '⛈️', mood: 'storm' },
    96: { text: 'Thunderstorm with hail', icon: '⛈️', mood: 'storm' },
    99: { text: 'Thunderstorm with heavy hail', icon: '⛈️', mood: 'storm' },
};

function codeInfo(code) {
    return WEATHER_CODES[code] || { text: 'Unknown', icon: '🌡️', mood: 'clear' };
}

function toFahrenheit(c) {
    return (c * 9) / 5 + 32;
}

function formatTemp(celsius) {
    const value = unit === 'C' ? celsius : toFahrenheit(celsius);
    return `${Math.round(value)}°${unit}`;
}

function setStatus(message, isError = false) {
    if (!message) {
        statusEl.hidden = true;
        return;
    }
    statusEl.hidden = false;
    statusEl.textContent = message;
    statusEl.classList.toggle('error', isError);
}

function getRecentSearches() {
    return JSON.parse(localStorage.getItem('skycast-recent') || '[]');
}

function saveRecentSearch(place) {
    let recents = getRecentSearches().filter((p) => p.name !== place.name || p.country !== place.country);
    recents.unshift(place);
    recents = recents.slice(0, 5);
    localStorage.setItem('skycast-recent', JSON.stringify(recents));
    renderChips();
}

function renderChips() {
    const recents = getRecentSearches();
    recentChips.innerHTML = '';
    recents.forEach((place) => {
        const chip = document.createElement('button');
        chip.className = 'chip';
        chip.type = 'button';
        chip.textContent = `${place.name}, ${place.country}`;
        chip.addEventListener('click', () => loadWeather(place));
        recentChips.appendChild(chip);
    });
}

async function geocodeCity(name) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Geocoding request failed');
    const data = await res.json();
    if (!data.results || data.results.length === 0) {
        throw new Error(`No city found matching "${name}"`);
    }
    const r = data.results[0];
    return {
        name: r.name,
        country: r.country_code || r.country || '',
        latitude: r.latitude,
        longitude: r.longitude,
    };
}

async function fetchForecast(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure,is_day` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
        `&timezone=auto&forecast_days=6`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Weather request failed');
    return res.json();
}

function applyMoodBackground(mood, isDay) {
    document.body.className = isDay ? mood : (mood === 'clear' ? 'night' : mood);
}

function renderCurrent(place, data) {
    const current = data.current;
    const info = codeInfo(current.weather_code);
    const isDay = current.is_day === 1;

    cityNameEl.textContent = `${place.name}, ${place.country}`;
    dateTimeEl.textContent = new Date(current.time).toLocaleString(undefined, {
        weekday: 'long', hour: '2-digit', minute: '2-digit',
    });
    weatherIconEl.textContent = isDay ? info.icon : (info.mood === 'clear' ? '🌙' : info.icon);
    tempEl.textContent = formatTemp(current.temperature_2m);
    descriptionEl.textContent = info.text;
    feelsLikeEl.textContent = formatTemp(current.apparent_temperature);
    humidityEl.textContent = `${current.relative_humidity_2m}%`;
    windEl.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
    pressureEl.textContent = `${Math.round(current.surface_pressure)} hPa`;
    rainChanceEl.textContent = `${data.daily.precipitation_probability_max?.[0] ?? 0}%`;

    applyMoodBackground(info.mood, isDay);
}

function renderForecast(data) {
    forecastListEl.innerHTML = '';
    const days = data.daily.time;
    days.forEach((dateStr, i) => {
        const info = codeInfo(data.daily.weather_code[i]);
        const dayName = i === 0 ? 'Today' : new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short' });

        const card = document.createElement('div');
        card.className = 'forecast-day';
        card.innerHTML = `
            <span class="day-name">${dayName}</span>
            <span class="day-icon">${info.icon}</span>
            <div class="day-temps">
                <span class="max">${formatTemp(data.daily.temperature_2m_max[i])}</span>
                <span class="min"> / ${formatTemp(data.daily.temperature_2m_min[i])}</span>
            </div>
        `;
        forecastListEl.appendChild(card);
    });
}

function renderAll() {
    if (!lastData) return;
    renderCurrent(lastData.place, lastData.data);
    renderForecast(lastData.data);
}

async function loadWeather(place) {
    setStatus('Loading weather…');
    content.hidden = true;
    emptyState.hidden = true;

    try {
        const data = await fetchForecast(place.latitude, place.longitude);
        lastData = { place, data };
        renderAll();
        setStatus(null);
        content.hidden = false;
        saveRecentSearch(place);
    } catch (err) {
        setStatus(err.message || 'Something went wrong. Please try again.', true);
        emptyState.hidden = false;
    }
}

async function handleSearch(cityName) {
    setStatus('Searching…');
    try {
        const place = await geocodeCity(cityName);
        await loadWeather(place);
    } catch (err) {
        setStatus(err.message || 'City not found. Try another name.', true);
        content.hidden = true;
        emptyState.hidden = false;
    }
}

searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = cityInput.value.trim();
    if (!value) return;
    handleSearch(value);
    cityInput.value = '';
});

geoBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
        setStatus('Geolocation is not supported by your browser.', true);
        return;
    }
    setStatus('Fetching your location…');
    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            const { latitude, longitude } = pos.coords;
            try {
                const url = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=en&format=json`;
                const res = await fetch(url);
                const data = await res.json();
                const r = data.results?.[0];
                const place = r
                    ? { name: r.name, country: r.country_code || r.country || '', latitude, longitude }
                    : { name: 'Your location', country: '', latitude, longitude };
                loadWeather(place);
            } catch {
                loadWeather({ name: 'Your location', country: '', latitude, longitude });
            }
        },
        () => setStatus('Could not access your location. Please allow permission or search manually.', true)
    );
});

unitToggle.addEventListener('click', () => {
    unit = unit === 'C' ? 'F' : 'C';
    unitToggle.textContent = `°${unit}`;
    localStorage.setItem('skycast-unit', unit);
    renderAll();
});

unitToggle.textContent = `°${unit}`;
renderChips();

const recents = getRecentSearches();
if (recents.length > 0) {
    loadWeather(recents[0]);
} else {
    emptyState.hidden = false;
}
