// ================================
// LOAD DATA
// ================================
let stock = JSON.parse(localStorage.getItem("stock")) || [];
let history = JSON.parse(localStorage.getItem("history")) || [];
let cart = JSON.parse(localStorage.getItem("cart")) || {};

// ================================
// ACTIVITY LOGGER
// ================================
function logActivity(type, message, extra = {}) {
  history.push({
    type,
    message,
    date: new Date().toLocaleString(),
    ...extra
  });
  localStorage.setItem("history", JSON.stringify(history));
}

// ================================
// ADD / REFILL STOCK
// ================================
function addStock() {
  let name = document.getElementById("productName").value.trim();
  let barcode = document.getElementById("productBarcode").value.trim();
  let quantity = parseFloat(document.getElementById("productQuantity").value);
  let unit = document.getElementById("unit").value;
  let price = parseFloat(document.getElementById("productPrice").value);

  if (!name || !barcode || isNaN(quantity) || isNaN(price)) {
    alert("Enter valid details");
    return;
  }

  const existing = stock.find(i => i.barcode === barcode);

  if (existing) {
    existing.quantity += quantity;
    existing.price = price;
    existing.unit = unit;
    logActivity("Stock Refilled", `${name} +${quantity} ${unit}`, { barcode, quantity });
  } else {
    stock.push({ name, barcode, quantity, unit, price });
    logActivity("Stock Added", `${name} (${quantity} ${unit}) added`, { barcode, quantity });
  }

  localStorage.setItem("stock", JSON.stringify(stock));
  alert("Stock saved");

  document.getElementById("productName").value = "";
  document.getElementById("productBarcode").value = "";
  document.getElementById("productQuantity").value = "";
  document.getElementById("productPrice").value = "";

  updateDashboard();
}

// ================================
// EDIT ITEM
// ================================
function editItem(barcode) {
  const item = stock.find(i => i.barcode === barcode);
  if (!item) return;

  const oldData = { ...item };

  let newName = prompt("Edit Name:", item.name);
  let newPrice = Number(prompt("Edit Price:", item.price));
  if (!newName || isNaN(newPrice)) return;

  item.name = newName;
  item.price = newPrice;

  localStorage.setItem("stock", JSON.stringify(stock));
  logActivity("Item Edited", `${oldData.name} updated`, { before: oldData, after: item });

  populateSell();
  updateDashboard();
}

// ================================
// POPULATE SELL PAGE
// ================================
function populateSell(list = stock) {
  const ul = document.getElementById("stockList");
  if (!ul) return;

  ul.innerHTML = "";

  list.filter(i => i.quantity > 0).forEach(item => {
    if (!cart[item.barcode]) cart[item.barcode] = { qty: 0, price: item.price, unit: item.unit };

    const step = (item.unit === "kg" || item.unit === "g") ? 0.1 : 1;

    const li = document.createElement("li");
    li.innerHTML = `
      <div class="item-info">
        <strong title="${item.name}">${item.name}</strong>
        <small>Available: ${item.quantity} ${item.unit}</small>
        <small>
          Price: ₹${item.price}
          <button onclick="editItem('${item.barcode}')" class="edit-btn">✏</button>
        </small>
      </div>

      <div style="display:flex; align-items:center; gap:10px; margin-top:10px;">
        <button class="qty-btn" onclick="changeQty('${item.barcode}', -${step})">−</button>
        <input id="qty-${item.barcode}" value="${cart[item.barcode].qty}" style="width:50px; text-align:center;" oninput="manualQty('${item.barcode}', this.value)">
        <button class="qty-btn" onclick="changeQty('${item.barcode}', ${step})">+</button>
        <button class="btn" onclick="addToCart('${item.barcode}')">Add</button>
      </div>
    `;
    ul.appendChild(li);
  });
}

// ================================
// MANUAL INPUT CHANGE
// ================================
function manualQty(barcode, value) {
  const item = stock.find(i => i.barcode === barcode);
  if (!item) return;

  let num = parseFloat(value);
  if (isNaN(num) || num < 0) num = 0;
  if (num > item.quantity) num = item.quantity;

  if (!cart[barcode]) cart[barcode] = { qty: 0, price: item.price, unit: item.unit };
  cart[barcode].qty = num;
}

// ================================
// CHANGE QTY IN SELL PAGE
// ================================
function changeQty(barcode, change) {
  const item = stock.find(i => i.barcode === barcode);
  if (!item) return;

  if (!cart[barcode]) cart[barcode] = { qty: 0, price: item.price, unit: item.unit };

  let next = cart[barcode].qty + change;
  if (item.unit === "kg" || item.unit === "g") next = Math.round(next * 10) / 10;
  else next = Math.round(next);

  if (next < 0) next = 0;
  if (next > item.quantity) next = item.quantity;

  cart[barcode].qty = next;
  const input = document.getElementById(`qty-${barcode}`);
  if (input) input.value = next;
}

// ================================
// ADD TO CART
// ================================
function addToCart(barcode) {
  const item = stock.find(i => i.barcode === barcode);
  if (!item || cart[barcode].qty <= 0) return;

  let liveCart = JSON.parse(localStorage.getItem("cart")) || {};

  if (!liveCart[barcode]) {
    liveCart[barcode] = { name: item.name, barcode, qty: cart[barcode].qty, price: item.price, unit: item.unit };
  } else {
    liveCart[barcode].qty += cart[barcode].qty;
  }

  logActivity("Cart Add", `${item.name} × ${cart[barcode].qty} added to cart`, { barcode, qty: cart[barcode].qty });

  cart[barcode].qty = 0;
  localStorage.setItem("cart", JSON.stringify(liveCart));
  updateCartBar();
  populateSell();
}

// ================================
// CART BAR
// ================================
function updateCartBar() {
  const bar = document.getElementById("cartBar");
  const info = document.getElementById("cartInfo");
  if (!bar) return;

  const liveCart = JSON.parse(localStorage.getItem("cart")) || {};
  let items = 0, amount = 0;

  for (let k in liveCart) {
    items += liveCart[k].qty;
    amount += liveCart[k].qty * liveCart[k].price;
  }

  bar.style.display = items ? "flex" : "none";
  info.innerText = `${items} items | ₹${amount}`;
}

function goToCart() {
  window.location.href = "cart.html";
}

// ================================
// CART PAGE FUNCTIONS
// ================================
function renderCartPage() {
  const list = document.getElementById("cartList");
  const empty = document.getElementById("emptyCart");
  const summary = document.getElementById("cartSummary");
  if (!list || !empty || !summary) return;

  const currentCart = JSON.parse(localStorage.getItem("cart")) || {};
  const keys = Object.keys(currentCart);

  list.innerHTML = "";

  if (keys.length === 0) {
    empty.style.display = "block";
    summary.style.display = "none";
    return;
  }

  empty.style.display = "none";
  summary.style.display = "block";

  let totalItems = 0;
  let totalAmount = 0;

  keys.forEach(barcode => {
    const data = currentCart[barcode];
    const amount = data.qty * data.price;

    totalItems += data.qty;
    totalAmount += amount;

    const li = document.createElement("li");
    li.style.background = "#232323";
    li.style.padding = "12px";
    li.style.borderRadius = "12px";
    li.style.marginBottom = "10px";

    li.innerHTML = `
      <strong>${data.name}</strong>
      <div style="display:flex; justify-content:space-between; margin-top:5px;">
        <span>₹${data.price} × ${data.qty} ${data.unit}</span>
        <span>₹${amount}</span>
      </div>
      <div style="display:flex; gap:6px; margin-top:8px; align-items:center;">
        <button class="qty-btn" onclick="changeCartQty('${barcode}', -1)">−</button>
        <span>${data.qty}</span>
        <button class="qty-btn" onclick="changeCartQty('${barcode}', 1)">+</button>
        <button class="btn" style="background:#ff4d4d; margin-left:auto;" onclick="removeCartItem('${barcode}')">Remove</button>
      </div>
    `;
    list.appendChild(li);
  });

  document.getElementById("totalItems").innerText = totalItems;
  document.getElementById("totalAmount").innerText = totalAmount;
}

// ================================
// CHANGE CART QTY / REMOVE
// ================================
function changeCartQty(barcode, change) {
  const currentCart = JSON.parse(localStorage.getItem("cart")) || {};
  if (!currentCart[barcode]) return;

  currentCart[barcode].qty += change;
  if (currentCart[barcode].qty <= 0) delete currentCart[barcode];

  localStorage.setItem("cart", JSON.stringify(currentCart));
  renderCartPage();
  updateCartBar();
}

function removeCartItem(barcode) {
  const currentCart = JSON.parse(localStorage.getItem("cart")) || {};
  delete currentCart[barcode];
  localStorage.setItem("cart", JSON.stringify(currentCart));
  renderCartPage();
  updateCartBar();
}

// ================================
// CHECKOUT (UPDATED)
// ================================
function checkoutCart() {
  const currentCart = JSON.parse(localStorage.getItem("cart")) || {};
  if (Object.keys(currentCart).length === 0) return;

  const customerName = prompt("Enter customer name") || "Walk-in Customer";
  const customerPhone = prompt("Enter customer phone number") || "N/A";

  let totalItems = 0;
  let totalAmount = 0;

  for (let barcode in currentCart) {
    const data = currentCart[barcode];
    const item = stock.find(i => i.barcode === barcode);
    if (!item) continue;

    item.quantity -= data.qty;
    totalItems += data.qty;
    totalAmount += data.qty * data.price;
  }

  history.push({
    type: "Sale",
    customerName,
    customerPhone,
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString(),
    totalItems,
    totalAmount,
    items: currentCart
  });

  localStorage.setItem("stock", JSON.stringify(stock));
  localStorage.setItem("history", JSON.stringify(history));
  localStorage.removeItem("cart");

  renderCartPage();
  updateCartBar();
  updateDashboard();

  alert(`Payment marked as paid ✔\nThank you ${customerName}`);
}

// ================================
// HISTORY PAGE
// ================================
function renderHistory() {
  const historyData = JSON.parse(localStorage.getItem("history")) || [];
  const list = document.getElementById("historyList");
  if (!list) return;

  list.innerHTML = "";

  if (historyData.length === 0) {
    list.innerHTML = "<p>No history available</p>";
    return;
  }

  historyData.slice().reverse().forEach(h => {
    const li = document.createElement("li");
    li.style.marginBottom = "12px";

    li.innerHTML = `
      <strong>${h.type}</strong><br>
      <small>${h.date || ""} ${h.time || ""}</small><br>
      <small>${h.customerName || ""} ${h.customerPhone || ""}</small><br>
      <span>${h.totalItems || 0} items × ₹${h.totalAmount || 0}</span>
      <hr>
    `;
    list.appendChild(li);
  });
}

// ================================
// INIT
// ================================
updateCartBar();
updateDashboard();
if (document.getElementById("stockList")) populateSell();
if (document.getElementById("historyList")) renderHistory();
