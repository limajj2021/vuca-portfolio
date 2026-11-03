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
| `works[].thumbnail` | 封面圖（選填），建議 4:3 |
| `stats` | 合作成果數字，值留空顯示「—」；整個物件刪掉則不顯示該區塊 |

聯絡方式在 `site.contact`（`instagram`／`email`／`line`），留空即隱藏。

## 品牌

`assets/logo.jpg` 為 VUCA 官方 Logo 原檔，請勿重製、改色或變形。

## 本機預覽

```bash
python3 -m http.server 8000
# 開啟 http://localhost:8000
```
