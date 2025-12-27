// ================================
// LOAD DATA
// ================================
let stock = JSON.parse(localStorage.getItem("stock")) || [];
let history = JSON.parse(localStorage.getItem("history")) || [];

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
// INIT
// ================================
updateDashboard();
