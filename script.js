// ================================
// LOAD DATA
// ================================
let stock = JSON.parse(localStorage.getItem("stock")) || [];
let history = JSON.parse(localStorage.getItem("history")) || [];

// TEMP QUANTITIES FOR SELLING
let sellQty = {};

// ================================
// SAVE DATA
// ================================
function saveData() {
  localStorage.setItem("stock", JSON.stringify(stock));
  localStorage.setItem("history", JSON.stringify(history));
}

// ================================
// ADD STOCK
// ================================
function addStock() {
  let name = document.getElementById("productName").value.trim();
  let quantity = parseFloat(document.getElementById("productQuantity").value);
  let unit = document.getElementById("unit").value;

  if (!name || !quantity) {
    alert("Enter valid name and quantity");
    return;
  }

  let existing = stock.find(
    item => item.name.toLowerCase() === name.toLowerCase() && item.unit === unit
  );

  if (existing) {
    existing.quantity += quantity;
  } else {
    stock.push({ name, quantity, unit });
  }

  // STORE DATE AS ISO STRING FOR CONSISTENT PARSING
  history.push({
    date: new Date().toISOString(),
    product: name,
    quantity,
    unit,
    type: "Add"
  });

  saveData();

  alert("Stock added!");
  document.getElementById("productName").value = "";
  document.getElementById("productQuantity").value = "";

  updateDashboard();
}

// ================================
// DASHBOARD COUNTS
// ================================
function updateDashboard() {
  let totalItems = stock.length;
  let outStockItems = stock.filter(i => i.quantity === 0).length;
  let lowStockItems = stock.filter(i => i.quantity > 0 && i.quantity <= 10).length;

  let t = document.getElementById("totalStock");
  let o = document.getElementById("outStock");
  let l = document.getElementById("lowStock");

  if (t) t.innerText = totalItems;
  if (o) o.innerText = outStockItems;
  if (l) l.innerText = lowStockItems;
}

// ================================
// DASHBOARD → OPEN FILTERED LIST
// ================================
function openStockList(type) {
  localStorage.setItem("stockViewType", type);
  window.location.href = "stock-list.html";
}

// ================================
// STOCK LIST PAGE LOGIC
// ================================
function renderFilteredStock() {
  let type = localStorage.getItem("stockViewType") || "all";
  let search = document.getElementById("searchItem")?.value.toLowerCase() || "";
  let list = document.getElementById("stockList");
  if (!list) return;

  list.innerHTML = "";

  let filtered = stock.filter(item => {
    if (type === "out") return item.quantity === 0;
    if (type === "low") return item.quantity > 0 && item.quantity <= 10;
    return true;
  });

  filtered
    .filter(item => item.name.toLowerCase().includes(search))
    .forEach(item => {
      let li = document.createElement("li");
      li.style.background = "#232323";
      li.style.padding = "15px";
      li.style.borderRadius = "12px";
      li.style.marginBottom = "10px";
      li.style.listStyle = "none";

      li.innerHTML = `
        <strong>${item.name}</strong><br>
        <small>Available: ${item.quantity} ${item.unit}</small>
      `;

      if (item.quantity === 0) li.style.opacity = "0.6";

      list.appendChild(li);
    });
}

// ================================
// HISTORY PAGE
// ================================
function filterHistory() {
  let filter = document.getElementById("filterType")?.value || "daily";
  let search = document.getElementById("searchHistory")?.value.toLowerCase() || "";
  let list = document.getElementById("historyList");
  if (!list) return;

  list.innerHTML = "";
  let now = new Date();

  // SORT HISTORY DESCENDING
  const sortedHistory = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));

  sortedHistory
    .filter(record => {
      let recDate = new Date(record.date);

      // FILTER BY TIME
      if (filter === "daily" && recDate.toDateString() !== now.toDateString()) return false;
      if (filter === "weekly") {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        if (recDate < weekAgo) return false;
      }
      if (filter === "monthly") {
        if (recDate.getMonth() !== now.getMonth() || recDate.getFullYear() !== now.getFullYear()) return false;
      }

      // SEARCH BY PRODUCT OR DATE
      if (search) {
        const dateStr = recDate.toLocaleString().toLowerCase();
        if (!record.product.toLowerCase().includes(search) && !dateStr.includes(search)) return false;
      }

      return true;
    })
    .forEach(record => {
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${record.product} (${record.type})</strong>
        <small>Quantity: ${record.quantity} ${record.unit}</small>
        <small>Date: ${new Date(record.date).toLocaleString()}</small>
      `;
      list.appendChild(li);
    });
}

// SEARCH BAR FUNCTION
function searchHistory() {
  filterHistory();
}

// REAL-TIME UPDATES EVERY SECOND
setInterval(() => {
  filterHistory();
}, 1000);

// ================================
// SELL PAGE FIXES
// ================================
let intervalSell;
let currentChangeSell = null;

// POPULATE SELL LIST
function populateSell(list = stock) {
  const ul = document.getElementById("stockList");
  if (!ul) return;

  ul.innerHTML = "";

  const filtered = list.filter(item => item.quantity > 0);

  filtered.forEach(item => {
    if (sellQty[item.name] === undefined) sellQty[item.name] = 0;

    const step = (item.unit === "kg" || item.unit === "g") ? 0.1 : 1;

    const li = document.createElement("li");
    li.innerHTML = `
      <div style="flex:1; flex-direction: column;">
        <strong>${item.name}</strong>
        <small>Available: ${item.quantity} ${item.unit}</small>
      </div>
      <div style="display:flex; align-items:center; margin-top:10px;">
        <button class="qty-btn" 
          onmousedown="startChange('${item.name}', -${step})" 
          onmouseup="stopChange()" 
          onmouseleave="stopChange()" 
          ontouchstart="startChange('${item.name}', -${step})" 
          ontouchend="stopChange()">−</button>
        <input id="sellQty-${item.name}" value="${sellQty[item.name]}" 
          oninput="manualQty('${item.name}', ${item.quantity}, ${step})">
        <button class="qty-btn" 
          onmousedown="startChange('${item.name}', ${step})" 
          onmouseup="stopChange()" 
          onmouseleave="stopChange()" 
          ontouchstart="startChange('${item.name}', ${step})" 
          ontouchend="stopChange()">+</button>
      </div>
      <button class="btn" style="margin-top:10px;" onclick="confirmSell('${item.name}')">Confirm Sell</button>
    `;
    ul.appendChild(li);
  });
}

// SELL QUANTITY FUNCTIONS
function startChange(name, change) {
  currentChangeSell = {name, change};
  updateQty(name, change); // fix single-click
  intervalSell = setInterval(() => updateQty(name, change), 200);
}

function stopChange() {
  clearInterval(intervalSell);
  currentChangeSell = null;
}

function updateQty(name, change) {
  const item = stock.find(i => i.name === name);
  if (!item) return;

  let next = (sellQty[name] || 0) + change;

  if (item.unit === "kg" || item.unit === "g") {
    next = Math.round(next * 10) / 10;
  } else {
    next = Math.round(next);
  }

  if (next < 0) next = 0;
  if (next > item.quantity) next = item.quantity;

  sellQty[name] = next;
  const el = document.getElementById(`sellQty-${name}`);
  if (el) el.value = next;
}

// MANUAL INPUT
function manualQty(name, max, step) {
  let val = parseFloat(document.getElementById(`sellQty-${name}`).value);
  if (isNaN(val)) val = 0;

  const item = stock.find(i => i.name === name);
  if (!item) return;

  if (item.unit === "kg" || item.unit === "g") {
    val = Math.round(val * 10) / 10;
  } else {
    val = Math.round(val);
  }

  if (val < 0) val = 0;
  if (val > item.quantity) val = item.quantity;

  sellQty[name] = val;
  document.getElementById(`sellQty-${name}`).value = val;
}

// CONFIRM SELL
function confirmSell(name) {
  const qty = sellQty[name];
  if (!qty || qty <= 0) return alert("Select quantity to sell");

  const item = stock.find(i => i.name === name);
  if (!item) return;

  item.quantity -= qty;

  history.push({
    date: new Date().toISOString(),
    product: item.name,
    quantity: qty,
    unit: item.unit,
    type: "Sell"
  });

  sellQty[name] = 0;
  saveData();
  alert(`Sold ${qty} of ${item.name}`);

  populateSell();
  updateDashboard();
  filterHistory();
}

// ================================
// INIT
// ================================
updateDashboard();
filterHistory();
populateSell();
