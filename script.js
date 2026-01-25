import { auth, db } from "./firebase.js";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* ================= SAFE REFS ================= */

const stockRef = () => collection(db, "users", auth.currentUser.uid, "stock");
const cartRef = () => collection(db, "users", auth.currentUser.uid, "cart");
const historyRef = () => collection(db, "users", auth.currentUser.uid, "history");

/* ================= STATE ================= */

let stock = [];
let cart = {};       // Firestore cart
let tempQty = {};    // Sell page buffer
let history = [];

/* ================= AUTH ================= */

auth.onAuthStateChanged(user => {
  if (!user) return (location.href = "login.html");
  listenStock();
  listenCart();
  listenHistory();
});

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
    const d = snap.docs[0];
    await updateDoc(d.ref, {
      quantity: d.data().quantity + quantity,
      price,
      unit
    });
  } else {
    await addDoc(stockRef(), { name, barcode, quantity, unit, price });
  }

  productName.value = "";
  productBarcode.value = "";
  productQuantity.value = "";
  productPrice.value = "";
}

async function editItem(barcode) {
  const item = stock.find(i => i.barcode === barcode);
  if (!item) return;

  const name = prompt("Edit name", item.name);
  const price = Number(prompt("Edit price", item.price));
  if (!name || isNaN(price)) return;

  await updateDoc(doc(db, "users", auth.currentUser.uid, "stock", item.id), {
    name,
    price
  });
}

/* ================= SELL ================= */

function populateSell() {
  const ul = document.getElementById("stockList");
  if (!ul) return;

  ul.innerHTML = "";

  stock.filter(i => i.quantity > 0).forEach(item => {
    if (tempQty[item.barcode] == null) tempQty[item.barcode] = 0;

    const step = item.unit === "kg" || item.unit === "g" ? 0.1 : 1;

    ul.innerHTML += `
      <li>
        <div class="item-info">
          <strong>${item.name}</strong>
          <small>Available: ${item.quantity} ${item.unit}</small>
          <small>₹${item.price}
            <button onclick="editItem('${item.barcode}')" class="edit-btn">✏</button>
          </small>
        </div>
        <div style="display:flex; gap:10px; margin-top:10px;">
          <button class="qty-btn" onclick="changeQty('${item.barcode}', -${step})">−</button>
          <input id="qty-${item.barcode}" value="${tempQty[item.barcode]}"
            style="width:50px;text-align:center"
            oninput="manualQty('${item.barcode}', this.value)">
          <button class="qty-btn" onclick="changeQty('${item.barcode}', ${step})">+</button>
          <button class="btn" onclick="addToCart('${item.barcode}')">Add</button>
        </div>
      </li>`;
  });
}

/* ================= QTY ================= */

function manualQty(barcode, v) {
  tempQty[barcode] = Number(v) || 0;
}

function changeQty(barcode, c) {
  tempQty[barcode] = Math.max(0, (tempQty[barcode] || 0) + c);
  document.getElementById(`qty-${barcode}`).value = tempQty[barcode];
}

/* ================= CART ================= */

async function addToCart(barcode) {
  const item = stock.find(i => i.barcode === barcode);
  const qty = tempQty[barcode];
  if (!item || qty <= 0) return;

  const q = query(cartRef(), where("barcode", "==", barcode));
  const snap = await getDocs(q);

  if (!snap.empty) {
    const d = snap.docs[0];
    await updateDoc(d.ref, { qty: d.data().qty + qty });
  } else {
    await addDoc(cartRef(), {
      name: item.name,
      barcode,
      qty,
      price: item.price,
      unit: item.unit
    });
  }

  tempQty[barcode] = 0;
  document.getElementById(`qty-${barcode}`).value = 0;
}

function listenCart() {
  onSnapshot(cartRef(), snap => {
    cart = {};
    snap.docs.forEach(d => (cart[d.data().barcode] = d.data()));
    updateCartBar();
    renderCartPage();
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
  if (!list) return;

  list.innerHTML = "";

  let ti = 0, ta = 0;

  Object.values(cart).forEach(i => {
    ti += i.qty;
    ta += i.qty * i.price;

    list.innerHTML += `
      <li>
        <strong>${i.name}</strong>
        <div style="display:flex;justify-content:space-between">
          <span>${i.qty} × ₹${i.price}</span>
          <span>₹${i.qty * i.price}</span>
        </div>
        <button class="btn" onclick="removeCartItem('${i.barcode}')">Remove</button>
      </li>`;
  });

  if (totalItems) totalItems.innerText = ti;
  if (totalAmount) totalAmount.innerText = ta;
}

async function removeCartItem(barcode) {
  const q = query(cartRef(), where("barcode", "==", barcode));
  const snap = await getDocs(q);
  if (!snap.empty) await deleteDoc(snap.docs[0].ref);
}

/* ================= CHECKOUT ================= */

async function checkoutCart() {
  let totalItems = 0, totalAmount = 0;

  for (const b in cart) {
    const d = cart[b];
    const item = stock.find(i => i.barcode === b);

    totalItems += d.qty;
    totalAmount += d.qty * d.price;

    await updateDoc(doc(db, "users", auth.currentUser.uid, "stock", item.id), {
      quantity: item.quantity - d.qty
    });
  }

  await addDoc(historyRef(), {
    totalItems,
    totalAmount,
    items: cart,
    date: new Date().toLocaleString()
  });

  const snap = await getDocs(cartRef());
  for (const d of snap.docs) await deleteDoc(d.ref);

  alert("Payment completed ✔");
}

/* ================= HISTORY ================= */

function listenHistory() {
  onSnapshot(historyRef(), snap => {
    history = snap.docs.map(d => d.data());
    renderHistory();
  });
}

function renderHistory() {
  const list = document.getElementById("historyList");
  if (!list) return;

  list.innerHTML = "";
  history.slice().reverse().forEach(h => {
    list.innerHTML += `
      <li>
        ₹${h.totalAmount}<br>
        ${h.date}
        <hr>
      </li>`;
  });
}

/* ================= DASHBOARD ================= */

function updateDashboard() {
  if (!totalStock) return;

  totalStock.innerText = stock.length;
  outStock.innerText = stock.filter(i => i.quantity === 0).length;
  lowStock.innerText = stock.filter(i => i.quantity > 0 && i.quantity < 5).length;
}

/* ================= EXPOSE ================= */

window.addStock = addStock;
window.editItem = editItem;
window.changeQty = changeQty;
window.manualQty = manualQty;
window.addToCart = addToCart;
window.goToCart = goToCart;
window.checkoutCart = checkoutCart;
window.removeCartItem = removeCartItem;
