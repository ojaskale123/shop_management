// ================================
// LOAD DATA
// ================================
let stock = JSON.parse(localStorage.getItem("stock")) || [];
let history = JSON.parse(localStorage.getItem("history")) || [];
let groups = JSON.parse(localStorage.getItem("groups")) || [];

// TEMP QUANTITIES FOR SELLING
let sellQty = {};
let groupIdCounter = groups.length ? Math.max(...groups.map(g => g.id)) + 1 : 1;

// ================================
// SAVE DATA
// ================================
function saveData() {
  localStorage.setItem("stock", JSON.stringify(stock));
  localStorage.setItem("history", JSON.stringify(history));
  localStorage.setItem("groups", JSON.stringify(groups));
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
  document.getElementById("totalStock").innerText = stock.length;
  document.getElementById("outStock").innerText = stock.filter(i => i.quantity === 0).length;
  document.getElementById("lowStock").innerText = stock.filter(i => i.quantity > 0 && i.quantity <= 10).length;

  renderGroups();
}

// ================================
// DASHBOARD → GROUP CARDS (CHAI TEMPLATE)
// ================================
function addGroupCard() {
  groups.push({ id: groupIdCounter++, amount: 0 });
  saveData();
  renderGroups();
}

function renderGroups() {
  const container = document.getElementById("groupContainer");
  if (!container) return;
  container.innerHTML = "";

  groups.forEach(group => {
    const div = document.createElement("div");
    div.className = "group-card";
    div.innerHTML = `
      <strong>Group ${group.id}</strong>
      <div style="display:flex; align-items:center; gap:5px; margin-top:5px;">
        <button class="qty-btn" onclick="changeGroupAmount(${group.id}, -1)">−</button>
        <input type="number" id="group-${group.id}" value="${group.amount}" 
          oninput="manualGroupAmount(${group.id})" style="width:60px; text-align:center;">
        <button class="qty-btn" onclick="changeGroupAmount(${group.id}, 1)">+</button>
      </div>
      <div style="display:flex; justify-content:space-between; margin-top:5px;">
        <button class="btn" onclick="confirmGroup(${group.id})">Confirm</button>
        <button class="btn" style="background:#ff4d4d;" onclick="deleteGroup(${group.id})">🗑️ Delete</button>
      </div>
    `;
    container.appendChild(div);
  });
}

function changeGroupAmount(id, change) {
  const group = groups.find(g => g.id === id);
  if (!group) return;
  group.amount += change;
  if (group.amount < 0) group.amount = 0;
  document.getElementById(`group-${id}`).value = group.amount;
  saveData();
}

function manualGroupAmount(id) {
  const group = groups.find(g => g.id === id);
  if (!group) return;
  let val = parseFloat(document.getElementById(`group-${id}`).value);
  if (isNaN(val) || val < 0) val = 0;
  group.amount = val;
  saveData();
}

function confirmGroup(id) {
  const group = groups.find(g => g.id === id);
  if (!group || group.amount <= 0) return alert("Enter an amount");

  history.push({
    date: new Date().toISOString(),
    product: `Group ${group.id} Bill`,
    quantity: 1,
    unit: "bill",
    type: "Chai",
    amount: group.amount
  });

  alert(`Group ${group.id} confirmed: ₹${group.amount}`);
  groups = groups.filter(g => g.id !== id);
  saveData();
  renderGroups();
  filterHistory();
}

function deleteGroup(id) {
  if (confirm("Are you sure you want to delete this group?")) {
    groups = groups.filter(g => g.id !== id);
    saveData();
    renderGroups();
  }
}

// ================================
// HISTORY PAGE
// ================================
function filterHistory() {
  let filter = document.getElementById("filterType")?.value || "all";
  let search = document.getElementById("searchHistory")?.value.toLowerCase() || "";
  let list = document.getElementById("historyList");
  if (!list) return;

  list.innerHTML = "";
  let now = new Date();

  const sortedHistory = [...history].sort((a,b) => new Date(b.date) - new Date(a.date));

  sortedHistory
    .filter(record => {
      let recDate = new Date(record.date);

      if (filter === "daily" && recDate.toDateString() !== now.toDateString()) return false;
      if (filter === "weekly") {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        if (recDate < weekAgo) return false;
      }
      if (filter === "monthly") {
        if (recDate.getMonth() !== now.getMonth() || recDate.getFullYear() !== now.getFullYear()) return false;
      }

      if (search) {
        const dateStr = recDate.toLocaleString().toLowerCase();
        if (!record.product.toLowerCase().includes(search) && !(dateStr.includes(search))) return false;
      }

      return true;
    })
    .forEach(record => {
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${record.product} (${record.type})</strong>
        ${record.amount ? `<small>Amount: ₹${record.amount}</small>` : ""}
        <small>Quantity: ${record.quantity} ${record.unit}</small>
        <small>Date: ${new Date(record.date).toLocaleString()}</small>
      `;
      list.appendChild(li);
    });
}

function searchHistory() {
  filterHistory();
}

setInterval(() => filterHistory(), 1000);

// ================================
// SELL PAGE
// ================================
let intervalSell;
let currentChangeSell = null;

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
  if (item.unit === "kg" || item.unit === "g") next = Math.round(next * 10) / 10;
  else next = Math.round(next);

  if (next < 0) next = 0;
  if (next > item.quantity) next = item.quantity;

  sellQty[name] = next;
  const el = document.getElementById(`sellQty-${name}`);
  if (el) el.value = next;
}

function manualQty(name, max, step) {
  let val = parseFloat(document.getElementById(`sellQty-${name}`).value);
  if (isNaN(val)) val = 0;

  const item = stock.find(i => i.name === name);
  if (!item) return;

  if (item.unit === "kg" || item.unit === "g") val = Math.round(val * 10) / 10;
  else val = Math.round(val);

  if (val < 0) val = 0;
  if (val > item.quantity) val = item.quantity;

  sellQty[name] = val;
  document.getElementById(`sellQty-${name}`).value = val;
}

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
