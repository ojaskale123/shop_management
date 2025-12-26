/* ================= STORAGE ================= */
function getInventory() {
    return JSON.parse(localStorage.getItem("inventory")) || [];
}

function saveInventory(data) {
    localStorage.setItem("inventory", JSON.stringify(data));
}

function addStock() {
    const name = document.getElementById("name").value.trim();
    const qty = parseInt(document.getElementById("qty").value);

    if (!name || isNaN(qty)) {
        alert("Enter product name and quantity");
        return;
    }

    let stock = JSON.parse(localStorage.getItem("stock")) || [];

    // Check if product already exists
    const existing = stock.find(item => item.name.toLowerCase() === name.toLowerCase());

    if (existing) {
        existing.qty += qty;
    } else {
        stock.push({ name, qty });
    }

    localStorage.setItem("stock", JSON.stringify(stock));

    document.getElementById("name").value = "";
    document.getElementById("qty").value = "";

    alert("Stock added successfully");
}


/* ================= DASHBOARD ================= */
function loadDashboard() {
    updateStockAlertBadge();
    updateTotalStockCount();
}

/* ================= TOTAL STOCK COUNT ================= */
function updateTotalStockCount() {
    const badge = document.getElementById("totalStockCount");
    if (!badge) return;

    badge.innerText = getInventory().length;
}

/* ================= STOCK ALERT TOGGLE ================= */
function toggleStockAlert() {
    const panel = document.getElementById("stockAlertPanel");
    if (!panel) return;

    if (panel.style.display === "none" || panel.style.display === "") {
        renderStockAlerts();
        panel.style.display = "block";
    } else {
        panel.style.display = "none";
    }
}

/* ================= STOCK ALERT CONTENT ================= */
function renderStockAlerts() {
    const box = document.getElementById("stockAlertList");
    if (!box) return;

    const inventory = getInventory();
    box.innerHTML = "";

    const out = inventory.filter(i => i.qty === 0);
    const low = inventory.filter(i => i.qty > 0 && i.qty <= 10);

    if (out.length === 0 && low.length === 0) {
        box.innerHTML = `<small style="opacity:.7;">No stock issues 🎉</small>`;
        return;
    }

    if (out.length) {
        box.innerHTML += `<b>❌ Out of Stock</b>`;
        out.forEach(i => {
            box.innerHTML += `<div class="alert-item alert-out">• ${i.name}</div>`;
        });
    }

    if (low.length) {
        box.innerHTML += `<br><b>⚠️ Low Stock</b>`;
        low.forEach(i => {
            box.innerHTML += `
                <div class="alert-item alert-low">
                    • ${i.name} (${i.qty} left)
                </div>`;
        });
    }
}

/* ================= STOCK ALERT BADGE ================= */
function updateStockAlertBadge() {
    const badge = document.getElementById("stockAlertBadge");
    if (!badge) return;

    const inventory = getInventory();
    const count = inventory.filter(
        i => i.qty === 0 || (i.qty > 0 && i.qty <= 10)
    ).length;

    if (count > 0) {
        badge.innerText = count;
        badge.style.display = "flex";
    } else {
        badge.style.display = "none";
    }
}

/* ================= SELL PAGE ================= */
function loadSell() {
    renderSellList();
}

function renderSellList() {
    const box = document.getElementById("sell");
    const search = document.getElementById("search");
    if (!box) return;

    const text = search ? search.value.toLowerCase() : "";
    const inventory = getInventory();

    box.innerHTML = "";

    inventory.forEach((p, index) => {
        if (p.qty <= 0) return;
        if (text && !p.name.toLowerCase().includes(text)) return;

        box.innerHTML += `
        <div class="card">
            <b>${p.name}</b><br>
            Available: ${p.qty}<br><br>

            <div style="display:flex; gap:12px; align-items:center;">
                <button class="button" style="width:44px"
                    onclick="changeQty(${index}, -1)">−</button>

                <span id="sellQty-${index}">1</span>

                <button class="button" style="width:44px"
                    onclick="changeQty(${index}, 1)">+</button>
            </div><br>

            <button class="button"
                onclick="confirmSell(${index})">Confirm Sell</button>
        </div>`;
    });
}

function changeQty(index, delta) {
    const span = document.getElementById(`sellQty-${index}`);
    if (!span) return;

    let v = parseInt(span.innerText) + delta;
    if (v < 1) v = 1;
    span.innerText = v;
}

function confirmSell(index) {
    let inventory = getInventory();
    const qty = parseInt(
        document.getElementById(`sellQty-${index}`).innerText
    );

    if (inventory[index].qty < qty) return;

    inventory[index].qty -= qty;
    saveInventory(inventory);
    renderSellList();
    updateStockAlertBadge();
}

/* ================= NAME SUGGESTIONS ================= */
function suggestNames(value, boxId) {
    const box = document.getElementById(boxId);
    if (!box) return;

    box.innerHTML = "";
    if (!value.trim()) return;

    const names = [...new Set(
        getInventory()
            .map(i => i.name)
            .filter(n => n.toLowerCase().startsWith(value.toLowerCase()))
    )];

    names.forEach(name => {
        const div = document.createElement("div");
        div.innerText = name;
        div.onclick = () => {
            const input = boxId === "nameSuggestions"
                ? document.getElementById("name")
                : document.getElementById("search");

            if (input) input.value = name;
            box.innerHTML = "";
            renderSellList();
        };
        box.appendChild(div);
    });
}

/* ================= ACTIVE NAV ================= */
document.addEventListener("DOMContentLoaded", () => {
    const page = location.pathname.split("/").pop();
    document.querySelectorAll("nav a").forEach(a => {
        if (a.getAttribute("href") === page) {
            a.classList.add("active");
        }
    });
});
let stock = JSON.parse(localStorage.getItem("stock")) || [];

/* LOAD INVENTORY */
function loadInventory() {
    const list = document.getElementById("inventoryList");
    if (!list) return;

    list.innerHTML = "";

    stock.forEach(item => {
        let statusClass = "status-in";
        let statusText = "In Stock";

        if (item.qty === 0) {
            statusClass = "status-out";
            statusText = "Out";
        } else if (item.qty <= 5) {
            statusClass = "status-low";
            statusText = "Low";
        }

        list.innerHTML += `
            <div class="inventory-item">
                <span>${item.name}</span>
                <span class="${statusClass}">
                    ${item.qty} • ${statusText}
                </span>
            </div>
        `;
    });
}

/* SEARCH */
function searchStock(text) {
    const items = document.querySelectorAll(".inventory-item");

    items.forEach(item => {
        item.style.display = item.innerText
            .toLowerCase()
            .includes(text.toLowerCase())
            ? "flex"
            : "none";
    });
}

loadInventory();
