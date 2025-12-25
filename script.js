// Load inventory from localStorage
function getInventory() {
    return JSON.parse(localStorage.getItem("inventory")) || [];
}

// Save inventory
function saveInventory(data) {
    localStorage.setItem("inventory", JSON.stringify(data));
}

/* ---------------- ADD STOCK ---------------- */
function addStock() {
    const name = document.getElementById("productName").value.trim();
    const qty = parseInt(document.getElementById("productQty").value);

    if (!name || qty <= 0) {
        alert("Enter valid product & quantity");
        return;
    }

    let inventory = getInventory();
    let product = inventory.find(p => p.name.toLowerCase() === name.toLowerCase());

    if (product) {
        product.qty += qty;
    } else {
        inventory.push({ name, qty });
    }

    saveInventory(inventory);
    alert("Stock added successfully");
    document.getElementById("productName").value = "";
    document.getElementById("productQty").value = "";
}

/* ---------------- SELL PRODUCT ---------------- */
function sellProduct(name) {
    let inventory = getInventory();
    let product = inventory.find(p => p.name === name);

    if (!product || product.qty <= 0) {
        alert("Out of stock");
        return;
    }

    product.qty -= 1;
    saveInventory(inventory);
    loadSellList();
}

/* ---------------- LOAD DASHBOARD ---------------- */
function loadDashboard() {
    const list = document.getElementById("stockList");
    if (!list) return;

    list.innerHTML = "";
    let inventory = getInventory();

    inventory.forEach(p => {
        const status = p.qty <= 10 ? "🔴 Low Stock" : "🟢 In Stock";
        list.innerHTML += `
            <div class="card">
                <b>${p.name}</b><br>
                Qty: ${p.qty}<br>
                ${status}
            </div>
        `;
    });
}

/* ---------------- SELL PAGE LIST ---------------- */
function loadSellList() {
    const list = document.getElementById("sellList");
    if (!list) return;

    list.innerHTML = "";
    let inventory = getInventory();

    inventory.forEach(p => {
        list.innerHTML += `
            <div class="card">
                <b>${p.name}</b><br>
                Qty: ${p.qty}<br><br>
                <button class="button" onclick="sellProduct('${p.name}')">
                    Sell 1
                </button>
            </div>
        `;
    });
}
