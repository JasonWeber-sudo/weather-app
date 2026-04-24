import { API_KEY } from "./config.js";

console.log("API KEY LOADED");

// ----------------------------
// DOM ELEMENTS
// ----------------------------
const form = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const status = document.getElementById("status");

const weatherCard = document.getElementById("weatherCard");
const cityName = document.getElementById("cityName");
const temperature = document.getElementById("temperature");
const description = document.getElementById("description");
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");

const recentList = document.getElementById("recentList");

// ================= THEME TOGGLE =================

const themeToggle = document.getElementById("themeToggle");

// Load saved theme
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "light") {
  document.body.classList.add("light");
  themeToggle.textContent = "☀️";
}

// Toggle theme
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("light");

  const isLight = document.body.classList.contains("light");
  themeToggle.textContent = isLight ? "☀️" : "🌙";

  localStorage.setItem("theme", isLight ? "light" : "dark");
});

// ----------------------------
// STATE
// ----------------------------
let recentCities = [];
let weatherMode = "clear";

// ----------------------------
// FORM SUBMIT
// ----------------------------
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const city = cityInput.value.trim();
  if (!city) {
    status.textContent = "Please enter a city name.";
    return;
  }

  recentCities.unshift(city);
  recentCities = recentCities.slice(0, 5);
  renderRecent();

  getWeather(city);
});

// ----------------------------
// WEATHER API
// ----------------------------
async function getWeather(city) {
  try {
    status.textContent = `Getting weather for ${city}...`;
    weatherCard.classList.add("hidden");

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=imperial&appid=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) throw new Error(data.message || "City not found");

    setTimeout(() => {
      updateUI({
        name: data.name,
        main: {
          temp: data.main.temp,
          humidity: data.main.humidity
        },
        weather: [{
          description: data.weather[0].description,
          main: data.weather[0].main
        }],
        wind: {
          speed: data.wind.speed
        }
      });
    }, 400);

  } catch (err) {
    status.textContent = err.message;
    console.error(err);
  }
}

// ----------------------------
// WEATHER THEMES
// ----------------------------
function applyWeatherTheme(desc, main) {
  const body = document.body;
  body.classList.remove("sunny", "rainy", "stormy", "cloudy");

  const text = desc.toLowerCase();
  const type = main.toLowerCase();

  if (type.includes("thunder") || type.includes("storm")) {
    weatherMode = "storm";
    body.classList.add("stormy");
    triggerLightning();
  } 
  else if (type.includes("rain") || text.includes("rain")) {
    weatherMode = "rain";
    body.classList.add("rainy");
  } 
  else if (type.includes("cloud")) {
    weatherMode = "cloud";
    body.classList.add("cloudy");
  } 
  else {
    weatherMode = "clear";
    body.classList.add("sunny");
  }
}

// ----------------------------
// UPDATE UI
// ----------------------------
function updateUI(data) {
  cityName.textContent = data.name;
  temperature.textContent = Math.round(data.main.temp);
  description.textContent = data.weather[0].description;
  humidity.textContent = data.main.humidity;
  wind.textContent = data.wind.speed;

  applyWeatherTheme(data.weather[0].description, data.weather[0].main);

  status.textContent = "";
  cityInput.value = "";
  cityInput.focus();

  weatherCard.classList.remove("hidden");
}

// ----------------------------
// RECENT SEARCHES
// ----------------------------
function renderRecent() {
  recentList.innerHTML = "";

  recentCities.forEach(city => {
    const div = document.createElement("div");
    div.className = "recent-item";
    div.textContent = city;
    div.onclick = () => getWeather(city);
    recentList.appendChild(div);
  });
}

// ----------------------------
// 3D CARD TILT
// ----------------------------
weatherCard.addEventListener("mousemove", (e) => {
  const rect = weatherCard.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  weatherCard.style.transform = `
    perspective(1000px)
    rotateX(${((y / rect.height) - 0.5) * -8}deg)
    rotateY(${((x / rect.width) - 0.5) * 8}deg)
    scale(1.02)
  `;
});

weatherCard.addEventListener("mouseleave", () => {
  weatherCard.style.transform = "perspective(1000px) rotateX(0) rotateY(0)";
});

// ----------------------------
// LIGHTNING
// ----------------------------
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

// ----------------------------
// PARTICLES (FIXED)
// ----------------------------
const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

resizeCanvas();

let particles = [];

class Particle {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 2 + 1;
    this.speedX = (Math.random() - 0.5) * 0.4;
    this.speedY = (Math.random() - 0.5) * 0.4;
  }

  update() {
    if (weatherMode === "rain" || weatherMode === "storm") {
      this.y += weatherMode === "storm" ? 6 : 10;
      this.x += Math.random() * 1.5;

      if (this.y > canvas.height) {
        this.y = -20;
        this.x = Math.random() * canvas.width;
      }
    } else {
      this.x += this.speedX;
      this.y += this.speedY;
      if (this.x < 0) this.x = canvas.width;
      if (this.x > canvas.width) this.x = 0;
      if (this.y < 0) this.y = canvas.height;
      if (this.y > canvas.height) this.y = 0;
    }
  }

  draw() {
    if (weatherMode === "rain" || weatherMode === "storm") {
      ctx.strokeStyle = "rgba(120,180,255,0.6)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(
        this.x - (Math.random() * 2 + 1),
        this.y - (Math.random() * 12 + 10)
      );
      ctx.stroke();
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function initParticles() {
  particles = [];
  for (let i = 0; i < 120; i++) particles.push(new Particle());
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => {
    p.update();
    p.draw();
  });
  requestAnimationFrame(animateParticles);
}

initParticles();
animateParticles();

window.addEventListener("resize", () => {
  resizeCanvas();
  initParticles();
});