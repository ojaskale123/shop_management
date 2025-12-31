// ================================
// LOAD DATA
// ================================
let stock = JSON.parse(localStorage.getItem("stock")) || [];
let history = JSON.parse(localStorage.getItem("history")) || [];
let cart = JSON.parse(localStorage.getItem("cart")) || {}; 
// cart format:
// {
//   "Rice": { qty: 2, price: 40, unit: "kg" }
// }

// ================================
// ADD STOCK FUNCTION (add.html)
// ================================
function addStock() {
  let name = document.getElementById("productName").value.trim();
  let quantity = parseFloat(document.getElementById("productQuantity").value);
  let unit = document.getElementById("unit").value;
  let price = parseFloat(document.getElementById("productPrice").value);

  if (!name || !quantity || isNaN(price)) {
    alert("Enter valid name, quantity, and price");
    return;
  }

  let existing = stock.find(
    item => item.name.toLowerCase() === name.toLowerCase() && item.unit === unit
  );

  if (existing) {
    existing.quantity += quantity;
    existing.price = price;
  } else {
    stock.push({ name, quantity, unit, price });
  }

  localStorage.setItem("stock", JSON.stringify(stock));

  document.getElementById("productName").value = "";
  document.getElementById("productQuantity").value = "";
  document.getElementById("productPrice").value = "";

  alert("Stock added successfully!");
}

// ================================
// SELL PAGE FUNCTIONS (sell.html)
// ================================
let intervalSell;

function populateSell(list = stock) {
  const ul = document.getElementById("stockList");
  if (!ul) return;

  ul.innerHTML = "";

  const filtered = list.filter(item => item.quantity > 0);

  filtered.forEach(item => {
    if (!cart[item.name]) cart[item.name] = { qty: 0, price: item.price, unit: item.unit };

    const step = (item.unit === "kg" || item.unit === "g") ? 0.1 : 1;

    const li = document.createElement("li");
    li.innerHTML = `
      <div style="flex:1; flex-direction: column;">
        <strong>${item.name}</strong>
        <small>Available: ${item.quantity} ${item.unit}</small>
        <small>Price: ₹${item.price}</small>
      </div>

      <div style="display:flex; align-items:center; margin-top:10px;">
        <button class="qty-btn"
          onmousedown="startChange('${item.name}', -${step})"
          onmouseup="stopChange()"
          onmouseleave="stopChange()">−</button>

        <input id="qty-${item.name}" value="${cart[item.name].qty}"
          oninput="manualQty('${item.name}', ${item.quantity})">

        <button class="qty-btn"
          onmousedown="startChange('${item.name}', ${step})"
          onmouseup="stopChange()"
          onmouseleave="stopChange()">+</button>
      </div>

      <button class="btn" style="margin-top:10px;" onclick="addToCart('${item.name}')">
        Add to Cart
      </button>
    `;
    ul.appendChild(li);
  });
}

function startChange(name, change) {
  updateQty(name, change);
  intervalSell = setInterval(() => updateQty(name, change), 200);
}

function stopChange() {
  clearInterval(intervalSell);
}

function updateQty(name, change) {
  const item = stock.find(i => i.name === name);
  if (!item) return;

  let next = (cart[name]?.qty || 0) + change;

  if (item.unit === "kg" || item.unit === "g")
    next = Math.round(next * 10) / 10;
  else
    next = Math.round(next);

  if (next < 0) next = 0;
  if (next > item.quantity) next = item.quantity;

  cart[name].qty = next;

  const input = document.getElementById(`qty-${name}`);
  if (input) input.value = next;
}

function manualQty(name, max) {
  let val = parseFloat(document.getElementById(`qty-${name}`).value);
  if (isNaN(val)) val = 0;
  if (val < 0) val = 0;
  if (val > max) val = max;

  cart[name].qty = val;
}

// ================================
// ADD TO CART (PRICE LOCKED HERE)
// ================================
function addToCart(name) {
  const selected = cart[name];
  if (!selected || selected.qty <= 0) {
    alert("Select quantity first");
    return;
  }

  const existingCart = JSON.parse(localStorage.getItem("cart")) || {};
  const item = stock.find(i => i.name === name);
  if (!item) return;

  if (!existingCart[name]) {
    existingCart[name] = {
      qty: selected.qty,
      price: item.price,
      unit: item.unit
    };
  } else {
    existingCart[name].qty += selected.qty;
  }

  localStorage.setItem("cart", JSON.stringify(existingCart));

  cart[name].qty = 0;
  const input = document.getElementById(`qty-${name}`);
  if (input) input.value = 0;

  updateCartBar();
}

// ================================
// CART BAR
// ================================
function updateCartBar() {
  const bar = document.getElementById("cartBar");
  const info = document.getElementById("cartInfo");
  if (!bar || !info) return;

  const currentCart = JSON.parse(localStorage.getItem("cart")) || {};
  let totalItems = 0;
  let totalAmount = 0;

  for (let name in currentCart) {
    totalItems += currentCart[name].qty;
    totalAmount += currentCart[name].qty * currentCart[name].price;
  }

  if (totalItems > 0) {
    bar.style.display = "flex";
    info.innerText = `${totalItems} items | ₹${totalAmount}`;
  } else {
    bar.style.display = "none";
  }
}

function goToCart() {
  if (document.getElementById("cartList")) renderCartPage();
  else window.location.href = "cart.html";
}

// ================================
// CART PAGE (cart.html)
// ================================
function renderCartPage() {
  const list = document.getElementById("cartList");
  const empty = document.getElementById("emptyCart");
  const summary = document.getElementById("cartSummary");
  if (!list || !empty || !summary) return;

  const currentCart = JSON.parse(localStorage.getItem("cart")) || {};
  const names = Object.keys(currentCart);

  list.innerHTML = "";

  if (names.length === 0) {
    empty.style.display = "block";
    summary.style.display = "none";
    return;
  }

  empty.style.display = "none";
  summary.style.display = "block";

  let totalItems = 0;
  let totalAmount = 0;

  names.forEach(name => {
    const data = currentCart[name];
    const amount = data.qty * data.price;

    totalItems += data.qty;
    totalAmount += amount;

    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${name}</strong>
      <div style="display:flex; justify-content:space-between;">
        <span>₹${data.price} × ${data.qty}</span>
        <span>₹${amount}</span>
      </div>

      <div style="display:flex; gap:6px; margin-top:8px;">
        <button class="qty-btn" onclick="changeCartQty('${name}', -1)">−</button>
        <span>${data.qty}</span>
        <button class="qty-btn" onclick="changeCartQty('${name}', 1)">+</button>
        <button class="btn" style="background:#ff4d4d; margin-left:auto;"
          onclick="removeCartItem('${name}')">Remove</button>
      </div>
    `;
    list.appendChild(li);
  });

  document.getElementById("totalItems").innerText = totalItems;
  document.getElementById("totalAmount").innerText = totalAmount;
}

function changeCartQty(name, change) {
  const currentCart = JSON.parse(localStorage.getItem("cart")) || {};
  if (!currentCart[name]) return;

  currentCart[name].qty += change;
  if (currentCart[name].qty <= 0) delete currentCart[name];

  localStorage.setItem("cart", JSON.stringify(currentCart));
  renderCartPage();
  updateCartBar();
}

function removeCartItem(name) {
  const currentCart = JSON.parse(localStorage.getItem("cart")) || {};
  delete currentCart[name];
  localStorage.setItem("cart", JSON.stringify(currentCart));
  renderCartPage();
  updateCartBar();
}

// ================================
// CHECKOUT
// ================================
function checkoutCart() {
  const currentCart = JSON.parse(localStorage.getItem("cart")) || {};
  if (!Object.keys(currentCart).length) return;

  for (let name in currentCart) {
    const item = stock.find(i => i.name === name);
    if (!item) continue;

    const data = currentCart[name];
    const amount = data.qty * data.price;

    item.quantity -= data.qty;

    history.push({
      date: new Date().toISOString(),
      product: name,
      quantity: data.qty,
      unit: data.unit,
      type: "Cart Sell",
      amount
    });
  }

  localStorage.removeItem("cart");
  localStorage.setItem("stock", JSON.stringify(stock));
  localStorage.setItem("history", JSON.stringify(history));

  renderCartPage();
  updateCartBar();
  alert("Payment marked as paid ✔");
}

// ================================
// INIT
// ================================
updateCartBar();
if (document.getElementById("cartList")) renderCartPage();
if (document.getElementById("stockList")) populateSell();
