# DXF Viewer Demo Application

這是一個功能完整的 DXF 查看器應用程式，具有互動式選取工具和圖層管理功能。

## 功能特色

### 1. 檔案載入
- **上傳 DXF 檔案**：點擊「Upload DXF」按鈕選擇並載入本地 DXF 檔案
- **從 URL 載入**：輸入 DXF 檔案的 URL 並點擊「Load」按鈕
- **URL 參數**：在頁面 URL 加上 `?dxfUrl=<your-url>` 可自動載入 DXF 檔案

### 2. 選取工具 (Selector Tools)

#### Line Tool (線段工具)
- 點擊任何線段附近即可選取
- 顯示資訊：
  - 線段長度
  - 起點座標 (X, Y)
  - 終點座標 (X, Y)

#### Hole Tool (孔洞工具)
- 點擊圓形特徵（圓圈/弧線）或其附近
- 顯示資訊：
  - 直徑 (Diameter)
  - 半徑 (Radius)
  - 中心點座標 (X, Y)
  - 面積 (Area)

#### Region Tool (區域工具)
- 按住滑鼠左鍵並拖曳以框選矩形區域
- 顯示資訊：
  - 區域寬度 (Width)
  - 區域高度 (Height)
  - 總面積 (Area)
  - 區域內的實體數量

### 3. Layer Active/Deactivate (圖層管理)
- 查看 DXF 檔案中的所有圖層
- 每個圖層顯示：
  - 圖層顏色指示器
  - 圖層名稱
  - 可見性勾選框
- 點擊勾選框即可切換圖層的顯示/隱藏

## 安裝與執行

### 開發模式

```bash
cd demo
npm install
npm run dev
```

應用程式將在 `http://localhost:3000` 開啟

### 建置專案

```bash
cd demo
npm run build
```

建置後的檔案會在 `demo/dist` 目錄中

## 使用方式

### 1. 載入 DXF 檔案

選擇以下任一方式載入：
- 點擊「Upload DXF」按鈕上傳本地檔案
- 在 URL 輸入框中輸入 DXF 檔案網址，然後點擊「Load」
- 使用 URL 參數：`http://localhost:3000?dxfUrl=https://example.com/file.dxf`

### 2. 選擇工具

從工具列選擇工具：
- **Line**：點擊線段附近以測量長度
- **Hole**：點擊圓圈以測量直徑
- **Region**：按住並拖曳滑鼠以框選區域
- **None**：預設的平移/縮放模式

### 3. 管理圖層

使用左側邊欄：
- 勾選/取消勾選圖層來顯示/隱藏
- 圖層顏色表示原始 DXF 的圖層顏色

## 技術細節

### 選取邏輯

**Line Selection（線段選取）：**
- 計算點擊位置到每條線段的垂直距離
- 選取閾值範圍內最近的線段
- 使用歐幾里得距離計算端點之間的長度

**Hole Selection（孔洞選取）：**
- 檢查點擊位置到圓心的距離
- 如果點擊位置在圓周附近或圓內則選取
- 根據半徑計算直徑和面積

**Region Selection（區域選取）：**
- 從拖曳起點到終點建立邊界框
- 尋找所有頂點在框內的實體
- 計算區域尺寸和面積

### 尺寸計算

所有尺寸都從 DXF 座標系統中提取：
- **長度 (Length)**：`√((x₂-x₁)² + (y₂-y₁)²)`
- **直徑 (Diameter)**：`2 × radius`
- **面積 (Circle)**：`π × radius²`
- **面積 (Region)**：`width × height`

### DXF-Viewer 整合

此應用程式展示如何整合 dxf-viewer 庫：

1. **獲取 DXF 實體資訊**：透過 `viewer.GetDxf()` 取得解析後的 DXF 資料
2. **計算尺寸**：從實體的頂點座標計算幾何尺寸
3. **圖層管理**：使用 `viewer.GetLayers()` 和 `viewer.ShowLayer()` 控制圖層可見性
4. **座標轉換**：使用 `viewer._CanvasToSceneCoord()` 將畫布座標轉換為場景座標

## 專案結構

```
demo/
├── index.html          # 主 HTML 檔案
├── style.css           # 樣式表
├── main.js             # 主要應用程式邏輯
├── vite.config.js      # Vite 配置
├── package.json        # 專案依賴
└── README.md           # 說明文件
```

## 瀏覽器相容性

- 需支援 WebGL 的現代瀏覽器
- Chrome、Firefox、Safari、Edge (最新版本)

## 授權

MPL-2.0
