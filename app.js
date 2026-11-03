(() => {
  const app = document.getElementById("app");
  const player = document.getElementById("player");
  const playerFrame = document.getElementById("playerFrame");
  let data;

  const esc = (s = "") =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // 從 IG 連結取出 /p/、/reel/、/tv/ 的代碼，轉成官方嵌入網址
  const igEmbed = (url = "") => {
    const m = url.match(/instagram\.com\/(?:[\w.]+\/)?(p|reel|reels|tv)\/([\w-]+)/);
    if (!m) return "";
    const type = m[1] === "reels" ? "reel" : m[1];
    return `https://www.instagram.com/${type}/${m[2]}/embed/captioned/`;
  };

  const photo = (p, cls = "") =>
    p.photo
      ? `<img src="${esc(p.photo)}" alt="${esc(p.name)}" loading="lazy" class="${cls}">`
      : `<div class="mono">${esc(p.name.replace(/^人物\s*/, "").slice(0, 2))}</div>`;

  const setActive = (name) => {
    document.querySelectorAll("[data-nav]").forEach((a) => a.classList.toggle("is-active", a.dataset.nav === name));
  };

  const tabs = (active) => `
    <div class="tabs">
      <a href="#/" class="${active === "people" ? "is-active" : ""}">全部人物</a>
      <a href="#/contact" class="${active === "contact" ? "is-active" : ""}">合作洽詢</a>
    </div>`;

  function renderHome() {
    const { site, people } = data;
    const heroPerson = people.find((p) => p.photo);
    app.innerHTML = `
      <section class="wrap">
        <div class="hero">
          <div>
            <div class="hero__bar"></div>
            <h1 class="hero__en">${site.titleEn.map(esc).join("<br>")}</h1>
            <p class="hero__services">${esc(site.titleZh).split("").join(" ")}</p>
            <p class="hero__services">${site.services.map(esc).join(" ・ ")}</p>
            <p class="hero__intro">${site.intro.map((l) => `<span>${esc(l)}</span>`).join("")}</p>
          </div>
          <div class="hero__media">${heroPerson ? `<img src="${esc(heroPerson.photo)}" alt="${esc(heroPerson.name)}">` : `<img class="hero__logo" src="assets/logo.jpg" alt="VUCA">`}</div>
        </div>
        ${tabs("people")}
        <div class="people">
          ${people
            .map(
              (p) => `
            <a class="card" href="#/p/${encodeURIComponent(p.slug)}">
              <div class="card__img">${photo(p)}</div>
              <div class="card__row">
                <div class="card__meta"><h3 class="card__name">${esc(p.name)}</h3><span class="card__count">${p.works.length} 支作品</span></div>
                <span class="arrow" aria-hidden="true">→</span>
              </div>
            </a>`
            )
            .join("")}
        </div>
      </section>`;
    setActive("home");
    document.title = `${site.brand}｜${site.titleZh}`;
  }

  function renderPerson(slug) {
    const p = data.people.find((x) => x.slug === slug);
    if (!p) return renderHome();
    const stats = Object.entries(p.stats || {});
    app.innerHTML = `
      <section class="wrap">
        <a class="back" href="#/"><span aria-hidden="true">←</span> 全部人物</a>
        <div class="profile">
          <div class="profile__img">${photo(p)}</div>
          <div>
            <h1 class="profile__name">${esc(p.name)}</h1>
            ${p.instagram ? `<a class="profile__ig" href="${esc(p.instagram)}" target="_blank" rel="noopener">@${esc(p.slug)} ↗</a>` : ""}
            ${p.bio ? `<p class="profile__bio">${esc(p.bio)}</p>` : ""}
            <div class="tags">${(p.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
          </div>
        </div>
        ${
          stats.length
            ? `<div class="stats">
                <div class="stats__label">合作成果</div>
                ${stats.map(([k, v]) => `<div class="stat"><div class="stat__k">${esc(k)}</div><div class="stat__v">${esc(v || "—")}</div></div>`).join("")}
              </div>`
            : ""
        }
        ${
          p.works.length
            ? `<div class="works">${p.works
                .map((w, i) => {
                  const playable = w.video || igEmbed(w.url);
                  return `
                <button class="work" type="button" data-i="${i}" ${playable ? "" : "disabled"}>
                  <div class="work__thumb">
                    ${w.thumbnail ? `<img src="${esc(w.thumbnail)}" alt="" loading="lazy">` : ""}
                    ${playable ? `<span class="play"></span>` : `<span class="work__soon">即將上架</span>`}
                  </div>
                  <p class="work__title">${esc(w.title)}</p>
                </button>`;
                })
                .join("")}</div>`
            : `<p class="empty">作品整理中。</p>`
        }
      </section>`;
    app.querySelectorAll(".work:not([disabled])").forEach((btn) => {
      const w = p.works[btn.dataset.i];
      btn.addEventListener("click", () => openPlayer(w));
      if (w.video && canHover) attachPreview(btn, w.video);
    });
    setActive("home");
    document.title = `${p.name}｜${data.site.brand}`;
  }

  function renderContact() {
    const c = data.site.contact || {};
    const items = [
      c.instagram && { label: "Instagram", href: c.instagram, note: "私訊洽詢" },
      c.email && { label: "Email", href: `mailto:${c.email}`, note: c.email },
      c.line && { label: "LINE", href: c.line, note: "加入好友" },
    ].filter(Boolean);
    app.innerHTML = `
      <section class="wrap contact">
        ${tabs("contact")}
        <div class="hero__bar"></div>
        <h1 class="hero__zh">合作洽詢</h1>
        <p class="hero__intro">品牌短影音、個人品牌內容、人物專訪，歡迎來信或私訊討論。</p>
        <div class="contact__list">
          ${items.map((i) => `<a class="contact__item" href="${esc(i.href)}" target="_blank" rel="noopener">${esc(i.label)} <span>${esc(i.note)} →</span></a>`).join("")}
        </div>
      </section>`;
    setActive("contact");
    document.title = `合作洽詢｜${data.site.brand}`;
  }

  // 有自架影片就用原生播放器，否則退回 IG 官方嵌入
  function openPlayer(w) {
    playerFrame.innerHTML = w.video
      ? `<video src="${esc(w.video)}" poster="${esc(w.thumbnail || "")}" controls autoplay playsinline></video>`
      : `<iframe src="${esc(igEmbed(w.url))}" allowfullscreen loading="lazy" title="作品播放"></iframe>`;
    player.showModal();
  }

  // 桌機滑鼠移入時無聲預覽，移出即移除，避免同時載入多支影片
  const canHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
  function attachPreview(btn, src) {
    const thumb = btn.querySelector(".work__thumb");
    let timer, video;
    btn.addEventListener("mouseenter", () => {
      timer = setTimeout(() => {
        video = Object.assign(document.createElement("video"), { src, muted: true, loop: true, playsInline: true, className: "work__preview" });
        thumb.appendChild(video);
        video.play().catch(() => {});
      }, 250);
    });
    btn.addEventListener("mouseleave", () => {
      clearTimeout(timer);
      video?.remove();
      video = null;
    });
  }
  const closePlayer = () => {
    player.close();
    playerFrame.innerHTML = "";
  };
  player.querySelector(".player__close").addEventListener("click", closePlayer);
  player.addEventListener("click", (e) => e.target === player && closePlayer());
  player.addEventListener("close", () => (playerFrame.innerHTML = ""));

  function route() {
    const hash = location.hash.replace(/^#/, "") || "/";
    const [, section, slug] = hash.split("/");
    if (section === "p" && slug) renderPerson(decodeURIComponent(slug));
    else if (section === "contact") renderContact();
    else renderHome();
    window.scrollTo(0, 0);
  }

  document.getElementById("year").textContent = new Date().getFullYear();

  fetch("data/content.json", { cache: "no-cache" })
    .then((r) => r.json())
    .then((json) => {
      data = json;
      document.getElementById("navServices").textContent = data.site.services.join("・");
      window.addEventListener("hashchange", route);
      route();
    })
    .catch(() => (app.innerHTML = `<p class="wrap empty">內容載入失敗，請重新整理。</p>`));
})();
