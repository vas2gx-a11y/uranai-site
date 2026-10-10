// 九星気学：本命星・月命星と、年盤・月盤・日盤による運勢と方位
// koyomi.js・common.js・app.js の後に読み込む

const STAR_NAMES = [null, "一白水星", "二黒土星", "三碧木星", "四緑木星", "五黄土星", "六白金星", "七赤金星", "八白土星", "九紫火星"];
const STAR_ELEMENT = [null, "水", "土", "木", "木", "土", "金", "金", "土", "火"];
const GENERATES = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };

// 後天定位の宮（番号＝定位の星）
const PALACES = [
  null,
  { name: "坎宮", dir: "北", score: 1, theme: "冬の時期・停滞", text: "運気が最も低い充電期。無理に動かず、心身を休めて計画を練るときです。悩みは人に相談すると和らぎます。", month: "今月は充電の月。新しいことは来月以降に回し、睡眠と体調管理を最優先に。信頼できる人との静かな時間が心を支えます。", day: "今日は控えめに過ごす日。予定は少なめにして、早めに帰って休みましょう。悩みは一人で抱えず話してみて。" },
  { name: "坤宮", dir: "南西", score: 3, theme: "準備・基礎固め", text: "地道な努力が実を結ぶ下準備の時期。目立たなくても、コツコツ積み上げたことが後で大きく役立ちます。", month: "今月は下準備の月。目立つ成果は出にくくても、資料づくりや段取りなど裏方の仕事が後で大きく効いてきます。", day: "今日は地道な作業がはかどる日。頼まれごとを丁寧にこなすと、思わぬ信頼を得られます。" },
  { name: "震宮", dir: "東", score: 4, theme: "発展・始動", text: "運気が動き出す芽吹きの時期。新しいことを始めるのに向いています。やる気を行動に移して。", month: "今月は動き出しの月。温めていた計画をスタートさせるのに最適です。迷ったら、まず小さく始めてみて。", day: "今日はやる気が出る日。朝のうちに新しいことに手をつけると、一日中良い流れに乗れます。" },
  { name: "巽宮", dir: "南東", score: 5, theme: "信用・整う", text: "物事が順調に整い、信用が集まる好調期。人とのご縁や取引がスムーズに進みます。", month: "今月は人とのご縁が広がる月。紹介や誘いが増え、話がスムーズにまとまります。身だしなみを整えると運気アップ。", day: "今日は信用運が高い日。約束や交渉ごと、大事な連絡は今日のうちに済ませると吉。" },
  { name: "中宮", dir: "中央", score: 2, theme: "転換・八方塞がり", text: "運気の転換点。周りから注目される一方、思い通りにいかないことも。新しいことは控え、足元を固めて。", month: "今月は注目を集める一方、思い通りに進みにくい月。新しいことは控え、今あることを整える時間にしましょう。", day: "今日は無理をしない日。予定外の出来事にも慌てず、身の回りの整理や片付けに時間を使って。" },
  { name: "乾宮", dir: "北西", score: 4, theme: "充実・活動", text: "エネルギーに満ちた充実期。責任ある立場を任されやすく、努力が評価されます。働きすぎには注意。", month: "今月は活動的な充実の月。仕事で責任ある役割を任されやすく、頑張りがしっかり評価されます。働きすぎには注意。", day: "今日は行動力が高まる日。目上の人との関わりにチャンスあり。ただし休憩もしっかりとって。" },
  { name: "兌宮", dir: "西", score: 4, theme: "収穫・喜び", text: "これまでの努力が実る収穫の時期。楽しいことや臨時収入にも恵まれます。浪費だけは気をつけて。", month: "今月は楽しみと実りの月。人付き合いや趣味が充実し、臨時の収入にも恵まれそう。お金の使いすぎにだけ注意。", day: "今日は楽しいことが起こりやすい日。食事や会話を楽しむと運気が上がります。財布の紐は少しだけ締めて。" },
  { name: "艮宮", dir: "北東", score: 2, theme: "変化・改革", text: "変化が起こりやすい節目の時期。環境の変化を前向きに受け止めると、新しい道が開けます。", month: "今月は変化の月。予定変更や環境の変化が起こりやすいとき。古いやり方を見直すチャンスと前向きに受け止めて。", day: "今日は気持ちを切り替える日。いつもと違う道や方法を試すと、新しい発見があります。" },
  { name: "離宮", dir: "南", score: 3, theme: "頂上・注目", text: "運気の頂点で、才能が注目される時期。華やかな反面、隠し事が明るみに出やすいので誠実さを大切に。", month: "今月は才能が注目される月。発表や人前に出る機会に恵まれます。隠しごとは明るみに出やすいので誠実に。", day: "今日はひらめきが冴える日。アイデアを人に話すと評価されそう。言葉は少しやわらかめに。" },
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

function boardHtml(center, honmei, dirs) {
  return `<div class="ky-board">${GRID_ORDER.map((p) => {
    const s = starAt(p, center);
    const cls = [s === honmei ? "me" : "", dirs.bad[p] ? "bad" : "", dirs.good.includes(p) ? "good" : ""].join(" ");
    return `<div class="ky-cell ${cls}"><span class="ky-dir">${PALACES[p].dir}</span><span class="ky-num">${STAR_NAMES[s].slice(0, 2)}</span></div>`;
  }).join("")}</div>`;
}

// kind：year（今年）/ month（今月）/ day（今日）で解説文を変える
function periodHtml(label, center, honmei, branch, kind) {
  const p = palaceOf(honmei, center);
  const pal = PALACES[p];
  const text = kind === "month" ? pal.month : kind === "day" ? pal.day : pal.text;
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
          <p>${text}</p>
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
    ${periodHtml(`今年（${ty}年・${STAR_NAMES[ys]}の年）`, ys, honmei, p.year % 12, "year")}
    ${periodHtml(`今月（${BRANCHES[p.month % 12]}月・${STAR_NAMES[ms]}の月）`, ms, honmei, p.month % 12, "month")}
    ${periodHtml(`今日（${tm}月${td}日・${STAR_NAMES[ds]}の日）`, ds, honmei, p.day % 12, "day")}
    <p class="sub">※ 年は立春、月は節入り、日は冬至・夏至に最も近い甲子の日で切り替えています。流派によって異なる場合があります。</p>
    ${shareButtons(`【${SITE_NAME}】九星気学で私は${ky.name}。今日は${todayPal.theme}の日でした☯`)}
  `);
});
