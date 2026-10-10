// 全ページ共通：ヘッダー・フッター・ユーティリティ

const SITE_NAME = "星読みの部屋";

const NAV = [
  ["/", "トップ"],
  ["/#today", "今日の運勢"],
  ["/#menu", "占術一覧"],
  ["/column/", "コラム"],
  ["/contact.html", "お問い合わせ"],
];

const FOOTER_LINKS = [
  ["/terms.html", "利用規約"],
  ["/privacy.html", "プライバシーポリシー"],
  ["/about.html", "運営者情報"],
  ["/contact.html", "お問い合わせ"],
];

function renderLayout() {
  const header = document.getElementById("site-header");
  if (header) {
    header.className = "site-header";
    header.innerHTML = `
      <div class="header-inner">
        <a class="logo" href="/">${SITE_NAME}</a>
        <button class="menu-toggle" aria-label="メニュー" aria-expanded="false">☰</button>
        <nav class="global-nav">${NAV.map(([href, label]) => `<a href="${href}">${label}</a>`).join("")}</nav>
      </div>`;
    const toggle = header.querySelector(".menu-toggle");
    toggle.addEventListener("click", () => {
      const open = header.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open);
    });
    header.querySelectorAll(".global-nav a").forEach((a) => a.addEventListener("click", () => header.classList.remove("nav-open")));
  }

  const footer = document.getElementById("site-footer");
  if (footer) {
    footer.className = "site-footer";
    footer.innerHTML = `
      <nav class="footer-nav">${FOOTER_LINKS.map(([href, label]) => `<a href="${href}">${label}</a>`).join("")}</nav>
      <p>占い結果はエンターテインメントとしてお楽しみください。</p>
      <p>&copy; ${new Date().getFullYear()} ${SITE_NAME}</p>`;
  }
}

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
const fmtDate = (d) => d.toLocaleDateString("sv-SE"); // YYYY-MM-DD（ローカル日付）
const todayStr = () => fmtDate(new Date());
const jpDate = (d) => `${d.getMonth() + 1}月${d.getDate()}日`;

// ---- 月齢 ----
const SYNODIC = 29.530588853;
const NEW_MOON_REF = Date.UTC(2000, 0, 6, 18, 14); // 基準となる新月

function moonAge(date = new Date()) {
  const days = (date.getTime() - NEW_MOON_REF) / 86400000;
  return ((days % SYNODIC) + SYNODIC) % SYNODIC;
}

function moonPhase(age) {
  return MOON_PHASES.find((p) => age < p.max);
}

// 指定日以降の新月・満月の日付（目安）
function upcomingMoons(count = 6, from = new Date()) {
  const age = moonAge(from);
  const result = [];
  let nextNew = from.getTime() + (SYNODIC - age) * 86400000;
  let nextFull = from.getTime() + (((SYNODIC / 2 - age) + SYNODIC) % SYNODIC) * 86400000;
  while (result.length < count) {
    if (nextNew < nextFull) {
      result.push({ type: "新月", emoji: "🌑", date: new Date(nextNew) });
      nextNew += SYNODIC * 86400000;
    } else {
      result.push({ type: "満月", emoji: "🌕", date: new Date(nextFull) });
      nextFull += SYNODIC * 86400000;
    }
  }
  return result;
}

// ---- SNSシェア ----
function shareButtons(text) {
  const url = location.origin + "/";
  const x = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  const line = `https://line.me/R/msg/text/?${encodeURIComponent(text + "\n" + url)}`;
  return `
    <div class="share">
      <a class="share-btn x" href="${x}" target="_blank" rel="noopener">Xでシェア</a>
      <a class="share-btn line" href="${line}" target="_blank" rel="noopener">LINEで送る</a>
    </div>`;
}

// ---- 生年月日の保存（この端末のブラウザ内のみ） ----
const PROFILE_KEY = "uranai-profile";

function loadProfile() {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY)) || {}; } catch { return {}; }
}

function saveProfile(data) {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...loadProfile(), ...data })); } catch {}
}

function clearProfile() {
  try { localStorage.removeItem(PROFILE_KEY); } catch {}
}

renderLayout();
