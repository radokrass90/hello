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
  windDirection: document.querySelector("#wind-direction"),
  humidity: document.querySelector("#humidity"),
  feelsLike: document.querySelector("#feels-like"),
  pressure: document.querySelector("#pressure"),
  cloudCover: document.querySelector("#cloud-cover"),
  precipitation: document.querySelector("#precipitation"),
  coordinates: document.querySelector("#coordinates"),
  forecastList: document.querySelector("#forecast-list"),
};

const cameraSources = {
  "new-york": "https://www.skylinewebcams.com/webcam/united-states/new-york/new-york/new-york-city.html",
  "los-angeles": "https://www.hollywoodsign.org/webcam",
  chicago: "https://theskydeck.com/live-web-cam/",
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
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl,cloud_cover,precipitation,is_day",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,sunrise,sunset",
    forecast_days: "5",
    timezone: "auto",
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);

  if (!response.ok) {
    throw new Error("Unable to load realtime weather for that location.");
  }

  return response.json();
};

const formatDirection = (degrees) => {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(degrees / 45) % directions.length;
  return `${directions[index]} (${degrees}°)`;
};

const renderForecast = (daily) => {
  fields.forecastList.innerHTML = daily.time
    .map((date, index) => {
      const [condition, icon] = weatherCodes[daily.weather_code[index]] ?? ["Forecast", "🌡️"];
      const day = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(
        new Date(`${date}T00:00:00`),
      );

      return `
        <article class="forecast-day">
          <div>
            <strong>${day}</strong>
            <span>${icon} ${condition}</span>
          </div>
          <dl>
            <div><dt>High / Low</dt><dd>${Math.round(daily.temperature_2m_max[index])}° / ${Math.round(
              daily.temperature_2m_min[index],
            )}°C</dd></div>
            <div><dt>Rain chance</dt><dd>${daily.precipitation_probability_max[index] ?? 0}%</dd></div>
            <div><dt>UV max</dt><dd>${Math.round(daily.uv_index_max[index] ?? 0)}</dd></div>
          </dl>
        </article>
      `;
    })
    .join("");
};

const renderWeather = (location, weather) => {
  const current = weather.current;
  const [condition, icon] = weatherCodes[current.weather_code] ?? ["Current conditions", "🌡️"];
  const observationTime = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(current.time));
  const daylight = current.is_day ? "Daytime" : "Nighttime";

  fields.place.textContent = formatPlace(location);
  fields.updated.textContent = `Observed ${observationTime}`;
  fields.icon.textContent = icon;
  fields.temperature.textContent = Math.round(current.temperature_2m);
  fields.condition.textContent = `${condition} • ${daylight}`;
  fields.wind.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  fields.windDirection.textContent = formatDirection(current.wind_direction_10m);
  fields.humidity.textContent = `${current.relative_humidity_2m}%`;
  fields.feelsLike.textContent = `${Math.round(current.apparent_temperature)}°C`;
  fields.pressure.textContent = `${Math.round(current.pressure_msl)} hPa`;
  fields.cloudCover.textContent = `${current.cloud_cover}%`;
  fields.precipitation.textContent = `${current.precipitation} mm`;
  fields.coordinates.textContent = `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`;
  renderForecast(weather.daily);

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

document.querySelectorAll("[data-camera]").forEach((button) => {
  button.addEventListener("click", () => {
    const cameraId = button.dataset.camera;
    const frame = document.querySelector(`[data-camera-frame="${cameraId}"]`);

    frame.innerHTML = `
      <iframe
        title="${button.closest(".camera-card").querySelector("h3").textContent} live camera"
        src="${cameraSources[cameraId]}"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
      ></iframe>
    `;
    button.textContent = "Camera loaded";
    button.disabled = true;
  });
});

searchWeather("San Francisco");
