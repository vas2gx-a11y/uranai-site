// 総合鑑定：星座・ホロスコープ・数秘術・九星気学・四柱推命・算命学・16タイプの結果を突き合わせて文章をつくる
// すべての占いのスクリプトの後に読み込む
// sogoFacts() が各占いの結果をまとめたデータ（将来 AI に渡す材料）、sogoReport() がそこから文章を組み立てる

// ---- 性質のタグ ----
const SOGO_TAGS = {
  lead: { name: "リーダーシップ", core: "人の先頭に立ち、物事を決めて動かす力", love: "恋愛でもリードしたいタイプ。頼られると愛情が深まりますが、相手の意見を聞く余白を持つとさらに円満に。", work: "決断と責任を任されるポジションで真価を発揮します。プロジェクトの旗振り役や管理職、独立・起業にも向いています。", advice: "一人で背負いすぎず、人に任せる勇気を持つと、器がさらに大きくなります。" },
  act: { name: "行動力・情熱", core: "思い立ったらすぐ動ける、エネルギッシュな推進力", love: "好きになったら一直線。駆け引きよりも、ストレートな愛情表現があなたの魅力です。", work: "スピードが求められる仕事や、新規開拓・営業・立ち上げの場面で一番輝きます。", advice: "勢いで始めたことを最後までやり切る仕組みをつくると、成果が何倍にもなります。" },
  steady: { name: "堅実さ・粘り強さ", core: "コツコツ積み上げ、決めたことをやり遂げる力", love: "時間をかけて信頼を育てる誠実な恋。安心感のある、長続きする関係を築けます。", work: "継続と正確さが求められる仕事で信頼を集めます。専門職・管理・財務など、積み上げが資産になる分野が◎。", advice: "ときには計画にない寄り道を。変化を楽しむ余裕が運気を広げます。" },
  logic: { name: "知性・分析力", core: "物事を筋道立てて考え、本質を見抜く頭脳", love: "会話が知的に楽しい相手に惹かれます。気持ちは言葉にしないと伝わらないことも意識して。", work: "分析・企画・研究・IT・コンサルなど、考える力そのものが武器になる仕事に向いています。", advice: "考えすぎて動けないときは、小さく試してみることが近道です。" },
  social: { name: "社交性・コミュニケーション力", core: "人とつながり、場を明るくする力", love: "出会いの多い恋愛体質。友達のような楽しい関係から恋が始まりやすいタイプです。", work: "営業・広報・接客・教育など、人と関わり、言葉で伝える仕事で力を発揮します。", advice: "広いつながりの中から、本当に大切な人との時間を意識して増やしましょう。" },
  care: { name: "優しさ・共感力", core: "人の気持ちに寄り添い、支える力", love: "相手を思いやる献身的な愛。尽くしすぎて疲れないよう、自分の気持ちも大切に。", work: "医療・福祉・教育・カウンセリング・サービスなど、人を支える仕事が天職です。", advice: "人を大切にするのと同じくらい、自分をいたわる時間を確保して。" },
  free: { name: "自由・冒険心", core: "枠にとらわれず、新しい世界に飛び込む力", love: "束縛は苦手で、お互いの自由を尊重できる関係が理想。一緒に冒険できる相手と好相性です。", work: "裁量の大きい仕事、フリーランス、海外・旅行・クリエイティブなど、変化のある環境で伸びます。", advice: "自由を守るためにも、お金・健康・生活習慣といった土台を整えておくと安心です。" },
  create: { name: "表現力・創造性", core: "自分らしさを形にし、新しいものを生み出す力", love: "ロマンチックで、恋を楽しむ演出上手。感性の合う相手に強く惹かれます。", work: "デザイン・企画・発信・アートなど、アイデアや感性を形にする仕事で輝きます。", advice: "完成度より「まず出す」こと。表現するほど運が巡ってきます。" },
  intuit: { name: "直感・内面の深さ", core: "目に見えないものを感じ取り、深く考える力", love: "心の深いところでつながれる相手を求めます。量より質の、濃い関係を大切にするタイプです。", work: "研究・専門職・心理・芸術など、一人で深く向き合う時間がある仕事で力を発揮します。", advice: "一人の時間で充電するのは、あなたに必要なこと。直感を信じて大丈夫です。" },
  harmony: { name: "協調性・調和", core: "周りとのバランスを取り、人と人をつなぐ力", love: "穏やかで対等な関係を大切にします。相手に合わせすぎず、自分の希望も伝えて。", work: "チームの調整役・サポート・人事・接客など、人と協力して成果を出す場面で欠かせない存在です。", advice: "「自分はどうしたいか」を考える時間をつくると、迷いが減ります。" },
};

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

// 同時に持っていると「二面性」になる組み合わせ
const SOGO_CONTRASTS = [
  { tags: ["free", "steady"], title: "自由を求める心と、安定を求める心", text: "新しいことに飛び込みたい気持ちと、確かな土台を守りたい気持ちが同居しています。どちらかを我慢するより、「土台を固めたうえで冒険する」と決めると、両方が活きます。" },
  { tags: ["logic", "care"], title: "冷静な頭と、温かい心", text: "論理で考える自分と、人の気持ちを大切にする自分。判断に迷いやすいのはそのためですが、両方を使える人は多くありません。説得力と思いやりを兼ね備えた存在になれます。" },
  { tags: ["lead", "harmony"], title: "引っ張る力と、合わせる力", text: "前に出て決めたい自分と、周りに合わせたい自分。場面によって使い分けられるのが強みで、まとめ役として信頼されます。" },
  { tags: ["social", "intuit"], title: "人と関わる楽しさと、一人の時間の大切さ", text: "外では社交的でも、内側には一人で深く考える時間が必要なタイプ。人と会ったあとは一人で充電する、というリズムを意識すると疲れにくくなります。" },
  { tags: ["act", "steady"], title: "すぐ動きたい勢いと、慎重に進めたい心", text: "思い立ったら動きたい自分と、確実に進めたい自分。勢いで始めて、慎重さで仕上げる――この順番を意識すると、失敗が減り成果が上がります。" },
];

const SOGO_ELEMENT = { 火: "情熱的で前向きな人", 地: "落ち着いた現実派", 風: "軽やかで社交的な人", 水: "優しく感受性豊かな人" };

// 今年の流れ
const SOGO_YEAR = {
  attack: { name: "攻めの年", text: "複数の占いが「動くほど運が開く」と示しています。新しい挑戦・転職・引っ越し・告白など、迷っていたことを実行に移すチャンスです。" },
  balance: { name: "バランスの年", text: "追い風と向かい風が混ざる年。全部に手を出すより、本当に大切な1〜2つのことに集中すると、着実に成果が出ます。" },
  prepare: { name: "準備の年", text: "大きく動くより、力を蓄える年。学び・貯蓄・健康づくりなど、来年以降に花開く種まきに時間を使いましょう。" },
  guard: { name: "守りの年", text: "算命学の天中殺にあたり、新しく始めることは思い通りに進みにくい年です。現状を整え、学びや人間関係のメンテナンスに力を注ぐと、明けてから大きく飛躍できます。" },
};
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
function sogoReport(f) {
  const { ranked, contrasts } = sogoTags(f);
  const [t1, t2, t3] = ranked.map((t) => ({ ...t, ...SOGO_TAGS[t.key] }));
  const sunEl = ZODIAC.find((z) => z.name === f.sun).element;
  const moonEl = ZODIAC.find((z) => z.name === f.moon).element;

  // 今年
  const active = ACTIVE_PERSONAL_YEARS.includes(f.personalYear);
  const goodPalace = f.yearPalace.score >= 4;
  const yearKey = f.tenchusatsuNow ? "guard" : active && goodPalace ? "attack" : active || goodPalace ? "balance" : "prepare";

  const goodSigns = ZODIAC.filter((z) => z.name !== f.sun && (z.element === sunEl || z.element === ELEMENT_FRIEND[sunEl])).map((z) => z.name);
  const jikkan = JIKKAN.find((j) => j.stem === f.dayStem);

  return {
    headline: `「${t1.name}」と「${t2.name}」をあわせ持つ人`,
    core: [t1, t2, t3].filter(Boolean),
    innerOuter: sunEl === moonEl
      ? `太陽と月がどちらも「${sunEl}」の星座。外から見たあなたと内面がそろった、裏表のない${SOGO_ELEMENT[sunEl]}です。`
      : `外から見たあなたは${SOGO_ELEMENT[sunEl]}（太陽：${f.sun}）。でも心の内側は${SOGO_ELEMENT[moonEl]}（月：${f.moon}）という一面があり、そこを理解してくれる人に心を開きます。`,
    contrasts,
    love: [t1.love, `金星（恋愛の星）は${f.venus}：${HORO_READ[f.venus].venus}`],
    loveSigns: goodSigns,
    work: [t1.work, `火星（行動の星）は${f.mars}：${HORO_READ[f.mars].mars}`],
    workExamples: f.type16 ? TYPES[f.type16].work : jikkan.work,
    year: { ...SOGO_YEAR[yearKey], key: yearKey },
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
      <div class="sogo-chips">
        <span>☉ ${f.sun}</span><span>☽ 月 ${f.moon}</span>${f.asc ? `<span>ASC ${f.asc}</span>` : ""}
        <span>運命数 ${f.lifePath}</span><span>${f.honmei}</span><span>日干 ${f.dayStem}（${f.dayStemSymbol}）</span>
        <span>${f.tenchusatsu}</span>${f.type16 ? `<span>${f.type16}（${TYPES[f.type16].name}）</span>` : ""}
      </div>

      <div class="num-section highlight">
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
        <p class="sub">数秘術：個人年数${f.personalYear}「${PERSONAL_YEAR[f.personalYear].theme}」／ 九星気学：${f.yearPalace.name}「${f.yearPalace.theme}」／ 算命学：${f.tenchusatsuNow ? "天中殺の年" : "天中殺ではない年"}</p>
      </div>

      <div class="num-section"><h4>✦ あなたへのアドバイス</h4>${r.advice.map((a) => `<p>${a}</p>`).join("")}</div>

      ${f.type16 ? "" : `<p class="sub">💡 <a href="#type16">16タイプ診断</a>を受けると、その結果も総合鑑定に反映されます。</p>`}
      ${f.time ? "" : `<p class="sub">💡 生まれた時刻を入れると、月星座がより正確になります。プロフィールに都道府県も登録すると第一印象（ASC）も加わります。</p>`}
      ${shareButtons(`【${SITE_NAME}】総合鑑定で私は${r.headline}でした✨`)}
    `);
  });
})();
