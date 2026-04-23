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


// ----------------------------
// STATE
// ----------------------------
let recentCities = [];
let weatherMode = "clear";

const apiKey = "e472440169dcc532d72a1a56090e2df3";


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
// REAL WEATHER API
// ----------------------------
async function getWeather(city) {
  try {
    status.textContent = `Getting weather for ${city}...`;
    weatherCard.classList.add("hidden");

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=imperial&appid=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "City not found");
    }

    console.log("API DATA:", data);

    const formatted = {
      name: data.name,
      main: {
        temp: data.main.temp,
        humidity: data.main.humidity
      },
      weather: [
        {
          description: data.weather[0].description,
          main: data.weather[0].main
        }
      ],
      wind: {
        speed: data.wind.speed
      }
    };

    setTimeout(() => {
      updateUI(formatted);
      status.textContent = "";
    }, 500);

  } catch (error) {
    status.textContent = error.message;
    console.error(error);
  }
}


// ----------------------------
// APPLY WEATHER THEME (REAL DATA)
// ----------------------------
function applyWeatherTheme(description, main) {
  const body = document.body;

  body.classList.remove("sunny", "rainy", "stormy", "cloudy");

  const text = description.toLowerCase();
  const type = main.toLowerCase();

  // Rain detection
  if (type.includes("rain") || text.includes("rain")) {
    weatherMode = "rain";
    body.classList.add("rainy");
  }

  // Storm detection
  else if (type.includes("thunder") || type.includes("storm")) {
    weatherMode = "storm";
    body.classList.add("stormy");

    triggerLightning();
  }

  // Cloud detection
  else if (type.includes("cloud")) {
    weatherMode = "cloud";
    body.classList.add("cloudy");
  }

  // Clear
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

  applyWeatherTheme(
    data.weather[0].description,
    data.weather[0].main
  );

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

  recentCities.forEach((city) => {
    const div = document.createElement("div");
    div.classList.add("recent-item");
    div.textContent = city;

    div.addEventListener("click", () => getWeather(city));

    recentList.appendChild(div);
  });
}


// ----------------------------
// 3D TILT EFFECT
// ----------------------------
weatherCard.addEventListener("mousemove", (e) => {
  const rect = weatherCard.getBoundingClientRect();

  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const rotateX = ((y - rect.height / 2) / rect.height) * -8;
  const rotateY = ((x - rect.width / 2) / rect.width) * 8;

  weatherCard.style.transform = `
    perspective(1000px)
    rotateX(${rotateX}deg)
    rotateY(${rotateY}deg)
    scale(1.02)
  `;
});

weatherCard.addEventListener("mouseleave", () => {
  weatherCard.style.transform = `
    perspective(1000px)
    rotateX(0deg)
    rotateY(0deg)
    scale(1)
  `;
});


// ----------------------------
// LIGHTNING SYSTEM
// ----------------------------
function triggerLightning() {
  const flash = document.createElement("div");

  Object.assign(flash.style, {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "white",
    opacity: 0,
    pointerEvents: "none",
    zIndex: 9999,
    transition: "opacity 0.15s ease"
  });

  document.body.appendChild(flash);

  setTimeout(() => flash.style.opacity = 0.8, 50);
  setTimeout(() => flash.style.opacity = 0, 150);
  setTimeout(() => flash.remove(), 400);
}


// ----------------------------
// PARTICLE SYSTEM
// ----------------------------
const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particlesArray = [];

class Particle {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 2;
    this.speedX = (Math.random() - 0.5) * 0.3;
    this.speedY = (Math.random() - 0.5) * 0.3;
  }

  update() {

    // RAIN
    if (weatherMode === "rain") {
      this.y += 8;
      this.x += 1;

      if (this.y > canvas.height) {
        this.y = 0;
        this.x = Math.random() * canvas.width;
      }
    }

    // STORM
    else if (weatherMode === "storm") {
      this.y += 3;
      this.x += Math.sin(this.y * 0.02) * 2;

      if (this.y > canvas.height) {
        this.y = 0;
        this.x = Math.random() * canvas.width;
      }
    }

    // NORMAL
    else {
      this.x += this.speedX;
      this.y += this.speedY;

      if (this.x > canvas.width) this.x = 0;
      if (this.x < 0) this.x = canvas.width;
      if (this.y > canvas.height) this.y = 0;
      if (this.y < 0) this.y = canvas.height;
    }
  }

  draw() {
    if (weatherMode === "rain") {
      ctx.strokeStyle = "rgba(120,180,255,0.8)";
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - 2, this.y - 12);
      ctx.stroke();
    } 
    else {
      ctx.fillStyle =
        weatherMode === "storm"
          ? "rgba(200,200,255,0.6)"
          : "rgba(255,255,255,0.5)";

      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}


// init particles
function initParticles() {
  particlesArray = [];
  for (let i = 0; i < 100; i++) {
    particlesArray.push(new Particle());
  }
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let p of particlesArray) {
    p.update();
    p.draw();
  }

  requestAnimationFrame(animateParticles);
}

initParticles();
animateParticles();

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  initParticles();
});