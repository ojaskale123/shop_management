// ================= STORAGE =================
function getInventory() { return JSON.parse(localStorage.getItem("inventory")) || []; }
function saveInventory(data) { localStorage.setItem("inventory", JSON.stringify(data)); }

function addStock() {
    const name = document.getElementById("name").value.trim();
    const qty = parseFloat(document.getElementById("qty").value);
    const unit = document.getElementById("unit").value;

    if (!name || isNaN(qty)) { alert("Enter product name and quantity"); return; }

    let stock = JSON.parse(localStorage.getItem("stock")) || [];
    const existing = stock.find(item => item.name.toLowerCase() === name.toLowerCase());

    const now = new Date().toISOString();

    if (existing) {
        existing.qty += qty;
        existing.unit = unit;
        stock.push({history:'added', name, qty, unit, date:now});
    } else {
        stock.push({name, qty, unit});
        let history = JSON.parse(localStorage.getItem("history")) || [];
        history.push({history:'added', name, qty, unit, date:now});
        localStorage.setItem("history", JSON.stringify(history));
    }

    localStorage.setItem("stock", JSON.stringify(stock));

    document.getElementById("name").value = "";
    document.getElementById("qty").value = "";

    alert("Stock added successfully");
}

// ================= DASHBOARD =================
function loadDashboard() {
    const stock = JSON.parse(localStorage.getItem("stock")) || [];
    document.getElementById("totalItems").innerText = stock.length;
    document.getElementById("lowItems").innerText = stock.filter(i=>i.qty>0 && i.qty<=10).length;
    document.getElementById("outItems").innerText = stock.filter(i=>i.qty===0).length;
}

function filterInventory(type) {
    let stock = JSON.parse(localStorage.getItem("stock")) || [];
    if(type==='low') stock = stock.filter(i=>i.qty>0 && i.qty<=10);
    else if(type==='out') stock = stock.filter(i=>i.qty===0);
    localStorage.setItem("filteredInventory", JSON.stringify(stock));
    window.location.href = "inventory.html";
}

// ================= INVENTORY =================
function loadInventory() {
    let stock = JSON.parse(localStorage.getItem("filteredInventory")) || JSON.parse(localStorage.getItem("stock")) || [];
    const list = document.getElementById("inventoryList");
    list.innerHTML = "";
    stock.forEach(item=>{
        let statusClass="status-in", statusText="In Stock";
        if(item.qty===0){statusClass="status-out"; statusText="Out";}
        else if(item.qty<=10){statusClass="status-low"; statusText="Low";}
        list.innerHTML += `<div class="inventory-item"><span>${item.name}</span><span class="${statusClass}">${item.qty} • ${statusText}</span></div>`;
    });
    localStorage.removeItem("filteredInventory");
}

function searchStock(value){
    const stock = JSON.parse(localStorage.getItem("stock")) || [];
    const filtered = stock.filter(item=>item.name.toLowerCase().startsWith(value.toLowerCase()));
    const suggestions = document.getElementById("searchSuggestions");
    suggestions.innerHTML="";
    filtered.forEach(item=>{
        const div=document.createElement("div");
        div.innerText=item.name;
        div.onclick=()=>{document.querySelector('input[placeholder="Search product..."]').value=item.name; suggestions.innerHTML=""; loadInventory();}
        suggestions.appendChild(div);
    });
}

// ================= SELL =================
function loadSell(){
    const box = document.getElementById("sell");
    if(!box) return;
    const search=document.getElementById("searchInput")?.value.toLowerCase()||"";
    const stock = JSON.parse(localStorage.getItem("stock")) || [];
    box.innerHTML="";
    stock.forEach((p,index)=>{
        if(p.qty<=0) return;
        if(search && !p.name.toLowerCase().includes(search)) return;
        box.innerHTML+=`
        <div class="card">
            <b>${p.name}</b> (${p.unit})<br>
            Available: ${p.qty}<br><br>
            <div style="display:flex; gap:12px; align-items:center;">
                <button class="button" style="width:44px" onmousedown="holdChange(${index},-1)" onmouseup="stopHold()">−</button>
                <span id="sellQty-${index}">1</span>
                <button class="button" style="width:44px" onmousedown="holdChange(${index},1)" onmouseup="stopHold()">+</button>
            </div><br>
            <button class="button" onclick="confirmSell(${index})">Confirm Sell</button>
        </div>`;
    });
}

let holdInterval;
function holdChange(index,delta){
    changeQty(index,delta);
    holdInterval=setInterval(()=>changeQty(index,delta),200);
}
function stopHold(){clearInterval(holdInterval);}

function changeQty(index,delta){
    const span=document.getElementById(`sellQty-${index}`);
    if(!span) return;
    let v=parseFloat(span.innerText)+delta;
    if(v<0.01)v=0.01;
    span.innerText=v.toFixed(2);
}

function confirmSell(index){
    const stock=JSON.parse(localStorage.getItem("stock")) || [];
    const qty=parseFloat(document.getElementById(`sellQty-${index}`).innerText);
    if(stock[index].qty<qty) return;
    stock[index].qty-=qty;
    localStorage.setItem("stock",JSON.stringify(stock));

    // add to history
    let history=JSON.parse(localStorage.getItem("history")) || [];
    const now=new Date().toISOString();
    history.push({history:'sold',name:stock[index].name,qty:qty,unit:stock[index].unit,date:now});
    localStorage.setItem("history",JSON.stringify(history));

    loadSell();
    loadDashboard();
}

// ================= HISTORY =================
function loadHistory(){
    const filter=document.getElementById("historyFilter")?.value || "all";
    const history=JSON.parse(localStorage.getItem("history")) || [];
    const list=document.getElementById("historyList");
    list.innerHTML="";
    const now=new Date();
    let filtered=history;
    if(filter!=='all'){
        filtered=history.filter(h=>{
            const d=new Date(h.date);
            if(filter==='daily') return d.toDateString()===now.toDateString();
            if(filter==='weekly'){
                const weekStart=new Date(now); weekStart.setDate(now.getDate()-now.getDay());
                return d>=weekStart;
            }
            if(filter==='monthly') return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear();
        });
    }
    filtered.forEach(h=>{
        list.innerHTML+=`<div class="card">${h.history.toUpperCase()}: ${h.name} (${h.qty} ${h.unit})</div>`;
    });
}

// ================= NAME SUGGESTIONS =================
function suggestNames(value, boxId){
    const box=document.getElementById(boxId);
    if(!box) return;
    box.innerHTML="";
    if(!value.trim()) return;
    const names=[...new Set((JSON.parse(localStorage.getItem("stock"))||[]).map(i=>i.name).filter(n=>n.toLowerCase().startsWith(value.toLowerCase())))];
    names.forEach(name=>{
        const div=document.createElement("div");
        div.innerText=name;
        div.onclick=()=>{
            const input=boxId==="nameSuggestions"?document.getElementById("name"):document.getElementById("searchInput");
            if(input) input.value=name;
            box.innerHTML="";
            loadSell();
        };
        box.appendChild(div);
    });
}
