// トップページ：各占いのロジック

// ---- タブ切替（#tarot, #omikuji などのハッシュにも対応） ----
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

// 自動で占うとき（プロフィールから一括表示）はスクロールしない
let quietShow = false;

function show(el, html) {
  el.innerHTML = html;
  el.hidden = false;
  if (quietShow) return;
  el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  // ログイン中なら auth.js が履歴に保存する
  const title = el.querySelector("h3")?.textContent || "";
  document.dispatchEvent(new CustomEvent("fortune-shown", { detail: { kind: el.id.replace(/-result$/, ""), title } }));
}

const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const luckyHtml = (items) => `<div class="lucky">${items.map((t) => `<span>${t}</span>`).join("")}</div>`;

// ---- 判定ロジック ----
function getZodiac(month, day) {
  if (month === 12 && day >= 22) return ZODIAC[0]; // 山羊座（年末側）
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

// 四柱推命：日干（2024-01-01 甲子を基準）
function getDayStem(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const target = Date.UTC(y, m - 1, d);
  const base = Date.UTC(2024, 0, 1);
  const diffDays = Math.round((target - base) / (1000 * 60 * 60 * 24));
  const stemIdx = ((diffDays % 10) + 10) % 10;
  return JIKKAN[stemIdx];
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
    const pool = c[scoreLevel(s)];
    return { label: c.label, score: s, text: pick(pool) };
  });
  return {
    total,
    cats,
    message: pick(ZODIAC_MESSAGES[scoreLevel(total)]),
    color: pick(LUCKY_COLORS),
    item: pick(LUCKY_ITEMS),
    spot: pick(LUCKY_SPOTS),
    rank: total * 100 + cats.reduce((a, c) => a + c.score, 0),
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
      <p class="sub">名前と生年月日を登録すると、すべての占いが入力なしで自動表示されます（この端末のブラウザ内にのみ保存されます）。</p>
      <div class="my-actions"><button class="btn" type="button" data-open-profile>プロフィールを登録する</button></div>`;
    return;
  }
  const sign = zodiacOf(birth);
  const f = zodiacFortune(sign);
  const num = lifePathNumber(birth);
  const ky = KYUSEI[kyuseiNumber(birth)];
  const stem = getDayStem(birth);
  const { sei = "", mei = "" } = loadProfile();
  const who = (sei + mei).trim();
  box.innerHTML = `
    <h3 class="card-title">${who ? `${escapeHtml(who)}さんの` : "あなたの"}今日の運勢</h3>
    <div class="my-summary">
      <div class="my-sign"><p class="symbol">${sign.symbol}</p><p>${sign.name}</p></div>
      <div>
        <p class="stars-val big">${stars(f.total)}</p>
        <p>${f.message}</p>
        ${luckyHtml([`ラッキーカラー：${f.color}`, `ラッキーアイテム：${f.item}`, `ラッキースポット：${f.spot}`])}
        <p class="sub">日干 ${stem.stem}（${stem.symbol}）／ 運命数 ${num}（${NUMEROLOGY[num].title}）／ 本命星 ${ky.name}</p>
      </div>
    </div>
    <div class="my-actions">
      <a class="btn small" href="#sogo">総合鑑定</a>
      <a class="btn small" href="#zodiac">星座占い</a>
      <a class="btn small" href="#shichu">四柱推命</a>
      <button class="btn ghost small" type="button" data-open-profile>プロフィールを編集</button>
    </div>`;
}

// 保存済みの生年月日を各フォームに入れておく
function fillBirthInputs() {
  const { birth } = loadProfile();
  if (!birth) return;
  document.querySelectorAll(".birth-input").forEach((el) => { if (!el.value) el.value = birth; });
}

// ---- タロット（ワンオラクル & スリーカード） ----
let tarotMode = "single"; // "single" | "spread"
let spreadCards = [];     // スリーカードで選択されたカード
const deck = document.getElementById("deck");
const tarotResult = document.getElementById("tarot-result");
const tarotReset = document.getElementById("tarot-reset");
const tarotLead = document.getElementById("tarot-lead");
const spreadSlots = document.getElementById("tarot-spread-slots");
const modeBtns = document.querySelectorAll(".tarot-mode-btn");

modeBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    tarotMode = btn.dataset.mode;
    modeBtns.forEach((b) => b.classList.toggle("active", b === btn));
    resetTarot();
  });
});

function resetTarot() {
  spreadCards = [];
  if (tarotMode === "single") {
    tarotLead.textContent = "心の中で質問を思い浮かべて、カードを1枚選んでください。";
    spreadSlots.hidden = true;
  } else {
    tarotLead.textContent = "「過去」「現在」「未来」の問いを胸に、カードを3枚順番に選んでください。（1枚目：過去）";
    spreadSlots.hidden = false;
    for (let i = 0; i < 3; i++) {
      const box = document.getElementById(`slot-${i}`);
      const name = document.getElementById(`slot-name-${i}`);
      box.innerHTML = `<span class="slot-icon">✦</span>`;
      box.classList.remove("filled");
      name.textContent = "未選択";
    }
  }
  renderDeck();
}

function renderDeck() {
  deck.innerHTML = "";
  const count = tarotMode === "single" ? 12 : 14;
  for (let i = 0; i < count; i++) {
    const card = document.createElement("button");
    card.className = "tarot-card";
    card.setAttribute("aria-label", `カード${i + 1}`);
    card.addEventListener("click", () => onCardClick(card));
    deck.appendChild(card);
  }
  deck.hidden = false;
  tarotResult.hidden = true;
  tarotReset.hidden = true;
}

function onCardClick(cardEl) {
  if (cardEl.classList.contains("picked")) return;

  if (tarotMode === "single") {
    // 1枚引き
    const card = TAROT[Math.floor(Math.random() * TAROT.length)];
    const reversed = Math.random() < 0.5;
    const pos = reversed ? "逆位置" : "正位置";
    deck.hidden = true;
    show(tarotResult, `
      <p class="symbol">🃏</p>
      <h3>${card.name}</h3>
      <p class="sub">${card.en}　<span class="badge ${reversed ? "rev" : ""}">${pos}</span></p>
      <p class="tarot-body">${reversed ? card.rev : card.up}</p>
      <a class="more" href="/column/tarot.html">大アルカナ22枚の意味一覧 →</a>
      ${shareButtons(`【${SITE_NAME}】タロットで「${card.name}（${pos}）」を引きました🃏`)}
    `);
    tarotReset.hidden = false;
  } else {
    // 3枚引き
    cardEl.classList.add("picked");
    cardEl.disabled = true;

    // 重複しないように選ぶ
    const chosenNames = spreadCards.map((c) => c.card.name);
    const available = TAROT.filter((c) => !chosenNames.includes(c.name));
    const card = available[Math.floor(Math.random() * available.length)];
    const reversed = Math.random() < 0.5;
    const slotIdx = spreadCards.length;

    spreadCards.push({ card, reversed, slotIdx });

    const slotBox = document.getElementById(`slot-${slotIdx}`);
    const slotName = document.getElementById(`slot-name-${slotIdx}`);
    const pos = reversed ? "逆位置" : "正位置";
    slotBox.innerHTML = `<span>🃏</span>`;
    slotBox.classList.add("filled");
    slotName.innerHTML = `<strong>${card.name}</strong><br><small class="${reversed ? "rev-txt" : ""}">${pos}</small>`;

    if (spreadCards.length === 1) {
      tarotLead.textContent = "2枚目のカードを選んでください。（2枚目：現在）";
    } else if (spreadCards.length === 2) {
      tarotLead.textContent = "3枚目のカードを選んでください。（3枚目：未来）";
    } else if (spreadCards.length === 3) {
      tarotLead.textContent = "3枚のカードが揃いました。";
      deck.hidden = true;
      setTimeout(renderSpreadResult, 400);
    }
  }
}

function renderSpreadResult() {
  const [cPast, cPres, cFut] = spreadCards;
  const labels = [
    { title: "過去（原因・これまでの流れ）", item: cPast, key: "past" },
    { title: "現在（直面している状況・課題）", item: cPres, key: "present" },
    { title: "未来（これからの展開・可能性）", item: cFut, key: "future" },
  ];

  // 総合メッセージの算出
  const revCount = spreadCards.filter((c) => c.reversed).length;
  let overall = "";
  if (revCount === 0) {
    overall = "3枚ともすべて「正位置」という素晴らしい展開です。過去からの努力が現在の自信を生み、未来に向かって力強く前進できる追い風が吹いています。迷わず直感を信じて進んでください。";
  } else if (revCount === 3) {
    overall = "3枚すべてが「逆位置」として現れました。今は無理に動くよりも、これまでのやり方や心構えを丁寧に見直す大切なタイミングです。焦りを手放し、基礎を固めることで状況は必ず好転します。";
  } else {
    overall = "正位置と逆位置がバランスよく現れ、人生のリアルな過渡期を映し出しています。過去の教訓を現在に活かし、未来のヒントを意識することで、より良い結果を引き寄せられるでしょう。";
  }

  const shareText = `【${SITE_NAME}】タロット3枚引き：過去【${cPast.card.name}】現在【${cPres.card.name}】未来【${cFut.card.name}】`;

  show(tarotResult, `
    <h3 class="tarot-spread-title">スリーカード・スプレッドの解釈</h3>
    <p class="sub">過去から現在、そして未来へとつながる時間の流れ</p>
    <div class="spread-results-grid">
      ${labels.map(({ title, item, key }) => {
        const pos = item.reversed ? "逆位置" : "正位置";
        const text = item.card.spread ? item.card.spread[key][item.reversed ? "rev" : "up"] : (item.reversed ? item.card.rev : item.card.up);
        return `
          <div class="spread-res-card">
            <span class="spread-step-tag">${title}</span>
            <div class="spread-res-header">
              <span class="symbol small">🃏</span>
              <div>
                <h4>${item.card.name}</h4>
                <p class="sub">${item.card.en} <span class="badge ${item.reversed ? "rev" : ""}">${pos}</span></p>
              </div>
            </div>
            <p class="spread-text">${text}</p>
          </div>`;
      }).join("")}
    </div>
    <div class="spread-overall-card">
      <h4>✦ 3枚が導く総合メッセージ</h4>
      <p>${overall}</p>
    </div>
    <a class="more" href="/column/tarot.html">大アルカナ22枚の意味一覧 →</a>
    ${shareButtons(shareText)}
  `);
  tarotReset.hidden = false;
}

tarotReset.addEventListener("click", resetTarot);

// ---- おみくじ ----
const omikujiDrawBtn = document.getElementById("omikuji-draw");
const omikujiBoxWrap = document.getElementById("omikuji-cylinder-wrap");
const omikujiStickDisp = document.getElementById("omikuji-stick-disp");
const omikujiResult = document.getElementById("omikuji-result");
const omikujiResetBtn = document.getElementById("omikuji-reset");

function drawOmikuji() {
  if (omikujiDrawBtn.disabled) return;
  omikujiDrawBtn.disabled = true;
  omikujiResult.hidden = true;
  omikujiResetBtn.hidden = true;
  omikujiStickDisp.hidden = true;

  // 筒を振るアニメーション
  omikujiBoxWrap.classList.add("shaking");

  setTimeout(() => {
    omikujiBoxWrap.classList.remove("shaking");
    // おみくじ棒を出す
    const item = OMIKUJI[Math.floor(Math.random() * OMIKUJI.length)];
    omikujiStickDisp.textContent = `${item.grade}`;
    omikujiStickDisp.hidden = false;
    omikujiStickDisp.classList.add("slide-out");

    setTimeout(() => {
      renderOmikujiResult(item);
      omikujiDrawBtn.disabled = false;
    }, 500);
  }, 900);
}

function renderOmikujiResult(item) {
  show(omikujiResult, `
    <div class="omikuji-paper">
      <div class="omikuji-header">
        <span class="omikuji-crest">⛩️ 星読み神社 御神籤 ⛩️</span>
        <h3 class="omikuji-grade grade-${item.grade}">${item.grade}</h3>
        <p class="omikuji-en">${item.gradeEn}</p>
      </div>

      <div class="omikuji-poem">
        <p>${item.poem}</p>
      </div>

      <div class="omikuji-message">
        <p>${item.message}</p>
      </div>

      <div class="omikuji-details">
        <div class="omikuji-row"><strong>【願　望】</strong><span>${item.wish}</span></div>
        <div class="omikuji-row"><strong>【恋　愛】</strong><span>${item.love}</span></div>
        <div class="omikuji-row"><strong>【仕・学】</strong><span>${item.work}</span></div>
        <div class="omikuji-row"><strong>【健　康】</strong><span>${item.health}</span></div>
        <div class="omikuji-row"><strong>【金　運】</strong><span>${item.money}</span></div>
      </div>

      <div class="omikuji-lucky">
        <span>吉方位：${item.direction}</span>
        <span>縁起物：${item.item}</span>
      </div>
    </div>
    ${shareButtons(`【${SITE_NAME}】今日のおみくじは【${item.grade}】でした！「${item.poem}」⛩️`)}
  `);
  omikujiResetBtn.hidden = false;
}

if (omikujiDrawBtn) {
  omikujiDrawBtn.addEventListener("click", drawOmikuji);
  omikujiResetBtn.addEventListener("click", () => {
    omikujiResult.hidden = true;
    omikujiResetBtn.hidden = true;
    omikujiStickDisp.hidden = true;
    omikujiStickDisp.classList.remove("slide-out");
    document.getElementById("omikuji").scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

// ---- 四柱推命（日干占い） ----
const shichuForm = document.getElementById("shichu-form");
if (shichuForm) {
  shichuForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const birthVal = document.getElementById("shichu-birth").value;
    const stem = getDayStem(birthVal);
    let dayKanshiStr = "";
    if (typeof fourPillars === "function") {
      const [by, bm, bd] = birthVal.split("-").map(Number);
      const fp = fourPillars(by, bm, bd);
      dayKanshiStr = ` <small>（日柱：${kanshiName(fp.day)}）</small>`;
    }

    // 今日の干支アドバイス用シード
    const rand = seededRandom("shichu" + todayStr() + stem.stem);
    const pick = (arr) => arr[Math.floor(rand() * arr.length)];
    const todayScore = 1 + Math.floor(rand() * 5);

    show(document.getElementById("shichu-result"), `
      <div class="shichu-card">
        <div class="shichu-hero">
          <p class="symbol" style="color: ${stem.color};">${stem.icon}</p>
          <h3>あなたの本質：日干「${stem.stem}（${stem.kana}）」${dayKanshiStr}</h3>
          <p class="sub">${stem.element} ／ 象徴：${stem.symbol}</p>
          <p class="shichu-catch">「${stem.catch}」</p>
        </div>

        <div class="shichu-section">
          <h4>✦ 基本性格・本質</h4>
          <p>${stem.personality}</p>
        </div>

        <div class="grid-2 shichu-features">
          <div class="feature-box">
            <h5>長所・強み</h5>
            <ul>${stem.strengths.map((s) => `<li>${s}</li>`).join("")}</ul>
          </div>
          <div class="feature-box">
            <h5>気をつけたい点</h5>
            <ul>${stem.weaknesses.map((w) => `<li>${w}</li>`).join("")}</ul>
          </div>
        </div>

        <div class="shichu-section">
          <h4>✦ 仕事・才能</h4>
          <p>${stem.work}</p>
        </div>

        <div class="shichu-section">
          <h4>✦ 恋愛・パートナーシップ</h4>
          <p>${stem.love}</p>
        </div>

        <div class="shichu-section highlight">
          <h4>✦ 最高の相性（干合）</h4>
          <p>${stem.compat}</p>
        </div>

        <div class="shichu-section today-advice">
          <h4>✦ 今日の運気アドバイス</h4>
          <p class="total">日干の調和度 <span class="stars-val">${stars(todayScore)}</span></p>
          <p>${stem.advice}</p>
        </div>

        ${shareButtons(`【${SITE_NAME}】四柱推命で私の日干は「${stem.stem}（${stem.kana}）― ${stem.symbol}」でした📜`)}
      </div>
    `);
  });
}

// ---- 星座占い ----
// 相性の良い星座：同じエレメントと、補い合うエレメント（火⇔風、地⇔水）
const ELEMENT_FRIEND = { 火: "風", 風: "火", 地: "水", 水: "地" };
function zodiacDetailHtml(sign) {
  const d = ZODIAC_DETAIL[sign.name];
  const good = ZODIAC.filter((z) => z !== sign && (z.element === sign.element || z.element === ELEMENT_FRIEND[sign.element]));
  return `
    <h4 class="detail-title">✦ ${sign.name}の基本性格</h4>
    <p class="sub">守護星：${d.ruler} ／ ${sign.element}のエレメント・${d.quality} ／ キーワード：${d.keyword}</p>
    <p>${d.desc}</p>
    <div class="grid-2 num-features">
      <div class="feature-box"><h5>強み</h5><ul>${d.strengths.map((t) => `<li>${t}</li>`).join("")}</ul></div>
      <div class="feature-box"><h5>気をつけたい点</h5><ul>${d.weaknesses.map((t) => `<li>${t}</li>`).join("")}</ul></div>
    </div>
    <div class="num-section"><h4>✦ 恋愛傾向</h4><p>${d.love}</p></div>
    <div class="num-section"><h4>✦ 仕事・適職</h4><p>${d.work}</p></div>
    <div class="num-section"><h4>✦ 相性の良い星座</h4><p>${good.map((z) => `${z.symbol} ${z.name}`).join("、")}</p></div>
    <div class="num-section"><h4>✦ 開運アドバイス</h4><p>${d.advice}</p></div>`;
}

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
    ${zodiacDetailHtml(sign)}
    ${shareButtons(`【${SITE_NAME}】${label}の${sign.name}は総合運${stars(f.total)}！ラッキーカラーは${f.color}✨`)}
  `);
});

// ---- 数秘術 ----
// 数字の各桁を足す
const digitSum = (n) => String(n).split("").reduce((s, c) => s + Number(c), 0);

// 1桁（またはマスターナンバー）になるまで足し、途中経過も返す
function reduceSteps(n, keepMaster = true) {
  const steps = [];
  while (n > 9 && !(keepMaster && [11, 22, 33].includes(n))) {
    steps.push(`${String(n).split("").join("+")} = ${digitSum(n)}`);
    n = digitSum(n);
  }
  return { n, steps };
}

document.getElementById("num-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const birth = document.getElementById("num-birth").value;
  const [, bm, bd] = birth.split("-").map(Number);
  const num = lifePathNumber(birth);
  const info = NUMEROLOGY[num];
  const dt = NUMEROLOGY_DETAIL[num];

  // 計算過程
  const digits = birth.replace(/\D/g, "").split("");
  const total = digits.reduce((s, c) => s + Number(c), 0);
  const calc = [`${digits.join("+")} = ${total}`, ...reduceSteps(total).steps];

  // 誕生数・個人年数・個人月数
  const birthDay = reduceSteps(bd).n; // 11日・22日はマスターナンバーのまま
  const now = new Date();
  const py = reduceSteps(digitSum(bm) + digitSum(bd) + digitSum(now.getFullYear()), false).n;
  const pm = reduceSteps(py + now.getMonth() + 1, false).n;
  const year = PERSONAL_YEAR[py];

  show(document.getElementById("num-result"), `
    <p class="symbol">${num}</p>
    <h3>運命数 ${num}：${info.title}</h3>
    <p class="sub">計算：${calc.join(" → ")}</p>
    ${luckyHtml(info.keywords)}

    <div class="num-section">
      <h4>✦ 基本性格</h4>
      <p>${dt.personality}</p>
    </div>
    <div class="grid-2 num-features">
      <div class="feature-box"><h5>長所・強み</h5><ul>${dt.strengths.map((t) => `<li>${t}</li>`).join("")}</ul></div>
      <div class="feature-box"><h5>気をつけたい点</h5><ul>${dt.weaknesses.map((t) => `<li>${t}</li>`).join("")}</ul></div>
    </div>
    <div class="num-section"><h4>✦ 仕事・適職</h4><p>${dt.work}</p></div>
    <div class="num-section"><h4>✦ 恋愛・パートナーシップ</h4><p>${dt.love}</p></div>
    <div class="num-section"><h4>✦ 相性の良い運命数</h4><p>${dt.compat.map((n) => `<strong>${n}</strong>（${NUMEROLOGY[n].title}）`).join("、")}</p></div>

    <div class="num-section">
      <h4>✦ 誕生数 ${birthDay}</h4>
      <p>生まれた日（${bd}日）が表す、生まれ持った才能：<strong>${BIRTH_DAY_TEXT[birthDay]}</strong></p>
    </div>
    <div class="num-section highlight">
      <h4>✦ ${now.getFullYear()}年のあなた：個人年数 ${py}「${year.theme}」</h4>
      <p>${year.text}</p>
      <p class="sub">今月（${now.getMonth() + 1}月）の個人月数は ${pm}「${PERSONAL_YEAR[pm].theme}」。月のテーマとして意識してみて。</p>
    </div>
    <div class="num-section today-advice">
      <h4>✦ あなたへのメッセージ</h4>
      <p>${dt.advice}</p>
      ${luckyHtml([`ラッキーカラー：${dt.color}`])}
    </div>

    <a class="more" href="/column/numerology.html">すべての運命数の意味を見る →</a>
    ${shareButtons(`【${SITE_NAME}】私の運命数は「${num}：${info.title}」、今年は「${year.theme}」でした🔢`)}
  `);
});

// ---- 相性占い ----
function elementCompat(a, b) {
  if (a === b) return ELEMENT_COMPAT.same;
  const pair = [a, b].sort().join("");
  return pair === "火風" || pair === "地水" ? ELEMENT_COMPAT.good : ELEMENT_COMPAT.mid;
}

// 運命数のグループ（マスターナンバーは 11→2, 22→4, 33→6 として扱う）
function numCompatText(na, nb) {
  const base = (n) => (n > 9 ? digitSum(n) : n);
  const ga = NUM_GROUPS.find((g) => g.nums.includes(base(na)));
  const gb = NUM_GROUPS.find((g) => g.nums.includes(base(nb)));
  const head = `運命数${na}（${NUMEROLOGY[na].title}）と運命数${nb}（${NUMEROLOGY[nb].title}）の組み合わせ。`;
  if (na === nb) return `${head}同じ運命数を持つふたりは、考え方や大切にしているものがよく似ています。言葉にしなくても分かり合える一方、同じ弱点を持つことも。互いの姿を鏡にして成長できる関係です。`;
  if (ga === gb) return `${head}どちらも「${ga.name}」で、${ga.text}価値観が共通しています。一緒にいて自然体でいられ、ペースも合いやすい関係です。`;
  return `${head}「${ga.name}」と「${gb.name}」という異なるタイプ。${ga.text}あなたと、${gb.text}お相手は、違いがあるからこそ互いに新しい視点をもたらせます。`;
}

// ふたりの生年月日から相性の点数を出す（rand は続けて恋愛・友情・仕事の点数にも使う）
function compatScore(a, b) {
  const sa = zodiacOf(a), sb = zodiacOf(b);
  const na = lifePathNumber(a), nb = lifePathNumber(b);
  const el = elementCompat(sa.element, sb.element);
  const rand = seededRandom([a, b].sort().join("|"));
  const numBonus = na === nb ? 8 : Math.abs((na % 9) - (nb % 9)) <= 2 ? 4 : 0;
  const score = Math.min(99, el.score + numBonus + Math.floor(rand() * 8) - 2);
  return { sa, sb, na, nb, el, rand, score };
}

document.getElementById("compat-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const a = document.getElementById("compat-a").value;
  const b = document.getElementById("compat-b").value;
  const { sa, sb, na, nb, el, rand, score } = compatScore(a, b);
  const pair = ELEMENT_PAIR[elementPairKey(sa.element, sb.element)];
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
    <div class="cats">
      ${[["恋愛", 0], ["友情", 3], ["仕事", -3]].map(([label, bias]) => {
        const v = Math.max(30, Math.min(99, score + bias + Math.floor(rand() * 15) - 7));
        return `<div class="cat"><p><strong>${label}の相性</strong> ${v}点</p><div class="meter-bar"><span style="width:${v}%"></span></div></div>`;
      }).join("")}
    </div>
    <div class="num-section"><h4>✦ 星座から見たふたり：${pair.title}</h4><p>${pair.text}</p></div>
    <div class="num-section"><h4>✦ 数秘術から見たふたり</h4><p>${numCompatText(na, nb)}</p></div>
    <div class="num-section"><h4>✦ ふたりへのアドバイス</h4><p>${pair.advice}</p></div>
    ${shareButtons(`【${SITE_NAME}】${sa.name}×${sb.name}の相性は${score}点でした💞`)}
  `);
});

// ---- 相性のいい生年月日を探す ----
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const md = (d) => `${d.getMonth() + 1}/${d.getDate()}`;

document.getElementById("match-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const me = document.getElementById("match-birth").value;
  const year = Number(document.getElementById("match-year").value) || 0;
  // 生まれ年が空欄なら、自分の生まれ年の前後10年を対象にする
  const myYear = Number(me.slice(0, 4));
  const [from, to] = year ? [year, year] : [myYear - 10, myYear + 10];
  const range = from === to ? `${from}年生まれ` : `${from}〜${to}年生まれ`;
  const days = [];
  for (let d = new Date(from, 0, 1); d.getFullYear() <= to; d.setDate(d.getDate() + 1)) {
    const date = new Date(d);
    const c = compatScore(me, ymd(date));
    days.push({ date, score: c.score, sign: c.sb, num: c.nb });
  }

  // ベスト生年月日：点数の高い順。同点が多いので、範囲内の年に散らばるよう
  // 同点の並びは生年月日ごとに決まった乱数で決め、1つの星座は3日まで・1つの年は1日までにする
  const tie = seededRandom(`match|${me}`);
  days.forEach((d) => { d.tie = tie(); });
  const perSign = {}, perYear = {};
  const best = [...days].sort((x, y) => y.score - x.score || x.tie - y.tie)
    .filter((d) => {
      const y = d.date.getFullYear();
      if ((perSign[d.sign.name] || 0) >= 3 || (from !== to && perYear[y])) return false;
      perSign[d.sign.name] = (perSign[d.sign.name] || 0) + 1;
      perYear[y] = true;
      return true;
    })
    .slice(0, 10)
    .sort((x, y) => y.score - x.score || x.date - y.date);

  // 星座ごとの期間と平均点（山羊座は年始と年末の2つの期間になる）
  const signs = ZODIAC.map((z) => {
    const list = days.filter((d) => d.sign === z);
    const runs = [];
    list.filter((d) => d.date.getFullYear() === from).forEach((d, i, first) => {
      if (i && d.date - first[i - 1].date === 864e5) runs[runs.length - 1][1] = d.date;
      else runs.push([d.date, d.date]);
    });
    const avg = Math.round(list.reduce((t, d) => t + d.score, 0) / list.length);
    return { z, avg, period: runs.map(([f, t]) => `${md(f)}〜${md(t)}`).join("・") };
  }).sort((x, y) => y.avg - x.avg);

  // 運命数ごとの平均点（上位3つ）
  const nums = [...new Set(days.map((d) => d.num))].map((n) => {
    const list = days.filter((d) => d.num === n);
    return { n, avg: Math.round(list.reduce((t, d) => t + d.score, 0) / list.length) };
  }).sort((x, y) => y.avg - x.avg || x.n - y.n).slice(0, 3);

  const mySign = zodiacOf(me);
  const dateLabel = (d) => `${from === to ? "" : `${d.getFullYear()}年`}${d.getMonth() + 1}月${d.getDate()}日`;
  show(document.getElementById("match-result"), `
    <h3>${range}の相性ベスト10</h3>
    <p class="sub">あなた：${mySign.symbol} ${mySign.name}・運命数${lifePathNumber(me)} ／ 日付を押すと詳しい相性を占えます</p>
    <ol class="match-list">
      ${best.map((d, i) => `<li><span class="match-rank">${i + 1}</span><button type="button" class="chip" data-date="${ymd(d.date)}">${dateLabel(d.date)}</button>
        <span>${d.sign.symbol} ${d.sign.name}・運命数${d.num}</span><strong>${d.score}点</strong></li>`).join("")}
    </ol>
    <h4 class="detail-title">✦ 相性のいい運命数</h4>
    <p>${nums.map((x) => `<strong>${x.n}</strong>（${NUMEROLOGY[x.n].title}）平均${x.avg}点`).join("、")}</p>
    <h4 class="detail-title">✦ 星座別の相性（${range}）</h4>
    <div class="match-signs">
      ${signs.map((s) => `<div class="match-sign"><span>${s.z.symbol} ${s.z.name}</span><span class="sub">${s.period}</span>
        <span class="meter-bar"><span style="width:${s.avg}%"></span></span><strong>${s.avg}点</strong></div>`).join("")}
    </div>
    ${shareButtons(`【${SITE_NAME}】${mySign.name}の私と相性のいい誕生日は${dateLabel(best[0].date)}でした💞`)}
  `);
});

// 日付を押すと、上の相性占いで詳しく占う
document.getElementById("match-result").addEventListener("click", (e) => {
  const date = e.target.dataset.date;
  if (!date) return;
  document.getElementById("compat-a").value = document.getElementById("match-birth").value;
  document.getElementById("compat-b").value = date;
  document.getElementById("compat-form").requestSubmit();
  document.getElementById("compat-result").scrollIntoView({ behavior: "smooth", block: "start" });
});

// ---- ルーン ----
// 上下対称でないルーンは、逆位置（rev）が出ることがあります
function drawRunes(n) {
  const pool = [...RUNES];
  return Array.from({ length: n }, () => {
    const r = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    const d = RUNE_DETAIL[r.name];
    return { ...r, ...d, reversed: d.rev !== null && Math.random() < 0.5 };
  });
}
const runePos = (r) => (r.reversed ? "逆位置" : r.rev === null ? "正位置（逆位置なし）" : "正位置");

document.getElementById("rune-draw").addEventListener("click", () => {
  const [r] = drawRunes(1);
  show(document.getElementById("rune-result"), `
    <p class="symbol rune ${r.reversed ? "rev" : ""}">${r.char}</p>
    <h3>${r.name}</h3>
    <p class="sub">${r.meaning} ／ ${runePos(r)}</p>
    <p>${r.reversed ? r.rev : r.text}</p>
    <div class="cats">
      <div class="cat"><p><strong>恋愛</strong></p><p>${r.love}</p></div>
      <div class="cat"><p><strong>仕事</strong></p><p>${r.work}</p></div>
    </div>
    <div class="num-section"><h4>✦ アドバイス</h4><p>${r.advice}</p></div>
    ${r.reversed ? `<p class="sub">※ 逆位置は、そのルーンの力が弱まっている・裏目に出やすい状態を表します。本来の意味は「${r.text}」</p>` : ""}
    ${shareButtons(`【${SITE_NAME}】ルーン占いで「${r.name}（${r.meaning}）」を引きました`)}
  `);
});

document.getElementById("rune-draw3").addEventListener("click", () => {
  const runes = drawRunes(3);
  const labels = [["過去", "これまでの流れ・原因"], ["現在", "今のあなたの状態"], ["未来", "このまま進んだ先"]];
  show(document.getElementById("rune-result"), `
    <h3>過去・現在・未来</h3>
    <div class="rune-spread">
      ${runes.map((r, i) => `<div class="rune-slot">
        <p class="rune-label">${labels[i][0]}</p>
        <p class="symbol rune ${r.reversed ? "rev" : ""}">${r.char}</p>
        <p><strong>${r.name}</strong></p>
        <p class="sub">${r.meaning}<br>${r.reversed ? "逆位置" : "正位置"}</p>
      </div>`).join("")}
    </div>
    ${runes.map((r, i) => `<div class="num-section"><h4>✦ ${labels[i][0]}：${labels[i][1]}</h4><p>${r.reversed ? r.rev : r.text}</p></div>`).join("")}
    <div class="num-section"><h4>✦ 未来をよくするアドバイス</h4><p>${runes[2].advice}</p></div>
    ${shareButtons(`【${SITE_NAME}】ルーン占い（過去・現在・未来）で「${runes.map((r) => r.name).join("・")}」を引きました`)}
  `);
});

// ---- 九星気学（kyusei.js） ----

// ---- 夢占い ----
const DREAM_LUCK = { good: ["吉夢", ""], caution: ["注意のサイン", "rev"], neutral: ["状況しだい", "neutral"] };

function dreamHtml(d) {
  const [luck, cls] = DREAM_LUCK[d.luck];
  return `<div class="dream-item">
    <h3>「${d.keys[0]}」の夢 <span class="badge ${cls}">${luck}</span></h3>
    <p class="sub">${d.cat}</p>
    <p>${d.text}</p>
    ${d.scenes ? `<ul class="dream-scenes">${d.scenes.map(([k, v]) => `<li><strong>${k}</strong>：${v}</li>`).join("")}</ul>` : ""}
  </div>`;
}

function searchDream(word) {
  const el = document.getElementById("dream-result");
  const hits = DREAMS.filter((d) => d.keys.some((k) => word.includes(k) || k.includes(word))
    || (d.scenes || []).some(([k]) => k.includes(word)));
  if (!hits.length) {
    show(el, `<h3>「${escapeHtml(word)}」は見つかりませんでした</h3><p>別の言葉で試すか、キーワード一覧から選んでください。</p>`);
    return;
  }
  show(el, hits.map(dreamHtml).join("") +
    shareButtons(`【${SITE_NAME}】「${hits[0].keys[0]}」の夢の意味を占いました🌙`));
}

document.getElementById("dream-form").addEventListener("submit", (e) => {
  e.preventDefault();
  searchDream(document.getElementById("dream-word").value.trim());
});

// カテゴリ別のキーワード一覧（クリックで検索）
document.getElementById("dream-index").innerHTML = DREAM_CATEGORIES.map((c) => `
  <div class="dream-cat"><span class="dream-cat-name">${c}</span>
    ${DREAMS.filter((d) => d.cat === c).map((d) => `<button type="button" class="chip" data-word="${d.keys[0]}">${d.keys[0]}</button>`).join("")}
  </div>`).join("");
document.getElementById("dream-index").addEventListener("click", (e) => {
  const w = e.target.dataset.word;
  if (!w) return;
  document.getElementById("dream-word").value = w;
  searchDream(w);
});

// ---- 初期表示 ----
resetTarot();
renderRanking();
renderMoon();
renderMyBox();
fillBirthInputs();
if (location.hash) onHash();
