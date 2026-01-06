// ================================
// LOAD DATA
// ================================
let stock = JSON.parse(localStorage.getItem("stock")) || [];
let history = JSON.parse(localStorage.getItem("history")) || [];
let cart = JSON.parse(localStorage.getItem("cart")) || {};

// ================================
// SELL PAGE LIST
// ================================
function populateSell(list = stock) {
  const ul = document.getElementById("stockList");
  if (!ul) return;

  ul.innerHTML = "";

  list.filter(item => item.quantity > 0).forEach(item => {
    if (!cart[item.barcode]) cart[item.barcode] = { qty: 0, price: item.price, unit: item.unit };

    const step = (item.unit === "kg" || item.unit === "g") ? 0.1 : 1;

    const li = document.createElement("li");

    li.innerHTML = `
      <div class="item-info">
        <strong title="${item.name}">${item.name}</strong>
        <small>Available: ${item.quantity} ${item.unit}</small>
        <small>
          Price: ₹${item.price || "Not Set"}
          <button onclick="editPrice('${item.barcode}')" class="edit-btn">✏</button>
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
// EDIT PRICE (SELL PAGE)
// ================================
function editPrice(barcode) {
  const item = stock.find(i => i.barcode === barcode);
  if (!item) return;

  let newPrice = prompt(`Set price for ${item.name}`, item.price || "");
  if (newPrice === null) return;

  newPrice = Number(newPrice);
  if (isNaN(newPrice) || newPrice < 0) {
    alert("Invalid price");
    return;
  }

  item.price = newPrice;
  localStorage.setItem("stock", JSON.stringify(stock));

  let liveCart = JSON.parse(localStorage.getItem("cart")) || {};
  if (liveCart[barcode]) {
    liveCart[barcode].price = newPrice;
    localStorage.setItem("cart", JSON.stringify(liveCart));
  }

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

  barcodeInput.addEventListener("keydown", e => {
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
        editPrice(item.barcode);
        barcodeInput.value = "";
        return;
      }

      let liveCart = JSON.parse(localStorage.getItem("cart")) || {};
      if (!liveCart[item.barcode]) {
        liveCart[item.barcode] = { name: item.name, barcode: item.barcode, qty: 1, price: item.price, unit: item.unit };
      } else {
        liveCart[item.barcode].qty += 1;
      }

      localStorage.setItem("cart", JSON.stringify(liveCart));
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
  if (item.unit === "kg" || item.unit === "g") next = Math.round(next * 10) / 10;
  else next = Math.round(next);

  if (next < 0) next = 0;
  if (next > item.quantity) next = item.quantity;

  cart[barcode].qty = next;
  const input = document.getElementById(`qty-${barcode}`);
  if (input) input.value = next;
}

function addToCart(barcode) {
  const item = stock.find(i => i.barcode === barcode);
  if (!item) return;

  if (!item.price || item.price === 0) {
    alert("Please set price first");
    editPrice(barcode);
    return;
  }

  if (!cart[barcode] || cart[barcode].qty <= 0) {
    alert("Select quantity");
    return;
  }

  let liveCart = JSON.parse(localStorage.getItem("cart")) || {};
  if (!liveCart[barcode]) {
    liveCart[barcode] = { ...cart[barcode], name: item.name, barcode: item.barcode };
  } else {
    liveCart[barcode].qty += cart[barcode].qty;
  }

  localStorage.setItem("cart", JSON.stringify(liveCart));
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

  const liveCart = JSON.parse(localStorage.getItem("cart")) || {};
  let items = 0, amount = 0;

  for (let k in liveCart) {
    items += liveCart[k].qty;
    amount += liveCart[k].qty * liveCart[k].price;
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
  const liveCart = JSON.parse(localStorage.getItem("cart")) || {};
  for (let k in liveCart) {
    if (!liveCart[k].price || liveCart[k].price === 0) {
      alert("Please set price for all items");
      return;
    }
  }
  window.location.href = "cart.html";
}

// ================================
// INIT
// ================================
updateCartBar();
if (document.getElementById("stockList")) populateSell();

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
