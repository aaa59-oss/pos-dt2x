# 點餐 POS APK（支援 GoDEX DT2x）

真正的 Android APK，內建 TCP 直接連線印表機，**不需要電腦跑 server、不需要 Termux**。

---

## 功能

- 內用 / 外帶切換
- 甜度、冰量、其他客製選項
- 一鍵結帳，每杯自動印一張標籤（4cm × 2.5cm 格式）
- 直接用 TCP 9100 送到 DT2x（固定 IP）
- 字體大小可選（小 / 中 / 大）

---

## 如何取得 APK（完全不需要自己的電腦）

### 方法 A：用 GitHub Actions 免費編譯（推薦）

1. 註冊 / 登入 [GitHub](https://github.com)（用手機瀏覽器即可）
2. 新建一個 **Public** Repository，名稱隨意（例如 `pos-dt2x`）
3. 把本資料夾所有檔案上傳到這個 Repository（可用 GitHub 手機 App 或網頁上傳）
4. 進入 Repository → 點上方 **Actions** 分頁
5. 選擇 **Build Android APK** → 點 **Run workflow**
6. 等待約 3～8 分鐘
7. 完成後點進該次 workflow → 下載 **Artifacts** 裡的 `pos-dt2x-debug.apk`
8. 傳到平板安裝即可

> 第一次編譯可能需要較久，之後會快很多。
> （此 workflow 已自動處理 TcpPrinterPlugin 的複製與註冊，不需手動操作。）

### 方法 B：用線上 APK 建構服務

把整個專案壓縮後，上傳到以下服務之一（有的免費用量有限）：

- [PWABuilder](https://www.pwabuilder.com/)（較適合 PWA）
- [AppyZeen](https://appyzeen.com/)
- 或其他「Website / Capacitor to APK」線上服務

---

## 專案結構說明

```
pos-dt2x-apk/
├── www/                    ← 點餐介面（HTML/CSS/JS）
│   ├── index.html
│   ├── app.js
│   ├── style.css
│   └── icon-*.png
├── android-plugin/         ← 原生 TCP 列印 Plugin 原始碼
│   └── TcpPrinterPlugin.java
├── .github/workflows/      ← GitHub Actions 自動編譯腳本
│   └── build-apk.yml
├── package.json
├── capacitor.config.json
└── README.md
```

---

## 本機編譯（如果有電腦的話）

```bash
npm install
npx cap add android
npx cap sync
npx cap open android
# 在 Android Studio 點 Build → Build APK(s)
```

記得把 `android-plugin/TcpPrinterPlugin.java` 放到正確的 package 路徑，並在 `MainActivity` 註冊 Plugin。

---

## 使用方式

1. 安裝 APK
2. 開啟 App → 點右下角 ⚙
3. 輸入 DT2x 的固定 IP（例如 `192.168.1.100`）
4. Port 保持 `9100`
5. 點「測試列印」
6. 開始點餐即可

---

## 注意事項

- 平板與 DT2x 必須在同一個 Wi-Fi / 區網
- 印表機要設固定 IP
- 第一次安裝 APK 時，Android 可能會提示「未知來源」，請允許安裝
- Debug APK 未簽名正式版，僅供自己使用；要上架 Play 商店需額外簽正式 keystore

---

## 自訂選單

編輯 `www/app.js` 最上方的 `MENU` 物件即可新增或修改品項。

有問題再跟我說，我可以繼續幫你調整！
