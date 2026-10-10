// ---- タブ切替 ----
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t === tab));
    document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("active", p.id === tab.dataset.tab));
  });
});

document.getElementById("year").textContent = new Date().getFullYear();

// ---- ユーティリティ ----
// 文字列から決まった乱数列を作る（同じ日・同じ星座なら同じ結果になる）
function seededRandom(seedStr) {
  let h = 2166136261;
  for (const c of seedStr) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const stars = (n) => "★".repeat(n) + "☆".repeat(5 - n);
const todayStr = () => new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD（ローカル日付）

function show(el, html) {
  el.innerHTML = html;
  el.hidden = false;
  el.scrollIntoView({ behavior: "smooth", block: "nearest" });
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
  deck.hidden = true;
  show(tarotResult, `
    <p class="symbol">🃏</p>
    <h3>${card.name}</h3>
    <p class="sub">${card.en}　<span class="badge ${reversed ? "rev" : ""}">${reversed ? "逆位置" : "正位置"}</span></p>
    <p>${reversed ? card.rev : card.up}</p>
  `);
  tarotReset.hidden = false;
}

tarotReset.addEventListener("click", renderDeck);
renderDeck();

// ---- 星座占い ----
function getZodiac(month, day) {
  if (month === 12 && day >= 22) return ZODIAC[0]; // 山羊座（年末側）
  // 開始日が遅い順に見て、該当する最初の星座を返す
  for (let i = ZODIAC.length - 1; i >= 1; i--) {
    const [m, d] = ZODIAC[i].from;
    if (month > m || (month === m && day >= d)) return ZODIAC[i];
  }
  return ZODIAC[0]; // 12/22〜1/19 は山羊座
}

document.getElementById("zodiac-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const [, m, d] = document.getElementById("zodiac-birth").value.split("-").map(Number);
  const sign = getZodiac(m, d);
  const rand = seededRandom(todayStr() + sign.name);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const score = () => 1 + Math.floor(rand() * 5);
  const [total, love, work, money] = [score(), score(), score(), score()];

  show(document.getElementById("zodiac-result"), `
    <p class="symbol">${sign.symbol}</p>
    <h3>${sign.name}</h3>
    <p class="sub">${todayStr()} の運勢</p>
    <div class="meter">
      <span>総合</span><span class="stars-val">${stars(total)}</span>
      <span>恋愛</span><span class="stars-val">${stars(love)}</span>
      <span>仕事</span><span class="stars-val">${stars(work)}</span>
      <span>金運</span><span class="stars-val">${stars(money)}</span>
    </div>
    <p>${pick(ZODIAC_MESSAGES)}</p>
    <div class="lucky">
      <span>ラッキーカラー：${pick(LUCKY_COLORS)}</span>
      <span>ラッキーアイテム：${pick(LUCKY_ITEMS)}</span>
    </div>
  `);
});

// ---- 数秘術 ----
function lifePathNumber(dateStr) {
  let n = dateStr.replace(/\D/g, "").split("").reduce((s, c) => s + Number(c), 0);
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = String(n).split("").reduce((s, c) => s + Number(c), 0);
  }
  return n;
}

document.getElementById("num-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const num = lifePathNumber(document.getElementById("num-birth").value);
  const info = NUMEROLOGY[num];
  show(document.getElementById("num-result"), `
    <p class="symbol">${num}</p>
    <h3>運命数 ${num}：${info.title}</h3>
    <p>${info.text}</p>
    <div class="lucky">${info.keywords.map((k) => `<span>${k}</span>`).join("")}</div>
  `);
});
