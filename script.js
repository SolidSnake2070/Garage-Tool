const STORAGE_KEY = "garage-panel-data-v1";

const defaultData = [
  {
    id: "kx250f",
    name: "KX250F",
    type: "MOTOCROSS / HOURS",
    unit: "h",
    current: 72,
    services: [
      { name: "Ölwechsel", target: 77, warnBefore: 2 },
      { name: "Ventilspiel", target: 80, warnBefore: 3 },
      { name: "Steuerkette prüfen", target: 80, warnBefore: 3 }
    ]
  },
  {
    id: "kx85",
    name: "KX85",
    type: "MOTOCROSS / HOURS",
    unit: "h",
    current: 20.4,
    services: [
      { name: "Getriebeöl", target: 25, warnBefore: 2 },
      { name: "Kolben", target: 40, warnBefore: 5 }
    ]
  },
  {
    id: "ktm690",
    name: "KTM 690 SMC",
    type: "STREET / KILOMETERS",
    unit: "km",
    current: 46799,
    services: [
      { name: "Ölwechsel", target: 50000, warnBefore: 1000 },
      { name: "Ventilspiel", target: 50000, warnBefore: 1000 }
    ]
  }
];

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(defaultData);

  try {
    return JSON.parse(saved);
  } catch {
    return structuredClone(defaultData);
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getServiceState(current, target, warnBefore) {
  if (current >= target) return "due";
  if (current >= target - warnBefore) return "warn";
  return "ok";
}

function getOverallStatus(bike) {
  const states = bike.services.map(s =>
    getServiceState(bike.current, s.target, s.warnBefore)
  );

  if (states.includes("due")) return "due";
  if (states.includes("warn")) return "warn";
  return "ok";
}

function stateLabel(state) {
  if (state === "due") return "FÄLLIG";
  if (state === "warn") return "BALD";
  return "OK";
}

function formatValue(value, unit) {
  if (unit === "km") {
    return new Intl.NumberFormat("de-DE").format(value) + " km";
  }
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1
  }).format(value) + " h";
}

function render() {
  const grid = document.getElementById("bikeGrid");
  const template = document.getElementById("bike-card-template");
  const data = loadData();

  grid.innerHTML = "";

  data.forEach((bike, bikeIndex) => {
    const node = template.content.cloneNode(true);

    const card = node.querySelector(".card");
    const type = node.querySelector(".card-type");
    const title = node.querySelector(".card-title");
    const badge = node.querySelector(".status-badge");
    const mainLabel = node.querySelector(".main-label");
    const mainInput = node.querySelector(".main-input");
    const serviceList = node.querySelector(".service-list");
    const saveBtn = node.querySelector(".save-btn");
    const saveInfo = node.querySelector(".save-info");

    type.textContent = bike.type;
    title.textContent = bike.name;
    mainLabel.textContent = `Aktueller Stand (${bike.unit})`;
    mainInput.value = bike.current;

    const overall = getOverallStatus(bike);
    badge.textContent = stateLabel(overall);
    badge.classList.add(`status-${overall}`);

    bike.services.forEach(service => {
      const row = document.createElement("div");
      row.className = "service-row";

      const name = document.createElement("div");
      name.className = "service-name";
      name.textContent = service.name;

      const target = document.createElement("div");
      target.className = "service-target";
      target.textContent = `bei ${formatValue(service.target, bike.unit)}`;

      const state = document.createElement("div");
      const serviceState = getServiceState(bike.current, service.target, service.warnBefore);
      state.className = `service-state ${serviceState}`;
      state.textContent =
        serviceState === "due" ? "FÄLLIG" :
        serviceState === "warn" ? "BALD" : "OK";

      row.appendChild(name);
      row.appendChild(target);
      row.appendChild(state);
      serviceList.appendChild(row);
    });

    saveBtn.addEventListener("click", () => {
      const newValue = Number(mainInput.value);
      if (Number.isNaN(newValue)) {
        saveInfo.textContent = "ungültiger Wert";
        return;
      }

      data[bikeIndex].current = newValue;
      saveData(data);
      render();
    });

    saveInfo.textContent = "lokal gespeichert";
    grid.appendChild(node);
  });
}

render();
