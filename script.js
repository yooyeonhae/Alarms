const weatherEl = document.getElementById("weather");
const clockEl = document.getElementById("clock");
const form = document.getElementById("alarm-form");
const timeInput = document.getElementById("alarm-time");
const labelInput = document.getElementById("alarm-label");
const listEl = document.getElementById("alarm-list");
const overlay = document.getElementById("ringing-overlay");
const ringingLabel = document.getElementById("ringing-label");
const stopBtn = document.getElementById("stop-btn");

const STORAGE_KEY = "alarms";
let alarms = loadAlarms();
let audioCtx = null;
let beepInterval = null;
let firedThisMinute = new Set();

function loadAlarms() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveAlarms() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alarms));
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function updateClock() {
  const now = new Date();
  clockEl.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  checkAlarms(now);
}

function checkAlarms(now) {
  const current = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  if (now.getSeconds() !== 0) {
    firedThisMinute.clear();
  }
  alarms.forEach((alarm) => {
    if (alarm.enabled && alarm.time === current && !firedThisMinute.has(alarm.id)) {
      firedThisMinute.add(alarm.id);
      ringAlarm(alarm);
    }
  });
}

function ringAlarm(alarm) {
  ringingLabel.textContent = alarm.label ? alarm.label : `${alarm.time} 알람`;
  overlay.classList.remove("hidden");
  startBeep();
}

function startBeep() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  stopBeep();
  beepInterval = setInterval(() => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
  }, 600);
}

function stopBeep() {
  if (beepInterval) {
    clearInterval(beepInterval);
    beepInterval = null;
  }
}

stopBtn.addEventListener("click", () => {
  overlay.classList.add("hidden");
  stopBeep();
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const time = timeInput.value.slice(0, 5);
  if (!time) return;
  alarms.push({
    id: Date.now(),
    time,
    label: labelInput.value.trim(),
    enabled: true,
  });
  alarms.sort((a, b) => a.time.localeCompare(b.time));
  saveAlarms();
  renderAlarms();
  form.reset();
});

function renderAlarms() {
  listEl.innerHTML = "";
  if (alarms.length === 0) {
    listEl.innerHTML = `<li class="empty-msg">등록된 알람이 없습니다.</li>`;
    return;
  }
  alarms.forEach((alarm) => {
    const li = document.createElement("li");
    li.className = "alarm-item" + (alarm.enabled ? "" : " disabled");

    li.innerHTML = `
      <div class="alarm-info">
        <span class="alarm-time-text">${alarm.time}</span>
        <span class="alarm-label-text">${alarm.label || ""}</span>
      </div>
      <div class="alarm-actions">
        <button class="toggle-btn ${alarm.enabled ? "on" : ""}" data-id="${alarm.id}">
          ${alarm.enabled ? "ON" : "OFF"}
        </button>
        <button class="delete-btn" data-id="${alarm.id}">삭제</button>
      </div>
    `;
    listEl.appendChild(li);
  });
}

listEl.addEventListener("click", (e) => {
  const id = Number(e.target.dataset.id);
  if (!id) return;

  if (e.target.classList.contains("toggle-btn")) {
    const alarm = alarms.find((a) => a.id === id);
    if (alarm) {
      alarm.enabled = !alarm.enabled;
      saveAlarms();
      renderAlarms();
    }
  }

  if (e.target.classList.contains("delete-btn")) {
    alarms = alarms.filter((a) => a.id !== id);
    saveAlarms();
    renderAlarms();
  }
});

async function loadWeather() {
  if (typeof WEATHER_CONFIG === "undefined") {
    weatherEl.textContent = "날씨 정보 없음 (config.js 필요)";
    return;
  }
  const { apiKey, lat, lon } = WEATHER_CONFIG;
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=kr`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = await res.json();
    const temp = Math.round(data.main.temp);
    const desc = data.weather[0].description;
    weatherEl.textContent = `🌤️ ${data.name} ${temp}°C, ${desc}`;
  } catch (err) {
    weatherEl.textContent = "날씨 정보를 불러오지 못했습니다.";
  }
}

renderAlarms();
updateClock();
setInterval(updateClock, 1000);
loadWeather();
setInterval(loadWeather, 10 * 60 * 1000);
