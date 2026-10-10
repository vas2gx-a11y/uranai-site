// トップページ：各占いのロジック

// ---- タブ切替（#tarot などのハッシュにも対応） ----
function activateTab(id, scroll) {
  const tab = document.querySelector(`.tab[data-tab="${id}"]`);
  if (!tab) return;
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t === tab));
  document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("active", p.id === id));
  if (scroll) document.getElementById("tools").scrollIntoView({ behavior: "smooth" });
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    activateTab(tab.dataset.tab);
    history.replaceState(null, "", "#" + tab.dataset.tab);
  });
});

const onHash = () => activateTab(location.hash.slice(1), true);
window.addEventListener("hashchange", onHash);

function show(el, html) {
  el.innerHTML = html;
  el.hidden = false;
  el.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

const luckyHtml = (items) => `<div class="lucky">${items.map((t) => `<span>${t}</span>`).join("")}</div>`;

// ---- 判定ロジック ----
function getZodiac(month, day) {
  if (month === 12 && day >= 22) return ZODIAC[0]; // 山羊座（年末側）
  // 開始日が遅い順に見て、該当する最初の星座を返す
  for (let i = ZODIAC.length - 1; i >= 1; i--) {
    const [m, d] = ZODIAC[i].from;
    if (month > m || (month === m && day >= d)) return ZODIAC[i];
  }
  return ZODIAC[0]; // 12/22〜1/19 は山羊座
}

const zodiacOf = (dateStr) => {
  const [, m, d] = dateStr.split("-").map(Number);
  return getZodiac(m, d);
};

function lifePathNumber(dateStr) {
  let n = dateStr.replace(/\D/g, "").split("").reduce((s, c) => s + Number(c), 0);
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = String(n).split("").reduce((s, c) => s + Number(c), 0);
  }
  return n;
}

// 本命星：立春（2/4頃）より前の生まれは前年扱い
function kyuseiNumber(dateStr) {
  let [y, m, d] = dateStr.split("-").map(Number);
  if (m === 1 || (m === 2 && d < 4)) y -= 1;
  let s = String(y).split("").reduce((a, c) => a + Number(c), 0);
  while (s > 9) s = String(s).split("").reduce((a, c) => a + Number(c), 0);
  const n = (11 - s) % 9;
  return n === 0 ? 9 : n;
}

// 期間ごとのキー（今週は月曜日の日付）
const PERIOD_LABEL = { day: "今日", week: "今週", month: "今月" };

function periodKey(period) {
  if (period === "month") return todayStr().slice(0, 7);
  if (period === "week") {
    const monday = new Date();
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    return fmtDate(monday);
  }
  return todayStr();
}

function zodiacFortune(sign, period = "day") {
  const rand = seededRandom(period + periodKey(period) + sign.name);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const score = () => 1 + Math.floor(rand() * 5);
  const total = score();
  const cats = CATEGORIES.map((c) => {
    const s = score();
    const pool = s <= 2 ? c.low : s === 3 ? c.mid : c.high;
    return { label: c.label, score: s, text: pick(pool) };
  });
  return {
    total,
    cats,
    message: pick(ZODIAC_MESSAGES),
    color: pick(LUCKY_COLORS),
    item: pick(LUCKY_ITEMS),
    spot: pick(LUCKY_SPOTS),
    rank: total * 100 + cats.reduce((a, c) => a + c.score, 0), // ランキング用
  };
}

// ---- 今日の星座ランキング ----
function renderRanking() {
  const list = ZODIAC.map((sign) => ({ sign, f: zodiacFortune(sign) }))
    .sort((a, b) => b.f.rank - a.f.rank || ZODIAC.indexOf(a.sign) - ZODIAC.indexOf(b.sign));
  document.getElementById("ranking-date").textContent = jpDate(new Date()) + " の運勢";
  document.getElementById("ranking").innerHTML = list
    .map(({ sign, f }, i) => `
      <li class="${i < 3 ? "top" : ""}">
        <span class="rank-no">${i + 1}</span>
        <span class="rank-sign">${sign.symbol} ${sign.name}</span>
        <span class="stars-val">${stars(f.total)}</span>
      </li>`)
    .join("");
}

// ---- 今日の月 ----
function renderMoon() {
  const age = moonAge();
  const phase = moonPhase(age);
  const next = upcomingMoons(2);
  document.getElementById("moon-card").innerHTML = `
    <h3 class="card-title">今日の月</h3>
    <p class="moon-emoji">${phase.emoji}</p>
    <p class="moon-name">${phase.name}<small>（月齢 ${age.toFixed(1)}）</small></p>
    <p>${phase.text}</p>
    <p class="sub">${next.map((m) => `次の${m.type}：${jpDate(m.date)}頃`).join("　")}</p>
    <a class="more" href="/column/moon.html">新月・満月カレンダーを見る →</a>`;
}

// ---- マイ運勢（保存した生年月日） ----
function renderMyBox() {
  const box = document.getElementById("my-box");
  const { birth } = loadProfile();
  if (!birth) {
    box.innerHTML = `
      <h3 class="card-title">あなたの今日の運勢</h3>
      <p class="sub">生年月日を保存すると、次回から入力なしで運勢を表示します（この端末のブラウザ内にのみ保存されます）。</p>
      <form class="form compact" id="my-form">
        <label>生年月日 <input type="date" id="my-birth" required></label>
        <button class="btn" type="submit">保存して占う</button>
      </form>`;
    box.querySelector("#my-form").addEventListener("submit", (e) => {
      e.preventDefault();
      saveProfile({ birth: box.querySelector("#my-birth").value });
      renderMyBox();
      fillBirthInputs();
    });
    return;
  }
  const sign = zodiacOf(birth);
  const f = zodiacFortune(sign);
  const num = lifePathNumber(birth);
  const ky = KYUSEI[kyuseiNumber(birth)];
  box.innerHTML = `
    <h3 class="card-title">あなたの今日の運勢</h3>
    <div class="my-summary">
      <div class="my-sign"><p class="symbol">${sign.symbol}</p><p>${sign.name}</p></div>
      <div>
        <p class="stars-val big">${stars(f.total)}</p>
        <p>${f.message}</p>
        ${luckyHtml([`ラッキーカラー：${f.color}`, `ラッキーアイテム：${f.item}`, `ラッキースポット：${f.spot}`])}
        <p class="sub">運命数 ${num}（${NUMEROLOGY[num].title}）／ 本命星 ${ky.name}</p>
      </div>
    </div>
    <div class="my-actions">
      <a class="btn small" href="#zodiac">詳しく見る</a>
      <button class="btn ghost small" id="my-clear">保存した生年月日を削除</button>
    </div>`;
  box.querySelector("#my-clear").addEventListener("click", () => {
    clearProfile();
    renderMyBox();
  });
}

// 保存済みの生年月日を各フォームに入れておく
function fillBirthInputs() {
  const { birth } = loadProfile();
  if (!birth) return;
  document.querySelectorAll(".birth-input").forEach((el) => { if (!el.value) el.value = birth; });
}

// ---- タロット ----
const deck = document.getElementById("deck");
const tarotResult = document.getElementById("tarot-result");
const tarotReset = document.getElementById("tarot-reset");

function renderDeck() {
  deck.innerHTML = "";
  for (let i = 0; i < 12; i++) {
    const card = document.createElement("button");
    card.className = "tarot-card";
    card.setAttribute("aria-label", `カード${i + 1}`);
    card.addEventListener("click", drawTarot);
    deck.appendChild(card);
  }
  deck.hidden = false;
  tarotResult.hidden = true;
  tarotReset.hidden = true;
}

function drawTarot() {
  const card = TAROT[Math.floor(Math.random() * TAROT.length)];
  const reversed = Math.random() < 0.5;
  const pos = reversed ? "逆位置" : "正位置";
  deck.hidden = true;
  show(tarotResult, `
    <p class="symbol">🃏</p>
    <h3>${card.name}</h3>
    <p class="sub">${card.en}　<span class="badge ${reversed ? "rev" : ""}">${pos}</span></p>
    <p>${reversed ? card.rev : card.up}</p>
    <a class="more" href="/column/tarot.html">大アルカナ22枚の意味一覧 →</a>
    ${shareButtons(`【${SITE_NAME}】タロットで「${card.name}（${pos}）」を引きました🃏`)}
  `);
  tarotReset.hidden = false;
}

tarotReset.addEventListener("click", renderDeck);

// ---- 星座占い ----
document.getElementById("zodiac-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const sign = zodiacOf(document.getElementById("zodiac-birth").value);
  const period = document.getElementById("zodiac-period").value;
  const f = zodiacFortune(sign, period);
  const label = PERIOD_LABEL[period];

  show(document.getElementById("zodiac-result"), `
    <p class="symbol">${sign.symbol}</p>
    <h3>${sign.name}</h3>
    <p class="sub">${label}の運勢</p>
    <p class="total">総合運 <span class="stars-val">${stars(f.total)}</span></p>
    <p>${f.message}</p>
    <div class="cats">
      ${f.cats.map((c) => `
        <div class="cat">
          <p><strong>${c.label}</strong> <span class="stars-val">${stars(c.score)}</span></p>
          <p>${c.text}</p>
        </div>`).join("")}
    </div>
    ${luckyHtml([`ラッキーカラー：${f.color}`, `ラッキーアイテム：${f.item}`, `ラッキースポット：${f.spot}`])}
    ${shareButtons(`【${SITE_NAME}】${label}の${sign.name}は総合運${stars(f.total)}！ラッキーカラーは${f.color}✨`)}
  `);
});

// ---- 数秘術 ----
document.getElementById("num-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const num = lifePathNumber(document.getElementById("num-birth").value);
  const info = NUMEROLOGY[num];
  show(document.getElementById("num-result"), `
    <p class="symbol">${num}</p>
    <h3>運命数 ${num}：${info.title}</h3>
    <p>${info.text}</p>
    ${luckyHtml(info.keywords)}
    <a class="more" href="/column/numerology.html">すべての運命数の意味を見る →</a>
    ${shareButtons(`【${SITE_NAME}】私の運命数は「${num}：${info.title}」でした🔢`)}
  `);
});

// ---- 相性占い ----
function elementCompat(a, b) {
  if (a === b) return ELEMENT_COMPAT.same;
  const pair = [a, b].sort().join("");
  return pair === "火風" || pair === "地水" ? ELEMENT_COMPAT.good : ELEMENT_COMPAT.mid;
}

document.getElementById("compat-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const a = document.getElementById("compat-a").value;
  const b = document.getElementById("compat-b").value;
  const sa = zodiacOf(a), sb = zodiacOf(b);
  const na = lifePathNumber(a), nb = lifePathNumber(b);
  const el = elementCompat(sa.element, sb.element);

  // 運命数が同じ・近いと加点。同じ組み合わせなら毎回同じ点数になる
  const rand = seededRandom([a, b].sort().join("|"));
  const numBonus = na === nb ? 8 : Math.abs((na % 9) - (nb % 9)) <= 2 ? 4 : 0;
  const score = Math.min(99, el.score + numBonus + Math.floor(rand() * 8) - 2);
  const advice = score >= 85 ? "運命的な相性。一緒にいるだけで運気が高まる関係です。"
    : score >= 70 ? "良好な相性。思いやりを忘れなければ、さらに絆が深まります。"
    : "伸びしろのある相性。違いを楽しむ気持ちが関係を育てます。";

  show(document.getElementById("compat-result"), `
    <p class="symbol">${sa.symbol} 💞 ${sb.symbol}</p>
    <h3>相性 ${score}点</h3>
    <p class="sub">${sa.name}（${sa.element}）× ${sb.name}（${sb.element}）／ 運命数 ${na} × ${nb}</p>
    <div class="meter-bar"><span style="width:${score}%"></span></div>
    <p>${el.text}</p>
    <p>${advice}</p>
    ${shareButtons(`【${SITE_NAME}】${sa.name}×${sb.name}の相性は${score}点でした💞`)}
  `);
});

// ---- ルーン ----
document.getElementById("rune-draw").addEventListener("click", () => {
  const r = RUNES[Math.floor(Math.random() * RUNES.length)];
  show(document.getElementById("rune-result"), `
    <p class="symbol rune">${r.char}</p>
    <h3>${r.name}</h3>
    <p class="sub">${r.meaning}</p>
    <p>${r.text}</p>
    ${shareButtons(`【${SITE_NAME}】ルーン占いで「${r.name}（${r.meaning}）」を引きました`)}
  `);
});

// ---- 九星気学 ----
document.getElementById("kyusei-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const ky = KYUSEI[kyuseiNumber(document.getElementById("kyusei-birth").value)];
  const rand = seededRandom("kyusei" + todayStr() + ky.name);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const s = 1 + Math.floor(rand() * 5);
  const dirs = ["北", "北東", "東", "南東", "南", "南西", "西", "北西"];

  show(document.getElementById("kyusei-result"), `
    <p class="symbol">☯</p>
    <h3>${ky.name}</h3>
    <p>${ky.text}</p>
    <p class="total">今日の運気 <span class="stars-val">${stars(s)}</span></p>
    <p>${pick(ZODIAC_MESSAGES)}</p>
    ${luckyHtml([`吉方位：${pick(dirs)}`, `ラッキーカラー：${pick(LUCKY_COLORS)}`])}
    ${shareButtons(`【${SITE_NAME}】私の本命星は「${ky.name}」。今日の運気は${stars(s)}`)}
  `);
});

// ---- 夢占い ----
const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

document.getElementById("dream-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const word = document.getElementById("dream-word").value.trim();
  const hits = DREAMS.filter((d) => d.keys.some((k) => word.includes(k) || k.includes(word)));
  const el = document.getElementById("dream-result");
  if (!hits.length) {
    const examples = DREAMS.slice(0, 10).map((d) => d.keys[0]).join("、");
    show(el, `<h3>「${escapeHtml(word)}」は見つかりませんでした</h3><p>別の言葉で試してみてください。（例：${examples}）</p>`);
    return;
  }
  show(el, hits.map((d) => `<h3>「${d.keys[0]}」の夢</h3><p>${d.text}</p>`).join("") +
    shareButtons(`【${SITE_NAME}】「${hits[0].keys[0]}」の夢の意味を占いました🌙`));
});

// ---- 初期表示 ----
renderDeck();
renderRanking();
renderMoon();
renderMyBox();
fillBirthInputs();
if (location.hash) onHash();
