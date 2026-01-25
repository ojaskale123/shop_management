import { onSnapshot } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import { auth, db } from "./firebase.js";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* ================= USER DATA REFS ================= */

function stockRef() {
  return collection(db, "users", auth.currentUser.uid, "stock");
}

function historyRef() {
  return collection(db, "users", auth.currentUser.uid, "history");
}

function cartRef() {
  return collection(db, "users", auth.currentUser.uid, "cart");
}

/* ================= LOCAL CACHE ================= */

let stock = [];
let cart = {};
let history = [];

/* ================= LOAD ALL ================= */

async function loadAll() {
  await loadStock();
  await loadCart();
  await loadHistory();
  updateCartBar();
  updateDashboard();
  if (document.getElementById("historyList")) renderHistory();
}

/* ================= STOCK ================= */

function listenStock() {
  onSnapshot(stockRef(), snap => {
    stock = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    populateSell();
    updateDashboard();
  });
}


async function addStock() {
  const name = productName.value.trim();
  const barcode = productBarcode.value.trim();
  const quantity = Number(productQuantity.value);
  const unit = document.getElementById("unit").value;
  const price = Number(productPrice.value);

  if (!name || !barcode || !quantity || !price) return alert("Fill all fields");

  const q = query(stockRef(), where("barcode", "==", barcode));
  const snap = await getDocs(q);

  if (!snap.empty) {
    const ref = snap.docs[0].ref;
    const data = snap.docs[0].data();

    await updateDoc(ref, {
      quantity: data.quantity + quantity,
      price,
      unit
    });
  } else {
    await addDoc(stockRef(), { name, barcode, quantity, unit, price });
  }

  loadStock();
}

/* ================= EDIT ================= */

async function editItem(barcode) {
  const item = stock.find(i => i.barcode === barcode);
  if (!item) return;

  const newName = prompt("Edit Name:", item.name);
  const newPrice = Number(prompt("Edit Price:", item.price));
  if (!newName || isNaN(newPrice)) return;

  await updateDoc(doc(db, "users", auth.currentUser.uid, "stock", item.id), {
    name: newName,
    price: newPrice
  });

  loadStock();
}

/* ================= SELL PAGE ================= */

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
        <strong>${item.name}</strong>
        <small>Available: ${item.quantity} ${item.unit}</small>
        <small>
          Price: ₹${item.price}
          <button onclick="editItem('${item.barcode}')" class="edit-btn">✏</button>
        </small>
      </div>
      <div style="display:flex; gap:10px; margin-top:10px;">
        <button class="qty-btn" onclick="changeQty('${item.barcode}', -${step})">−</button>
        <input id="qty-${item.barcode}" value="${cart[item.barcode].qty}" style="width:50px;text-align:center" 
        oninput="manualQty('${item.barcode}', this.value)">
        <button class="qty-btn" onclick="changeQty('${item.barcode}', ${step})">+</button>
        <button class="btn" onclick="addToCart('${item.barcode}')">Add</button>
      </div>
    `;
    ul.appendChild(li);
  });
}

/* ================= QTY ================= */

function manualQty(barcode, value) {
  const item = stock.find(i => i.barcode === barcode);
  if (!item) return;

  let num = parseFloat(value);
  if (isNaN(num) || num < 0) num = 0;
  if (num > item.quantity) num = item.quantity;

  cart[barcode].qty = num;
}

function changeQty(barcode, change) {
  const item = stock.find(i => i.barcode === barcode);
  if (!item) return;

  let next = cart[barcode].qty + change;
  if (item.unit === "kg" || item.unit === "g") next = Math.round(next * 10) / 10;
  else next = Math.round(next);

  if (next < 0) next = 0;
  if (next > item.quantity) next = item.quantity;

  cart[barcode].qty = next;
  document.getElementById(`qty-${barcode}`).value = next;
}

/* ================= CART ================= */

async function addToCart(barcode) {
  const item = stock.find(i => i.barcode === barcode);
  if (!item || cart[barcode].qty <= 0) return;

  const qty = cart[barcode].qty;
  cart[barcode].qty = 0;

  const q = query(cartRef(), where("barcode", "==", barcode));
  const snap = await getDocs(q);

  if (!snap.empty) {
    const ref = snap.docs[0].ref;
    const data = snap.docs[0].data();
    await updateDoc(ref, { qty: data.qty + qty });
  } else {
    await addDoc(cartRef(), { name: item.name, barcode, qty, price: item.price, unit: item.unit });
  }

  loadCart();
}

function listenCart() {
  onSnapshot(cartRef(), snap => {
    cart = {};
    snap.docs.forEach(d => {
      const i = d.data();
      cart[i.barcode] = i;
    });
    updateCartBar();
    if (document.getElementById("cartList")) renderCartPage();
  });
}


function updateCartBar() {
  const bar = document.getElementById("cartBar");
  const info = document.getElementById("cartInfo");
  if (!bar) return;

  let items = 0, amount = 0;
  Object.values(cart).forEach(i => {
    items += i.qty;
    amount += i.qty * i.price;
  });

  bar.style.display = items ? "flex" : "none";
  info.innerText = `${items} items | ₹${amount}`;
}

function goToCart() {
  location.href = "cart.html";
}

/* ================= CART PAGE ================= */

function renderCartPage() {
  const list = document.getElementById("cartList");
  const empty = document.getElementById("emptyCart");
  const summary = document.getElementById("cartSummary");
  if (!list) return;

  list.innerHTML = "";

  const keys = Object.keys(cart);
  if (!keys.length) {
    empty.style.display = "block";
    summary.style.display = "none";
    return;
  }

  empty.style.display = "none";
  summary.style.display = "block";

  let totalItems = 0, totalAmount = 0;

  keys.forEach(barcode => {
    const d = cart[barcode];
    const amount = d.qty * d.price;
    totalItems += d.qty;
    totalAmount += amount;

    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${d.name}</strong>
      <div style="display:flex; justify-content:space-between;">
        <span>${d.qty} × ₹${d.price}</span>
        <span>₹${amount}</span>
      </div>
      <button class="btn" onclick="removeCartItem('${barcode}')">Remove</button>
    `;
    list.appendChild(li);
  });

  totalItems.innerText = totalItems;
  totalAmount.innerText = totalAmount;
}

async function removeCartItem(barcode) {
  const q = query(cartRef(), where("barcode", "==", barcode));
  const snap = await getDocs(q);
  if (!snap.empty) await deleteDoc(snap.docs[0].ref);
  loadCart();
}

/* ================= CHECKOUT ================= */

async function checkoutCart() {
  if (!Object.keys(cart).length) return;

  const customerName = prompt("Customer name") || "Walk-in";
  const customerPhone = prompt("Phone") || "N/A";

  let totalItems = 0;
  let totalAmount = 0;

  for (let barcode in cart) {
    const d = cart[barcode];
    const item = stock.find(i => i.barcode === barcode);
    if (!item) continue;

    totalItems += d.qty;
    totalAmount += d.qty * d.price;

    await updateDoc(doc(db, "users", auth.currentUser.uid, "stock", item.id), {
      quantity: item.quantity - d.qty
    });
  }

  await addDoc(historyRef(), {
    customerName,
    customerPhone,
    totalItems,
    totalAmount,
    items: cart,
    date: new Date().toLocaleString()
  });

  const snap = await getDocs(cartRef());
  for (const d of snap.docs) await deleteDoc(d.ref);

  cart = {};
  loadAll();

  alert("Payment completed ✔");
}

/* ================= HISTORY ================= */

function listenHistory() {
  onSnapshot(historyRef(), snap => {
    history = snap.docs.map(d => d.data());
    if (document.getElementById("historyList")) renderHistory();
  });
}


function renderHistory() {
  const list = document.getElementById("historyList");
  if (!list) return;

  list.innerHTML = "";

  history.slice().reverse().forEach(h => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>Sale</strong><br>
      ₹${h.totalAmount}<br>
      ${h.customerName} (${h.customerPhone})<br>
      ${h.date}
      <hr>
    `;
    list.appendChild(li);
  });
}

/* ================= INIT ================= */

auth.onAuthStateChanged(user => {
  if (!user) return;
  listenStock();
  listenCart();
  listenHistory();
});
