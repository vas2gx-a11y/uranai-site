// 東洋占術：算命学・紫微斗数・宿曜占星術・易・姓名判断、四柱推命の命式
// koyomi.js（暦計算）・common.js・app.js の後に読み込む

const parseDate = (s) => s.split("-").map(Number);
const ELEMENTS = ["木", "火", "土", "金", "水"];
const ELEMENT_ADVICE = {
  木: "緑の多い場所を散歩する、新しいことを学ぶなど「伸びる」行動で木の気を補えます。",
  火: "明るい色の服や日光浴、人と笑い合う時間で火の気を補えます。",
  土: "規則正しい生活や料理、土に触れる時間で土の気を補えます。",
  金: "身の回りの整理整頓や金属のアクセサリーで金の気を補えます。",
  水: "水辺で過ごす、ゆっくり入浴する、読書や睡眠で水の気を補えます。",
};

// ============ 四柱推命：命式と五行バランス（既存の日干占いに追加） ============
function meishikiHtml(dateStr, hour) {
  const [y, m, d] = parseDate(dateStr);
  const p = fourPillars(y, m, d, hour);
  const cols = [["年柱", p.year], ["月柱", p.month], ["日柱", p.day], ["時柱", p.hour]];
  const count = Object.fromEntries(ELEMENTS.map((e) => [e, 0]));
  cols.forEach(([, i]) => {
    if (i === null) return;
    count[STEM_ELEMENT[i % 10]]++;
    count[BRANCH_ELEMENT[i % 12]]++;
  });
  const max = Math.max(...Object.values(count), 1);
  const lacking = ELEMENTS.filter((e) => count[e] === 0);
  return `
    <div class="shichu-section">
      <h4>✦ 命式（四柱）</h4>
      <table class="meishiki">
        <tr>${cols.map(([l]) => `<th>${l}</th>`).join("")}</tr>
        <tr>${cols.map(([, i]) => `<td>${i === null ? "－" : STEMS[i % 10]}</td>`).join("")}</tr>
        <tr>${cols.map(([, i]) => `<td>${i === null ? "－" : BRANCHES[i % 12]}</td>`).join("")}</tr>
      </table>
      ${hour === null ? `<p class="sub">※ 生まれた時刻を入力すると時柱も表示されます。</p>` : ""}
      <h4>✦ 五行バランス</h4>
      <div class="gogyo">
        ${ELEMENTS.map((e) => `<div class="gogyo-row"><span>${e}</span><span class="gogyo-bar"><span class="g-${e}" style="width:${(count[e] / max) * 100}%"></span></span><span>${count[e]}</span></div>`).join("")}
      </div>
      <p>${lacking.length ? `不足している五行：<strong>${lacking.join("・")}</strong>。${lacking.map((e) => ELEMENT_ADVICE[e]).join("")}` : "五行がすべて揃った、バランスの良い命式です。"}</p>
      <p class="sub">※ 節入り日は計算による目安です。節入り当日生まれの方は前後の月になる場合があります。</p>
    </div>`;
}

// 既存の四柱推命フォームの結果に命式を差し込む
(() => {
  const form = document.getElementById("shichu-form");
  if (!form) return;
  form.addEventListener("submit", () => {
    const birth = document.getElementById("shichu-birth").value;
    const t = document.getElementById("shichu-time")?.value;
    const hour = t ? Number(t.split(":")[0]) : null;
    const result = document.getElementById("shichu-result");
    const anchor = result.querySelector(".shichu-section");
    if (anchor) anchor.insertAdjacentHTML("beforebegin", meishikiHtml(birth, hour));
  });
})();

// ============ 算命学：天中殺 ============
const TENCHUSATSU = [
  { name: "戌亥天中殺", branches: [10, 11], text: "精神性を重んじる理想家タイプ。目に見えないものや精神世界に価値を置き、独自の哲学を持っています。家系や先祖の影響を受けやすく、自分の代で新しい流れをつくる宿命です。" },
  { name: "申酉天中殺", branches: [8, 9], text: "行動力にあふれる現実派。忙しく動き回ることで運が開けるタイプで、同時にいくつものことをこなす器用さがあります。一方で結果を急ぎすぎないことが大切です。" },
  { name: "午未天中殺", branches: [6, 7], text: "ゼロから自分の力で道を切り開く独立独歩タイプ。周囲の助けに頼らず、苦労を経験に変えて大きく成長します。晩年に向けて運気が安定していきます。" },
  { name: "辰巳天中殺", branches: [4, 5], text: "波乱を力に変える、エネルギッシュな個性派。普通では満足できず、変化の大きい人生を生きることで才能が発揮されます。逆境に強いのが最大の武器です。" },
  { name: "寅卯天中殺", branches: [2, 3], text: "現実的で実行力のあるタイプ。目の前のことを着実に形にしていく力があり、仕事や社会の場で存在感を発揮します。行動することで運が開けます。" },
  { name: "子丑天中殺", branches: [0, 1], text: "目上の人からの引き立てを受けにくい分、自立心と忍耐力が育つタイプ。若い頃の努力が後半生で大きく実を結ぶ、大器晩成型です。" },
];

function tenchusatsuOf(dayIdx) {
  return TENCHUSATSU[Math.floor(dayIdx / 10)];
}

document.getElementById("sanmei-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const [y, m, d] = parseDate(document.getElementById("sanmei-birth").value);
  const dayIdx = fourPillars(y, m, d).day;
  const t = tenchusatsuOf(dayIdx);
  const thisYear = new Date().getFullYear();
  const years = [];
  for (let yy = thisYear; years.length < 4; yy++) {
    if (t.branches.includes(((yy - 4) % 12 + 12) % 12)) years.push(yy);
  }
  const now = years.includes(thisYear);
  show(document.getElementById("sanmei-result"), `
    <p class="symbol">🔯</p>
    <h3>${t.name}</h3>
    <p class="sub">日柱：${kanshiName(dayIdx)}</p>
    <p>${t.text}</p>
    <div class="card">
      <p><strong>天中殺の年</strong>：${years.map((v) => `${v}年`).join("・")}（各年とも立春から）</p>
      <p>${now ? "今年は天中殺の年です。大きな決断や新規の始まりは慎重に。学びや準備に時間を使うと、明けてから大きく飛躍できます。" : "今年は天中殺ではありません。新しい挑戦や決断を積極的に進めて良い時期です。"}</p>
    </div>
    ${shareButtons(`【${SITE_NAME}】算命学で私は「${t.name}」でした🔯`)}
  `);
});

// ============ 宿曜占星術 ============
const SHUKU = ["昴", "畢", "觜", "参", "井", "鬼", "柳", "星", "張", "翼", "軫", "角", "亢", "氐", "房", "心", "尾", "箕", "斗", "女", "虚", "危", "室", "壁", "奎", "婁", "胃"];
const SHUKU_READING = ["ぼう", "ひつ", "し", "しん", "せい", "き", "りゅう", "せい", "ちょう", "よく", "しん", "かく", "こう", "てい", "ぼう", "しん", "び", "き", "と", "じょ", "きょ", "き", "しつ", "へき", "けい", "ろう", "い"];
const SHUKU_MONTH_START = [null, 22, 24, 26, 1, 3, 5, 8, 11, 13, 15, 18, 20]; // 旧暦各月1日の宿
const SHUKU_TEXT = {
  昴: "品があり知的な優等生タイプ。学問や芸術の分野で才能を発揮し、自然と人の上に立ちます。",
  畢: "マイペースで粘り強い努力家。一度決めたことは最後までやり抜き、着実に成果を上げます。",
  觜: "話し上手で頭の回転が速い交渉上手。言葉で人を動かす力があり、金運にも恵まれます。",
  参: "好奇心旺盛で行動的な改革者。型にはまらない発想で、新しい流れを生み出します。",
  井: "論理的で冷静な分析家。物事の本質を見抜き、筋道立てて考える力に優れています。",
  鬼: "純粋で自由な心を持つ夢追い人。直感が鋭く、精神的なものに惹かれる傾向があります。",
  柳: "情熱的で一途な努力家。好きなことにはとことん打ち込み、集中力で道を切り開きます。",
  星: "負けず嫌いで向上心の強い頑張り屋。逆境をバネに成長する、遅咲きの実力派です。",
  張: "華やかで存在感のある人気者。人前に立つことで輝き、周囲を明るく照らします。",
  翼: "高い理想を持つ努力家。遠くへ羽ばたく力を持ち、海外や広い世界と縁があります。",
  軫: "社交的で世渡り上手な人気者。フットワークが軽く、人と人をつなぐ役割を担います。",
  角: "明るく社交的で遊び心のある楽天家。センスが良く、どこにいても場を盛り上げます。",
  亢: "正義感が強く、信念を貫く反骨の人。権力に屈しない強さで、人を守るリーダーになります。",
  氐: "エネルギッシュで粘り強い野心家。欲しいものは必ず手に入れる実行力があります。",
  房: "生まれながらの幸運に恵まれた人。穏やかで人に好かれ、豊かな人生を歩みます。",
  心: "人の心をつかむ魅力の持ち主。愛嬌があり、相手に合わせる柔軟さで信頼を得ます。",
  尾: "一途で忍耐強い職人気質。こだわりを持って一つの道を極めることで成功します。",
  箕: "豪快で面倒見の良い親分肌。度胸があり、困難な状況でも周りを引っ張ります。",
  斗: "カリスマ性のある理想家。高い目標に向けて努力を惜しまず、大きな成果をつかみます。",
  女: "真面目で勉強熱心な努力家。知識と教養を武器に、着実にキャリアを築きます。",
  虚: "繊細でロマンチックな感性派。豊かな想像力と芸術的センスを持っています。",
  危: "社交的で冒険心あふれる自由人。新しい環境を楽しみ、人脈を広げていきます。",
  室: "パワフルで行動力のあるリーダー。大胆な決断で道を切り開き、周囲を引っ張ります。",
  壁: "縁の下の力持ちタイプ。誠実で信頼され、人を支えることで自らも幸運をつかみます。",
  奎: "上品で穏やか、品格のある人。真面目で道徳心が強く、周囲から尊敬されます。",
  婁: "器用で多才なマルチプレイヤー。気配り上手で、何でもそつなくこなします。",
  胃: "エネルギッシュで情熱的な挑戦者。自分の力で欲しいものをつかみ取る強さがあります。",
};

function honmeiShuku(dateStr) {
  const [y, m, d] = parseDate(dateStr);
  const lunar = toLunar(y, m, d);
  return { lunar, shuku: SHUKU[(SHUKU_MONTH_START[lunar.month] + lunar.day - 1) % 27] };
}

document.getElementById("sukuyo-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const { lunar, shuku } = honmeiShuku(document.getElementById("sukuyo-birth").value);
  const i = SHUKU.indexOf(shuku);
  show(document.getElementById("sukuyo-result"), `
    <p class="symbol">🌌</p>
    <h3>${shuku}宿（${SHUKU_READING[i]}しゅく）</h3>
    <p class="sub">旧暦 ${lunar.leap ? "閏" : ""}${lunar.month}月${lunar.day}日生まれ</p>
    <p>${SHUKU_TEXT[shuku]}</p>
    ${shareButtons(`【${SITE_NAME}】宿曜占星術で私の本命宿は「${shuku}宿」でした🌌`)}
  `);
});

// ============ 紫微斗数 ============
const SHIBI_STARS = {
  紫微: "帝王の星。気品と統率力を備え、人の上に立つ運命。プライドの高さを謙虚さで包むと大成します。",
  天機: "知恵の星。頭の回転が速く、企画力や分析力に優れた参謀タイプ。変化の中で才能を発揮します。",
  太陽: "光の星。明るく博愛精神にあふれ、人のために尽くすことで輝きます。社会的な活躍が期待できます。",
  武曲: "財の星。決断力と実行力を持ち、お金を生み出す才能があります。堅実さが成功の鍵です。",
  天同: "福の星。穏やかで人当たりが良く、自然と幸運に恵まれます。人生を楽しむ才能の持ち主です。",
  廉貞: "情熱の星。強い意志とこだわりを持ち、白黒はっきりさせたい性格。芸術や専門分野で開花します。",
  天府: "財庫の星。包容力があり、人や財を集めて守る力に優れています。安定した豊かな人生を築きます。",
  太陰: "月の星。優しく繊細で、美的センスに優れた人。不動産や家庭運にも恵まれます。",
  貪狼: "欲望と才能の星。多芸多才で社交的、人を惹きつける魅力があります。好奇心が人生を彩ります。",
  巨門: "言葉の星。鋭い観察眼と弁舌の才能を持ちます。教育・研究・話す仕事で力を発揮します。",
  天相: "補佐の星。公正で面倒見が良く、人を支える立場で信頼を集めます。調整役として欠かせない存在です。",
  天梁: "長寿と守護の星。面倒見が良く、困難から人を救う力があります。年齢を重ねるほど運が開けます。",
  七殺: "将軍の星。勇敢で行動力があり、困難に真っ向から立ち向かう開拓者。波乱を力に変えます。",
  破軍: "変革の星。古いものを壊し新しいものを生み出す力を持ちます。変化の多い人生で真価を発揮します。",
};
const NAYIN_ELEMENT = "金火木土金火水土金木水土火木水金火木土金火水土金木水土火木水";
const KYOKU = { 水: 2, 木: 3, 金: 4, 土: 5, 火: 6 };
const KYOKU_NAME = { 2: "水二局", 3: "木三局", 4: "金四局", 5: "土五局", 6: "火六局" };
const PALACE_NAMES = ["命宮", "兄弟宮", "夫妻宮", "子女宮", "財帛宮", "疾厄宮", "遷移宮", "奴僕宮", "官禄宮", "田宅宮", "福徳宮", "父母宮"];

function shibiChart(dateStr, hour) {
  const [y, m, d] = parseDate(dateStr);
  const lunar = toLunar(y, m, d);
  let lm = lunar.month;
  if (lunar.leap && lunar.day > 15) lm = lm % 12 + 1; // 閏月の後半は翌月扱い
  const ly = lunar.month > m ? y - 1 : y; // 旧暦の年（年初の旧11・12月は前年）
  const yearStem = mod(ly - 4, 10);
  const hb = Math.floor(((hour + 1) % 24) / 2);

  const mei = mod(2 + (lm - 1) - hb, 12); // 命宮の地支
  const shin = mod(2 + (lm - 1) + hb, 12); // 身宮の地支
  const toraStem = mod((yearStem % 5) * 2 + 2, 10); // 寅の天干（五虎遁）
  const meiStem = mod(toraStem + mod(mei - 2, 12), 10);
  const kyoku = KYOKU[NAYIN_ELEMENT[Math.floor(kanshiIndex(meiStem, mei) / 2)]];

  // 紫微星の位置
  let x = 0;
  while ((lunar.day + x) % kyoku !== 0) x++;
  const q = (lunar.day + x) / kyoku;
  const shibi = mod(2 + q - 1 + (x % 2 ? -x : x), 12);
  const tenpu = mod(4 - shibi, 12);

  const pos = {};
  const put = (star, p) => (pos[mod(p, 12)] ||= []).push(star);
  [["紫微", 0], ["天機", -1], ["太陽", -3], ["武曲", -4], ["天同", -5], ["廉貞", -8]].forEach(([s, o]) => put(s, shibi + o));
  [["天府", 0], ["太陰", 1], ["貪狼", 2], ["巨門", 3], ["天相", 4], ["天梁", 5], ["七殺", 6], ["破軍", 10]].forEach(([s, o]) => put(s, tenpu + o));

  return { lunar, mei, shin, kyoku, pos };
}

document.getElementById("shibi-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const birth = document.getElementById("shibi-birth").value;
  const hour = Number(document.getElementById("shibi-time").value.split(":")[0]);
  const c = shibiChart(birth, hour);
  let stars = c.pos[c.mei] || [];
  const borrowed = !stars.length;
  if (borrowed) stars = c.pos[mod(c.mei + 6, 12)] || []; // 主星がなければ対宮の星を借りる
  const palaces = PALACE_NAMES.map((name, i) => {
    const b = mod(c.mei - i, 12);
    return `<tr><th>${name}</th><td>${BRANCHES[b]}</td><td>${(c.pos[b] || []).join("・") || "－"}${b === c.shin ? "（身宮）" : ""}</td></tr>`;
  }).join("");

  show(document.getElementById("shibi-result"), `
    <p class="symbol">✴</p>
    <h3>命宮の主星：${stars.join("・")}</h3>
    <p class="sub">旧暦 ${c.lunar.leap ? "閏" : ""}${c.lunar.month}月${c.lunar.day}日 ／ 命宮 ${BRANCHES[c.mei]} ／ ${KYOKU_NAME[c.kyoku]}${borrowed ? " ／ 命宮に主星がないため対宮の星で読みます" : ""}</p>
    ${stars.map((s) => `<p><strong>${s}星</strong>：${SHIBI_STARS[s]}</p>`).join("")}
    <details class="card"><summary>十二宮の配置を見る</summary><table class="palaces">${palaces}</table></details>
    ${shareButtons(`【${SITE_NAME}】紫微斗数で私の命宮の主星は「${stars.join("・")}」でした✴`)}
  `);
});

// ============ 易（六十四卦） ============
// 八卦（下から 1=陽, 0=陰）
const TRIGRAMS = { "111": "天", "110": "沢", "101": "火", "100": "雷", "011": "風", "010": "水", "001": "山", "000": "地" };
const HEXAGRAMS = [
  null,
  ["乾為天", "天の力が満ちる最強の卦。志を高く持ち、堂々と進めば成功します。ただし驕りは禁物。"],
  ["坤為地", "大地のように受け入れる卦。先頭に立つより、従い支えることで実りを得ます。"],
  ["水雷屯", "生みの苦しみの卦。物事の始まりで困難が多いとき。焦らず基盤を固めて。"],
  ["山水蒙", "未熟・啓蒙の卦。まだ先が見えない状態。良い師や助言者に学ぶと道が開けます。"],
  ["水天需", "待つことの卦。時機はまだ。力を蓄え、焦らず好機を待てば必ず報われます。"],
  ["天水訟", "争いの卦。対立が生まれやすいとき。意地を張らず、早めに和解を図って。"],
  ["地水師", "統率の卦。集団をまとめる力が求められます。正しい目的と規律が成功の鍵。"],
  ["水地比", "親しみ・協力の卦。人と手を取り合うことで物事がうまく運びます。"],
  ["風天小畜", "小さく蓄える卦。大きな動きはまだ早い。小さな努力を積み重ねて。"],
  ["天沢履", "虎の尾を踏む卦。危うい状況でも、礼儀と慎重さを守れば無事に進めます。"],
  ["地天泰", "安泰・調和の卦。天地が交わり万事うまくいく大吉の時。今の幸運に感謝を。"],
  ["天地否", "閉塞の卦。意思が通じにくいとき。無理に動かず、内面を充実させて。"],
  ["天火同人", "協同の卦。志を同じくする仲間と力を合わせると、大きなことが成し遂げられます。"],
  ["火天大有", "大いに保つ卦。豊かさと成功に恵まれる大吉の時。得たものを分かち合って。"],
  ["地山謙", "謙虚の卦。控えめな姿勢が人望を集め、結果として大きな成功につながります。"],
  ["雷地豫", "喜び・準備の卦。楽しい出来事の予感。ただし浮かれすぎず備えを忘れずに。"],
  ["沢雷随", "従うことの卦。流れや良い人に従うことで運が開けます。柔軟さが吉。"],
  ["山風蠱", "腐敗と刷新の卦。古い問題を立て直すとき。思い切った改革が吉と出ます。"],
  ["地沢臨", "臨む・発展の卦。運気が上昇中。積極的に人や物事に関わっていきましょう。"],
  ["風地観", "観察の卦。今は行動より観察のとき。物事をよく見極め、学ぶことで道が見えます。"],
  ["火雷噬嗑", "噛み砕く卦。障害を取り除く決断が必要なとき。はっきりした態度で臨んで。"],
  ["山火賁", "飾りの卦。見た目や形式が整うとき。ただし中身を充実させることを忘れずに。"],
  ["山地剥", "剥がれ落ちる卦。衰退の時期。無理に動かず、守りに徹すれば次の好機が来ます。"],
  ["地雷復", "復活の卦。一陽来復、運気が戻り始めます。新たなスタートに良い時です。"],
  ["天雷无妄", "自然のままの卦。作為を捨て、誠実に自然体でいることが幸運を招きます。"],
  ["山天大畜", "大いに蓄える卦。力や知識をため込むとき。蓄えたものが後に大きく役立ちます。"],
  ["山雷頤", "養うことの卦。心身の健康、言葉づかい、食生活を整えると運気が上がります。"],
  ["沢風大過", "大いに過ぎる卦。負担が大きすぎる状態。無理を減らし、バランスを取り戻して。"],
  ["坎為水", "重なる困難の卦。苦境が続きますが、誠実さを失わなければ必ず抜け出せます。"],
  ["離為火", "明るさ・付着の卦。知性と美が輝くとき。良いものに寄り添うことで栄えます。"],
  ["沢山咸", "感応の卦。心が通じ合うとき。恋愛や人間関係に吉。素直な気持ちを大切に。"],
  ["雷風恒", "恒久の卦。変わらず続けることに価値があります。今の道を地道に歩んで。"],
  ["天山遯", "退く卦。今は身を引くべきとき。潔く一歩下がることで、自分を守れます。"],
  ["雷天大壮", "大いに盛んな卦。勢いがあるとき。ただし勢いに任せた強引さには注意を。"],
  ["火地晋", "進む卦。日が昇るように昇進・発展するとき。積極的に前へ出て吉。"],
  ["地火明夷", "光が傷つく卦。才能が認められにくいとき。表に出さず内に秘めて時を待って。"],
  ["風火家人", "家族の卦。家庭や身近な人との関係を大切にすると、全体の運気が整います。"],
  ["火沢睽", "背き合う卦。意見が食い違いやすいとき。小さなことから歩み寄って。"],
  ["水山蹇", "行き悩む卦。前に進めない困難のとき。無理に進まず、助けを求めるのが吉。"],
  ["雷水解", "解ける卦。困難や緊張が解けていくとき。問題は早めに片付けて前へ。"],
  ["山沢損", "減らす卦。何かを手放すことで、かえって大きな益を得ます。損して得取れ。"],
  ["風雷益", "増す卦。利益や助けが増える吉の時。積極的に行動し、人にも分け与えて。"],
  ["沢天夬", "決断の卦。迷いを断ち切るとき。正しいと思うことをはっきり示しましょう。"],
  ["天風姤", "思いがけない出会いの卦。予期せぬ縁が訪れます。相手をよく見極めて。"],
  ["沢地萃", "集まる卦。人や物が集まり、にぎわうとき。人の輪の中に良い運があります。"],
  ["地風升", "昇る卦。少しずつ着実に上昇していくとき。努力が順調に実を結びます。"],
  ["沢水困", "困窮の卦。苦しいときですが、言葉より行動で示せば道は開けます。"],
  ["水風井", "井戸の卦。変わらぬ価値を持つもの。基本に立ち返り、人の役に立つことを。"],
  ["沢火革", "改革の卦。変化のとき。古いやり方を改め、新しい形に変えると吉。"],
  ["火風鼎", "鼎（かなえ）の卦。安定と新たな創造のとき。人と協力して新しいものを生み出して。"],
  ["震為雷", "雷の卦。驚くような出来事があっても、落ち着いて対処すれば大事に至りません。"],
  ["艮為山", "止まる卦。今は動かず、じっと止まることが最善。心を静めて。"],
  ["風山漸", "少しずつ進む卦。順序を踏んで着実に進めば、良い結果に。結婚にも吉。"],
  ["雷沢帰妹", "順序の乱れの卦。焦って物事を進めると失敗しがち。立場をわきまえて。"],
  ["雷火豊", "豊かさの卦。満ち足りた絶頂のとき。盛りの後に備え、今を大切に。"],
  ["火山旅", "旅の卦。不安定ながら新しい経験を得るとき。謙虚に、身軽に動いて。"],
  ["巽為風", "風の卦。柔軟に従うことで物事が通じます。人の意見をよく聞いて。"],
  ["兌為沢", "喜びの卦。楽しい会話や交流に恵まれます。笑顔が幸運を呼び込みます。"],
  ["風水渙", "散らす卦。わだかまりが解け、離れていたものが再び集まるきっかけに。"],
  ["水沢節", "節度の卦。ほどよく区切りをつけることが大切。やりすぎに注意して。"],
  ["風沢中孚", "まことの卦。誠実な心が相手に通じるとき。真心を込めて接すれば吉。"],
  ["雷山小過", "少し行き過ぎる卦。大きなことより小さなことに注力して。控えめが吉。"],
  ["水火既済", "完成の卦。物事が一段落するとき。ただし完成の後こそ油断せずに。"],
  ["火水未済", "未完成の卦。まだ途中ですが、それは可能性が残っているということ。最後まで丁寧に。"],
];
const TRIGRAM_LONG = { 天: "乾", 沢: "兌", 火: "離", 雷: "震", 風: "巽", 水: "坎", 山: "艮", 地: "坤" };

// 上卦・下卦の象から卦番号を探す（卦名「上下〇」「〇為〇」の規則を利用）
function hexagramNumber(lines) {
  const lower = TRIGRAMS[lines.slice(0, 3).join("")];
  const upper = TRIGRAMS[lines.slice(3).join("")];
  return HEXAGRAMS.findIndex((h) => h && (upper === lower
    ? h[0] === `${TRIGRAM_LONG[upper]}為${upper}`
    : h[0].startsWith(upper + lower)));
}

const lineSvg = (yang, changing) => `<div class="yao ${yang ? "yang" : "yin"} ${changing ? "chg" : ""}"><span></span>${yang ? "" : "<span></span>"}</div>`;
const hexHtml = (lines, changes = []) => `<div class="hex">${lines.map((l, i) => lineSvg(l, changes.includes(i))).reverse().join("")}</div>`;

document.getElementById("eki-draw")?.addEventListener("click", () => {
  // 3枚のコインで1爻ずつ：6=老陰(変) 7=少陽 8=少陰 9=老陽(変)
  const toss = () => [0, 0, 0].reduce((s) => s + (Math.random() < 0.5 ? 2 : 3), 0);
  const vals = Array.from({ length: 6 }, toss);
  const hon = vals.map((v) => (v % 2 ? 1 : 0));
  const changes = vals.map((v, i) => (v === 6 || v === 9 ? i : -1)).filter((i) => i >= 0);
  const yuki = hon.map((l, i) => (changes.includes(i) ? 1 - l : l));
  const n1 = hexagramNumber(hon), n2 = hexagramNumber(yuki);
  const yaoName = ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"];

  show(document.getElementById("eki-result"), `
    <div class="hex-pair">
      <div>${hexHtml(hon, changes)}<p class="sub">本卦</p></div>
      ${changes.length ? `<div class="hex-arrow">→</div><div>${hexHtml(yuki)}<p class="sub">之卦</p></div>` : ""}
    </div>
    <h3>第${n1}卦 ${HEXAGRAMS[n1][0]}</h3>
    <p>${HEXAGRAMS[n1][1]}</p>
    ${changes.length ? `
      <p class="sub">変爻：${changes.map((i) => yaoName[i]).join("・")}</p>
      <p><strong>これからの流れ（之卦）：第${n2}卦 ${HEXAGRAMS[n2][0]}</strong><br>${HEXAGRAMS[n2][1]}</p>`
      : `<p class="sub">変爻なし：今の状況がしばらく続くことを示します。</p>`}
    ${shareButtons(`【${SITE_NAME}】易占いで「${HEXAGRAMS[n1][0]}」が出ました☯`)}
  `);
});

// ============ 姓名判断 ============
const KANJI_STROKES = {};
Object.entries(KANJI_STROKES_BY_COUNT).forEach(([n, chars]) => {
  for (const c of chars) KANJI_STROKES[c] = Number(n);
});
const KANA_STROKES = Object.fromEntries([
  ..."あ3い2う2え2お3か3き4く1け3こ2さ3し1す2せ3そ1た4ち2つ1て1と2な4に3ぬ2ね2の1は3ひ1ふ4へ1ほ4ま3み2む3め2も3や3ゆ2よ2ら2り2る1れ2ろ1わ2を3ん1".match(/../g),
  ..."ア2イ2ウ3エ3オ3カ2キ3ク2ケ3コ2サ3シ3ス2セ2ソ2タ3チ3ツ3テ3ト2ナ2ニ2ヌ2ネ4ノ1ハ2ヒ2フ1ヘ1ホ4マ2ミ3ム2メ2モ3ヤ2ユ2ヨ3ラ2リ2ル2レ1ロ3ワ2ヲ3ン2ー1々3".match(/../g),
].map((s) => [s[0], Number(s[1])]));
const SMALL_KANA = { ぁ: "あ", ぃ: "い", ぅ: "う", ぇ: "え", ぉ: "お", っ: "つ", ゃ: "や", ゅ: "ゆ", ょ: "よ", ァ: "ア", ィ: "イ", ゥ: "ウ", ェ: "エ", ォ: "オ", ッ: "ツ", ャ: "ヤ", ュ: "ユ", ョ: "ヨ" };

// よく使われる異体字
const VARIANT_STROKES = { 髙: 11, 﨑: 11, 齋: 17 };

function strokeOf(ch) {
  if (KANJI_STROKES[ch]) return KANJI_STROKES[ch];
  if (VARIANT_STROKES[ch]) return VARIANT_STROKES[ch];
  const base = SMALL_KANA[ch] || ch;
  if (KANA_STROKES[base]) return KANA_STROKES[base];
  // 濁点（+2）・半濁点（+1）
  const nfd = base.normalize("NFD");
  if (nfd.length === 2 && KANA_STROKES[nfd[0]]) return KANA_STROKES[nfd[0]] + (nfd[1] === "゙" ? 2 : 1);
  return null;
}

const DAIKICHI = [1, 3, 5, 11, 13, 15, 16, 21, 23, 24, 31, 32, 33, 41, 45, 52, 63, 81];
const KICHI = [6, 7, 8, 17, 18, 25, 29, 35, 37, 39, 47, 48, 57, 61, 65, 67, 68];
const HANKICHI = [27, 30, 38, 51, 55, 58, 71, 73, 75, 77];

function kikkyo(n) {
  const v = n > 81 ? ((n - 1) % 80) + 1 : n;
  if (DAIKICHI.includes(v)) return { label: "大吉", cls: "k-daikichi" };
  if (KICHI.includes(v)) return { label: "吉", cls: "k-kichi" };
  if (HANKICHI.includes(v)) return { label: "半吉", cls: "k-hankichi" };
  return { label: "凶", cls: "k-kyo" };
}

const KAKU_INFO = [
  ["天格", "家系から受け継いだ運。先祖代々の気質を表し、それ自体の吉凶は重視しません。"],
  ["人格", "あなたの性格や才能、人生の中心となる運。最も重要な格です。"],
  ["地格", "幼少期〜青年期の運勢と、基本的な性質を表します。"],
  ["外格", "対人関係や社会からの評価、周囲の環境運を表します。"],
  ["総格", "人生全体の運勢、特に中年期以降の運を表します。"],
];

function seimei(sei, mei) {
  const s = [...sei].map(strokeOf), n = [...mei].map(strokeOf);
  const unknown = [...sei, ...mei].filter((c) => strokeOf(c) === null);
  if (unknown.length) return { unknown };
  const sum = (a) => a.reduce((x, y) => x + y, 0);
  const ten = sum(s) + (s.length === 1 ? 1 : 0); // 一字姓は霊数1を加える
  const chi = sum(n) + (n.length === 1 ? 1 : 0); // 一字名も同様
  const jin = s[s.length - 1] + n[0];
  const so = sum(s) + sum(n);
  const gai = ten + chi - jin;
  return { s, n, kaku: [ten, jin, chi, gai, so] };
}

document.getElementById("seimei-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const sei = document.getElementById("seimei-sei").value.trim();
  const mei = document.getElementById("seimei-mei").value.trim();
  const el = document.getElementById("seimei-result");
  const r = seimei(sei, mei);
  if (r.unknown) {
    show(el, `<h3>画数が分からない文字があります</h3><p>「${escapeHtml(r.unknown.join("、"))}」は登録されていません。常用漢字・人名用漢字・ひらがな・カタカナで入力してください（旧字体は新字体に置き換えてください）。</p>`);
    return;
  }
  const jin = kikkyo(r.kaku[1]), so = kikkyo(r.kaku[4]);
  show(el, `
    <p class="symbol">✍</p>
    <h3>${escapeHtml(sei)} ${escapeHtml(mei)}</h3>
    <p class="sub">${[...sei].map((c, i) => `${escapeHtml(c)}(${r.s[i]})`).join(" ")}　${[...mei].map((c, i) => `${escapeHtml(c)}(${r.n[i]})`).join(" ")}</p>
    <table class="kaku-table">
      ${KAKU_INFO.map(([name, desc], i) => {
        const k = kikkyo(r.kaku[i]);
        return `<tr><th>${name}</th><td class="kaku-num">${r.kaku[i]}画</td><td><span class="kikkyo ${k.cls}">${i === 0 ? "－" : k.label}</span></td><td class="kaku-desc">${desc}</td></tr>`;
      }).join("")}
    </table>
    <p>人格（性格・才能）は<strong>${jin.label}</strong>、総格（人生全体）は<strong>${so.label}</strong>。${jin.label === "凶" && so.label === "凶" ? "数の上では試練の多い名前ですが、試練は成長の糧。周囲への感謝を大切にすると運が好転します。" : "名前の持つ良い流れを信じて、自分らしく進んでいきましょう。"}</p>
    <p class="sub">※ 新字体の画数で計算しています。吉凶の判定は流派によって異なります。</p>
    ${shareButtons(`【${SITE_NAME}】姓名判断で人格は「${jin.label}」、総格は「${so.label}」でした✍`)}
  `);
});
