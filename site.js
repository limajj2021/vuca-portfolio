(() => {
  const LINE = "https://lin.ee/UYclGrS";
  const $ = (id) => document.getElementById(id);
  document.getElementById("year").textContent = new Date().getFullYear();

  // 案例：data/cases.json 有內容才顯示，沒有就整段隱藏
  const CASE_FIELDS = [["industry", "行業"], ["pain", "卡點"], ["action", "介入"], ["metric", "指標"], ["note", "結論與限制"]];
  const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  fetch("data/cases.json", { cache: "no-cache" })
    .then((r) => (r.ok ? r.json() : []))
    .then((cases) => {
      if (!Array.isArray(cases) || !cases.length) return;
      $("caseList").innerHTML = cases
        .map((c) => `<article class="case"><dl>${CASE_FIELDS.filter(([k]) => c[k]).map(([k, label]) => `<dt>${label}</dt><dd>${esc(c[k])}</dd>`).join("")}</dl></article>`)
        .join("");
      $("cases").hidden = false;
    })
    .catch(() => {});

  // 表單：不儲存資料。決策者與預算都有填才給時段（轉 LINE 確認），否則只顯示評估訊息。
  const form = $("form");
  const result = $("result");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    const val = (k) => (d[k] || "").trim();
    if (!val("company")) {
      form.company.focus();
      return;
    }
    if (!val("decision") || !val("budget")) {
      result.innerHTML = `<p class="msg">將依案件條件評估。</p>`;
      result.hidden = false;
      result.scrollIntoView({ block: "nearest" });
      return;
    }
    const summary = [
      `公司／行業：${val("company")}`,
      `卡點層級：${val("layer") || "未填"}`,
      `決策者職稱：${val("decision")}`,
      `期望時程：${val("timeline") || "未填"}`,
      `預算區間：${val("budget")}`,
    ].join("\n");
    result.innerHTML = `
      <p class="msg">條件符合，請於 LINE 傳送以下資料確認時段。</p>
      <textarea readonly rows="5" aria-label="預約資料">${esc(summary)}</textarea>
      <a class="btn" id="toLine" href="${LINE}" target="_blank" rel="noopener">複製並開啟 LINE</a>
      <p class="fine">資料僅在此頁產生，不會自動送出。</p>`;
    result.hidden = false;
    $("toLine").addEventListener("click", () => navigator.clipboard?.writeText(summary).catch(() => {}));
    result.scrollIntoView({ block: "nearest" });
  });
})();
