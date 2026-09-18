// ==================== 選單資料 ====================
const MENU = {
  "人氣推薦": [
    { id: "special-milk-tea", name: "特選奶茶", price: 129 },
    { id: "black-tea-latte", name: "紅茶拿鐵", price: 120 },
    { id: "green-tea-latte", name: "綠茶拿鐵", price: 120 },
    { id: "oolong-tea", name: "高山烏龍", price: 90 },
  ],
  "鮮奶系列": [
    { id: "milk-tea", name: "鮮奶茶", price: 110 },
    { id: "milk-green", name: "鮮奶綠", price: 110 },
    { id: "milk-oolong", name: "鮮奶烏龍", price: 115 },
  ],
  "果茶系列": [
    { id: "passion-tea", name: "百香綠茶", price: 95 },
    { id: "lemon-tea", name: "檸檬紅茶", price: 90 },
    { id: "grapefruit-tea", name: "葡萄柚綠", price: 100 },
  ],
  "加料": [
    { id: "pearl", name: "珍珠", price: 15 },
    { id: "pudding", name: "布丁", price: 15 },
    { id: "taro", name: "芋圓", price: 20 },
    { id: "cheese", name: "起司奶蓋", price: 25 },
  ]
};

const SUGAR_OPTIONS = ["正常糖", "少糖", "半糖", "微糖", "無糖"];
const ICE_OPTIONS = ["正常冰", "少冰", "微冰", "去冰", "常溫", "熱"];
const EXTRA_OPTIONS = ["奶多茶少", "茶多奶少", "去茶葉", "多冰"];

// ==================== 狀態 ====================
let cart = [];
let currentOrderType = "外帶";
let selectedItem = null;
let selectedSugar = "無糖";
let selectedIce = "去冰";
let selectedExtras = ["奶多茶少"];
let printerIP = localStorage.getItem("printerIP") || "192.168.1.100";
let printerPort = localStorage.getItem("printerPort") || "9100";
let fontSize = localStorage.getItem("fontSize") || "medium";
let orderCounter = parseInt(localStorage.getItem("orderCounter") || "1");

// ==================== 初始化 ====================
document.addEventListener("DOMContentLoaded", () => {
  renderCategories();
  renderMenu(Object.keys(MENU)[0]);
  updateCartUI();
  updatePrinterStatus();

  // 事件綁定
  document.getElementById("btn-takeout").addEventListener("click", () => setOrderType("外帶"));
  document.getElementById("btn-dinein").addEventListener("click", () => setOrderType("內用"));
  document.getElementById("btn-clear").addEventListener("click", clearCart);
  document.getElementById("btn-checkout").addEventListener("click", openCheckout);
  document.getElementById("btn-settings").addEventListener("click", openSettings);
  document.getElementById("btn-save-settings").addEventListener("click", saveSettings);
  document.getElementById("btn-close-settings").addEventListener("click", closeSettings);
  document.getElementById("btn-test-print").addEventListener("click", testPrint);
  document.getElementById("btn-confirm-print").addEventListener("click", confirmAndPrint);
  document.getElementById("btn-cancel-checkout").addEventListener("click", () => {
    document.getElementById("checkout-modal").classList.remove("show");
  });
  document.getElementById("btn-confirm-options").addEventListener("click", addToCart);

  // 載入設定
  document.getElementById("input-printer-ip").value = printerIP;
  document.getElementById("input-printer-port").value = printerPort;
  document.getElementById("font-size").value = fontSize;
});

// ==================== 選單渲染 ====================
function renderCategories() {
  const tabs = document.getElementById("category-tabs");
  tabs.innerHTML = "";
  Object.keys(MENU).forEach((cat, idx) => {
    const btn = document.createElement("button");
    btn.className = "cat-btn" + (idx === 0 ? " active" : "");
    btn.textContent = cat;
    btn.onclick = () => {
      document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderMenu(cat);
    };
    tabs.appendChild(btn);
  });
}

function renderMenu(category) {
  const grid = document.getElementById("menu-grid");
  grid.innerHTML = "";
  MENU[category].forEach(item => {
    const div = document.createElement("div");
    div.className = "menu-item";
    div.innerHTML = `
      <div class="name">${item.name}</div>
      <div class="price">$${item.price}</div>
    `;
    div.onclick = () => selectItem(item);
    grid.appendChild(div);
  });
}

// ==================== 點餐流程 ====================
function selectItem(item) {
  selectedItem = item;
  selectedSugar = "無糖";
  selectedIce = "去冰";
  selectedExtras = ["奶多茶少"];

  // 顯示選項面板
  const panel = document.getElementById("options-panel");
  panel.style.display = "block";

  renderOptionButtons("sugar-options", SUGAR_OPTIONS, selectedSugar, (v) => selectedSugar = v);
  renderOptionButtons("ice-options", ICE_OPTIONS, selectedIce, (v) => selectedIce = v);
  renderOptionButtons("extra-options", EXTRA_OPTIONS, selectedExtras, (v) => {
    // 多選
    if (selectedExtras.includes(v)) {
      selectedExtras = selectedExtras.filter(x => x !== v);
    } else {
      selectedExtras.push(v);
    }
    renderOptionButtons("extra-options", EXTRA_OPTIONS, selectedExtras, arguments.callee);
  }, true);
}

function renderOptionButtons(containerId, options, selected, onSelect, multi = false) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "opt-btn";
    const isActive = multi ? selected.includes(opt) : selected === opt;
    if (isActive) btn.classList.add("active");
    btn.textContent = opt;
    btn.onclick = () => {
      onSelect(opt);
      // 重新渲染以更新 active
      if (multi) {
        renderOptionButtons(containerId, options, selectedExtras, onSelect, true);
      } else {
        renderOptionButtons(containerId, options, 
          containerId === "sugar-options" ? selectedSugar : selectedIce, 
          onSelect);
      }
    };
    container.appendChild(btn);
  });
}

function addToCart() {
  if (!selectedItem) return;

  const opts = [];
  if (selectedSugar) opts.push(selectedSugar);
  if (selectedIce) opts.push(selectedIce);
  selectedExtras.forEach(e => opts.push(e));

  cart.push({
    ...selectedItem,
    options: opts,
    qty: 1
  });

  selectedItem = null;
  document.getElementById("options-panel").style.display = "none";
  updateCartUI();
}

function setOrderType(type) {
  currentOrderType = type;
  document.querySelectorAll(".type-btn").forEach(b => b.classList.remove("active"));
  document.querySelector(`.type-btn[data-type="${type}"]`).classList.add("active");
}

function clearCart() {
  if (cart.length && !confirm("確定清空購物車？")) return;
  cart = [];
  updateCartUI();
}

function updateCartUI() {
  const list = document.getElementById("cart-list");
  const totalEl = document.getElementById("total-price");
  const checkoutBtn = document.getElementById("btn-checkout");

  if (cart.length === 0) {
    list.innerHTML = '<div class="empty-cart">尚未點餐</div>';
    totalEl.textContent = "$0";
    checkoutBtn.disabled = true;
    return;
  }

  let total = 0;
  list.innerHTML = "";
  cart.forEach((item, idx) => {
    total += item.price * item.qty;
    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <div class="info">
        <div class="name">${item.name} × ${item.qty}</div>
        <div class="opts">${item.options.join(" / ")}</div>
      </div>
      <div class="price">$${item.price * item.qty}</div>
      <button class="remove" onclick="removeFromCart(${idx})">×</button>
    `;
    list.appendChild(div);
  });
  totalEl.textContent = `$${total}`;
  checkoutBtn.disabled = false;
}

function removeFromCart(idx) {
  cart.splice(idx, 1);
  updateCartUI();
}

// ==================== 結帳 & 列印 ====================
function openCheckout() {
  if (cart.length === 0) return;
  const summary = document.getElementById("checkout-summary");
  let html = `<p><strong>類型：</strong>${currentOrderType}</p><ul style="margin:12px 0;padding-left:20px;">`;
  let total = 0;
  cart.forEach(item => {
    total += item.price * item.qty;
    html += `<li>${item.name} × ${item.qty}<br><small>${item.options.join(" / ")}</small></li>`;
  });
  html += `</ul><p style="font-size:1.2rem;font-weight:700;">合計：$${total}</p>`;
  summary.innerHTML = html;
  document.getElementById("checkout-modal").classList.add("show");
}

async function confirmAndPrint() {
  document.getElementById("checkout-modal").classList.remove("show");
  
  const orderNo = String(orderCounter).padStart(3, "0");
  orderCounter++;
  localStorage.setItem("orderCounter", orderCounter);

  // 為每一杯印一張標籤
  for (let i = 0; i < cart.length; i++) {
    const item = cart[i];
    for (let q = 0; q < item.qty; q++) {
      const ezpl = generateEZPL({
        orderType: currentOrderType,
        itemName: item.name,
        options: item.options,
        price: item.price,
        orderNo: orderNo,
        current: i + 1 + q,
        total: cart.reduce((s, c) => s + c.qty, 0),
        storeName: "樹林站前店"
      });
      await sendToPrinter(ezpl);
      // 稍微延遲避免塞車
      await sleep(300);
    }
  }

  alert(`訂單 #${orderNo} 已送出列印！`);
  cart = [];
  updateCartUI();
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ==================== EZPL 產生（參考圖片格式） ====================
function generateEZPL({ orderType, itemName, options, price, orderNo, current, total, storeName }) {
  const now = new Date();
  const dateStr = `${String(now.getMonth()+1).padStart(2,"0")}/${String(now.getDate()).padStart(2,"0")}`;
  const timeStr = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;

  // 字體大小對應 (小/中/大)
  // DT2x 203dpi，標籤約 40mm x 25mm → 約 320 x 200 dots
  // 使用不同字型放大倍數
  let fontMul = 1;
  let nameFont = "A";
  if (fontSize === "small") {
    fontMul = 1;
  } else if (fontSize === "medium") {
    fontMul = 2;
  } else {
    fontMul = 3;
  }

  // 客製選項字串
  const optStr = options.map(o => "•" + o).join("/");

  // EZPL 指令
  // ^Q 高度, gap
  // ^W 寬度
  // ^H 濃度
  // ^S 速度
  // ^P 張數
  // ^L ... E 標籤內容
  // A 指令：文字  At,x,y,xmul,ymul,gap,rotation,data

  const commands = [];
  commands.push("^Q25,2");           // 高度 25mm，gap 2mm
  commands.push("^W40");             // 寬度 40mm
  commands.push("^H10");             // 濃度
  commands.push("^S4");              // 速度
  commands.push("^P1");              // 1 張
  commands.push("^R0");              // 左邊距
  commands.push("^L");               // 開始標籤

  // === 左側黑條 + 外帶/內用 ===
  // 用矩形當黑底
  commands.push("R0,0,80,200,1,1");  // 左側黑色區域 (約 10mm 寬)

  // 白色文字「1 外帶」或「1 內用」
  // 因為黑底，用反白字比較難，改用粗體黑字在旁邊
  // 改成：左側放數字 + 類型
  const typeText = `1 ${orderType}`;
  commands.push(`AB,90,20,1,1,0,0,${typeText}`);

  // === 品名 ===
  commands.push(`AC,90,55,${fontMul},${fontMul},0,0,${itemName}`);

  // === 客製選項 ===
  commands.push(`AA,90,100,1,1,0,0,${optStr}`);

  // === 日期時間 + 店名 ===
  commands.push(`AA,90,140,1,1,0,0,${dateStr} ${timeStr}`);
  commands.push(`AA,90,160,1,1,0,0,${storeName}${storeName}`);

  // === 價格 ===
  commands.push(`AD,250,160,1,1,0,0,$${price}`);

  // === 進度 1/1 ===
  commands.push(`AB,90,185,1,1,0,0,${current}/${total}`);

  commands.push("E"); // 結束並列印

  return commands.join("\r\n") + "\r\n";
}

// ==================== 傳送至印表機 ====================
// 優先使用 Capacitor 原生 TCP（真正 APK 模式）
// 其次使用後端中繼，最後複製到剪貼簿

async function sendToPrinter(ezplData) {
  // 1. 原生 Capacitor TCP（APK 內建）
  if (window.Capacitor && window.Capacitor.isNativePlatform()) {
    try {
      // 使用 capacitor-tcp-socket 或相容 API
      const { TcpSocket } = await import('capacitor-tcp-socket').catch(() => ({}));
      
      if (TcpSocket && TcpSocket.connect) {
        const conn = await TcpSocket.connect({
          ipAddress: printerIP,
          port: parseInt(printerPort) || 9100
        });
        await TcpSocket.send({
          client: conn.client,
          data: ezplData
        });
        await TcpSocket.disconnect({ client: conn.client });
        console.log("原生 TCP 列印成功");
        return true;
      }

      // 備用：使用 Capacitor 自訂 plugin 介面
      if (window.Capacitor.Plugins && window.Capacitor.Plugins.TcpPrinter) {
        await window.Capacitor.Plugins.TcpPrinter.print({
          ip: printerIP,
          port: parseInt(printerPort) || 9100,
          data: ezplData
        });
        return true;
      }
    } catch (e) {
      console.error("原生 TCP 失敗，嘗試其他方式", e);
    }
  }

  // 2. 後端中繼（PWA / 瀏覽器模式）
  const backendUrl = localStorage.getItem("backendUrl") || "";
  if (backendUrl) {
    try {
      const res = await fetch(`${backendUrl}/print`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ip: printerIP,
          port: parseInt(printerPort),
          data: ezplData
        })
      });
      if (!res.ok) throw new Error("後端回應錯誤");
      return true;
    } catch (e) {
      console.error(e);
      alert("無法連線到列印中繼伺服器。\nEZPL 已複製到剪貼簿。");
      copyToClipboard(ezplData);
      return false;
    }
  }

  // 3. 最後手段：複製到剪貼簿
  copyToClipboard(ezplData);
  console.log("EZPL 指令：\n", ezplData);
  alert("目前在瀏覽器模式，無法直接列印。\n請使用 APK 版本，或設定後端中繼。\n指令已複製到剪貼簿。");
  return false;
}

function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => {});
  }
}

async function testPrint() {
  const ezpl = generateEZPL({
    orderType: "外帶",
    itemName: "特選奶茶",
    options: ["無糖", "去冰", "奶多茶少"],
    price: 129,
    orderNo: "000",
    current: 1,
    total: 1,
    storeName: "樹林站前店"
  });
  await sendToPrinter(ezpl);
  alert("測試標籤已送出（或已複製到剪貼簿）");
}

// ==================== 設定 ====================
function openSettings() {
  document.getElementById("settings-modal").classList.add("show");
}
function closeSettings() {
  document.getElementById("settings-modal").classList.remove("show");
}
function saveSettings() {
  printerIP = document.getElementById("input-printer-ip").value.trim();
  printerPort = document.getElementById("input-printer-port").value.trim();
  fontSize = document.getElementById("font-size").value;
  localStorage.setItem("printerIP", printerIP);
  localStorage.setItem("printerPort", printerPort);
  localStorage.setItem("fontSize", fontSize);
  updatePrinterStatus();
  closeSettings();
  alert("設定已儲存");
}
function updatePrinterStatus() {
  const el = document.getElementById("printer-ip-display");
  const dot = document.getElementById("printer-status");
  if (printerIP) {
    el.textContent = `印表機 ${printerIP}:${printerPort}`;
    dot.classList.add("online");
    dot.classList.remove("offline");
  } else {
    el.textContent = "印表機未設定";
    dot.classList.remove("online");
    dot.classList.add("offline");
  }
}
