/* ================= STORAGE ================= */
function getInventory() { return JSON.parse(localStorage.getItem("inventory")) || []; }
function saveInventory(data) { localStorage.setItem("inventory", JSON.stringify(data)); }

/* ================= HISTORY ================= */
function getHistory() { return JSON.parse(localStorage.getItem("history")) || []; }
function saveHistory(data) { localStorage.setItem("history", JSON.stringify(data)); }

/* ================= ADD STOCK ================= */
function addStock() {
    const name = document.getElementById("name").value.trim();
    const qty = parseFloat(document.getElementById("qty").value);
    const unit = document.getElementById("unit").value;

    if (!name || isNaN(qty)) { alert("Enter product name & quantity"); return; }

    let inventory = getInventory();
    const exist = inventory.find(i => i.name.toLowerCase() === name.toLowerCase() && i.unit === unit);

    if (exist) { exist.qty += qty; } 
    else { inventory.push({ name, qty, unit }); }

    saveInventory(inventory);
    addHistory(`Added ${qty} ${unit} of ${name}`);
    document.getElementById("name").value = ""; 
    document.getElementById("qty").value = "";
    alert("Stock added successfully");
    loadDashboard();
}

/* ================= DASHBOARD ================= */
function loadDashboard() {
    const inv = getInventory();
    document.getElementById("totalItems").innerText = inv.length;
    document.getElementById("lowItems").innerText = inv.filter(i => i.qty > 0 && i.qty <= 10).length;
    document.getElementById("outItems").innerText = inv.filter(i => i.qty === 0).length;
}

function filterInventory(type) {
    localStorage.setItem("filterType", type);
    location.href = "inventory.html";
}

/* ================= INVENTORY PAGE ================= */
function loadInventory() {
    const list = document.getElementById("inventoryList");
    if (!list) return;
    const filter = localStorage.getItem("filterType") || "all";
    const inv = getInventory();
    list.innerHTML = "";
    inv.forEach(item => {
        if (filter === "low" && !(item.qty > 0 && item.qty <= 10)) return;
        if (filter === "out" && item.qty !== 0) return;
        const status = item.qty === 0 ? "status-out" : (item.qty <= 5 ? "status-low" : "status-in");
        list.innerHTML += `<div class="inventory-item"><span>${item.name}</span><span class="${status}">${item.qty} ${item.unit}</span></div>`;
    });
    localStorage.removeItem("filterType");
}

function searchStock(text) {
    const list = document.getElementById("inventoryList");
    if (!list) return;
    const inv = getInventory();
    list.innerHTML = "";
    inv.forEach(item => {
        if (item.name.toLowerCase().includes(text.toLowerCase())) {
            const status = item.qty === 0 ? "status-out" : (item.qty <= 5 ? "status-low" : "status-in");
            list.innerHTML += `<div class="inventory-item"><span>${item.name}</span><span class="${status}">${item.qty} ${item.unit}</span></div>`;
        }
    });
}

/* ================= SUGGESTIONS ================= */
function suggestNames(value, boxId) {
    const box = document.getElementById(boxId);
    if (!box) return;
    box.innerHTML = "";
    if (!value.trim()) return;
    const inv = getInventory();
    const names = [...new Set(inv.map(i => i.name).filter(n => n.toLowerCase().startsWith(value.toLowerCase())))];
    names.forEach(name => {
        const div = document.createElement("div");
        div.innerText = name;
        div.onclick = () => {
            document.querySelector(`#${boxId === "nameSuggestions" ? "name" : "searchInput"}`).value = name;
            box.innerHTML = "";
            if (boxId === "searchSuggestions") renderSellList();
        };
        box.appendChild(div);
    });
}

/* ================= SELL PAGE ================= */
function loadSell() { renderSellList(); }

function renderSellList() {
    const box = document.getElementById("sell");
    if (!box) return;
    const text = document.getElementById("searchInput")?.value.toLowerCase() || "";
    const inv = getInventory();
    box.innerHTML = "";

    inv.forEach((item, index) => {
        if (item.qty <= 0) return;
        if (text && !item.name.toLowerCase().includes(text)) return;
        box.innerHTML += `
        <div class="card">
            <b>${item.name}</b> <small>(${item.unit})</small><br>
            Available: ${item.qty} ${item.unit}<br><br>
            <div style="display:flex; gap:12px; align-items:center;">
                <button class="button" onmousedown="holdChange(${index},-1)" onmouseup="clearHold()" ontouchstart="holdChange(${index},-1)" ontouchend="clearHold()">−</button>
                <span id="sellQty-${index}">1</span>
                <button class="button" onmousedown="holdChange(${index},1)" onmouseup="clearHold()" ontouchstart="holdChange(${index},1)" ontouchend="clearHold()">+</button>
            </div><br>
            <button class="button" onclick="confirmSell(${index})">Confirm Sell</button>
        </div>`;
    });
}

/* HOLD BUTTON SPEED */
let holdInterval;
function holdChange(index, delta) {
    changeQty(index, delta);
    holdInterval = setInterval(() => { changeQty(index, delta); }, 150);
}
function clearHold() { clearInterval(holdInterval); }

function changeQty(index, delta) {
    const span = document.getElementById(`sellQty-${index}`);
    if (!span) return;
    let v = parseFloat(span.innerText) + delta;
    if (v < 0.1) v = 0.1;
    span.innerText = v.toFixed(1);
}

function confirmSell(index) {
    let inv = getInventory();
    const qty = parseFloat(document.getElementById(`sellQty-${index}`).innerText);
    if (inv[index].qty < qty) return;
    inv[index].qty -= qty;
    saveInventory(inv);
    addHistory(`Sold ${qty} ${inv[index].unit} of ${inv[index].name}`);
    renderSellList();
    loadDashboard();
}

/* ================= HISTORY PAGE ================= */
function addHistory(text) {
    const hist = getHistory();
    hist.push({ text, date: new Date().toISOString() });
    saveHistory(hist);
}

function loadHistory() {
    const box = document.getElementById("historyList");
    if (!box) return;
    const hist = getHistory().reverse();
    hist.forEach(h => {
        box.innerHTML += `<div class="card">${new Date(h.date).toLocaleString()}: ${h.text}</div>`;
    });
}

function filterHistory(filter) {
    const box = document.getElementById("historyList");
    if (!box) return;
    const hist = getHistory().reverse();
    const now = new Date();
    box.innerHTML = "";
    hist.forEach(h => {
        const d = new Date(h.date);
        if (filter === "daily" && (d.toDateString() !== now.toDateString())) return;
        if (filter === "weekly" && ((now - d) / 1000 / 60 / 60 / 24 > 7)) return;
        if (filter === "monthly" && (now.getMonth() !== d.getMonth())) return;
        box.innerHTML += `<div class="card">${d.toLocaleString()}: ${h.text}</div>`;
    });
}
