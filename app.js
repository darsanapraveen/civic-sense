const complaints = [
  {
    title: "Power outage at Central Hospital",
    location: "Central Hospital, Capital City",
    category: "Healthcare",
    affected: 420,
    severity: 5,
    placeImportance: "hospital",
    description: "A power outage is affecting critical hospital services."
  },
  {
    title: "Water supply interruption",
    location: "North Community",
    category: "Utilities",
    affected: 180,
    severity: 4,
    placeImportance: "community",
    description: "Residents have reported a prolonged interruption in water supply."
  },
  {
    title: "Traffic signal not working",
    location: "Main Market Junction",
    category: "Transport",
    affected: 90,
    severity: 3,
    placeImportance: "market",
    description: "A damaged traffic signal is causing delays at a busy junction."
  }
];

const placeWeights = {
  community: 5,
  market: 10,
  school: 18,
  transport: 20,
  hospital: 25,
  critical: 30
};

const severityNames = {
  1: "Low",
  2: "Mild",
  3: "Moderate",
  4: "High",
  5: "Critical"
};

function scoreComplaint(c) {
  return Math.round(
    c.affected * 1.8 +
    (placeWeights[c.placeImportance] || 5) +
    c.severity * 5
  );
}

function priority(score) {
  if (score >= 850) return ["Emergency", "emergency"];
  if (score >= 450) return ["High", "high"];
  if (score >= 180) return ["Medium", "medium"];
  return ["Monitor", "low"];
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, function (ch) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[ch];
  });
}

function renderQueue() {
  const queue = document.getElementById("queue");

  const sorted = [...complaints].sort(
    (a, b) => scoreComplaint(b) - scoreComplaint(a)
  );

  queue.innerHTML = sorted.map(function (c) {
    const score = scoreComplaint(c);
    const [level, cls] = priority(score);

    return `
      <article class="queue-item">
        <div class="queue-top">
          <div>
            <div class="queue-title">
              ${escapeHtml(c.title)}
            </div>

            <div class="queue-meta">
              ${escapeHtml(c.location)} ·
              ${escapeHtml(c.category)} ·
              ${Number(c.affected).toLocaleString()} people affected
            </div>
          </div>

          <span class="priority-badge ${cls}">
            ${level}
          </span>
        </div>

        ${
          c.description
            ? `<p class="queue-description">
                ${escapeHtml(c.description)}
              </p>`
            : ""
        }

        <div class="queue-meta" style="margin-top:10px">
          Score:
          <span class="score">${score}</span>
          · Severity:
          ${severityNames[c.severity]}
        </div>
      </article>
    `;
  }).join("");

  renderMetrics();
  renderChart();
}

function renderMetrics() {
  const metrics = document.getElementById("metrics");

  const totalPeople = complaints.reduce(
    (sum, c) => sum + Number(c.affected),
    0
  );

  const emergency = complaints.filter(
    c => priority(scoreComplaint(c))[0] === "Emergency"
  ).length;

  metrics.innerHTML = `
    <div class="metric">
      <strong>${complaints.length}</strong>
      <span>Complaints</span>
    </div>

    <div class="metric">
      <strong>${totalPeople.toLocaleString()}</strong>
      <span>People affected</span>
    </div>

    <div class="metric">
      <strong>${emergency}</strong>
      <span>Emergency</span>
    </div>
  `;
}

function renderChart() {
  const svg = document.getElementById("pieChart");
  const legend = document.getElementById("pieLegend");

  const counts = {
    Emergency: 0,
    High: 0,
    Medium: 0,
    Monitor: 0
  };

  complaints.forEach(function (c) {
    counts[priority(scoreComplaint(c))[0]]++;
  });

  const colors = {
    Emergency: "#c94a4a",
    High: "#df8b32",
    Medium: "#d0ad2e",
    Monitor: "#6e9d7e"
  };

  const total = complaints.length || 1;

  let start = 0;

  const cx = 110;
  const cy = 110;
  const r = 82;

  svg.innerHTML = "";

  Object.entries(counts).forEach(function ([name, count]) {
    if (!count) return;

    const angle = (count / total) * Math.PI * 2;
    const end = start + angle;

    const x1 =
      cx + r * Math.cos(start - Math.PI / 2);

    const y1 =
      cy + r * Math.sin(start - Math.PI / 2);

    const x2 =
      cx + r * Math.cos(end - Math.PI / 2);

    const y2 =
      cy + r * Math.sin(end - Math.PI / 2);

    const large = angle > Math.PI ? 1 : 0;

    const path = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );

    path.setAttribute(
      "d",
      `M ${cx} ${cy}
       L ${x1} ${y1}
       A ${r} ${r} 0 ${large} 1 ${x2} ${y2}
       Z`
    );

    path.setAttribute("fill", colors[name]);
    path.setAttribute("stroke", "#fff");
    path.setAttribute("stroke-width", "3");

    svg.appendChild(path);

    start = end;
  });

  legend.innerHTML = Object.entries(counts)
    .filter(([, count]) => count)
    .map(function ([name, count]) {
      return `
        <div class="legend-item">
          <i style="background:${colors[name]}"></i>
          ${name}: ${count}
        </div>
      `;
    })
    .join("");
}

document
  .getElementById("severity")
  .addEventListener("input", function (e) {
    document.getElementById("severityLabel").textContent =
      severityNames[e.target.value];
  });

document
  .getElementById("complaintForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    const form = new FormData(e.target);

    complaints.push({
      title: form.get("title"),
      location: form.get("location"),
      category: form.get("category"),
      affected: Number(form.get("affected")),
      severity: Number(form.get("severity")),
      placeImportance: form.get("placeImportance"),
      description: form.get("description")
    });

    e.target.reset();

    document.getElementById("affected").value = 50;
    document.getElementById("severity").value = 3;
    document.getElementById("severityLabel").textContent = "Moderate";

    renderQueue();
  });

renderQueue();
