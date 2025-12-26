/***********************
  🔐 AUTH PROTECTION
************************/
import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

window.protectPage = function () {
  onAuthStateChanged(auth, (user) => {
    if (!user) window.location.href = "index.html";
  });
};

/***********************
  💾 LOCAL STORAGE HELPERS
************************/
function getStock() {
  return JSON.parse(localStorage.getItem("stock")) || [];
}

function saveStock(data) {
  localStorage.setItem("stock", JSON.stringify(data));
}

function getHistory() {
  return JSON.parse(localStorage.getItem("history")) || [];
}

function saveHistory(data) {
  localStorage.setItem("history", JSON.stringify(data));
}

/***********************
  ➕ ADD STOCK
************************/
window.addStock = function () {
  const name = document.getElementById("name").value.trim();
  const qty = parseFloat(document.getElementById("qty").value);
  const unit = document.getElementById("unit").value;

  if (!name || isNaN(qty)) {
    alert("Enter valid name and quantity");
    return;
  }

  const stock = getStock();
  const now = new Date().toISOString();
  const item = stock.find(i => i.name.toLowerCase() === name.toLowerCase());

  if (item) item.qty += qty;
  else stock.push({ name, qty, unit });

  saveStock(stock);

  const history = getHistory();
  history.push({ type: "added", name, qty, unit, date: now });
  saveHistory(history);

  document.getElementById("name").value = "";
  document.getElementById("qty").value = "";
  alert("Stock Added");
};

/***********************
  📊 DASHBOARD
************************/
window.loadDashboard = function () {
  const stock = getStock();
  document.getElementById("totalItems").innerText = stock.length;
  document.getElementById("lowItems").innerText =
    stock.filter(i => i.qty > 0 && i.qty <= 10).length;
  document.getElementById("outItems").innerText =
    stock.filter(i => i.qty === 0).length;
};

window.filterInventory = function (type) {
  let stock = getStock();
  if (type === "low") stock = stock.filter(i => i.qty > 0 && i.qty <= 10);
  if (type === "out") stock = stock.filter(i => i.qty === 0);

  localStorage.setItem("filteredInventory", JSON.stringify(stock));
  window.location.href = "inventory.html";
};

/***********************
  📋 INVENTORY
************************/
window.loadInventory = function () {
  const stock =
    JSON.parse(localStorage.getItem("filteredInventory")) || getStock();

  const box = document.getElementById("inventoryList");
  if (!box) return;
  box.innerHTML = "";

  stock.forEach(item => {
    let status = "In";
    let cls = "status-in";
    if (item.qty === 0) { status = "Out"; cls = "status-out"; }
    else if (item.qty <= 10) { status = "Low"; cls = "status-low"; }

    box.innerHTML += `
      <div class="inventory-item">
        <span>${item.name}</span>
        <span class="${cls}">${item.qty} ${item.unit} • ${status}</span>
      </div>`;
  });

  localStorage.removeItem("filteredInventory");
};

/***********************
  🔍 SEARCH + SUGGESTIONS
************************/
window.suggestNames = function (value, boxId) {
  const box = document.getElementById(boxId);
  if (!box) return;
  box.innerHTML = "";
  if (!value) return;

  const stock = getStock();
  const matches = stock
    .map(i => i.name)
    .filter(n => n.toLowerCase().startsWith(value.toLowerCase()));

  [...new Set(matches)].forEach(name => {
    const div = document.createElement("div");
    div.innerText = name;
    div.onclick = () => {
      const input = document.getElementById("searchInput") || document.getElementById("name");
      input.value = name;
      box.innerHTML = "";
    };
    box.appendChild(div);
  });
};

/***********************
  🛒 SELL
************************/
let holdTimer;

window.loadSell = function () {
  const box = document.getElementById("sell");
  if (!box) return;
  box.innerHTML = "";

  getStock().forEach((p, i) => {
    if (p.qty <= 0) return;

    box.innerHTML += `
      <div class="card">
        <b>${p.name}</b> (${p.unit})<br>
        Available: ${p.qty}<br><br>

        <button onmousedown="hold(${i},-1)" onmouseup="stopHold()">−</button>
        <span id="q-${i}">1</span>
        <button onmousedown="hold(${i},1)" onmouseup="stopHold()">+</button>

        <br><br>
        <button onclick="sellNow(${i})">Sell</button>
      </div>`;
  });
};

window.hold = function (i, d) {
  changeQty(i, d);
  holdTimer = setInterval(() => changeQty(i, d), 150);
};
window.stopHold = () => clearInterval(holdTimer);

function changeQty(i, d) {
  const s = document.getElementById(`q-${i}`);
  let v = parseFloat(s.innerText) + d;
  if (v < 0.01) v = 0.01;
  s.innerText = v.toFixed(2);
}

window.sellNow = function (i) {
  const stock = getStock();
  const qty = parseFloat(document.getElementById(`q-${i}`).innerText);
  if (qty > stock[i].qty) return alert("Not enough stock");

  stock[i].qty -= qty;
  saveStock(stock);

  const history = getHistory();
  history.push({
    type: "sold",
    name: stock[i].name,
    qty,
    unit: stock[i].unit,
    date: new Date().toISOString()
  });
  saveHistory(history);

  loadSell();
  if (document.getElementById("totalItems")) loadDashboard();
};

/***********************
  📜 HISTORY
************************/
window.loadHistory = function () {
  const filter = document.getElementById("historyFilter")?.value || "all";
  const list = document.getElementById("historyList");
  if (!list) return;

  const data = getHistory();
  list.innerHTML = "";
  const now = new Date();

  data.filter(h => {
    const d = new Date(h.date);
    if (filter === "daily") return d.toDateString() === now.toDateString();
    if (filter === "weekly") return now - d < 7 * 86400000;
    if (filter === "monthly") return d.getMonth() === now.getMonth();
    return true;
  }).forEach(h => {
    list.innerHTML += `
      <div class="card">
        ${h.type.toUpperCase()} • ${h.name} • ${h.qty} ${h.unit}
      </div>`;
  });
};
