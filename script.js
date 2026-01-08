// script.js
import { auth } from "./firebase.js";
import { loadUserData, saveUserData, listenUserData } from "./data.js";

// ================== GLOBALS ==================
window.stock = [];
window.cart = {};
window.history = [];

// ================== LOAD ALL DATA ==================
async function initData() {
  window.stock = await loadUserData("stock");
  window.cart = await loadUserData("cart");
  window.history = await loadUserData("history");

  updateCartBar();
  if (document.getElementById("stockList")) populateSell();
  if (document.getElementById("historyList")) renderHistory();
  if (document.getElementById("cartList")) renderCartPage();
}
initData();

// ================== REAL-TIME LISTENERS ==================
auth.onAuthStateChanged((user) => {
  if (!user) window.location.href = "login.html";
  else {
    listenUserData("stock", (data) => {
      window.stock = data;
      if (document.getElementById("stockList")) populateSell();
      if (document.getElementById("totalStock")) updateDashboard();
    });
    listenUserData("cart", (data) => {
      window.cart = data;
      updateCartBar();
      if (document.getElementById("cartList")) renderCartPage();
    });
    listenUserData("history", (data) => {
      window.history = data;
      if (document.getElementById("historyList")) renderHistory();
    });
  }
});

// ================== ADD STOCK ==================
window.addStock = async function () {
  const name = document.getElementById("productName").value.trim();
  const barcode = document.getElementById("productBarcode").value.trim();
  const quantity = parseFloat(document.getElementById("productQuantity").value);
  const unit = document.getElementById("unit").value;
  const price = parseFloat(document.getElementById("productPrice").value);

  if (!name || !barcode || isNaN(quantity) || isNaN(price)) return alert("Enter valid details");

  const existing = stock.find(i => i.barcode === barcode);
  if (existing) {
    existing.quantity += quantity;
    existing.name = name;
    existing.unit = unit;
    existing.price = price;
    alert("Stock updated successfully!");
  } else {
    stock.push({ name, barcode, quantity, unit, price });
    alert("Stock added successfully!");
  }

  await saveUserData("stock", stock);

  document.getElementById("productName").value = "";
  document.getElementById("productBarcode").value = "";
  document.getElementById("productQuantity").value = "";
  document.getElementById("productPrice").value = "";
};

// ================== POPULATE SELL PAGE ==================
window.populateSell = function (list = stock) {
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
          Price: ₹${item.price || "Not Set"}
          <button onclick="editItem('${item.barcode}')" class="edit-btn">✏</button>
        </small>
      </div>
      <div style="display:flex; gap:10px; margin-top:10px;">
        <button onclick="changeQty('${item.barcode}', -${step})">−</button>
        <input id="qty-${item.barcode}" value="${cart[item.barcode].qty}" style="width:50px; text-align:center;">
        <button onclick="changeQty('${item.barcode}', ${step})">+</button>
        <button onclick="addToCart('${item.barcode}')">Add</button>
      </div>
    `;
    ul.appendChild(li);
  });
};

// ================== EDIT ITEM ==================
window.editItem = async function (barcode) {
  const item = stock.find(i => i.barcode === barcode);
  if (!item) return;

  const newName = prompt("Edit Name:", item.name);
  if (newName === null) return;

  const newBarcode = prompt("Edit Barcode:", item.barcode);
  if (newBarcode === null) return;

  const newQuantity = Number(prompt("Edit Quantity:", item.quantity));
  const newPrice = Number(prompt("Edit Price:", item.price));
  if (!newName || isNaN(newQuantity) || isNaN(newPrice)) return alert("Invalid input");

  item.name = newName;
  item.barcode = newBarcode;
  item.quantity = newQuantity;
  item.price = newPrice;

  if (cart[barcode]) {
    cart[newBarcode] = { ...cart[barcode], price: newPrice };
    if (newBarcode !== barcode) delete cart[barcode];
    await saveUserData("cart", cart);
  }

  await saveUserData("stock", stock);
  populateSell();
  updateCartBar();
};

// ================== BARCODE SCAN ==================
document.addEventListener("DOMContentLoaded", () => {
  const barcodeInput = document.getElementById("barcodeInput");
  if (!barcodeInput) return;

  barcodeInput.focus();
  barcodeInput.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const code = barcodeInput.value.trim();
      const item = stock.find(i => i.barcode === code);
      if (!item) { alert("Item not found"); barcodeInput.value = ""; return; }

      if (!cart[item.barcode]) {
        cart[item.barcode] = { name: item.name, barcode: item.barcode, qty: 1, price: item.price, unit: item.unit };
      } else { cart[item.barcode].qty += 1; }

      await saveUserData("cart", cart);
      barcodeInput.value = "";
      updateCartBar();
    }
  });
});

// ================== MANUAL CART ==================
window.changeQty = function (barcode, change) {
  const item = stock.find(i => i.barcode === barcode);
  if (!item) return;
  if (!cart[barcode]) cart[barcode] = { qty: 0, price: item.price, unit: item.unit };

  let next = cart[barcode].qty + change;
  next = (item.unit === "kg" || item.unit === "g") ? Math.round(next * 10)/10 : Math.round(next);
  if (next < 0) next = 0;
  if (next > item.quantity) next = item.quantity;
  cart[barcode].qty = next;

  const input = document.getElementById(`qty-${barcode}`);
  if (input) input.value = next;
};

window.addToCart = async function (barcode) {
  const item = stock.find(i => i.barcode === barcode);
  if (!item || !cart[barcode] || cart[barcode].qty <= 0) return alert("Select quantity");

  cart[barcode].name = item.name;
  cart[barcode].barcode = item.barcode;

  await saveUserData("cart", cart);
  cart[barcode].qty = 0;

  const input = document.getElementById(`qty-${barcode}`);
  if (input) input.value = 0;

  updateCartBar();
};

// ================== CART BAR ==================
window.updateCartBar = function () {
  const bar = document.getElementById("cartBar");
  const info = document.getElementById("cartInfo");
  if (!bar) return;

  let items = 0, amount = 0;
  for (let k in cart) { items += cart[k].qty; amount += cart[k].qty * cart[k].price; }

  if (items > 0) {
    bar.style.display = "flex";
    info.innerText = `${items} items | ₹${amount}`;
  } else {
    bar.style.display = "none";
  }
};

// ================== DASHBOARD ==================
window.updateDashboard = function () {
  document.getElementById("totalStock").innerText = stock.length;
  document.getElementById("outStock").innerText = stock.filter(i=>i.quantity===0).length;
  document.getElementById("lowStock").innerText = stock.filter(i=>i.quantity>0 && i.quantity<=10).length;
};

// ================== HISTORY ==================
window.renderHistory = function () {
  const list = document.getElementById("historyList");
  if (!list) return;
  list.innerHTML = "";

  if (!history.length) { list.innerHTML = "<p>No history</p>"; return; }

  history.slice().reverse().forEach(h => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${h.type}</strong><br><small>${h.date}</small><br>${h.totalItems} items × ₹${h.totalAmount}<hr>`;
    list.appendChild(li);
  });
};

// ================== CART PAGE ==================
window.renderCartPage = function () {
  const list = document.getElementById("cartList");
  if (!list) return;
  const summary = document.getElementById("cartSummary");
  const empty = document.getElementById("emptyCart");

  const items = Object.keys(cart);
  list.innerHTML = "";

  if (!items.length) { empty.style.display="block"; summary.style.display="none"; return; }

  empty.style.display="none"; summary.style.display="block";

  let totalItems = 0, totalAmount = 0;
  items.forEach(k => {
    const data = cart[k];
    totalItems += data.qty;
    totalAmount += data.qty * data.price;

    const li = document.createElement("li");
    li.style.background = "#232323"; li.style.padding="12px"; li.style.marginBottom="10px"; li.style.borderRadius="12px";

    li.innerHTML = `
      <strong>${data.name}</strong>
      <div style="display:flex; justify-content:space-between; margin-top:5px;">
        <span>₹${data.price} × ${data.qty} ${data.unit}</span>
        <span>₹${data.qty*data.price}</span>
      </div>
      <div style="display:flex; gap:6px; margin-top:8px; align-items:center;">
        <button onclick="changeCartQty('${data.name}', -1)">−</button>
        <span>${data.qty}</span>
        <button onclick="changeCartQty('${data.name}', 1)">+</button>
        <button onclick="removeCartItem('${data.name}')">Remove</button>
      </div>
    `;
    list.appendChild(li);
  });

  document.getElementById("totalItems").innerText = totalItems;
  document.getElementById("totalAmount").innerText = totalAmount;
};
// Make functions accessible from HTML onclick
window.addStock = addStock;
window.editItem = editItem;
window.changeQty = changeQty;
window.addToCart = addToCart;
window.goToCart = goToCart;
window.searchStock = searchStock;
