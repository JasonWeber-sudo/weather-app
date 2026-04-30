import { API_KEY } from "./config.js";

/*
 * Weather App
 * Author: Jason Weber
 * Stack: Vanilla JS + Canvas
 * Features: Theme toggle, weather effects, particles, lightning
 */

// DOM Elements
const DOM = {
  form: document.getElementById("searchForm"),
  cityInput: document.getElementById("cityInput"),
  status: document.getElementById("status"),

  weatherCard: document.getElementById("weatherCard"),
  cityName: document.getElementById("cityName"),
  temperature: document.getElementById("temperature"),
  description: document.getElementById("description"),
  humidity: document.getElementById("humidity"),
  wind: document.getElementById("wind"),

  recentList: document.getElementById("recentList"),
  themeToggle: document.getElementById("themeToggle"),

  canvas: document.getElementById("particles")
};

// Application State
const state = {
  status: "idle",
  currentWeather: null,
  forecast: [],
  forecastError: false,
  recentCities: [],
  weatherMode: "clear",
  particles: []
};

// Dark/Light Theme
function loadTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "light") {
    document.body.classList.add("light");
    DOM.themeToggle.textContent = "☀️";
  }
}

function toggleTheme() {
  document.body.classList.toggle("light");
  const isLight = document.body.classList.contains("light");

  DOM.themeToggle.textContent = isLight ? "☀️" : "🌙";
  localStorage.setItem("theme", isLight ? "light" : "dark");
}

DOM.themeToggle.addEventListener("click", toggleTheme);
loadTheme();

// Form Handling
DOM.form.addEventListener("submit", (e) => {
  e.preventDefault();

  const city = DOM.cityInput.value.trim();
  if (!city) {
    DOM.status.textContent = "Please enter a city name.";
    return;
  }

  updateRecentCities(city);
  fetchWeather(city);
  fetchFiveDayForecast(city);
});

// Weather API Fetch
async function fetchWeather(city) {
  try {
    DOM.status.textContent = `Getting weather for ${city}...`;
    DOM.weatherCard.classList.add("hidden");

    const url =
      `https://api.openweathermap.org/data/2.5/weather` +
      `?q=${city}&units=imperial&appid=${API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "City not found");

    setTimeout(() => updateUI(data), 400);

  } catch (err) {
    DOM.status.textContent = err.message;
    console.error(err);
  }
}

// Forecast API Fetch
async function fetchFiveDayForecast(city) {
  try {
    DOM.status.textContent = "Loading forecast...";

    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=imperial&appid=${API_KEY}`
    );

    if (!res.ok) throw new Error("Forecast not found");

    const data = await res.json();

    const dailyForecast = getDailyForecast(data.list);
    renderForecast(dailyForecast);

    DOM.status.textContent = "";
  } catch (err) {
    DOM.status.textContent = "Unable to load forecast data";
    console.error(err);
  }
}

// UI Render Forecast
function renderForecast(forecastData) {
  const container = document.getElementById("forecast-list");
  if (!container) return;

  container.innerHTML = "";

  forecastData.forEach(day => {
    const card = document.createElement("div");
    card.className = "forecast-card";

    card.innerHTML = `
      <p class="forecast-date">
        ${new Date(day.date).toLocaleDateString(undefined, { weekday: "short" })}
      </p>

      <img
        class="forecast-icon"
        src="https://openweathermap.org/img/wn/${day.icon}@2x.png"
        alt="${day.description}"
      />

      <p class="forecast-temps">
        <span class="high">${Math.round(day.high)}°</span>
        <span class="low">${Math.round(day.low)}°</span>
      </p>

      <p class="forecast-desc">${day.description}</p>
    `;

    container.appendChild(card);
  });

  document.getElementById("forecast").classList.remove("hidden");
}

// Extract Daily Forecast from 3-Hour Data
function getDailyForecast(list) {
  const days = {};

  list.forEach(item => {
    const date = item.dt_txt.split(" ")[0];

    if (!days[date]) {
      days[date] = {
        date,
        temps: [],
        icon: item.weather[0].icon,
        description: item.weather[0].description
      };
    }

    days[date].temps.push(item.main.temp);
  });

  return Object.values(days)
    .slice(0, 5)
    .map(day => ({
      date: day.date,
      high: Math.max(...day.temps),
      low: Math.min(...day.temps),
      icon: day.icon,
      description: day.description
    }));
}

// UI Update
function updateUI(data) {
  DOM.cityName.textContent = data.name;
  DOM.temperature.textContent = Math.round(data.main.temp);
  DOM.description.textContent = data.weather[0].description;
  DOM.humidity.textContent = data.main.humidity;
  DOM.wind.textContent = data.wind.speed;

  applyWeatherMode(
    data.weather[0].main,
    data.weather[0].description
  );

  DOM.status.textContent = "";
  DOM.cityInput.value = "";
  DOM.cityInput.focus();
  DOM.weatherCard.classList.remove("hidden");
}

// Weather Mode Logic
function applyWeatherMode(main, description) {
  const type = main.toLowerCase();
  const text = description.toLowerCase();

  if (type.includes("thunder") || type.includes("storm")) {
    state.weatherMode = "storm";
    triggerLightning();
  } else if (type.includes("rain") || text.includes("rain")) {
    state.weatherMode = "rain";
  } else if (type.includes("cloud")) {
    state.weatherMode = "cloud";
  } else {
    state.weatherMode = "clear";
  }
}

// Recent Searches
function updateRecentCities(city) {
  state.recentCities.unshift(city);
  state.recentCities = state.recentCities.slice(0, 5);
  renderRecentCities();
}

function renderRecentCities() {
  DOM.recentList.innerHTML = "";

  state.recentCities.forEach(city => {
    const item = document.createElement("div");
    item.className = "recent-item";
    item.textContent = city;
    item.onclick = () => fetchWeather(city);
    DOM.recentList.appendChild(item);
  });
}

// 3D Card Tilt Effect
DOM.weatherCard.addEventListener("mousemove", (e) => {
  const rect = DOM.weatherCard.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  DOM.weatherCard.style.transform = `
    perspective(1000px)
    rotateX(${((y / rect.height) - 0.5) * -8}deg)
    rotateY(${((x / rect.width) - 0.5) * 8}deg)
    scale(1.02)
  `;
});

DOM.weatherCard.addEventListener("mouseleave", () => {
  DOM.weatherCard.style.transform =
    "perspective(1000px) rotateX(0) rotateY(0)";
});

// Lightning Flash Effect
function triggerLightning() {
  const flash = document.createElement("div");

  Object.assign(flash.style, {
    position: "fixed",
    inset: 0,
    background: "white",
    opacity: 0,
    pointerEvents: "none",
    zIndex: 9999,
    transition: "opacity 0.15s ease"
  });

  document.body.appendChild(flash);

  setTimeout(() => flash.style.opacity = 0.7, 50);
  setTimeout(() => flash.style.opacity = 0, 150);
  setTimeout(() => flash.remove(), 400);
}

// Canvas Particles Setup
const ctx = DOM.canvas.getContext("2d");

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;

  DOM.canvas.width = window.innerWidth * dpr;
  DOM.canvas.height = window.innerHeight * dpr;
  DOM.canvas.style.width = window.innerWidth + "px";
  DOM.canvas.style.height = window.innerHeight + "px";

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

resizeCanvas();
window.addEventListener("resize", () => {
  resizeCanvas();
  initParticles();
});

// Utilities for Canvas Particles
function isLightMode() {
  return document.body.classList.contains("light");
}

function getParticleColors() {
  return {
    rain: isLightMode()
      ? "rgba(15,23,42,0.95)"
      : "rgba(120,180,255,0.6)",

    normal: isLightMode()
      ? "rgba(15,23,42,0.85)"
      : "rgba(255,255,255,0.5)"
  };
}

// Particle Class
class Particle {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * DOM.canvas.width;
    this.y = Math.random() * DOM.canvas.height;
    this.size = Math.random() * 2 + 1;
    this.speedX = (Math.random() - 0.5) * 0.4;
    this.speedY = (Math.random() - 0.5) * 0.4;
  }

  update() {
    if (state.weatherMode === "rain" || state.weatherMode === "storm") {
      this.y += state.weatherMode === "storm" ? 6 : 10;
      this.x += Math.random() * 1.5;

      if (this.y > DOM.canvas.height) {
        this.y = -20;
        this.x = Math.random() * DOM.canvas.width;
      }
    } else {
      this.x += this.speedX;
      this.y += this.speedY;

      if (this.x < 0) this.x = DOM.canvas.width;
      if (this.x > DOM.canvas.width) this.x = 0;
      if (this.y < 0) this.y = DOM.canvas.height;
      if (this.y > DOM.canvas.height) this.y = 0;
    }
  }

  draw() {
    const colors = getParticleColors();

    if (state.weatherMode === "rain" || state.weatherMode === "storm") {
      ctx.strokeStyle = colors.rain;
      ctx.lineWidth = isLightMode() ? 2.5 : 1.2;

      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - 2, this.y - 16);
      ctx.stroke();
    } else {
      ctx.fillStyle = colors.normal;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size + (isLightMode() ? 0.8 : 0), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Particle Loop Function
function initParticles() {
  state.particles = [];
  for (let i = 0; i < 120; i++) {
    state.particles.push(new Particle());
  }
}

function animateParticles() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  state.particles.forEach(p => {
    p.update();
    p.draw();
  });

  requestAnimationFrame(animateParticles);
}

initParticles();
animateParticles();