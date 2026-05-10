const form = document.querySelector("#weather-form");
const input = document.querySelector("#location-input");
const statusBox = document.querySelector("#status");
const result = document.querySelector("#weather-result");
const quickLinks = document.querySelectorAll("[data-location]");

const fields = {
  place: document.querySelector("#place"),
  updated: document.querySelector("#updated"),
  icon: document.querySelector("#weather-icon"),
  temperature: document.querySelector("#temperature"),
  condition: document.querySelector("#condition"),
  wind: document.querySelector("#wind"),
  humidity: document.querySelector("#humidity"),
  feelsLike: document.querySelector("#feels-like"),
  coordinates: document.querySelector("#coordinates"),
};

const weatherCodes = {
  0: ["Clear sky", "☀️"],
  1: ["Mainly clear", "🌤️"],
  2: ["Partly cloudy", "⛅"],
  3: ["Overcast", "☁️"],
  45: ["Fog", "🌫️"],
  48: ["Depositing rime fog", "🌫️"],
  51: ["Light drizzle", "🌦️"],
  53: ["Moderate drizzle", "🌦️"],
  55: ["Dense drizzle", "🌧️"],
  61: ["Slight rain", "🌧️"],
  63: ["Moderate rain", "🌧️"],
  65: ["Heavy rain", "🌧️"],
  71: ["Slight snow", "🌨️"],
  73: ["Moderate snow", "🌨️"],
  75: ["Heavy snow", "❄️"],
  80: ["Rain showers", "🌦️"],
  81: ["Moderate showers", "🌧️"],
  82: ["Violent showers", "⛈️"],
  95: ["Thunderstorm", "⛈️"],
  96: ["Thunderstorm with hail", "⛈️"],
  99: ["Severe thunderstorm with hail", "⛈️"],
};

const showStatus = (message) => {
  statusBox.textContent = message;
  statusBox.classList.remove("hidden");
  result.classList.add("hidden");
};

const formatPlace = (location) => {
  return [location.name, location.admin1, location.country].filter(Boolean).join(", ");
};

const fetchLocation = async (query) => {
  const params = new URLSearchParams({ name: query, count: "1", language: "en", format: "json" });
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`);

  if (!response.ok) {
    throw new Error("Unable to search for that location right now.");
  }

  const data = await response.json();

  if (!data.results?.length) {
    throw new Error("No matching place found. Try another city, region, or landmark.");
  }

  return data.results[0];
};

const fetchWeather = async ({ latitude, longitude }) => {
  const params = new URLSearchParams({
    latitude,
    longitude,
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
    timezone: "auto",
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);

  if (!response.ok) {
    throw new Error("Unable to load realtime weather for that location.");
  }

  return response.json();
};

const renderWeather = (location, weather) => {
  const current = weather.current;
  const [condition, icon] = weatherCodes[current.weather_code] ?? ["Current conditions", "🌡️"];
  const observationTime = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(current.time));

  fields.place.textContent = formatPlace(location);
  fields.updated.textContent = `Observed ${observationTime}`;
  fields.icon.textContent = icon;
  fields.temperature.textContent = Math.round(current.temperature_2m);
  fields.condition.textContent = condition;
  fields.wind.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  fields.humidity.textContent = `${current.relative_humidity_2m}%`;
  fields.feelsLike.textContent = `${Math.round(current.apparent_temperature)}°C`;
  fields.coordinates.textContent = `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`;

  statusBox.classList.add("hidden");
  result.classList.remove("hidden");
};

const searchWeather = async (query) => {
  const cleanedQuery = query.trim();

  if (!cleanedQuery) {
    showStatus("Enter a location to see realtime conditions.");
    return;
  }

  showStatus(`Loading realtime weather for ${cleanedQuery}...`);

  try {
    const location = await fetchLocation(cleanedQuery);
    const weather = await fetchWeather(location);
    renderWeather(location, weather);
  } catch (error) {
    showStatus(error.message);
  }
};

form.addEventListener("submit", (event) => {
  event.preventDefault();
  searchWeather(input.value);
});

quickLinks.forEach((button) => {
  button.addEventListener("click", () => {
    input.value = button.dataset.location;
    searchWeather(button.dataset.location);
  });
});

searchWeather("San Francisco");
