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

/* ---------------- DASHBOARD ---------------- */
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
}

/* ---------------- INLINE EDIT ---------------- */
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

/* ---------------- DELETE ITEM ---------------- */
function deleteItem(index) {
    let inventory = getInventory();
    inventory.splice(index, 1);
    saveInventory(inventory);
    loadDashboard();
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
