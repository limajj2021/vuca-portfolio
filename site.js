(() => {
  document.getElementById("year").textContent = new Date().getFullYear();

  const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const grid = document.getElementById("grid");
  const canHover = matchMedia("(hover: hover)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 作品格：直接讀作品集的 data/content.json，人物一多就自動多一格
  fetch("data/content.json", { cache: "no-cache" })
    .then((r) => r.json())
    .then(({ people = [] }) => {
      grid.innerHTML = people
        .map((p) => {
          const first = p.works?.[0] || {};
          const cover = p.photo || first.thumbnail || "";
          const tags = (p.industry || []).map((t) => t.replace(/^#/, "")).join("・");
          return `
            <a class="tile" href="works.html#/p/${encodeURIComponent(p.slug)}" data-video="${esc(first.video || "")}">
              ${cover ? `<img src="${esc(cover)}" alt="" loading="lazy">` : ""}
              <div class="tile__info">
                ${tags ? `<p class="tile__tags">${esc(tags)}</p>` : ""}
                <p class="tile__name">${esc(p.name)}</p>
                <p class="tile__count">${p.works?.length || 0} 支作品 →</p>
              </div>
            </a>`;
        })
        .join("");

      // 桌機滑過時預覽影片
      if (!canHover) return;
      grid.querySelectorAll(".tile[data-video]").forEach((tile) => {
        const src = tile.dataset.video;
        if (!src) return;
        let v;
        tile.addEventListener("mouseenter", () => {
          if (!v) {
            v = Object.assign(document.createElement("video"), { src, muted: true, loop: true, playsInline: true });
            tile.prepend(v);
          }
          v.play().then(() => tile.classList.add("is-playing")).catch(() => {});
        });
        tile.addEventListener("mouseleave", () => {
          tile.classList.remove("is-playing");
          v?.pause();
        });
      });
    })
    .catch(() => {});
})();
