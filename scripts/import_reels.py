#!/usr/bin/env python3
"""匯入 IG 作品連結到 data/content.json。

用法：python3 scripts/import_reels.py links.txt
  links.txt 每行一個 IG 貼文／Reel 連結。
  依發文帳號分類到人物；已存在的作品會略過；封面下載到 assets/works/。
只讀取 IG 官方公開嵌入頁（/embed/），不需登入。
"""
import html
import json
import re
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "data" / "content.json"
WORKS_DIR = ROOT / "assets" / "works"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"
URL_RE = re.compile(r"instagram\.com/(?:([\w.]+)/)?(p|reel|reels|tv)/([\w-]+)")


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def parse_embed(code, kind):
    page = get(f"https://www.instagram.com/{kind}/{code}/embed/captioned/").decode("utf-8", "replace")
    user = re.search(r'class="UsernameText">([^<]+)<', page)
    img = re.search(r'class="EmbeddedMediaImage"[^>]*src="([^"]+)"', page)
    cap = re.search(r'class="Caption">.*?</a>(.*?)(?:<div class="CaptionComments"|</div>)', page, re.S)
    caption = ""
    if cap:
        text = re.sub(r"<br\s*/?>", "\n", cap.group(1))
        caption = html.unescape(re.sub(r"<[^>]+>", "", text)).strip()
    return {
        "username": user.group(1).strip() if user else None,
        "image": html.unescape(img.group(1)) if img else None,
        "caption": caption,
    }


def make_title(caption):
    for line in caption.splitlines():
        line = re.sub(r"[#@][\w.一-鿿]+", "", line).strip(" ｜|-—")
        if line:
            return line[:30] + ("…" if len(line) > 30 else "")
    return "作品"


def main(path):
    data = json.loads(CONTENT.read_text("utf-8"))
    people = {p["slug"]: p for p in data["people"]}
    existing = {URL_RE.search(w["url"]).group(3): w for p in data["people"] for w in p["works"] if URL_RE.search(w.get("url", ""))}
    seen = set(existing)
    WORKS_DIR.mkdir(parents=True, exist_ok=True)
    added = 0

    for raw in Path(path).read_text("utf-8").split():
        m = URL_RE.search(raw.strip('"'))
        if not m:
            continue
        if m.group(3) in seen:
            work = existing.get(m.group(3))
            if work and work["title"] == "作品":  # 先前沒抓到標題的作品，重抓一次
                try:
                    kind = "reel" if m.group(2) in ("reel", "reels") else m.group(2)
                    work["title"] = make_title(parse_embed(m.group(3), kind)["caption"])
                    print(f"~ {m.group(3)}  {work['title']}")
                    time.sleep(1)
                except Exception as e:
                    print(f"{m.group(3)} 標題更新失敗：{e}", file=sys.stderr)
            continue
        owner, kind, code = m.group(1), "reel" if m.group(2) in ("reel", "reels") else m.group(2), m.group(3)
        try:
            info = parse_embed(code, kind)
        except Exception as e:
            print(f"略過 {code}：{e}", file=sys.stderr)
            continue
        username = info["username"] or owner
        if not username:
            print(f"略過 {code}：找不到發文帳號", file=sys.stderr)
            continue

        thumb = ""
        if info["image"]:
            try:
                (WORKS_DIR / f"{code}.jpg").write_bytes(get(info["image"]))
                thumb = f"assets/works/{code}.jpg"
            except Exception as e:
                print(f"{code} 封面下載失敗：{e}", file=sys.stderr)

        person = people.get(username)
        if not person:
            person = {
                "slug": username,
                "name": username,
                "instagram": f"https://www.instagram.com/{username}/",
                "photo": thumb,
                "bio": "",
                "tags": ["企劃發想", "拍攝執行", "剪輯製作"],
                "works": [],
            }
            people[username] = person
            data["people"].append(person)
        person["works"].append({
            "title": make_title(info["caption"]),
            "url": f"https://www.instagram.com/{kind}/{code}/",
            "thumbnail": thumb,
        })
        seen.add(code)
        added += 1
        print(f"+ {username}  {code}  {person['works'][-1]['title']}")
        time.sleep(1)

    CONTENT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", "utf-8")
    print(f"完成：新增 {added} 則，共 {len(data['people'])} 位人物")


if __name__ == "__main__":
    main(sys.argv[1])
