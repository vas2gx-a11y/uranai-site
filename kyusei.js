// 九星気学：本命星・月命星と、年盤・月盤・日盤による運勢と方位
// koyomi.js・common.js・app.js の後に読み込む

const STAR_NAMES = [null, "一白水星", "二黒土星", "三碧木星", "四緑木星", "五黄土星", "六白金星", "七赤金星", "八白土星", "九紫火星"];
const STAR_ELEMENT = [null, "水", "土", "木", "木", "土", "金", "金", "土", "火"];
const GENERATES = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };

// 後天定位の宮（番号＝定位の星）
const PALACES = [
  null,
  { name: "坎宮", dir: "北", score: 1, theme: "冬の時期・停滞", text: "運気が最も低い充電期。無理に動かず、心身を休めて計画を練るときです。悩みは人に相談すると和らぎます。" },
  { name: "坤宮", dir: "南西", score: 3, theme: "準備・基礎固め", text: "地道な努力が実を結ぶ下準備の時期。目立たなくても、コツコツ積み上げたことが後で大きく役立ちます。" },
  { name: "震宮", dir: "東", score: 4, theme: "発展・始動", text: "運気が動き出す芽吹きの時期。新しいことを始めるのに向いています。やる気を行動に移して。" },
  { name: "巽宮", dir: "南東", score: 5, theme: "信用・整う", text: "物事が順調に整い、信用が集まる好調期。人とのご縁や取引がスムーズに進みます。" },
  { name: "中宮", dir: "中央", score: 2, theme: "転換・八方塞がり", text: "運気の転換点。周りから注目される一方、思い通りにいかないことも。新しいことは控え、足元を固めて。" },
  { name: "乾宮", dir: "北西", score: 4, theme: "充実・活動", text: "エネルギーに満ちた充実期。責任ある立場を任されやすく、努力が評価されます。働きすぎには注意。" },
  { name: "兌宮", dir: "西", score: 4, theme: "収穫・喜び", text: "これまでの努力が実る収穫の時期。楽しいことや臨時収入にも恵まれます。浪費だけは気をつけて。" },
  { name: "艮宮", dir: "北東", score: 2, theme: "変化・改革", text: "変化が起こりやすい節目の時期。環境の変化を前向きに受け止めると、新しい道が開けます。" },
  { name: "離宮", dir: "南", score: 3, theme: "頂上・注目", text: "運気の頂点で、才能が注目される時期。華やかな反面、隠し事が明るみに出やすいので誠実さを大切に。" },
];

// 盤の表示順（上が南）
const GRID_ORDER = [4, 9, 2, 3, 5, 7, 8, 1, 6];
// 十二支の方位にあたる宮（破の計算用）
const BRANCH_PALACE = [1, 8, 8, 3, 4, 4, 9, 2, 2, 7, 6, 6];

const star9 = (n) => mod(n - 1, 9) + 1;
const palaceOf = (star, center) => star9(star - center + 5); // その盤で星が入る宮
const starAt = (palace, center) => star9(center + palace - 5); // その宮に入る星
const opposite = (p) => (p === 5 ? null : 10 - p);

// 年の九星（立春で切り替え）
function yearStar(y, m, d) {
  const yy = m <= 2 && solarMonth(y, m, d) >= 11 ? y - 1 : y;
  let s = String(yy).split("").reduce((a, c) => a + Number(c), 0);
  while (s > 9) s = String(s).split("").reduce((a, c) => a + Number(c), 0);
  return star9(11 - s);
}

// 月の九星（節入りで切り替え）。寅月の星は年の星の組で決まる
function monthStar(y, m, d) {
  const ys = yearStar(y, m, d);
  const start = [1, 4, 7].includes(ys) ? 8 : [2, 5, 8].includes(ys) ? 2 : 5;
  return star9(start - (solarMonth(y, m, d) - 1));
}

// 日の九星：冬至に最も近い甲子の日から一白で順行（陽遁）、夏至に最も近い甲子の日から九紫で逆行（陰遁）
const dayNumber = (y, m, d) => Math.round(jdFromDate(y, m, d) + JST - 2415020.5); // 1900-01-01 = 0（甲戌）
function solsticeDay(year, lon) {
  const month = lon === 270 ? 12 : 6;
  for (let d = 15; d <= 28; d++) {
    const L = sunLongitude(jdFromDate(year, month, d) + 1);
    if (L >= lon && L < lon + 30) return dayNumber(year, month, d);
  }
  return null;
}
function nearestKoshi(dn) {
  const k = mod(dn + 10, 60); // その日の干支番号
  return k <= 30 ? dn - k : dn + (60 - k);
}
function dayStar(y, m, d) {
  const dn = dayNumber(y, m, d);
  const switches = [];
  for (const yy of [y - 1, y, y + 1]) {
    switches.push({ dn: nearestKoshi(solsticeDay(yy, 270)), yang: true });
    switches.push({ dn: nearestKoshi(solsticeDay(yy, 90)), yang: false });
  }
  const sw = switches.filter((s) => s.dn <= dn).sort((a, b) => b.dn - a.dn)[0];
  const n = dn - sw.dn;
  return sw.yang ? star9(1 + n) : star9(9 - n);
}

// 相生・比和の星（吉方位に使える星）
function friendlyStars(honmei) {
  const e = STAR_ELEMENT[honmei];
  return [1, 2, 3, 4, 6, 7, 8, 9].filter((s) => {
    const f = STAR_ELEMENT[s];
    return f === e || GENERATES[f] === e || GENERATES[e] === f;
  });
}

// 盤ごとの方位の吉凶
function directions(center, honmei, branch) {
  const bad = {};
  const mark = (p, label) => { if (p && p !== 5) (bad[p] ||= []).push(label); };
  const goPalace = palaceOf(5, center);
  if (center !== 5) { mark(goPalace, "五黄殺"); mark(opposite(goPalace), "暗剣殺"); }
  const hp = palaceOf(honmei, center);
  if (hp !== 5) { mark(hp, "本命殺"); mark(opposite(hp), "本命的殺"); }
  mark(opposite(BRANCH_PALACE[branch]), "破");
  const friends = friendlyStars(honmei);
  const good = [1, 2, 3, 4, 6, 7, 8, 9].filter((p) => !bad[p] && friends.includes(starAt(p, center)));
  return { bad, good };
}

// 出会い運：良縁の四緑木星・恋愛の七赤金星が吉方位に入る方角
const MEET_STARS = { 4: "良縁・結婚", 7: "恋愛・楽しい出会い" };
function meetDirs(center, honmei, branch) {
  const dirs = directions(center, honmei, branch);
  return Object.keys(MEET_STARS).map(Number)
    .map((s) => ({ star: s, palace: palaceOf(s, center) }))
    .filter((m) => dirs.good.includes(m.palace));
}

function meetHtml(periods, honmei) {
  const byPalace = {};
  const rows = periods.map(([label, center, branch]) => {
    const ms = meetDirs(center, honmei, branch);
    ms.forEach((m) => (byPalace[m.palace] ||= []).push(label));
    const text = ms.length
      ? ms.map((m) => `<strong>${PALACES[m.palace].dir}</strong>（${STAR_NAMES[m.star]}：${MEET_STARS[m.star]}）`).join("、")
      : "なし（吉方位へのお出かけで運気を整えて）";
    return `<p class="ky-dirs"><span class="good-label">${label}</span> ${text}</p>`;
  }).join("");
  lastMeet = Object.entries(byPalace).map(([palace, labels]) => ({ palace: Number(palace), labels }));
  return `
    <div class="num-section highlight">
      <h4>✦ 出会いに良い方角</h4>
      <p>九星気学では、<strong>四緑木星</strong>は良縁や結婚、<strong>七赤金星</strong>は恋愛や楽しい出会いを運ぶ星とされます。これらの星が吉方位に入っている方角へ出かけると、ご縁に恵まれやすくなります。</p>
      ${rows}
      <div id="meet-places">${placesHtml()}</div>
    </div>`;
}

// ---- 家から見た出会いの方角の街（位置はこの端末にのみ保存し、外部には送信しない） ----
const HOME_KEY = "uranai-home";
const loadHome = () => { try { return JSON.parse(localStorage.getItem(HOME_KEY)); } catch { return null; } };
const saveHome = (h) => { try { localStorage.setItem(HOME_KEY, JSON.stringify(h)); } catch {} };

const toRad = (d) => (d * Math.PI) / 180;
function distanceKm(a, b) {
  const h = Math.sin(toRad(b[0] - a[0]) / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(toRad(b[1] - a[1]) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}
function bearing(a, b) {
  const y = Math.sin(toRad(b[1] - a[1])) * Math.cos(toRad(b[0]));
  const x = Math.cos(toRad(a[0])) * Math.sin(toRad(b[0])) - Math.sin(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.cos(toRad(b[1] - a[1]));
  return mod((Math.atan2(y, x) * 180) / Math.PI, 360);
}
// 方位の範囲（真北基準。東西南北は30°、四隅は60°）→ 宮
const SECTORS = [[15, 1], [75, 8], [105, 3], [165, 4], [195, 9], [255, 2], [285, 7], [345, 6]];
const palaceOfBearing = (b) => (SECTORS.find(([end]) => b < end) || [0, 1])[1];
const nearestPlace = (pos) => PLACES.reduce((best, pl) => (distanceKm(pos, [pl[1], pl[2]]) < distanceKm(pos, [best[1], best[2]]) ? pl : best));

const BANDS = [["近場", 0, 20], ["日帰り", 20, 150], ["旅行", 150, Infinity]];
let lastMeet = []; // [{ palace, labels }]

function placesHtml() {
  const home = loadHome();
  const controls = `
    <div class="meet-home">
      <p class="sub">家（出発地）：<strong>${home ? escapeHtml(home.label) : "未設定"}</strong></p>
      <button type="button" class="btn ghost small" id="home-geo">📍 現在地を使う</button>
      <select id="home-place"><option value="">近くの街を選ぶ</option>${PLACES.map(([n], i) => `<option value="${i}">${n}</option>`).join("")}</select>
    </div>`;
  if (!home) return `${controls}<p class="sub">家の場所を設定すると、出会いの方角にある街を表示します。位置はこの端末にのみ保存され、外部には送信されません。</p>`;
  if (!lastMeet.length) return controls;
  const pos = [home.lat, home.lon];
  const found = PLACES.map(([n, la, lo]) => ({ n, d: distanceKm(pos, [la, lo]), p: palaceOfBearing(bearing(pos, [la, lo])) })).filter((x) => x.d >= 1);
  const groups = lastMeet.map(({ palace, labels }) => {
    const inDir = found.filter((x) => x.p === palace).sort((a, b) => a.d - b.d);
    const lines = BANDS.map(([name, lo, hi]) => {
      const hit = inDir.filter((x) => x.d >= lo && x.d < hi).slice(0, 3);
      return hit.length ? `<li><span class="sub">${name}</span> ${hit.map((x) => `${x.n}（${Math.round(x.d)}km）`).join("、")}</li>` : "";
    }).join("");
    return `<p class="ky-dirs"><span class="good-label">${PALACES[palace].dir}</span> ${labels.join("・")}の出会いの方角</p>
      <ul class="meet-list">${lines || `<li class="sub">この方角に登録された街はありません。家から${PALACES[palace].dir}へ散歩してみて。</li>`}</ul>`;
  }).join("");
  return `${controls}${groups}<p class="sub">※ 方角は真北基準で、東西南北は30°、それ以外は60°の範囲で判定しています。年の方角は引っ越しや遠出、月は旅行、日は日帰りやデートの目安に。</p>`;
}

function setHome(h) {
  saveHome(h);
  const el = document.getElementById("meet-places");
  if (el) el.innerHTML = placesHtml();
}
document.addEventListener("click", (e) => {
  if (!e.target.closest("#home-geo")) return;
  if (!navigator.geolocation) { alert("この端末では現在地を取得できません。近くの街を選んでください。"); return; }
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      const pos = [Math.round(coords.latitude * 100) / 100, Math.round(coords.longitude * 100) / 100];
      setHome({ lat: pos[0], lon: pos[1], label: `現在地（${nearestPlace(pos)[0]}付近）` });
    },
    () => alert("現在地を取得できませんでした。近くの街を選んでください。"),
  );
});
document.addEventListener("change", (e) => {
  if (e.target.id !== "home-place" || e.target.value === "") return;
  const [n, lat, lon] = PLACES[Number(e.target.value)];
  setHome({ lat, lon, label: `${n}付近` });
});

function boardHtml(center, honmei, dirs) {
  return `<div class="ky-board">${GRID_ORDER.map((p) => {
    const s = starAt(p, center);
    const cls = [s === honmei ? "me" : "", dirs.bad[p] ? "bad" : "", dirs.good.includes(p) ? "good" : ""].join(" ");
    return `<div class="ky-cell ${cls}"><span class="ky-dir">${PALACES[p].dir}</span><span class="ky-num">${STAR_NAMES[s].slice(0, 2)}</span></div>`;
  }).join("")}</div>`;
}

function periodHtml(label, center, honmei, branch) {
  const p = palaceOf(honmei, center);
  const pal = PALACES[p];
  const dirs = directions(center, honmei, branch);
  const goodText = dirs.good.map((q) => PALACES[q].dir).join("・") || "なし（移動は控えめに）";
  const badText = Object.entries(dirs.bad).map(([q, ls]) => `${PALACES[q].dir}（${ls.join("・")}）`).join("、");
  return `
    <div class="ky-period">
      <h4>${label}</h4>
      <div class="ky-period-body">
        ${boardHtml(center, honmei, dirs)}
        <div>
          <p class="sub">中宮：${STAR_NAMES[center]} ／ あなたの星は<strong>${pal.name}</strong>（${pal.dir === "中央" ? "中央" : pal.dir}）</p>
          <p class="total">${pal.theme} <span class="stars-val">${stars(pal.score)}</span></p>
          <p>${pal.text}</p>
          <p class="ky-dirs"><span class="good-label">吉方位</span> ${goodText}</p>
          <p class="ky-dirs"><span class="bad-label">凶方位</span> ${badText}</p>
        </div>
      </div>
    </div>`;
}

document.getElementById("kyusei-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const [by, bm, bd] = parseDate(document.getElementById("kyusei-birth").value);
  const honmei = yearStar(by, bm, bd);
  const getsumei = monthStar(by, bm, bd);
  const ky = KYUSEI[honmei], kyM = KYUSEI[getsumei];

  const now = new Date();
  const [ty, tm, td] = [now.getFullYear(), now.getMonth() + 1, now.getDate()];
  const p = fourPillars(ty, tm, td);
  const ys = yearStar(ty, tm, td), ms = monthStar(ty, tm, td), ds = dayStar(ty, tm, td);
  const todayPal = PALACES[palaceOf(honmei, ds)];

  show(document.getElementById("kyusei-result"), `
    <p class="symbol">☯</p>
    <h3>本命星：${ky.name}</h3>
    <p>${ky.text}</p>
    <div class="num-section">
      <h4>✦ 月命星：${kyM.name}</h4>
      <p>生まれ月の星は、内面の性質や子どもの頃の気質を表します。${kyM.text.split("。")[0]}。そんな一面も、あなたの中に息づいています。</p>
    </div>
    <div class="num-section highlight">
      <h4>✦ 吉方位とは</h4>
      <p>その期間に出かけたり引っ越したりすると運気が上がるとされる方角です。年と月の吉方位が重なる方角が特に良いとされます。表の<span class="good-label">緑</span>が吉方位、<span class="bad-label">赤</span>が凶方位、金色の枠があなたの星です。</p>
    </div>
    ${meetHtml([["今年", ys, p.year % 12], ["今月", ms, p.month % 12], ["今日", ds, p.day % 12]], honmei)}
    ${periodHtml(`今年（${ty}年・${STAR_NAMES[ys]}の年）`, ys, honmei, p.year % 12)}
    ${periodHtml(`今月（${BRANCHES[p.month % 12]}月・${STAR_NAMES[ms]}の月）`, ms, honmei, p.month % 12)}
    ${periodHtml(`今日（${tm}月${td}日・${STAR_NAMES[ds]}の日）`, ds, honmei, p.day % 12)}
    <p class="sub">※ 年は立春、月は節入り、日は冬至・夏至に最も近い甲子の日で切り替えています。流派によって異なる場合があります。</p>
    ${shareButtons(`【${SITE_NAME}】九星気学で私は${ky.name}。今日は${todayPal.theme}の日でした☯`)}
  `);
});
