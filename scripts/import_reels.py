#!/usr/bin/env python3
"""匯入 IG 作品連結到 data/content.json。

用法：python3 scripts/import_reels.py links.txt
      python3 scripts/import_reels.py --avatars   # 替缺大頭照的人物補抓
  links.txt 每行一個 IG 貼文／Reel 連結。
  依發文帳號分類到人物；封面下載到 assets/works/，影片壓成 720p 存到 assets/videos/。
  已匯入的作品會略過，只補齊缺少的標題或影片，可重複執行。
只讀取 IG 官方公開嵌入頁（/embed/），不需登入。需要 ffmpeg。
"""
import html
import json
import re
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "data" / "content.json"
WORKS_DIR = ROOT / "assets" / "works"
VIDEOS_DIR = ROOT / "assets" / "videos"
PEOPLE_DIR = ROOT / "assets" / "people"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"
URL_RE = re.compile(r"instagram\.com/(?:([\w.]+)/)?(p|reel|reels|tv)/([\w-]+)")


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def parse_embed(code, kind):
    page = get(f"https://www.instagram.com/{kind}/{code}/embed/captioned/").decode("utf-8", "replace")
    user = re.search(r'class="UsernameText">([^<]+)<', page)
    img = re.search(r'class="EmbeddedMediaImage"[^>]*src="([^"]+)"', page)
    cap = re.search(r'class="Caption">.*?</a>(.*?)(?:<div class="CaptionComments"|</div>)', page, re.S)
    vid = re.search(r'video_url\\+":\\+"(.*?)\\+"', page)
    pic = re.search(r'profile_pic_url\\+":\\+"(.*?)\\+"', page)
    caption = ""
    if cap:
        text = re.sub(r"<br\s*/?>", "\n", cap.group(1))
        caption = html.unescape(re.sub(r"<[^>]+>", "", text)).strip()
    video = unescape_json_url(vid.group(1)) if vid else ""
    return {
        "username": user.group(1).strip() if user else None,
        "image": html.unescape(img.group(1)) if img else None,
        "caption": caption,
        "video": video,
        "avatar": unescape_json_url(pic.group(1)) if pic else "",
    }


def unescape_json_url(u):
    # 嵌入頁內的 JSON 經過多層跳脫：\\\/ → /、\\u0026 → &
    u = re.sub(r"\\+/", "/", u)
    u = re.sub(r"\\+u0026", "&", u)
    return html.unescape(u)


def save_avatar(slug, url):
    PEOPLE_DIR.mkdir(parents=True, exist_ok=True)
    (PEOPLE_DIR / f"{slug}.jpg").write_bytes(get(url))
    return f"assets/people/{slug}.jpg"


def fill_avatars():
    """替沒有大頭照的人物，從其第一支作品的嵌入頁抓發文帳號大頭照。"""
    data = json.loads(CONTENT.read_text("utf-8"))
    for p in data["people"]:
        if p.get("avatar") or not p["works"]:
            continue
        m = URL_RE.search(p["works"][0]["url"])
        try:
            info = parse_embed(m.group(3), "reel" if m.group(2) in ("reel", "reels") else m.group(2))
            if info["avatar"]:
                p["avatar"] = save_avatar(p["slug"], info["avatar"])
                print(f"大頭照 ✓ {p['slug']}")
        except Exception as e:
            print(f"{p['slug']} 大頭照失敗：{e}", file=sys.stderr)
        time.sleep(1)
    CONTENT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", "utf-8")


def make_title(caption):
    for line in caption.splitlines():
        line = re.sub(r"[#@][\w.一-鿿]+", "", line).strip(" ｜|-—")
        if line:
            return line[:30] + ("…" if len(line) > 30 else "")
    return "作品"


def save_video(code, url):
    """下載 IG 影片並壓成 720p H.264（網頁可邊下載邊播放）。回傳網站內路徑。"""
    VIDEOS_DIR.mkdir(parents=True, exist_ok=True)
    out = VIDEOS_DIR / f"{code}.mp4"
    with tempfile.NamedTemporaryFile(suffix=".mp4") as src:
        src.write(get(url))
        src.flush()
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", src.name,
             "-vf", "scale='min(720,iw)':-2", "-c:v", "libx264", "-preset", "slow", "-crf", "28", "-maxrate", "1200k", "-bufsize", "2400k",
             "-profile:v", "high", "-pix_fmt", "yuv420p",
             "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", str(out)],
            check=True,
        )
    return f"assets/videos/{code}.mp4"


def main(path):
    data = json.loads(CONTENT.read_text("utf-8"))
    people = {p["slug"]: p for p in data["people"]}
    existing = {URL_RE.search(w["url"]).group(3): w for p in data["people"] for w in p["works"] if URL_RE.search(w.get("url", ""))}
    WORKS_DIR.mkdir(parents=True, exist_ok=True)
    added = updated = 0

    for raw in Path(path).read_text("utf-8").split():
        m = URL_RE.search(raw.strip('"'))
        if not m:
            continue
        owner, kind, code = m.group(1), "reel" if m.group(2) in ("reel", "reels") else m.group(2), m.group(3)
        work = existing.get(code)
        if work and work["title"] != "作品" and work.get("video"):
            continue

        try:
            info = parse_embed(code, kind)
        except Exception as e:
            print(f"略過 {code}：{e}", file=sys.stderr)
            continue

        video = ""
        if info["video"] and not (work and work.get("video")):
            try:
                video = save_video(code, info["video"])
            except Exception as e:
                print(f"{code} 影片處理失敗：{e}", file=sys.stderr)

        if work:  # 已匯入：只補缺少的欄位
            if work["title"] == "作品":
                work["title"] = make_title(info["caption"])
            if video:
                work["video"] = video
            updated += 1
            print(f"~ {code}  {work['title']}  {'影片 ✓' if work.get('video') else ''}")
            time.sleep(1)
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
            avatar = ""
            if info["avatar"]:
                try:
                    avatar = save_avatar(username, info["avatar"])
                except Exception as e:
                    print(f"{username} 大頭照下載失敗：{e}", file=sys.stderr)
            person = {
                "slug": username,
                "name": username,
                "instagram": f"https://www.instagram.com/{username}/",
                "avatar": avatar,
                "photo": thumb,
                "industry": [],
                "bio": "",
                "tags": ["企劃發想", "拍攝執行", "剪輯製作"],
                "works": [],
            }
            people[username] = person
            data["people"].append(person)
        new = {"title": make_title(info["caption"]), "url": f"https://www.instagram.com/{kind}/{code}/", "thumbnail": thumb}
        if video:
            new["video"] = video
        person["works"].append(new)
        existing[code] = new
        added += 1
        print(f"+ {username}  {code}  {new['title']}  {'影片 ✓' if video else ''}")
        time.sleep(1)

    CONTENT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", "utf-8")
    print(f"完成：新增 {added} 則、更新 {updated} 則，共 {len(data['people'])} 位人物")


if __name__ == "__main__":
    if sys.argv[1] == "--avatars":
        fill_avatars()
    else:
        main(sys.argv[1])
