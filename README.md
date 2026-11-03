# VUCA｜人物作品集

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
| `works[].thumbnail` | 封面圖（選填），建議 4:5 直式 |
| `stats` | 合作成果數字，值留空顯示「—」；整個物件刪掉則不顯示該區塊 |

聯絡方式在 `site.contact`（`instagram`／`email`／`line`），留空即隱藏。

## 批次匯入 IG 作品

把 IG 連結（每行一個）存成 `links.txt`，執行：

```bash
python3 scripts/import_reels.py links.txt
```

腳本只讀 IG 官方公開嵌入頁（不需登入），會依發文帳號自動分到對應人物（沒有就新建）、
以說明文字第一行當標題、下載封面到 `assets/works/`。已匯入的作品會略過，可重複執行。
新建的人物 `name` 預設為 IG 帳號，請再手動改成中文名與介紹。

## 品牌

`assets/logo.jpg` 為 VUCA 官方 Logo 原檔，請勿重製、改色或變形。

## 本機預覽

```bash
python3 -m http.server 8000
# 開啟 http://localhost:8000
```
