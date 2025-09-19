// === Clock ===
function updateClock() {
  document.getElementById("clock").textContent =
    new Date().toLocaleTimeString();
}
setInterval(updateClock, 1000);
updateClock();

// === Paths & Stations ===
const path1 = [
  [12, 73],
  [180, 76],
  [323, 225],
  [524, 221],
  [568, 261],
  [960, 262],
];
const path2 = [
  [5, 382],
  [166, 383],
  [285, 265],
  [567, 265],
  [688, 264],
  [743, 326],
  [962, 327],
];
const stations1 = ["SA1", "SA2", "SA3", "SA4", "SA5", "SA6"];
const stations2 = ["SB1", "SB2", "SB3", "SB4", "SB5", "SB6", "SB7"];

// === Train schedule data ===
const trainSchedules = {
  train1: {
    name: "Train A (ID: 101)",
    schedule: [
      {
        station: "SA1",
        arrival: "10:00",
        departure: "10:05",
        platform: "1",
        status: "On Time",
      },
      {
        station: "SA2",
        arrival: "10:30",
        departure: "10:35",
        platform: "2",
        status: "Delayed",
      },
      {
        station: "SA3",
        arrival: "11:00",
        departure: "11:05",
        platform: "3",
        status: "On Time",
      },
    ],
  },
  train2: {
    name: "Train B (ID: 202)",
    schedule: [
      {
        station: "SB1",
        arrival: "09:45",
        departure: "09:50",
        platform: "1",
        status: "On Time",
      },
      {
        station: "SB2",
        arrival: "10:20",
        departure: "10:25",
        platform: "2",
        status: "Delayed",
      },
      {
        station: "SB3",
        arrival: "10:50",
        departure: "10:55",
        platform: "1",
        status: "On Time",
      },
    ],
  },
};

// === Active trains ===
const trainData = {
  train1: {
    name: "Train A",
    status: "On Time",
    priority: "High",
    type: "Passenger",
    path: path1,
    currentIndex: 0,
  },
  train2: {
    name: "Train B",
    status: "Delayed",
    priority: "Medium",
    type: "Freight",
    path: path2,
    currentIndex: 0,
  },
};

function distance([x1, y1], [x2, y2]) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}
function estimateETA(train) {
  const idx = train.currentIndex;
  if (idx >= train.path.length - 1) return "At final station";
  const speed = 50;
  const dist = distance(train.path[idx], train.path[idx + 1]);
  return new Date(Date.now() + (dist / speed) * 1000).toLocaleTimeString();
}

function renderSchedules() {
  const container = document.getElementById("schedule-container");
  container.innerHTML = "";
  Object.entries(trainSchedules).forEach(([id, train]) => {
    const section = document.createElement("div");
    section.innerHTML = `<h4>${train.name}</h4>`;
    const table = document.createElement("table");
    table.innerHTML = `<thead><tr><th>Station</th><th>Arrival</th><th>Departure</th><th>Platform</th><th>Status</th></tr></thead>`;
    const tbody = document.createElement("tbody");
    train.schedule.forEach((s, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${s.station}</td><td>${s.arrival}</td><td>${
        s.departure
      }</td><td>${s.platform}</td>
                  <td class="${
                    s.status === "On Time" ? "status on-time" : "status delayed"
                  }">${s.status}</td>`;
      if (idx === trainData[id].currentIndex) tr.classList.add("row-current");
      if (idx === trainData[id].currentIndex + 1) tr.classList.add("row-next");
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    section.appendChild(table);
    container.appendChild(section);
  });
}

function updateActiveTrains() {
  const list = document.getElementById("train-list");
  list.innerHTML = "";
  document.querySelectorAll(".station").forEach((s) => {
    s.style.background = "yellow";
    s.style.color = "black";
  });
  Object.entries(trainData).forEach(([id, t]) => {
    const nextStationIdx = t.currentIndex + 1;
    const nextStation =
      nextStationIdx < t.path.length
        ? id === "train1"
          ? stations1[nextStationIdx]
          : stations2[nextStationIdx]
        : "Final";
    const currentStation =
      t.currentIndex < t.path.length
        ? id === "train1"
          ? stations1[t.currentIndex]
          : stations2[t.currentIndex]
        : "Final";
    const dist =
      nextStationIdx < t.path.length
        ? distance(t.path[t.currentIndex], t.path[nextStationIdx]).toFixed(1)
        : 0;
    const currEl = Array.from(document.querySelectorAll(".station")).find(
      (s) => s.textContent === currentStation
    );
    if (currEl) {
      currEl.style.background = "green";
      currEl.style.color = "white";
    }
    const nextEl = Array.from(document.querySelectorAll(".station")).find(
      (s) => s.textContent === nextStation
    );
    if (nextEl) {
      nextEl.style.background = "orange";
      nextEl.style.color = "white";
    }
    const li = document.createElement("li");
    li.innerHTML = `<span>🚆 ${t.name} (${t.priority}, ${t.type})</span>
                <span class="status ${t.status.toLowerCase()}">${
      t.status
    }</span>
                <span>Next: ${nextStation}</span><span>Dist: ${dist}px</span><span>ETA: ${estimateETA(
      t
    )}</span>`;
    list.appendChild(li);
  });
  renderSchedules();
}

function animateTrain(trainId, path) {
  const train = document.getElementById(trainId);
  const trainObj = trainData[trainId];
  let index = 0;
  function move() {
    const [x, y] = path[index];
    train.style.left = x + "px";
    train.style.top = y + "px";
    trainObj.currentIndex = index;
    updateActiveTrains();
    setTimeout(() => {
      index = (index + 1) % path.length;
      move();
    }, 3000);
  }
  move();
}
animateTrain("train1", path1);
animateTrain("train2", path2);

// === Alerts with history and acknowledgement ===
const alerts = {},
  alertHistory = [];
function addAlert(type, text, id, requireAck = false) {
  const list = document.getElementById("alert-list");
  if (alerts[id]) {
    alerts[id].querySelector(".alert-text").textContent = text;
    return;
  }
  const li = document.createElement("li");
  li.className = `alert ${type}`;
  li.innerHTML = `<span class="alert-icon">${
    type === "urgent" ? "🚨" : type === "warning" ? "⚡" : "ℹ️"
  }</span>
              <span class="alert-text">${text}</span>
              <span class="alert-time">${new Date().toLocaleTimeString()}</span>`;
  if (requireAck) {
    const ack = document.createElement("button");
    ack.textContent = "✅ Acknowledge";
    ack.onclick = () => {
      logAlertHistory("Acknowledged: " + text);
      li.remove();
      delete alerts[id];
    };
    li.appendChild(ack);
  } else {
    const btn = document.createElement("button");
    btn.textContent = "❌";
    btn.onclick = () => {
      logAlertHistory("Dismissed: " + text);
      li.remove();
      delete alerts[id];
    };
    li.appendChild(btn);
  }
  list.appendChild(li);
  alerts[id] = li;
  logAlertHistory("Raised: " + text);
}
function logAlertHistory(msg) {
  const list = document.getElementById("alert-history-list");
  const li = document.createElement("li");
  li.textContent = `${new Date().toLocaleTimeString()} - ${msg}`;
  list.appendChild(li);
}
setInterval(() => {
  Object.entries(trainData).forEach(([id, t]) => {
    if (t.status === "Delayed") {
      addAlert("warning", `${t.name} is delayed!`, id);
    } else {
      if (alerts[id]) {
        alerts[id].remove();
        delete alerts[id];
      }
    }
  });
}, 4000);

// === Decision Support with Accept/Override ===
const recommendations = [
  {
    id: 1,
    title: "Potential conflict near SA3",
    description: "Train A and Train B may arrive simultaneously.",
    type: "warning",
  },
  {
    id: 2,
    title: "Track maintenance at SB2",
    description: "Delay expected. Rerouting may be required.",
    type: "info",
  },
];
function renderRecommendations() {
  const recDiv = document.getElementById("recommendations");
  recDiv.innerHTML = "";
  recommendations.forEach((rec) => {
    const card = document.createElement("div");
    card.className = `recommendation-card ${rec.type}`;
    card.innerHTML = `<div class="recommendation-title">${rec.title}</div><div>${rec.description}</div>`;
    const actions = document.createElement("div");
    actions.className = "recommendation-actions";
    const accept = document.createElement("button");
    accept.className = "action-btn accept";
    accept.textContent = "Accept";
    accept.onclick = () => {
      logConflictHistory(`Accepted: ${rec.title}`);
      card.remove();
    };
    const override = document.createElement("button");
    override.className = "action-btn override";
    override.textContent = "Override";
    override.onclick = () => {
      logConflictHistory(`Overridden: ${rec.title}`);
      card.remove();
    };
    actions.appendChild(accept);
    actions.appendChild(override);
    card.appendChild(actions);
    recDiv.appendChild(card);
  });
}
function logConflictHistory(msg) {
  const list = document.getElementById("history-list");
  const li = document.createElement("li");
  li.textContent = `${new Date().toLocaleTimeString()} - ${msg}`;
  list.appendChild(li);
}
renderRecommendations();

// === Live Operations Updates ===
function updateLiveOperations() {
  const totalSegments = path1.length + path2.length;
  let occupied = 0;
  Object.values(trainData).forEach((t) => {
    if (t.currentIndex < t.path.length) occupied++;
  });
  const occupancy = ((occupied / totalSegments) * 100).toFixed(1);
  document.getElementById(
    "track-occupancy"
  ).textContent = `Track Occupancy: ${occupancy}%`;

  let atStations = 0;
  Object.values(trainData).forEach((t) => {
    if (t.currentIndex < t.path.length) atStations++;
  });
  document.getElementById(
    "trains-at-stations"
  ).textContent = `Trains at Stations: ${atStations}`;

  const projection = Object.entries(trainData)
    .map(([id, t]) => {
      return `${t.name}: ${estimateETA(t)}`;
    })
    .join(" | ");
  document.getElementById(
    "next-30min-projection"
  ).textContent = `Next 30 min Projection: ${projection}`;
}

setInterval(updateLiveOperations, 3000);
updateLiveOperations();
