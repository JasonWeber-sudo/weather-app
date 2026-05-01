import { API_KEY } from "./config.js";

/*
* Author: Jason Weber
* Description: A weather app that fetches data from OpenWeatherMap API and displays current weather and 5-day forecast. Includes a 3D tilt effect on the weather card, dynamic background effects based on weather conditions, and a theme toggle for light/dark mode. Recent searches are saved and displayed for quick access.
* Tech Stack: HTML, CSS, JavaScript (Vanilla), OpenWeatherMap API
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

const forecastContainer = document.getElementById("forecast-list");
const forecastSection = document.getElementById("forecast");

const state = {
  recentCities: [],
  particles: [],
  rain: [],
  weatherMode: "clear",
  isLoading: false
};

let requestId = 0;

// Theme

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

  // refresh visuals for particles/rain contrast
  initEffects();
}

DOM.themeToggle?.addEventListener("click", toggleTheme);
loadTheme();

// Skeleton Loading (WIP)

function showSkeletons() {
  DOM.weatherCard?.classList.remove("hidden");

  const skeleton = document.getElementById("weatherSkeleton");
  const content = document.getElementById("weatherContent");

  if (skeleton && content) {
    skeleton.classList.remove("hidden");
    content.classList.add("hidden");
  }

  if (forecastContainer) {
    forecastContainer.innerHTML = "";

    for (let i = 0; i < 5; i++) {
      forecastContainer.innerHTML += `
        <div class="forecast-card skeleton"></div>
      `;
    }
  }
}

// Form Handling

DOM.form?.addEventListener("submit", (e) => {
  e.preventDefault();

  const city = DOM.cityInput.value.trim();
  if (!city) return;

  addRecent(city);

  fetchWeather(city);
  fetchForecast(city);
});

// Weather Fetch with Request ID to prevent race conditions

async function fetchWeather(city) {
  requestId++;
  const localId = requestId;

  state.isLoading = true;

  DOM.status.textContent = "";

  showSkeletons();

  // Skeleton Loading Delay
  await new Promise(r => setTimeout(r, 900));

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=imperial&appid=${API_KEY}`
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    if (localId !== requestId) return;

    updateUI(data);

  } catch (err) {
    DOM.status.textContent = err.message;
    DOM.weatherCard.classList.add("hidden");
  } finally {
    state.isLoading = false;
  }
}

// Forecast

async function fetchForecast(city) {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=imperial&appid=${API_KEY}`
    );

    const data = await res.json();
    if (!res.ok) throw new Error();

    renderForecast(formatForecast(data.list));
  } catch {
    DOM.status.textContent = "Forecast unavailable";
  }
}

function renderForecast(days) {
  if (!forecastContainer) return;

  forecastContainer.innerHTML = "";

  days.forEach(day => {
    const card = document.createElement("div");
    card.className = "forecast-card";

    card.innerHTML = `
      <p>${new Date(day.date).toLocaleDateString(undefined, { weekday: "short" })}</p>
      <img src="https://openweathermap.org/img/wn/${day.icon}@2x.png"/>
      <p>${Math.round(day.high)}° / ${Math.round(day.low)}°</p>
      <p>${day.description}</p>
    `;

    forecastContainer.appendChild(card);
  });

  forecastSection?.classList.remove("hidden");
}

// Forecast Data Formatting

function formatForecast(list) {
  const map = {};

  list.forEach(item => {
    const date = item.dt_txt.split(" ")[0];

    if (!map[date]) {
      map[date] = {
        date,
        temps: [],
        icon: item.weather[0].icon,
        description: item.weather[0].description
      };
    }

    map[date].temps.push(item.main.temp);
  });

  return Object.values(map).slice(0, 5).map(d => ({
    date: d.date,
    high: Math.max(...d.temps),
    low: Math.min(...d.temps),
    icon: d.icon,
    description: d.description
  }));
}

// UI Update

function updateUI(data) {
  document.getElementById("weatherSkeleton")?.classList.add("hidden");
  document.getElementById("weatherContent")?.classList.remove("hidden");

  DOM.cityName.textContent = data.name;
  DOM.temperature.textContent = Math.round(data.main.temp);
  DOM.description.textContent = data.weather[0].description;
  DOM.humidity.textContent = data.main.humidity;
  DOM.wind.textContent = data.wind.speed;

  DOM.weatherCard.classList.remove("hidden");

  setWeatherMode(data.weather[0].main);
}

// Weather Mode

function setWeatherMode(main) {
  const m = main.toLowerCase();

  if (m.includes("rain")) state.weatherMode = "rain";
  else if (m.includes("thunder") || m.includes("storm")) state.weatherMode = "storm";
  else state.weatherMode = "clear";

  initEffects();
}

// Recent Searches

function addRecent(city) {
  state.recentCities.unshift(city);
  state.recentCities = [...new Set(state.recentCities)].slice(0, 5);

  renderRecent();
}

function renderRecent() {
  DOM.recentList.innerHTML = "";

  state.recentCities.forEach(city => {
    const el = document.createElement("div");
    el.className = "recent-item";
    el.textContent = city;

    el.onclick = () => {
      fetchWeather(city);
      fetchForecast(city);
    };

    DOM.recentList.appendChild(el);
  });
}

// 3d Tilt Effect

DOM.weatherCard?.addEventListener("mousemove", (e) => {
  if (state.isLoading) return;

  const r = DOM.weatherCard.getBoundingClientRect();

  const x = e.clientX - r.left;
  const y = e.clientY - r.top;

  DOM.weatherCard.style.transform = `
    perspective(1000px)
    rotateX(${((y / r.height) - 0.5) * -8}deg)
    rotateY(${((x / r.width) - 0.5) * 8}deg)
    scale(1.02)
  `;
});

DOM.weatherCard?.addEventListener("mouseleave", () => {
  DOM.weatherCard.style.transform =
    "perspective(1000px) rotateX(0) rotateY(0)";
});

// Particles & Rain

const canvas = DOM.canvas;
const ctx = canvas?.getContext("2d");

function resize() {
  if (!canvas) return;
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}

window.addEventListener("resize", resize);
resize();

function initEffects() {
  state.particles = [];
  state.rain = [];

  // particles
  for (let i = 0; i < 90; i++) {
    state.particles.push({
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 2 + 1
    });
  }

  // rain
  for (let i = 0; i < 70; i++) {
    state.rain.push({
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight,
      len: 10 + Math.random() * 10,
      speed: 4 + Math.random() * 4
    });
  }
}

function draw() {
  if (!ctx) return;

  ctx.clearRect(0, 0, innerWidth, innerHeight);

  const isLight = document.body.classList.contains("light");

  // particles
  if (state.weatherMode === "clear") {
    ctx.fillStyle = isLight
      ? "rgba(15,23,42,0.35)"
      : "rgba(255,255,255,0.5)";

    state.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = innerWidth;
      if (p.x > innerWidth) p.x = 0;
      if (p.y < 0) p.y = innerHeight;
      if (p.y > innerHeight) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // rain
  if (state.weatherMode === "rain" || state.weatherMode === "storm") {
    ctx.strokeStyle = isLight
      ? "rgba(2,132,199,0.6)"
      : "rgba(120,180,255,0.6)";

    state.rain.forEach(r => {
      r.y += r.speed;

      if (r.y > innerHeight) {
        r.y = -20;
        r.x = Math.random() * innerWidth;
      }

      ctx.beginPath();
      ctx.moveTo(r.x, r.y);
      ctx.lineTo(r.x, r.y + r.len);
      ctx.stroke();
    });
  }

  requestAnimationFrame(draw);
}

initEffects();
draw();