# VUCA｜你的行銷團隊

官網首頁（`index.html`）＋影音作品集（[`works.html`](works.html)）。純靜態，部署在 GitHub Pages，網域 vuca.ca。

## 首頁定位

以**短影音月方案**為核心入口（含每月顧問會議），其他服務環繞在旁：

- 帶人進來：Threads 經營、廣告投放、AEO
- 把人接住：網頁／APP 開發（含資安）、LINE OA 建置、AI 客服機器人
- 大型專案：老闆個人品牌全案、品牌形象片／廣告片、招募／招生影片
- 教你的團隊：企業內訓、AI 應用教學

不列價格、不做免費諮詢，一律 LINE 洽詢報價。

## 頁面結構

| 檔案 | 內容 |
|---|---|
| `index.html` / `site.css` / `site.js` | 首頁：主標＋影片、服務地圖、作品、資安差異化、流程、FAQ、聯絡 |
| `works.html` / `app.js` / `style.css` / `data/content.json` | 影音作品集（以下為其維護說明） |

- 服務地圖在 `index.html` 的 `.map` 區塊（中心 `.core`，四群 `.sat--a`～`.sat--d`），改文字直接改 HTML。
- 首頁「作品」區自動讀 `data/content.json` 的人物，新增人物後首頁會自動出現。
- 主視覺影片在 `.hero__video` 裡的 `<video src>`。

---

## 影音作品集（works.html）

以人物分類的短影音作品集網站。純靜態（HTML／CSS／JS），部署在 GitHub Pages，無需 build。

## 更新內容

所有內容都在 [`data/content.json`](data/content.json)，在 GitHub 網頁上直接編輯、Commit 後約 1 分鐘生效。

新增一位人物：在 `people` 陣列加一筆

```json
{
  "slug": "wang-xiaoming",
  "name": "王小明",
  "photo": "assets/people/wang-xiaoming.jpg",
  "bio": "一句話介紹。",
  "tags": ["企劃發想", "拍攝執行", "剪輯製作"],
  "stats": { "觀看表現": "120 萬+", "互動表現": "8.5%", "轉換表現": "—" },
  "works": [
    { "title": "作品標題", "url": "https://www.instagram.com/reel/XXXXXXXX/", "thumbnail": "" }
  ]
}
```

| 欄位 | 說明 |
|---|---|
| `slug` | 網址代號，英數與連字號，例：`#/p/wang-xiaoming` |
| `photo` | 人物照，上傳到 `assets/people/`；留空則顯示名字縮寫 |
| `works[].url` | IG 貼文／Reel 連結（`/p/`、`/reel/`、`/tv/` 皆可），點擊後以 IG 官方嵌入播放；留空顯示「即將上架」 |
| `works[].video` | 自架影片路徑；有填就用網站原生播放器，沒填則退回 IG 嵌入 |
| `works[].thumbnail` | 封面圖（選填），建議 4:5 直式 |
| `stats` | 合作成果數字，值留空顯示「—」；整個物件刪掉則不顯示該區塊 |

聯絡方式在 `site.contact`（`instagram`／`email`／`line`），留空即隱藏。

## 批次匯入 IG 作品

把 IG 連結（每行一個）存成 `links.txt`，執行：

```bash
python3 scripts/import_reels.py links.txt
```

腳本只讀 IG 官方公開嵌入頁（不需登入），會依發文帳號自動分到對應人物（沒有就新建）、
以說明文字第一行當標題、下載封面到 `assets/works/`、影片壓成 720p 存到 `assets/videos/`（需要 ffmpeg）。已匯入的作品會略過，可重複執行。
新建的人物 `name` 預設為 IG 帳號，請再手動改成中文名與介紹。

### 容量

GitHub Pages 網站上限 1GB。每支影片約 4–12MB，約可放 150 支；接近上限時把 `assets/videos/` 搬到 Cloudflare R2 等儲存空間，再把 `video` 欄位改成完整網址即可，前端不用改。

## 品牌

`assets/logo.jpg` 為 VUCA 官方 Logo 原檔，請勿重製、改色或變形。`assets/logo.png` 為同一檔案去除白底後的透明版（Logo 本體像素與色彩未更動），網站使用此檔。

## 本機預覽

```bash
python3 -m http.server 8000
# 開啟 http://localhost:8000
```
