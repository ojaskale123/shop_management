function getInventory() {
    return JSON.parse(localStorage.getItem("inventory")) || [];
}

function saveInventory(data) {
    localStorage.setItem("inventory", JSON.stringify(data));
}

/* ---------------- ADD STOCK ---------------- */
function addStock() {
    const name = document.getElementById("name").value.trim();
    const qty = parseInt(document.getElementById("qty").value);

    if (!name || qty <= 0) {
        alert("Enter valid details");
        return;
    }

    let inventory = getInventory();
    let item = inventory.find(p => p.name.toLowerCase() === name.toLowerCase());

    if (item) {
        item.qty += qty;
    } else {
        inventory.push({ name, qty });
    }

    saveInventory(inventory);
    alert("Stock Added");

    document.getElementById("name").value = "";
    document.getElementById("qty").value = "";
}

/* ---------------- DASHBOARD ---------------- */
function loadDashboard() {
    const box = document.getElementById("list");
    if (!box) return;

    box.innerHTML = "";
    getInventory().forEach(p => {
        box.innerHTML += `
        <div class="card">
            <b>${p.name}</b><br>
            Quantity: ${p.qty}<br>
            ${p.qty <= 10 ? '<span class="low">Low Stock</span>' : 'In Stock'}
        </div>`;
    });
}

/* ---------------- SELL PAGE ---------------- */
function loadSell() {
    renderSellList();
}

function renderSellList() {
    const box = document.getElementById("sell");
    const searchText = document.getElementById("search").value.toLowerCase();

    if (!box) return;
    box.innerHTML = "";

    let inventory = getInventory();

    inventory.forEach((p, index) => {
        // If search is empty → show all
        // If search has text → show only matching
        if (
            searchText === "" ||
            p.name.toLowerCase().includes(searchText)
        ) {
            box.innerHTML += `
            <div class="card">
                <b>${p.name}</b><br>
                Available: ${p.qty}<br><br>

                <div style="display:flex; gap:10px; align-items:center;">
                    <button class="button" style="width:40px;" onclick="changeQty(${index}, -1)">−</button>
                    <span id="sellQty-${index}">1</span>
                    <button class="button" style="width:40px;" onclick="changeQty(${index}, 1)">+</button>
                </div><br>

                <button class="button" onclick="confirmSell(${index})">
                    Confirm Sell
                </button>
            </div>`;
        }
    });
}

function changeQty(index, delta) {
    const span = document.getElementById(`sellQty-${index}`);
    let value = parseInt(span.innerText) + delta;
    if (value < 1) value = 1;
    span.innerText = value;
}

function confirmSell(index) {
    let inventory = getInventory();
    let qtyToSell = parseInt(
        document.getElementById(`sellQty-${index}`).innerText
    );

    if (inventory[index].qty < qtyToSell) {
        alert("Not enough stock");
        return;
    }

    inventory[index].qty -= qtyToSell;
    saveInventory(inventory);
    renderSellList();
}
