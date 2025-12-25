/* ================= STORAGE ================= */
function getInventory() {
    return JSON.parse(localStorage.getItem("inventory")) || [];
}

function saveInventory(data) {
    localStorage.setItem("inventory", JSON.stringify(data));
}

/* ================= ADD STOCK ================= */
function addStock() {
    const name = document.getElementById("name").value.trim();
    const qty = parseInt(document.getElementById("qty").value);

    if (!name || qty <= 0) return;

    let inventory = getInventory();
    let item = inventory.find(p => p.name.toLowerCase() === name.toLowerCase());

    if (item) {
        item.qty += qty;
    } else {
        inventory.push({ name, qty });
    }

    saveInventory(inventory);

    document.getElementById("name").value = "";
    document.getElementById("qty").value = "";
}
updateStockAlertBadge();
document.getElementById("nameSuggestions").innerHTML = "";



/* ================= DASHBOARD ================= */
function loadDashboard() {
    const box = document.getElementById("list");
    if (!box) return;

    box.innerHTML = "";
    let inventory = getInventory();

    inventory.forEach((p, index) => {
        let status = "In Stock";
        if (p.qty === 0) status = "<span class='low'>Out of Stock</span>";
        else if (p.qty <= 10) status = "<span class='low'>Low Stock</span>";

        box.innerHTML += `
        <div class="card" style="position:relative;">

            <!-- Corner Actions -->
            <div style="
                position:absolute;
                top:10px;
                right:10px;
                display:flex;
                gap:8px;
                font-size:14px;
            ">
                <span style="cursor:pointer;"
                    onclick="enableEdit(${index})">✏️</span>
                <span style="cursor:pointer;"
                    onclick="deleteItem(${index})">🗑️</span>
            </div>

            <div id="name-${index}">
                <b>${p.name}</b>
            </div>

            Quantity: ${p.qty}<br>
            ${status}
        </div>`;
    });

    loadOutOfStock();
}

function toggleStockAlert() {
    const panel = document.getElementById("stockAlertPanel");

    if (panel.style.display === "none") {
        renderStockAlerts();
        panel.style.display = "block";
    } else {
        panel.style.display = "none";
    }
}

function renderStockAlerts() {
    const box = document.getElementById("stockAlertList");
    const inventory = getInventory();

    box.innerHTML = "";

    const outOfStock = inventory.filter(i => i.qty === 0);
    const lowStock = inventory.filter(i => i.qty > 0 && i.qty <= 10);

    if (outOfStock.length === 0 && lowStock.length === 0) {
        box.innerHTML = `<small style="opacity:0.7;">No stock issues 🎉</small>`;
        return;
    }

    if (outOfStock.length > 0) {
        box.innerHTML += `<b>❌ Out of Stock</b>`;
        outOfStock.forEach(item => {
            box.innerHTML += `
                <div class="alert-item alert-out">
                    • ${item.name}
                </div>
            `;
        });
    }

    if (lowStock.length > 0) {
        box.innerHTML += `<br><b>⚠️ Low Stock</b>`;
        lowStock.forEach(item => {
            box.innerHTML += `
                <div class="alert-item alert-low">
                    • ${item.name} (${item.qty} left)
                </div>
            `;
        });
    }
}


/* ================= OUT OF STOCK BLOCK ================= */
function loadOutOfStock() {
    const box = document.getElementById("outOfStockList");
    if (!box) return;

    const inventory = getInventory();
    const outItems = inventory.filter(item => item.qty === 0);

    box.innerHTML = "";

    if (outItems.length === 0) {
        box.innerHTML = `<small style="opacity:0.7;">All items are in stock 👍</small>`;
        return;
    }

    outItems.forEach(item => {
        box.innerHTML += `
            <div style="
                padding:6px 0;
                font-size:14px;
                color:#ff6b6b;
            ">
                • ${item.name}
            </div>
        `;
    });
}

/* ================= INLINE EDIT ================= */
function enableEdit(index) {
    let inventory = getInventory();
    const nameDiv = document.getElementById(`name-${index}`);

    nameDiv.innerHTML = `
        <input type="text"
            value="${inventory[index].name}"
            onblur="saveEdit(${index}, this.value)"
            style="
                width:100%;
                padding:6px;
                border-radius:6px;
                border:1px solid #ccc;
            "
            autofocus
        />
    `;
}

function saveEdit(index, value) {
    let inventory = getInventory();
    if (!value.trim()) {
        loadDashboard();
        return;
    }

    inventory[index].name = value.trim();
    saveInventory(inventory);
    loadDashboard();
}

/* ================= DELETE ITEM ================= */
function deleteItem(index) {
    let inventory = getInventory();
    inventory.splice(index, 1);
    saveInventory(inventory);
    loadDashboard();
}

/* ================= SELL PAGE ================= */
function loadSell() {
    renderSellList();
}

function renderSellList() {
    const box = document.getElementById("sell");
    const searchInput = document.getElementById("search");
    const searchText = searchInput ? searchInput.value.toLowerCase() : "";

    if (!box) return;

    box.innerHTML = "";
    let inventory = getInventory();

    inventory.forEach((p, index) => {

        // Hide out-of-stock items
        if (p.qty <= 0) return;

        if (
            searchText === "" ||
            p.name.toLowerCase().includes(searchText)
        ) {
            box.innerHTML += `
            <div class="card">
                <b>${p.name}</b><br>
                Available: ${p.qty}<br><br>

                <div style="display:flex; gap:10px; align-items:center;">
                    <button class="button" style="width:40px;"
                        onclick="changeQty(${index}, -1)">−</button>

                    <span id="sellQty-${index}">1</span>

                    <button class="button" style="width:40px;"
                        onclick="changeQty(${index}, 1)">+</button>
                </div><br>

                <button class="button"
                    onclick="confirmSell(${index})">
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

    if (inventory[index].qty < qtyToSell) return;

    inventory[index].qty -= qtyToSell;
    saveInventory(inventory);
    renderSellList();
}

/* ================= ACTIVE NAV ================= */
document.addEventListener("DOMContentLoaded", () => {
    const links = document.querySelectorAll("nav a");
    const currentPage = window.location.pathname.split("/").pop();

    links.forEach(link => {
        if (link.getAttribute("href") === currentPage) {
            link.classList.add("active");
        }
    });
});

function updateStockAlertBadge() {
    const badge = document.getElementById("stockAlertBadge");
    if (!badge) return;

    const inventory = getInventory();

    const outOfStock = inventory.filter(i => i.qty === 0).length;
    const lowStock = inventory.filter(i => i.qty > 0 && i.qty <= 10).length;

    const totalAlerts = outOfStock + lowStock;

    if (totalAlerts > 0) {
        badge.innerText = totalAlerts;
        badge.style.display = "flex";
    } else {
        badge.style.display = "none";
    }
}
function updateStockAlertBadge() {
    const badge = document.getElementById("stockAlertBadge");
    if (!badge) return;

    const inventory = getInventory();
    const count =
        inventory.filter(i => i.qty === 0 || (i.qty > 0 && i.qty <= 10)).length;

    if (count > 0) {
        badge.innerText = count;
        badge.style.display = "flex";
    } else {
        badge.style.display = "none";
    }
}
function suggestNames(value, boxId) {
    const box = document.getElementById(boxId);
    if (!box) return;

    box.innerHTML = "";

    if (!value.trim()) return;

    const inventory = getInventory();
    const matches = inventory
        .map(i => i.name)
        .filter(name =>
            name.toLowerCase().startsWith(value.toLowerCase())
        );

    // remove duplicates
    const unique = [...new Set(matches)];

    unique.forEach(name => {
        const div = document.createElement("div");
        div.innerText = name;
        div.onclick = () => {
            if (boxId === "nameSuggestions") {
                document.getElementById("name").value = name;
            } else {
                document.getElementById("search").value = name;
                renderSellList();
            }
            box.innerHTML = "";
        };
        box.appendChild(div);
    });
}
const s = document.getElementById("searchSuggestions");
if (s) s.innerHTML = "";
