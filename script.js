alert("SCRIPT LOADED");

import { auth } from "./firebase.js";
import { loadUserData, saveUserData } from "./data.js";

// ================================
// LOAD DATA (FROM FIRESTORE)
// ================================
let stock = [];
let history = [];
let cart = {};

async function loadAllData() {
  stock = await loadUserData("stock");
  history = await loadUserData("history");
  cart = await loadUserData("cart");

  updateCartBar();
  if (document.getElementById("stockList")) populateSell();
}

loadAllData();

// ================================
// ADD / REFILL STOCK FUNCTION
// ================================
async function addStock() {
  let name = document.getElementById("productName").value.trim();
  let barcode = document.getElementById("productBarcode").value.trim();
  let quantity = parseFloat(document.getElementById("productQuantity").value);
  let unit = document.getElementById("unit").value;
  let price = parseFloat(document.getElementById("productPrice").value);

  if (!name || !barcode || !quantity || isNaN(price)) {
    alert("Enter valid details");
    return;
  }

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
}

// ================================
// SELL PAGE LIST
// ================================
function populateSell(list = stock) {
  const ul = document.getElementById("stockList");
  if (!ul) return;

  ul.innerHTML = "";

  list.filter(item => item.quantity > 0).forEach(item => {
    if (!cart[item.barcode]) {
      cart[item.barcode] = { qty: 0, price: item.price, unit: item.unit };
    }

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

      <div style="display:flex; align-items:center; gap:10px; margin-top:10px;">
        <button class="qty-btn" onclick="changeQty('${item.barcode}', -${step})">−</button>
        <input id="qty-${item.barcode}" value="${cart[item.barcode].qty}" style="width:50px; text-align:center;">
        <button class="qty-btn" onclick="changeQty('${item.barcode}', ${step})">+</button>
        <button class="btn" onclick="addToCart('${item.barcode}')">Add</button>
      </div>
    `;
    ul.appendChild(li);
  });
}

// ================================
// EDIT ITEM
// ================================
async function editItem(barcode) {
  const item = stock.find(i => i.barcode === barcode);
  if (!item) return;

  let newName = prompt("Edit Name:", item.name);
  if (newName === null) return;

  let newBarcode = prompt("Edit Barcode:", item.barcode);
  if (newBarcode === null) return;

  let newQuantity = Number(prompt("Edit Quantity:", item.quantity));
  let newPrice = Number(prompt("Edit Price:", item.price));

  if (!newName || isNaN(newQuantity) || newQuantity < 0 || isNaN(newPrice) || newPrice < 0) {
    alert("Invalid input");
    return;
  }

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
}

// ================================
// BARCODE SCAN
// ================================
document.addEventListener("DOMContentLoaded", () => {
  const barcodeInput = document.getElementById("barcodeInput");
  if (!barcodeInput) return;

  barcodeInput.focus();

  barcodeInput.addEventListener("keydown", async e => {
    if (e.key === "Enter") {
      e.preventDefault();

      const code = barcodeInput.value.trim();
      if (!code) return;

      const item = stock.find(i => i.barcode === code);
      if (!item) {
        alert("Item not found");
        barcodeInput.value = "";
        return;
      }

      if (!item.price || item.price === 0) {
        alert("Please set price first");
        editItem(item.barcode);
        barcodeInput.value = "";
        return;
      }

      if (!cart[item.barcode]) {
        cart[item.barcode] = {
          name: item.name,
          barcode: item.barcode,
          qty: 1,
          price: item.price,
          unit: item.unit
        };
      } else {
        cart[item.barcode].qty += 1;
      }

      await saveUserData("cart", cart);
      barcodeInput.value = "";
      updateCartBar();
    }
  });
});

// ================================
// MANUAL CART
// ================================
function changeQty(barcode, change) {
  const item = stock.find(i => i.barcode === barcode);
  if (!item) return;

  if (!cart[barcode]) cart[barcode] = { qty: 0, price: item.price, unit: item.unit };

  let next = cart[barcode].qty + change;
  next = (item.unit === "kg" || item.unit === "g")
    ? Math.round(next * 10) / 10
    : Math.round(next);

  if (next < 0) next = 0;
  if (next > item.quantity) next = item.quantity;

  cart[barcode].qty = next;
  const input = document.getElementById(`qty-${barcode}`);
  if (input) input.value = next;
}

async function addToCart(barcode) {
  const item = stock.find(i => i.barcode === barcode);
  if (!item || !cart[barcode] || cart[barcode].qty <= 0) {
    alert("Select quantity");
    return;
  }

  cart[barcode].name = item.name;
  cart[barcode].barcode = item.barcode;

  await saveUserData("cart", cart);
  cart[barcode].qty = 0;

  const input = document.getElementById(`qty-${barcode}`);
  if (input) input.value = 0;

  updateCartBar();
}

// ================================
// CART BAR
// ================================
function updateCartBar() {
  const bar = document.getElementById("cartBar");
  const info = document.getElementById("cartInfo");
  if (!bar) return;

  let items = 0, amount = 0;
  for (let k in cart) {
    items += cart[k].qty;
    amount += cart[k].qty * cart[k].price;
  }

  if (items > 0) {
    bar.style.display = "flex";
    info.innerText = `${items} items | ₹${amount}`;
  } else {
    bar.style.display = "none";
  }
}

// ================================
// GO TO CART PAGE
// ================================
function goToCart() {
  for (let k in cart) {
    if (!cart[k].price || cart[k].price === 0) {
      alert("Please set price for all items");
      return;
    }
  }
  window.location.href = "cart.html";
}

// ================================
// SELL PAGE SEARCH
// ================================
function searchStock() {
  const input = document.getElementById("searchItem");
  if (!input) return;

  const query = input.value.toLowerCase();
  const filtered = stock.filter(item =>
    item.name.toLowerCase().includes(query)
  );
  populateSell(filtered);
}
