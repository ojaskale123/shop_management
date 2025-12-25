function getInventory() {
    return JSON.parse(localStorage.getItem("inventory")) || [];
}

function saveInventory(data) {
    localStorage.setItem("inventory", JSON.stringify(data));
}

/* ADD STOCK */
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

/* LOAD DASHBOARD */
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

/* SELL PRODUCT */
function loadSell() {
    const box = document.getElementById("sell");
    if (!box) return;

    box.innerHTML = "";
    getInventory().forEach(p => {
        box.innerHTML += `
        <div class="card">
            <b>${p.name}</b><br>
            Qty: ${p.qty}<br><br>
            <button class="button" onclick="sell('${p.name}')">Sell 1</button>
        </div>`;
    });
}

function sell(name) {
    let inventory = getInventory();
    let item = inventory.find(p => p.name === name);

    if (!item || item.qty <= 0) {
        alert("Out of stock");
        return;
    }

    item.qty -= 1;
    saveInventory(inventory);
    loadSell();
}
