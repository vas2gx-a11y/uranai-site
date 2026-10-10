// 16タイプ性格診断（ユング心理学のタイプ論をもとにしたオリジナル診断）

// axis: どの指標か / dir: 「そう思う」がどちらの極に寄るか
const TYPE_QUESTIONS = [
  { axis: "EI", dir: "E", q: "初対面の人とでも、すぐに打ち解けられる" },
  { axis: "EI", dir: "I", q: "大勢と過ごしたあとは、一人の時間で回復したい" },
  { axis: "EI", dir: "E", q: "考えをまとめるより、話しながら考えるほうが得意だ" },
  { axis: "EI", dir: "I", q: "パーティーより、気心の知れた少人数の集まりが好き" },
  { axis: "EI", dir: "E", q: "休日は外に出かけて人と会うと元気になる" },
  { axis: "SN", dir: "S", q: "アイデアより、実際に役立つ具体的な方法に惹かれる" },
  { axis: "SN", dir: "N", q: "「もしも〜だったら」と空想するのが好きだ" },
  { axis: "SN", dir: "S", q: "説明は、抽象的な話より具体例があるほうが分かりやすい" },
  { axis: "SN", dir: "N", q: "物事の細部より、全体像や意味のほうが気になる" },
  { axis: "SN", dir: "S", q: "経験に基づいた確かなやり方を信頼している" },
  { axis: "TF", dir: "T", q: "判断するときは、気持ちより論理的な正しさを優先する" },
  { axis: "TF", dir: "F", q: "相手を傷つけないかどうかが、何より気になる" },
  { axis: "TF", dir: "T", q: "議論で反対意見を言うのは、相手のためにもなると思う" },
  { axis: "TF", dir: "F", q: "人から相談されると、まず共感して寄り添いたい" },
  { axis: "TF", dir: "T", q: "効率の悪いやり方を見ると、改善したくなる" },
  { axis: "JP", dir: "J", q: "予定は前もって決めておきたい" },
  { axis: "JP", dir: "P", q: "締め切り直前になると、むしろ集中力が高まる" },
  { axis: "JP", dir: "J", q: "部屋や持ち物は、いつも整理されているほうが落ち着く" },
  { axis: "JP", dir: "P", q: "旅行は計画を立てず、気の向くままに楽しみたい" },
  { axis: "JP", dir: "J", q: "やるべきことを終えてから遊びたい" },
];

const AXIS_LABEL = {
  EI: [["E", "外向"], ["I", "内向"]],
  SN: [["S", "感覚"], ["N", "直観"]],
  TF: [["T", "思考"], ["F", "感情"]],
  JP: [["J", "判断"], ["P", "知覚"]],
};

const TYPES = {
  INTJ: { name: "戦略家", desc: "独自の視点で未来を描き、緻密な計画で実現していく知性派。合理的で、目標に向かって迷わず進みます。", strengths: ["長期的な戦略を立てる力", "高い集中力と独立心", "本質を見抜く洞察力"], weaknesses: ["感情表現が苦手", "他人に厳しくなりがち"], work: "研究職・コンサルタント・エンジニア・経営企画", love: "慎重ですが、心を許した相手には深く誠実。知的に刺激し合える関係を好みます。" },
  INTP: { name: "探究者", desc: "「なぜ？」を突き詰める、好奇心旺盛な思考家。論理の美しさを愛し、独創的なアイデアを生み出します。", strengths: ["論理的な分析力", "柔軟で独創的な発想", "知的好奇心"], weaknesses: ["実行や継続が苦手", "人の気持ちに鈍感になりがち"], work: "研究者・プログラマー・データ分析・学者", love: "言葉より行動で愛情を示すタイプ。一緒に考え、語り合える相手と相性◎。" },
  ENTJ: { name: "統率者", desc: "大きな目標を掲げ、人と組織を動かすリーダー。決断力と行動力で、困難な状況も切り開きます。", strengths: ["決断力と統率力", "効率を重視する実行力", "自信と説得力"], weaknesses: ["強引になりがち", "弱さを見せられない"], work: "経営者・管理職・起業家・弁護士", love: "パートナーとも成長し合いたいタイプ。尊敬できる相手に一途です。" },
  ENTP: { name: "発明家", desc: "常識を疑い、新しい可能性を次々と見つけるアイデアマン。議論や挑戦を楽しむ、機知に富んだ人です。", strengths: ["発想力と機転", "議論やプレゼンの強さ", "変化への適応力"], weaknesses: ["飽きっぽい", "細かい作業が苦手"], work: "起業家・企画・マーケター・コンサルタント", love: "刺激的で楽しい恋を求めます。自由を尊重してくれる相手と長続き。" },
  INFJ: { name: "理想家", desc: "深い洞察力と思いやりを持つ、静かな理想主義者。人の可能性を信じ、より良い世界のために尽くします。", strengths: ["人の本心を見抜く洞察力", "信念の強さ", "思いやりと献身"], weaknesses: ["完璧主義で疲れやすい", "本音を隠しがち"], work: "カウンセラー・作家・教育者・人事", love: "魂のつながりを求めるロマンチスト。深く理解し合える関係を大切にします。" },
  INFP: { name: "夢想家", desc: "豊かな内面世界と強い価値観を持つ、優しい理想家。自分らしさと誠実さを何より大切にします。", strengths: ["共感力と優しさ", "豊かな想像力", "自分の価値観を貫く強さ"], weaknesses: ["現実的な処理が苦手", "傷つきやすい"], work: "作家・デザイナー・心理職・福祉", love: "一途でロマンチック。ありのままを受け入れてくれる相手に心を開きます。" },
  ENFJ: { name: "導き手", desc: "人の成長を心から願い、周りを励まし導くカリスマ。温かさと情熱で、人々をひとつにまとめます。", strengths: ["人を動かす言葉の力", "面倒見の良さ", "チームをまとめる力"], weaknesses: ["人に尽くしすぎる", "批判に弱い"], work: "教師・コーチ・広報・マネージャー", love: "相手の幸せを第一に考える献身的な恋人。感謝を伝え合える関係が理想。" },
  ENFP: { name: "情熱家", desc: "好奇心と情熱にあふれる自由人。人との出会いや新しい体験から、ワクワクする可能性を見つけ出します。", strengths: ["人を惹きつける明るさ", "豊かな発想力", "共感力"], weaknesses: ["計画性に欠ける", "気持ちが移ろいやすい"], work: "クリエイター・企画・広告・カウンセラー", love: "恋に全力で、一緒にいて楽しい相手。新鮮さを保てる関係が長続きのコツ。" },
  ISTJ: { name: "堅実家", desc: "責任感が強く、約束を必ず守る信頼の人。決められたことを正確に、最後までやり遂げます。", strengths: ["責任感と誠実さ", "正確で丁寧な仕事", "粘り強さ"], weaknesses: ["変化への対応が苦手", "融通が利かないことも"], work: "公務員・経理・法務・品質管理", love: "誠実で安定した関係を築くタイプ。言葉は少なくても行動で愛を示します。" },
  ISFJ: { name: "守護者", desc: "周りの人を静かに支える、温かく献身的な人。細やかな気配りで、身近な人の毎日を守ります。", strengths: ["思いやりと気配り", "責任感", "記憶力と丁寧さ"], weaknesses: ["自分を後回しにしがち", "断るのが苦手"], work: "看護・保育・事務・接客", love: "尽くし上手で家庭的。感謝の言葉をくれる相手と幸せな関係を築きます。" },
  ESTJ: { name: "実務家", desc: "秩序とルールを重んじる、頼れるまとめ役。現実的な判断で物事をテキパキと進めます。", strengths: ["実行力と管理能力", "公正さ", "リーダーシップ"], weaknesses: ["頑固になりがち", "感情面に無頓着"], work: "管理職・行政・金融・プロジェクトマネージャー", love: "誠実で頼りがいのあるパートナー。将来を一緒に計画できる相手が理想。" },
  ESFJ: { name: "世話役", desc: "人が大好きで、みんなが心地よく過ごせるよう気を配るムードメーカー。協力と調和を大切にします。", strengths: ["社交性と協調性", "面倒見の良さ", "実務的な気配り"], weaknesses: ["人の評価を気にしすぎる", "変化を嫌う"], work: "営業・接客・医療・イベント運営", love: "愛情表現が豊かで、記念日も大切にするタイプ。安心感のある関係を好みます。" },
  ISTP: { name: "職人", desc: "冷静沈着で手先が器用な実践派。仕組みを理解し、問題をスマートに解決する力があります。", strengths: ["問題解決力", "冷静な判断", "技術の習得の早さ"], weaknesses: ["感情を表に出さない", "長期的な約束が苦手"], work: "エンジニア・整備士・パイロット・職人", love: "束縛を嫌う自由派。一緒に何かを楽しめる、さっぱりした関係が心地よい。" },
  ISFP: { name: "芸術家", desc: "繊細な感性で、今この瞬間の美しさを味わう人。穏やかで優しく、自分らしい表現を大切にします。", strengths: ["美的センス", "優しさと柔軟性", "今を楽しむ力"], weaknesses: ["計画が苦手", "争いを避けすぎる"], work: "デザイナー・美容師・料理人・アーティスト", love: "言葉より態度で愛を伝えるタイプ。穏やかで居心地のいい関係を求めます。" },
  ESTP: { name: "挑戦者", desc: "スリルと行動を愛する、エネルギッシュな現実派。考えるより先に動き、その場の状況に強いタイプです。", strengths: ["行動力と度胸", "交渉力", "臨機応変さ"], weaknesses: ["衝動的になりやすい", "退屈に弱い"], work: "営業・起業家・スポーツ・救急", love: "情熱的で楽しいデートが得意。刺激と自由のある関係を好みます。" },
  ESFP: { name: "盛り上げ役", desc: "明るく陽気で、その場を一瞬で楽しくするエンターテイナー。人と楽しさを分かち合うのが大好きです。", strengths: ["明るさと社交性", "共感力", "楽しむ天才"], weaknesses: ["計画性に欠ける", "嫌なことを後回しにしがち"], work: "接客・エンタメ・販売・イベント", love: "一緒にいて楽しい恋人。感情表現がストレートで、愛情たっぷり。" },
};

// 相性が良いとされる組み合わせ：E/I と J/P が逆で、S/N が同じタイプ
const flip = (c, a, b) => (c === a ? b : a);
function goodMatches(code) {
  const [e, s, t, j] = code;
  return [flip(e, "E", "I") + s + t + flip(j, "J", "P"), flip(e, "E", "I") + s + flip(t, "T", "F") + flip(j, "J", "P")];
}

(() => {
  const form = document.getElementById("type-form");
  if (!form) return;
  const scale = [["とてもそう思う", 2], ["ややそう思う", 1], ["どちらでもない", 0], ["あまりそう思わない", -1], ["まったくそう思わない", -2]];
  form.querySelector(".type-questions").innerHTML = TYPE_QUESTIONS.map((q, i) => `
    <fieldset class="tq">
      <legend><span class="tq-no">Q${i + 1}</span> ${q.q}</legend>
      <div class="tq-scale">
        <span class="tq-end">そう思う</span>
        ${scale.map(([label, v], k) => `<label title="${label}"><input type="radio" name="q${i}" value="${v}" aria-label="${label}" required><span class="tq-dot d${k}"></span></label>`).join("")}
        <span class="tq-end">思わない</span>
      </div>
    </fieldset>`).join("");

  const progress = document.getElementById("type-progress");
  form.addEventListener("change", () => {
    const done = TYPE_QUESTIONS.filter((_, i) => form.querySelector(`input[name="q${i}"]:checked`)).length;
    progress.textContent = `${done} / ${TYPE_QUESTIONS.length} 問回答`;
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const score = { EI: 0, SN: 0, TF: 0, JP: 0 };
    TYPE_QUESTIONS.forEach((q, i) => {
      const v = Number(form.querySelector(`input[name="q${i}"]:checked`).value);
      score[q.axis] += q.dir === AXIS_LABEL[q.axis][0][0] ? v : -v;
    });
    // 各指標 5問 × 最大2点 = ±10。同点（0）の場合は右側（I・N・F・P）とする
    const code = Object.keys(score).map((ax) => (score[ax] > 0 ? AXIS_LABEL[ax][0][0] : AXIS_LABEL[ax][1][0])).join("");
    const t = TYPES[code];
    const bars = Object.entries(score).map(([ax, v]) => {
      const pct = Math.round(50 + v * 5); // 左側の割合
      const [[la, ln], [ra, rn]] = AXIS_LABEL[ax];
      return `<div class="type-axis">
        <span class="${pct >= 50 ? "on" : ""}">${ln}(${la}) ${pct}%</span>
        <span class="type-bar"><span style="width:${pct}%"></span></span>
        <span class="${pct < 50 ? "on" : ""}">${100 - pct}% ${rn}(${ra})</span>
      </div>`;
    }).join("");

    show(document.getElementById("type-result"), `
      <div class="type-hero">${typeIllustration(code)}</div>
      <p class="type-group">${TYPE_GROUPS[typeGroup(code)].name}グループ</p>
      <p class="symbol type-code">${code}</p>
      <h3 class="type-name">${t.name}タイプ</h3>
      <div class="type-axes">${bars}</div>
      <p>${t.desc}</p>
      <div class="grid-2 num-features">
        <div class="feature-box"><h5>強み</h5><ul>${t.strengths.map((s) => `<li>${s}</li>`).join("")}</ul></div>
        <div class="feature-box"><h5>気をつけたい点</h5><ul>${t.weaknesses.map((s) => `<li>${s}</li>`).join("")}</ul></div>
      </div>
      <div class="num-section"><h4>✦ 向いている仕事</h4><p>${t.work}</p></div>
      <div class="num-section"><h4>✦ 恋愛傾向</h4><p>${t.love}</p></div>
      <div class="num-section"><h4>✦ 相性が良いとされるタイプ</h4><p>${goodMatches(code).map((c) => `<strong>${c}</strong>（${TYPES[c].name}）`).join("、")}</p></div>
      <p class="sub">※ ユング心理学のタイプ論をもとにした簡易診断です。公式のMBTI®検査とは異なります。</p>
      ${shareButtons(`【${SITE_NAME}】16タイプ性格診断で私は「${code}：${t.name}」タイプでした🧩`)}
    `);
  });
})();
