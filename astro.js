// ホロスコープ：天体位置の計算（JPL の近似軌道要素・Meeus の簡易式）と出生図
// koyomi.js の後に読み込む

const SIGNS = [
  { name: "牡羊座", glyph: "♈\uFE0E", element: "火", trait: "情熱的でまっすぐ。思い立ったらすぐ行動する開拓者の気質" },
  { name: "牡牛座", glyph: "♉\uFE0E", element: "地", trait: "穏やかで粘り強い。五感の豊かさと安定を大切にする気質" },
  { name: "双子座", glyph: "♊\uFE0E", element: "風", trait: "好奇心旺盛で軽やか。情報や言葉を自在に操る気質" },
  { name: "蟹座", glyph: "♋\uFE0E", element: "水", trait: "愛情深く面倒見がいい。身近な人を守ろうとする気質" },
  { name: "獅子座", glyph: "♌\uFE0E", element: "火", trait: "華やかで堂々としている。自分らしさを表現する気質" },
  { name: "乙女座", glyph: "♍\uFE0E", element: "地", trait: "細やかで誠実。物事を整え、役に立とうとする気質" },
  { name: "天秤座", glyph: "♎\uFE0E", element: "風", trait: "社交的でバランス感覚に優れる。美と調和を求める気質" },
  { name: "蠍座", glyph: "♏\uFE0E", element: "水", trait: "深く一途。物事の本質に迫り、強い絆を求める気質" },
  { name: "射手座", glyph: "♐\uFE0E", element: "火", trait: "自由で楽観的。広い世界や理想を追い求める気質" },
  { name: "山羊座", glyph: "♑\uFE0E", element: "地", trait: "責任感が強く現実的。目標に向けて着実に登っていく気質" },
  { name: "水瓶座", glyph: "♒\uFE0E", element: "風", trait: "独創的で自由。常識にとらわれず未来を見る気質" },
  { name: "魚座", glyph: "♓\uFE0E", element: "水", trait: "感受性豊かで優しい。人の痛みに共感し、夢を描く気質" },
];

const PLANETS = [
  { key: "sun", name: "太陽", glyph: "☉", theme: "あなたの本質・生きる目的" },
  { key: "moon", name: "月", glyph: "☽", theme: "感情・素の自分・安心できるもの" },
  { key: "mercury", name: "水星", glyph: "☿", theme: "考え方・話し方・学び方" },
  { key: "venus", name: "金星", glyph: "♀", theme: "恋愛・好きなもの・美意識" },
  { key: "mars", name: "火星", glyph: "♂", theme: "行動力・情熱・闘争心" },
  { key: "jupiter", name: "木星", glyph: "♃", theme: "幸運・成長・発展するところ" },
  { key: "saturn", name: "土星", glyph: "♄", theme: "試練・責任・時間をかけて得るもの" },
  { key: "uranus", name: "天王星", glyph: "♅", theme: "変革・独自性（世代の星）" },
  { key: "neptune", name: "海王星", glyph: "♆", theme: "夢・直感・インスピレーション（世代の星）" },
  { key: "pluto", name: "冥王星", glyph: "♇", theme: "根源的な力・再生（世代の星）" },
];

// JPL の近似軌道要素（J2000 黄道、1800〜2050年）[a, e, I, L, 近日点経度, 昇交点経度] と世紀あたりの変化量
const ORBITS = {
  mercury: [[0.38709927, 0.20563593, 7.00497902, 252.2503235, 77.45779628, 48.33076593], [0.00000037, 0.00001906, -0.00594749, 149472.67411175, 0.16047689, -0.12534081]],
  venus: [[0.72333566, 0.00677672, 3.39467605, 181.9790995, 131.60246718, 76.67984255], [0.0000039, -0.00004107, -0.0007889, 58517.81538729, 0.00268329, -0.27769418]],
  earth: [[1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0], [0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0]],
  mars: [[1.52371034, 0.0933941, 1.84969142, -4.55343205, -23.94362959, 49.55953891], [0.00001847, 0.00007882, -0.00813131, 19140.30268499, 0.44441088, -0.29257343]],
  jupiter: [[5.202887, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909], [-0.00011607, -0.00013253, -0.00183714, 3034.74612775, 0.21252668, 0.20469106]],
  saturn: [[9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831, 113.66242448], [-0.0012506, -0.00050991, 0.00193609, 1222.49362201, -0.41897216, -0.28867794]],
  uranus: [[19.18916464, 0.04725744, 0.77263783, 313.23810451, 170.9542763, 74.01692503], [-0.00196176, -0.00004397, -0.00242939, 428.48202785, 0.40805281, 0.04240589]],
  neptune: [[30.06992276, 0.00859048, 1.77004347, -55.12002969, 44.96476227, 131.78422574], [0.00026291, 0.00005105, 0.00035372, 218.45945325, -0.32241464, -0.00508664]],
  pluto: [[39.48211675, 0.2488273, 17.14001206, 238.92903833, 224.06891629, 110.30393684], [-0.00031596, 0.0000517, 0.00004818, 145.20780515, -0.04062942, -0.01183482]],
};

// 日心黄道直交座標（J2000）
function helioXYZ(key, T) {
  const [el, rate] = ORBITS[key];
  const [a, e, I, L, wbar, node] = el.map((v, i) => v + rate[i] * T);
  const w = wbar - node;
  let M = mod(L - wbar + 180, 360) - 180;
  let E = M + (e * 180 / Math.PI) * Math.sin(M * RAD);
  for (let i = 0; i < 6; i++) {
    E -= (E - (e * 180 / Math.PI) * Math.sin(E * RAD) - M) / (1 - e * Math.cos(E * RAD));
  }
  const xp = a * (Math.cos(E * RAD) - e);
  const yp = a * Math.sqrt(1 - e * e) * Math.sin(E * RAD);
  const cw = Math.cos(w * RAD), sw = Math.sin(w * RAD);
  const cO = Math.cos(node * RAD), sO = Math.sin(node * RAD);
  const cI = Math.cos(I * RAD), sI = Math.sin(I * RAD);
  return [
    (cw * cO - sw * sO * cI) * xp + (-sw * cO - cw * sO * cI) * yp,
    (cw * sO + sw * cO * cI) * xp + (-sw * sO + cw * cO * cI) * yp,
    sw * sI * xp + cw * sI * yp,
  ];
}

// 月の黄経（Meeus 47章の主要項）
function moonLongitude(jd) {
  const T = (jd - 2451545) / 36525;
  const Lp = 218.3164477 + 481267.88123421 * T;
  const D = (297.8501921 + 445267.1114034 * T) * RAD;
  const M = (357.5291092 + 35999.0502909 * T) * RAD;
  const Mp = (134.9633964 + 477198.8675055 * T) * RAD;
  const F = (93.272095 + 483202.0175233 * T) * RAD;
  return mod(Lp + 6.289 * Math.sin(Mp) + 1.274 * Math.sin(2 * D - Mp) + 0.658 * Math.sin(2 * D)
    + 0.214 * Math.sin(2 * Mp) - 0.186 * Math.sin(M) - 0.114 * Math.sin(2 * F)
    + 0.059 * Math.sin(2 * D - 2 * Mp) + 0.057 * Math.sin(2 * D - M - Mp) + 0.053 * Math.sin(2 * D + Mp)
    + 0.046 * Math.sin(2 * D - M) + 0.041 * Math.sin(Mp - M) - 0.035 * Math.sin(D)
    - 0.031 * Math.sin(M + Mp) + 0.015 * Math.sin(2 * D - 2 * F) - 0.013 * Math.sin(Mp + 2 * F)
    + 0.011 * Math.sin(Mp - 2 * F) + 0.011 * Math.sin(4 * D - Mp), 360);
}

// 全天体の黄経（春分点は計算日のもの）
function planetLongitudes(jd) {
  const T = (jd - 2451545) / 36525;
  const precession = 1.39697 * T; // J2000 → 計算日の春分点
  const earth = helioXYZ("earth", T);
  const lon = { sun: sunLongitude(jd), moon: moonLongitude(jd) };
  for (const key of ["mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"]) {
    const p = helioXYZ(key, T);
    lon[key] = mod(Math.atan2(p[1] - earth[1], p[0] - earth[0]) / RAD + precession, 360);
  }
  return lon;
}

// アセンダントと MC（lat, lon は度、東経が正）
function angles(jd, lat, lng) {
  const T = (jd - 2451545) / 36525;
  const gmst = 280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * T * T;
  const ramc = mod(gmst + lng, 360) * RAD;
  const eps = (23.439291 - 0.0130042 * T) * RAD;
  const asc = Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(lat * RAD) * Math.sin(eps)));
  const mc = Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps));
  return { asc: mod(asc / RAD, 360), mc: mod(mc / RAD, 360) };
}

const ASPECTS = [
  { angle: 0, name: "コンジャンクション（合）", orb: 8, color: "#e8c77a", text: "2つの力が一体となり、強く表れます。" },
  { angle: 60, name: "セクスタイル（60°）", orb: 5, color: "#6fc3ff", text: "互いを助け合う、ほどよい調和の関係。" },
  { angle: 90, name: "スクエア（90°）", orb: 6, color: "#ff6b81", text: "葛藤や緊張を生みますが、成長の原動力にもなります。" },
  { angle: 120, name: "トライン（120°）", orb: 7, color: "#6fe3a0", text: "自然に流れる幸運な調和。生まれ持った才能を表します。" },
  { angle: 180, name: "オポジション（180°）", orb: 8, color: "#ff9f6b", text: "正反対の力の綱引き。バランスを取ることで大きな力に。" },
];

function findAspects(lon) {
  const keys = PLANETS.map((p) => p.key);
  const list = [];
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      let d = Math.abs(lon[keys[i]] - lon[keys[j]]);
      if (d > 180) d = 360 - d;
      const asp = ASPECTS.find((a) => Math.abs(d - a.angle) <= a.orb);
      if (asp) list.push({ a: keys[i], b: keys[j], asp, exact: Math.abs(d - asp.angle) });
    }
  }
  return list.sort((x, y) => x.exact - y.exact);
}

const PREFS = [
  ["北海道", 43.06, 141.35], ["青森県", 40.82, 140.74], ["岩手県", 39.7, 141.15], ["宮城県", 38.27, 140.87], ["秋田県", 39.72, 140.1],
  ["山形県", 38.24, 140.36], ["福島県", 37.75, 140.47], ["茨城県", 36.34, 140.45], ["栃木県", 36.57, 139.88], ["群馬県", 36.39, 139.06],
  ["埼玉県", 35.86, 139.65], ["千葉県", 35.61, 140.12], ["東京都", 35.69, 139.69], ["神奈川県", 35.45, 139.64], ["新潟県", 37.9, 139.02],
  ["富山県", 36.7, 137.21], ["石川県", 36.59, 136.63], ["福井県", 36.07, 136.22], ["山梨県", 35.66, 138.57], ["長野県", 36.65, 138.18],
  ["岐阜県", 35.39, 136.72], ["静岡県", 34.98, 138.38], ["愛知県", 35.18, 136.91], ["三重県", 34.73, 136.51], ["滋賀県", 35.0, 135.87],
  ["京都府", 35.02, 135.76], ["大阪府", 34.69, 135.52], ["兵庫県", 34.69, 135.18], ["奈良県", 34.69, 135.83], ["和歌山県", 34.23, 135.17],
  ["鳥取県", 35.5, 134.24], ["島根県", 35.47, 133.05], ["岡山県", 34.66, 133.93], ["広島県", 34.4, 132.46], ["山口県", 34.19, 131.47],
  ["徳島県", 34.07, 134.56], ["香川県", 34.34, 134.04], ["愛媛県", 33.84, 132.77], ["高知県", 33.56, 133.53], ["福岡県", 33.61, 130.42],
  ["佐賀県", 33.25, 130.3], ["長崎県", 32.74, 129.87], ["熊本県", 32.79, 130.74], ["大分県", 33.24, 131.61], ["宮崎県", 31.91, 131.42],
  ["鹿児島県", 31.56, 130.56], ["沖縄県", 26.21, 127.68],
];

const signOf = (lon) => SIGNS[Math.floor(lon / 30)];
const degText = (lon) => `${Math.floor(lon % 30)}°${String(Math.floor(((lon % 30) % 1) * 60)).padStart(2, "0")}′`;

// 近い角度どうしが最低 gap 度離れるよう、並び順を保ったまま広げる（昇順の配列を受け取る）
function spreadAngles(sorted, gap) {
  const n = sorted.length;
  // いちばん大きな隙間の直後を起点にして、円を直線に開く
  let start = 0, maxGap = -1;
  for (let i = 0; i < n; i++) {
    const g = mod(sorted[i] - sorted[(i + n - 1) % n], 360);
    if (g > maxGap) { maxGap = g; start = i; }
  }
  const idx = Array.from({ length: n }, (_, k) => (start + k) % n);
  const base = idx.map((i, k) => sorted[i] + (k > 0 && sorted[i] < sorted[idx[0]] ? 360 : 0));
  // 固まりを作り、固まりの中心が元の位置の平均になるよう配置する
  let groups = base.map((v) => ({ items: [v], pos: v }));
  let merged = true;
  while (merged) {
    merged = false;
    for (let g = 0; g < groups.length - 1; g++) {
      const A = groups[g], B = groups[g + 1];
      if (A.pos + A.items.length * gap > B.pos) {
        const items = [...A.items, ...B.items];
        const mean = items.reduce((x, y) => x + y, 0) / items.length;
        groups.splice(g, 2, { items, pos: mean - ((items.length - 1) * gap) / 2 });
        merged = true;
        break;
      }
    }
  }
  const out = [];
  groups.forEach((g) => g.items.forEach((_, k) => out.push(g.pos + k * gap)));
  const result = new Array(n);
  idx.forEach((i, k) => (result[i] = mod(out[k], 360)));
  return result;
}

// ---- 出生図（SVG） ----
function chartSvg(lon, asc, aspects) {
  const size = 400, c = size / 2, R = 170, r1 = 140, r2 = 100;
  const base = asc ?? 0; // アセンダントを左（9時の位置）に置く
  const pt = (deg, rad) => {
    const a = (180 + (deg - base)) * RAD;
    return [c + rad * Math.cos(a), c - rad * Math.sin(a)];
  };
  let svg = `<svg viewBox="0 0 ${size} ${size}" class="chart" role="img" aria-label="出生図">`;
  svg += `<circle cx="${c}" cy="${c}" r="${R}" class="ch-ring"/><circle cx="${c}" cy="${c}" r="${r1}" class="ch-ring"/><circle cx="${c}" cy="${c}" r="${r2}" class="ch-ring"/>`;
  for (let i = 0; i < 12; i++) {
    const [x1, y1] = pt(i * 30, r1), [x2, y2] = pt(i * 30, R);
    const [gx, gy] = pt(i * 30 + 15, (R + r1) / 2);
    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="ch-line"/>`;
    svg += `<text x="${gx}" y="${gy}" class="ch-sign el-${SIGNS[i].element}">${SIGNS[i].glyph}</text>`;
  }
  if (asc !== null) {
    const [ax, ay] = pt(asc, r2), [bx, by] = pt(asc + 180, r2);
    svg += `<line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" class="ch-axis"/>`;
    const [tx, ty] = pt(asc, R + 12);
    svg += `<text x="${tx}" y="${ty}" class="ch-label">ASC</text>`;
  }
  aspects.forEach(({ a, b, asp }) => {
    if (asp.angle === 0) return;
    const [x1, y1] = pt(lon[a], r2), [x2, y2] = pt(lon[b], r2);
    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${asp.color}" class="ch-asp"/>`;
  });
  // 天体の記号：近いものは表示角度を広げて重ならないようにし、実際の位置へ線を引く
  const order = [...PLANETS].sort((p, q) => lon[p.key] - lon[q.key]);
  const disp = spreadAngles(order.map((p) => lon[p.key]), 11);
  order.forEach((p, i) => {
    const rad = (r1 + r2) / 2;
    const [x, y] = pt(disp[i], rad), [dx, dy] = pt(lon[p.key], r2), [lx, ly] = pt(disp[i], rad - 11);
    svg += `<line x1="${dx}" y1="${dy}" x2="${lx}" y2="${ly}" class="ch-line"/><circle cx="${dx}" cy="${dy}" r="2" class="ch-dot"/><text x="${x}" y="${y}" class="ch-planet">${p.glyph}</text>`;
  });
  return svg + "</svg>";
}

// ---- 画面 ----
(() => {
  const sel = document.getElementById("horo-pref");
  if (!sel) return;
  sel.innerHTML = `<option value="">わからない・海外</option>` + PREFS.map(([n], i) => `<option value="${i}" ${n === "東京都" ? "selected" : ""}>${n}</option>`).join("");

  document.getElementById("horo-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const [y, m, d] = document.getElementById("horo-birth").value.split("-").map(Number);
    const time = document.getElementById("horo-time").value;
    const pref = sel.value === "" ? null : PREFS[Number(sel.value)];
    const [hh, mm] = time ? time.split(":").map(Number) : [12, 0];
    const jd = jdFromDate(y, m, d) + (hh + mm / 60) / 24; // JST の時刻をユリウス日に
    const lon = planetLongitudes(jd);
    const next = planetLongitudes(jd + 1);
    const retro = (k) => k !== "sun" && k !== "moon" && mod(next[k] - lon[k] + 180, 360) - 180 < 0;
    const ang = time && pref ? angles(jd, pref[1], pref[2]) : null;
    const asc = ang ? ang.asc : null;
    const aspects = findAspects(lon);
    const house = (l) => (asc === null ? "－" : (mod(Math.floor(l / 30) - Math.floor(asc / 30), 12) + 1) + "室");

    // 四元素のバランス（主要7天体）
    const elCount = { 火: 0, 地: 0, 風: 0, 水: 0 };
    PLANETS.slice(0, 7).forEach((p) => elCount[signOf(lon[p.key]).element]++);
    const topEl = Object.entries(elCount).sort((a, b) => b[1] - a[1])[0][0];
    const EL_TEXT = { 火: "情熱と行動力", 地: "現実感覚と安定", 風: "知性とコミュニケーション", 水: "感受性と共感力" };

    const sun = signOf(lon.sun), moon = signOf(lon.moon);
    show(document.getElementById("horo-result"), `
      <h3>あなたの出生図</h3>
      <p class="sub">${y}年${m}月${d}日 ${time || "12:00（時刻不明）"} ${pref ? pref[0] : ""}生まれ</p>
      <div class="chart-wrap">${chartSvg(lon, asc, aspects)}</div>

      <div class="num-section highlight">
        <h4>✦ ビッグスリー</h4>
        <p><strong>☉ 太陽：${sun.name}</strong> ― ${sun.trait}。これがあなたの人生の軸です。</p>
        <p><strong>☽ 月：${moon.name}</strong> ― 素のあなたは${moon.trait.replace("。", "で、").replace(/気質$/, "一面を持っています")}。${time ? "" : "（時刻不明のため、月の星座は前後する場合があります）"}</p>
        ${asc !== null ? `<p><strong>ASC：${signOf(asc).name}</strong> ― 第一印象や外から見たあなたは「${signOf(asc).trait.split("。")[0]}」。</p>` : `<p class="sub">生まれた時刻と都道府県を入れると、アセンダント（第一印象）とハウスも分かります。</p>`}
      </div>

      <table class="planet-table">
        <tr><th>天体</th><th>星座</th><th>度数</th><th>ハウス</th></tr>
        ${PLANETS.map((p) => `<tr><td>${p.glyph} ${p.name}${retro(p.key) ? " <span class=\"retro\">℞</span>" : ""}</td><td>${signOf(lon[p.key]).glyph} ${signOf(lon[p.key]).name}</td><td>${degText(lon[p.key])}</td><td>${house(lon[p.key])}</td></tr>`).join("")}
        ${ang ? `<tr><td>ASC</td><td>${signOf(ang.asc).glyph} ${signOf(ang.asc).name}</td><td>${degText(ang.asc)}</td><td>1室</td></tr><tr><td>MC</td><td>${signOf(ang.mc).glyph} ${signOf(ang.mc).name}</td><td>${degText(ang.mc)}</td><td>－</td></tr>` : ""}
      </table>
      <p class="sub">℞＝逆行。ハウスはホールサイン方式です。</p>

      <div class="num-section">
        <h4>✦ 天体ごとの読み解き</h4>
        ${PLANETS.slice(2, 7).map((p) => `<p><strong>${p.glyph} ${p.name}（${p.theme}）</strong>：${signOf(lon[p.key]).name}。${signOf(lon[p.key]).trait}。</p>`).join("")}
      </div>

      <div class="num-section">
        <h4>✦ 四元素のバランス</h4>
        <p>${Object.entries(elCount).map(([k, v]) => `${k} ${v}`).join("　")}</p>
        <p>最も多いのは「${topEl}」。あなたの強みは<strong>${EL_TEXT[topEl]}</strong>です。</p>
      </div>

      <div class="num-section">
        <h4>✦ 主なアスペクト</h4>
        ${aspects.slice(0, 6).map(({ a, b, asp }) => {
          const pa = PLANETS.find((p) => p.key === a), pb = PLANETS.find((p) => p.key === b);
          return `<p><span style="color:${asp.color}">●</span> ${pa.name} × ${pb.name}：${asp.name}。${asp.text}</p>`;
        }).join("") || "<p>目立ったアスペクトはありません。</p>"}
      </div>
      ${shareButtons(`【${SITE_NAME}】私のホロスコープは太陽${sun.name}・月${moon.name}${asc !== null ? `・ASC${signOf(asc).name}` : ""}でした🪐`)}
    `);
  });
})();
