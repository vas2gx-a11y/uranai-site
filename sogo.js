// 総合鑑定：星座・ホロスコープ・数秘術・九星気学・四柱推命・算命学・16タイプの結果を突き合わせて文章をつくる
// すべての占いのスクリプトと sogo-data.js（文章データ）の後に読み込む
// sogoFacts() が各占いの結果をまとめたデータ（将来 AI に渡す材料）、sogoReport() がそこから文章を組み立てる

// 各占いの結果 → タグ
const SOGO_SIGN_TAGS = {
  牡羊座: ["lead", "act"], 牡牛座: ["steady", "create"], 双子座: ["social", "logic"], 蟹座: ["care", "harmony"],
  獅子座: ["lead", "create"], 乙女座: ["logic", "steady"], 天秤座: ["harmony", "social"], 蠍座: ["intuit", "logic"],
  射手座: ["free", "act"], 山羊座: ["steady", "lead"], 水瓶座: ["free", "logic"], 魚座: ["care", "intuit"],
};
const SOGO_NUM_TAGS = {
  1: ["lead", "act"], 2: ["harmony", "care"], 3: ["create", "social"], 4: ["steady", "logic"], 5: ["free", "act"],
  6: ["care", "harmony"], 7: ["logic", "intuit"], 8: ["lead", "steady"], 9: ["care", "intuit"],
  11: ["intuit", "create"], 22: ["lead", "steady"], 33: ["care", "intuit"],
};
const SOGO_STAR_TAGS = [null, ["harmony", "intuit"], ["steady", "care"], ["act", "free"], ["harmony", "social"], ["lead", "act"], ["lead", "steady"], ["social", "create"], ["steady", "act"], ["create", "intuit"]];
const SOGO_STEM_TAGS = {
  甲: ["lead", "steady"], 乙: ["harmony", "care"], 丙: ["social", "act"], 丁: ["intuit", "care"], 戊: ["steady", "care"],
  己: ["care", "harmony"], 庚: ["act", "lead"], 辛: ["create", "logic"], 壬: ["free", "act"], 癸: ["intuit", "care"],
};
const SOGO_MBTI_TAGS = { E: "social", I: "intuit", S: "steady", N: "create", T: "logic", F: "care", J: "lead", P: "free" };

const ACTIVE_PERSONAL_YEARS = [1, 3, 5, 8];

// ---- 各占いの結果を集める ----
function sogoFacts(p) {
  const [y, m, d] = p.birth.split("-").map(Number);
  const now = new Date();
  const [ty, tm, td] = [now.getFullYear(), now.getMonth() + 1, now.getDate()];

  // ホロスコープ（時刻不明なら正午）
  const [hh, mm] = p.time ? p.time.split(":").map(Number) : [12, 0];
  const jd = jdFromDate(y, m, d) + (hh + mm / 60) / 24;
  const lon = planetLongitudes(jd);
  const pref = p.pref === "" || p.pref == null ? null : PREFS[Number(p.pref)];
  const asc = p.time && pref ? signOf(angles(jd, pref[1], pref[2]).asc).name : null;
  const planet = (k) => signOf(lon[k]).name;

  // 数秘術
  const lifePath = lifePathNumber(p.birth);
  const personalYear = reduceSteps(digitSum(m) + digitSum(d) + digitSum(ty), false).n;

  // 九星気学
  const honmei = yearStar(y, m, d);
  const yearPalace = PALACES[palaceOf(honmei, yearStar(ty, tm, td))];

  // 四柱推命・算命学
  const stem = getDayStem(p.birth);
  const tenchu = tenchusatsuOf(fourPillars(y, m, d).day);
  const tenchuNow = tenchu.branches.includes(mod(ty - 4, 12));

  // 16タイプ（診断済みなら）
  const type16 = Array.isArray(p.type16) && p.type16.length === TYPE_QUESTIONS.length ? typeScore(p.type16).code : null;

  return {
    name: `${p.sei || ""}${p.mei || ""}`.trim(),
    birth: p.birth, time: p.time || null, pref: pref ? pref[0] : null, year: ty,
    sun: planet("sun"), moon: planet("moon"), asc,
    mercury: planet("mercury"), venus: planet("venus"), mars: planet("mars"), jupiter: planet("jupiter"), saturn: planet("saturn"),
    lifePath, personalYear,
    honmei: STAR_NAMES[honmei], honmeiNo: honmei, yearPalace: { name: yearPalace.name, theme: yearPalace.theme, score: yearPalace.score, text: yearPalace.text },
    dayStem: stem.stem, dayStemSymbol: stem.symbol,
    tenchusatsu: tenchu.name, tenchusatsuNow: tenchuNow,
    type16,
  };
}

// ---- タグを数えて、一致と二面性を見つける ----
function sogoTags(f) {
  const sources = [
    ["星座（太陽）", SOGO_SIGN_TAGS[f.sun], 1],
    ["月星座", SOGO_SIGN_TAGS[f.moon], 1],
    ["数秘術", SOGO_NUM_TAGS[f.lifePath], 1],
    ["九星気学", SOGO_STAR_TAGS[f.honmeiNo], 1],
    ["四柱推命", SOGO_STEM_TAGS[f.dayStem], 1],
  ];
  if (f.type16) sources.push(["16タイプ", f.type16.split("").map((c) => SOGO_MBTI_TAGS[c]), 0.5]);

  const tags = {};
  sources.forEach(([src, list, w]) => list.forEach((t) => {
    tags[t] = tags[t] || { key: t, score: 0, from: [] };
    tags[t].score += w;
    if (!tags[t].from.includes(src)) tags[t].from.push(src);
  }));
  const ranked = Object.values(tags).sort((a, b) => b.score - a.score || b.from.length - a.from.length);
  // 二面性は、両方の性質が強いものから2つまで
  const contrasts = SOGO_CONTRASTS.filter((c) => c.tags.every((t) => tags[t] && tags[t].score >= 1))
    .sort((a, b) => Math.min(...b.tags.map((t) => tags[t].score)) - Math.min(...a.tags.map((t) => tags[t].score)))
    .slice(0, 2);
  return { ranked, contrasts, tags };
}

// ---- 文章を組み立てる ----
// 文章の候補が複数あるときは、生年月日ごとに決まった1本を選ぶ（同じ人には毎回同じ文章）
function sogoPick(f, key, list) {
  return list[Math.floor(seededRandom(`${f.birth}|${key}`)() * list.length)];
}

function sogoReport(f) {
  const { ranked, contrasts } = sogoTags(f);
  const pick = (key, list) => sogoPick(f, key, list);
  const [t1, t2, t3] = ranked.map((t) => {
    const d = SOGO_TAGS[t.key];
    return { ...t, name: d.name, core: pick(`core-${t.key}`, d.core), love: pick("love", d.love), work: pick("work", d.work), advice: pick("advice", d.advice) };
  });
  const pairKey = [t1.key, t2.key].sort((a, b) => SOGO_TAG_ORDER.indexOf(a) - SOGO_TAG_ORDER.indexOf(b)).join("+");
  const [pairTitle, pairText] = SOGO_PAIRS[pairKey];
  const agree = SOGO_AGREE.find(([n]) => t1.from.length >= n)[1];
  const sunEl = ZODIAC.find((z) => z.name === f.sun).element;
  const moonEl = ZODIAC.find((z) => z.name === f.moon).element;

  // 今年
  const active = ACTIVE_PERSONAL_YEARS.includes(f.personalYear);
  const goodPalace = f.yearPalace.score >= 4;
  const yearKey = f.tenchusatsuNow ? "guard" : active && goodPalace ? "attack" : active || goodPalace ? "balance" : "prepare";

  const goodSigns = ZODIAC.filter((z) => z.name !== f.sun && (z.element === sunEl || z.element === ELEMENT_FRIEND[sunEl])).map((z) => z.name);
  const jikkan = JIKKAN.find((j) => j.stem === f.dayStem);

  return {
    headline: pairTitle,
    headlineSub: `「${t1.name}」と「${t2.name}」をあわせ持つ人`,
    pairText,
    agree,
    core: [t1, t2, t3].filter(Boolean),
    innerOuter: sunEl === moonEl
      ? `太陽と月がどちらも「${sunEl}」の星座。外から見たあなたと内面がそろった、裏表のない${SOGO_ELEMENT[sunEl]}です。`
      : `外から見たあなたは${SOGO_ELEMENT[sunEl]}（太陽：${f.sun}）。でも心の内側は${SOGO_ELEMENT[moonEl]}（月：${f.moon}）という一面があり、そこを理解してくれる人に心を開きます。`,
    contrasts: contrasts.map((c) => ({ title: c.title, text: pick(`contrast-${c.title}`, c.text) })),
    love: [t1.love, `金星（恋愛の星）は${f.venus}：${HORO_READ[f.venus].venus}`],
    loveSigns: goodSigns,
    work: [t1.work, `火星（行動の星）は${f.mars}：${HORO_READ[f.mars].mars}`],
    workExamples: f.type16 ? TYPES[f.type16].work : jikkan.work,
    year: { key: yearKey, name: SOGO_YEAR[yearKey].name, text: pick("year", SOGO_YEAR[yearKey].text), actions: SOGO_YEAR[yearKey].actions },
    advice: [t1.advice, `土星（課題の星）は${f.saturn}：${HORO_READ[f.saturn].saturn}`],
  };
}

// ---- 画面 ----
(() => {
  const form = document.getElementById("sogo-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const p = { ...loadProfile(), birth: document.getElementById("sogo-birth").value, time: document.getElementById("sogo-time").value };
    const f = sogoFacts(p);
    const r = sogoReport(f);
    const agree = (t) => `<span class="sogo-src">${t.from.length >= 2 ? `${t.from.length}つの占いが一致：` : ""}${t.from.join("・")}</span>`;

    show(document.getElementById("sogo-result"), `
      <p class="sub">${f.name ? `${escapeHtml(f.name)}さん・` : ""}${f.birth.replace(/-/g, "/")}${f.time ? ` ${f.time}` : ""}生まれ</p>
      <h3>${r.headline}</h3>
      <p class="sub">${r.headlineSub}</p>
      <div class="sogo-chips">
        <span>☉ ${f.sun}</span><span>☽ 月 ${f.moon}</span>${f.asc ? `<span>ASC ${f.asc}</span>` : ""}
        <span>運命数 ${f.lifePath}</span><span>${f.honmei}</span><span>日干 ${f.dayStem}（${f.dayStemSymbol}）</span>
        <span>${f.tenchusatsu}</span>${f.type16 ? `<span>${f.type16}（${TYPES[f.type16].name}）</span>` : ""}
      </div>

      <div class="num-section highlight">
        <h4>✦ あなたはこんな人</h4>
        <p>${r.pairText}</p>
        <p>${r.agree}</p>
      </div>

      <div class="num-section">
        <h4>✦ あなたの核となる性質</h4>
        ${r.core.map((t, i) => `<p><strong>${i + 1}. ${t.name}</strong> ― ${t.core}。<br>${agree(t)}</p>`).join("")}
        <p class="sub">複数の占いが同じ性質を示しているほど、あなたの中で強く表れている特徴です。</p>
      </div>

      <div class="num-section"><h4>✦ 外の顔と、内面</h4><p>${r.innerOuter}</p></div>

      ${r.contrasts.length ? `<div class="num-section"><h4>✦ あなたの中の二面性</h4>
        ${r.contrasts.map((c) => `<p><strong>${c.title}</strong><br>${c.text}</p>`).join("")}</div>` : ""}

      <div class="num-section"><h4>✦ 恋愛</h4>${r.love.map((t) => `<p>${t}</p>`).join("")}<p class="sub">相性の良い星座：${r.loveSigns.join("、")}</p></div>
      <div class="num-section"><h4>✦ 仕事・才能</h4>${r.work.map((t) => `<p>${t}</p>`).join("")}<p class="sub">向いている仕事の例：${r.workExamples}</p></div>

      <div class="num-section highlight">
        <h4>✦ ${f.year}年の流れ：${r.year.name}</h4>
        <p>${r.year.text}</p>
        <p>個人年数${f.personalYear}「${PERSONAL_YEAR[f.personalYear].theme}」：${PERSONAL_YEAR[f.personalYear].text}</p>
        <p>九星気学では${f.yearPalace.name}「${f.yearPalace.theme}」：${f.yearPalace.text}</p>
        <p><strong>今年やると良いこと</strong></p>
        <ul>${r.year.actions.map((a) => `<li>${a}</li>`).join("")}</ul>
        <p class="sub">算命学：${f.tenchusatsuNow ? "今年は天中殺の年" : "今年は天中殺ではない年"}</p>
      </div>

      <div class="num-section"><h4>✦ あなたへのアドバイス</h4>${r.advice.map((a) => `<p>${a}</p>`).join("")}</div>

      ${f.type16 ? "" : `<p class="sub">💡 <a href="#type16">16タイプ診断</a>を受けると、その結果も総合鑑定に反映されます。</p>`}
      ${f.time ? "" : `<p class="sub">💡 生まれた時刻を入れると、月星座がより正確になります。プロフィールに都道府県も登録すると第一印象（ASC）も加わります。</p>`}
      ${shareButtons(`【${SITE_NAME}】総合鑑定で私は「${r.headline}」タイプでした✨`)}
    `);
  });
})();
