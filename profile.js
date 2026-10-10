// プロフィール（名前・生年月日・時刻・出生地）の登録と、各占いの自動表示
// すべての占いスクリプトの後に読み込む

const ONBOARD_SKIP_KEY = "uranai-onboard-skip";

// ---- 登録画面 ----
function openProfileDialog() {
  const p = loadProfile();
  let dlg = document.getElementById("profile-dialog");
  if (!dlg) {
    dlg = document.createElement("dialog");
    dlg.id = "profile-dialog";
    dlg.className = "profile-dialog";
    document.body.appendChild(dlg);
  }
  dlg.innerHTML = `
    <form method="dialog" id="profile-form">
      <h2>プロフィール登録</h2>
      <p class="sub">一度登録すると、すべての占いが入力なしで表示されます。<br>入力内容はこの端末のブラウザ内にのみ保存され、外部には送信されません。</p>
      <div class="pf-row">
        <label>姓 <input type="text" id="pf-sei" maxlength="6" placeholder="山田" value="${escapeHtml(p.sei || "")}"></label>
        <label>名 <input type="text" id="pf-mei" maxlength="6" placeholder="花子" value="${escapeHtml(p.mei || "")}"></label>
      </div>
      <label><span>生年月日 <span class="req">必須</span></span><input type="date" id="pf-birth" required value="${p.birth || ""}"></label>
      <div class="pf-row">
        <div class="pf-time">
          <label>生まれた時刻 <input type="time" id="pf-time" value="${p.time || ""}" ${p.timeUnknown ? "disabled" : ""}></label>
          <label class="pf-check"><input type="checkbox" id="pf-time-unknown" ${p.timeUnknown ? "checked" : ""}> 時刻はわからない</label>
        </div>
        <label>出生地 <select id="pf-pref">
          <option value="">わからない・海外</option>
          ${PREFS.map(([n], i) => `<option value="${i}" ${String(p.pref) === String(i) ? "selected" : ""}>${n}</option>`).join("")}
        </select></label>
      </div>
      <p class="sub">名前は姓名判断、時刻と出生地はホロスコープ・紫微斗数・四柱推命の時柱に使います。時刻が不明な場合は正午として計算し、時刻が必要な項目（アセンダント・時柱など）は表示しません。</p>
      <div class="pf-actions">
        <button class="btn" type="submit" value="save">保存して占う</button>
        <button class="btn ghost" type="button" id="pf-later">${p.birth ? "閉じる" : "あとで"}</button>
      </div>
      ${p.birth ? `<button class="pf-delete" type="button" id="pf-delete">登録内容を削除する</button>` : ""}
    </form>`;

  const timeInput = dlg.querySelector("#pf-time");
  dlg.querySelector("#pf-time-unknown").addEventListener("change", (e) => {
    timeInput.disabled = e.target.checked;
    if (e.target.checked) timeInput.value = "";
  });

  dlg.querySelector("#profile-form").addEventListener("submit", (e) => {
    const birth = dlg.querySelector("#pf-birth").value;
    if (!birth) { e.preventDefault(); return; }
    saveProfile({
      sei: dlg.querySelector("#pf-sei").value.trim(),
      mei: dlg.querySelector("#pf-mei").value.trim(),
      birth,
      time: dlg.querySelector("#pf-time-unknown").checked ? "" : timeInput.value,
      timeUnknown: dlg.querySelector("#pf-time-unknown").checked || !timeInput.value,
      pref: dlg.querySelector("#pf-pref").value,
    });
    document.dispatchEvent(new Event("profile-saved"));
    applyProfile();
  });
  dlg.querySelector("#pf-later").addEventListener("click", () => {
    try { localStorage.setItem(ONBOARD_SKIP_KEY, "1"); } catch {}
    dlg.close();
  });
  dlg.querySelector("#pf-delete")?.addEventListener("click", () => {
    if (!confirm("登録したプロフィールと診断結果を削除しますか？")) return;
    clearProfile();
    document.dispatchEvent(new Event("profile-cleared"));
    dlg.close();
    setTimeout(() => location.reload(), 500); // サーバー側の削除を待つ
  });
  dlg.showModal();
}

document.addEventListener("click", (e) => {
  if (e.target.closest("[data-open-profile]")) openProfileDialog();
});

// ヘッダーの「プロフィール」（/#profile）からも開けるようにする
function openProfileFromHash() {
  if (location.hash !== "#profile") return;
  history.replaceState(null, "", location.pathname);
  openProfileDialog();
}
window.addEventListener("hashchange", openProfileFromHash);

// ---- 自動で占う ----
const pfSetVal = (id, v) => { const el = document.getElementById(id); if (el && v !== undefined) el.value = v; };
const pfSubmit = (id) => document.getElementById(id)?.requestSubmit();

// 各タブを開いたときに結果を出すための処理（必要な情報が無いものは何もしない）
const AUTO_RUN = {
  zodiac: (p) => { pfSetVal("zodiac-birth", p.birth); pfSubmit("zodiac-form"); },
  numerology: (p) => { pfSetVal("num-birth", p.birth); pfSubmit("num-form"); },
  shichu: (p) => { pfSetVal("shichu-birth", p.birth); pfSetVal("shichu-time", p.time || ""); pfSubmit("shichu-form"); },
  sanmei: (p) => { pfSetVal("sanmei-birth", p.birth); pfSubmit("sanmei-form"); },
  shibi: (p) => {
    pfSetVal("shibi-birth", p.birth); pfSetVal("shibi-time", p.time || "12:00"); pfSubmit("shibi-form");
    if (!p.time) document.querySelector("#shibi-result h3")?.insertAdjacentHTML("afterend", `<p class="sub">※ 生まれた時刻が不明のため、正午として計算しています。命宮・主星は時刻によって変わります。</p>`);
  },
  sukuyo: (p) => { pfSetVal("sukuyo-birth", p.birth); pfSubmit("sukuyo-form"); },
  kyusei: (p) => { pfSetVal("kyusei-birth", p.birth); pfSubmit("kyusei-form"); },
  horoscope: (p) => { pfSetVal("horo-birth", p.birth); pfSetVal("horo-time", p.time || ""); pfSetVal("horo-pref", p.pref ?? ""); pfSubmit("horo-form"); },
  seimei: (p) => { if (!p.sei || !p.mei) return; pfSetVal("seimei-sei", p.sei); pfSetVal("seimei-mei", p.mei); pfSubmit("seimei-form"); },
  compat: (p) => { pfSetVal("compat-a", p.birth); }, // お相手の入力が必要なので自動では占わない
  type16: (p) => {
    if (!p.type16) return;
    const form = document.getElementById("type-form");
    p.type16.forEach((v, i) => { const r = form.querySelector(`input[name="q${i}"][value="${v}"]`); if (r) r.checked = true; });
    form.dispatchEvent(new Event("change"));
    form.requestSubmit();
  },
};

function runAll() {
  const p = loadProfile();
  if (!p.birth) return;
  quietShow = true;
  try {
    Object.values(AUTO_RUN).forEach((fn) => { try { fn(p); } catch (err) { console.error(err); } });
  } finally {
    quietShow = false;
  }
}

function applyProfile() {
  document.querySelectorAll(".birth-input").forEach((el) => { el.value = loadProfile().birth || ""; });
  renderMyBox();
  runAll();
}

// 16タイプ診断の回答も保存して、次回から結果を表示する
document.getElementById("type-form")?.addEventListener("submit", () => {
  const form = document.getElementById("type-form");
  const answers = TYPE_QUESTIONS.map((_, i) => form.querySelector(`input[name="q${i}"]:checked`)?.value);
  if (answers.every((v) => v !== undefined) && loadProfile().birth) {
    saveProfile({ type16: answers.map(Number) });
    document.dispatchEvent(new Event("profile-saved"));
  }
});

// ---- 起動時 ----
(() => {
  const p = loadProfile();
  if (location.hash === "#profile") {
    if (p.birth) runAll();
    openProfileFromHash();
    return;
  }
  if (p.birth) {
    runAll();
    return;
  }
  let skipped = false;
  try { skipped = localStorage.getItem(ONBOARD_SKIP_KEY) === "1"; } catch {}
  if (!skipped) openProfileDialog();
})();
