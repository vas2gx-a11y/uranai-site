// 16タイプ性格診断の結果に表示するキャラクターイラスト（オリジナルのSVG）

// 4つのグループ：直観＋思考(NT) / 直観＋感情(NF) / 感覚＋判断(SJ) / 感覚＋知覚(SP)
const TYPE_GROUPS = {
  NT: { name: "分析家", bg: ["#c9a8f0", "#5b3c99"], outfit: "#6f4bb8", outfit2: "#8d6ad6" },
  NF: { name: "外交官", bg: ["#a6e3bf", "#2f8a5b"], outfit: "#3a9a68", outfit2: "#56b883" },
  SJ: { name: "番人", bg: ["#a9d8ef", "#2d6f99"], outfit: "#3482b3", outfit2: "#55a0cc" },
  SP: { name: "探検家", bg: ["#f8dc93", "#c48a1c"], outfit: "#d39a26", outfit2: "#e9b94a" },
};

function typeGroup(code) {
  return code[1] === "N" ? (code[2] === "T" ? "NT" : "NF") : (code[3] === "J" ? "SJ" : "SP");
}

// 髪型・髪色・小物などの組み合わせ
const TYPE_ART = {
  INTJ: { hair: "side", hairColor: "#2b2540", acc: "glasses", eyes: "calm", prop: "chess" },
  INTP: { hair: "messy", hairColor: "#4a3b2c", acc: "glasses", eyes: "dot", prop: "flask" },
  ENTJ: { hair: "slick", hairColor: "#1f1a2e", acc: "", eyes: "calm", prop: "flag" },
  ENTP: { hair: "spiky", hairColor: "#e07a3f", acc: "", eyes: "wink", prop: "bulb" },
  INFJ: { hair: "long", hairColor: "#3c2a52", acc: "", eyes: "calm", prop: "lantern" },
  INFP: { hair: "bob", hairColor: "#c98a5a", acc: "flower", eyes: "happy", prop: "feather" },
  ENFJ: { hair: "wave", hairColor: "#7a4a2a", acc: "", eyes: "happy", prop: "star" },
  ENFP: { hair: "pony", hairColor: "#f0a84a", acc: "", eyes: "sparkle", prop: "balloon" },
  ISTJ: { hair: "side", hairColor: "#3a3026", acc: "glasses", eyes: "dot", prop: "clipboard" },
  ISFJ: { hair: "bun", hairColor: "#8a5a3a", acc: "", eyes: "happy", prop: "shield" },
  ESTJ: { hair: "slick", hairColor: "#2a2a2a", acc: "tie", eyes: "calm", prop: "briefcase" },
  ESFJ: { hair: "wave", hairColor: "#b5653a", acc: "ribbon", eyes: "happy", prop: "teacup" },
  ISTP: { hair: "messy", hairColor: "#2f2f38", acc: "cap", eyes: "dot", prop: "wrench" },
  ISFP: { hair: "bob", hairColor: "#5a3a2a", acc: "beret", eyes: "calm", prop: "palette" },
  ESTP: { hair: "spiky", hairColor: "#d9a441", acc: "shades", eyes: "dot", prop: "bolt" },
  ESFP: { hair: "pony", hairColor: "#d6527a", acc: "", eyes: "sparkle", prop: "mic" },
};

const INK = "#3a2f4a";
const SKIN = "#ffe0c8";

// 後ろ髪（顔より奥に描く）
const HAIR_BACK = {
  long: (c) => `<path d="M64 84 Q60 150 74 160 L126 160 Q140 150 136 84 Z" fill="${c}"/>`,
  bob: (c) => `<path d="M64 86 Q62 118 72 124 L128 124 Q138 118 136 86 Z" fill="${c}"/>`,
  wave: (c) => `<path d="M64 84 Q58 112 66 128 Q72 138 80 130 L120 130 Q128 138 134 128 Q142 112 136 84 Z" fill="${c}"/>`,
  pony: (c) => `<path d="M128 70 Q156 74 150 112 Q146 132 136 136 Q144 110 130 92 Z" fill="${c}"/>`,
  bun: (c) => `<circle cx="100" cy="50" r="13" fill="${c}"/>`,
};

// 前髪
const HAIR_FRONT = {
  side: (c) => `<path d="M67 90 Q64 52 100 52 Q136 52 133 90 Q128 74 116 70 Q96 74 76 74 Q70 80 67 90 Z" fill="${c}"/>`,
  messy: (c) => `<path d="M66 92 Q60 54 96 50 Q100 42 106 50 Q140 52 134 92 L128 76 L120 82 L114 70 L104 80 L96 68 L86 80 L78 72 Z" fill="${c}"/>`,
  slick: (c) => `<path d="M67 86 Q66 52 100 52 Q134 52 133 86 Q130 66 100 64 Q76 64 67 86 Z" fill="${c}"/>`,
  spiky: (c) => `<path d="M66 90 L62 66 L74 70 L72 50 L88 60 L94 42 L104 58 L116 44 L118 62 L134 54 L130 72 L138 76 L134 90 Q126 72 100 70 Q76 72 66 90 Z" fill="${c}"/>`,
  long: (c) => `<path d="M66 94 Q62 52 100 52 Q138 52 134 94 Q128 72 104 66 Q100 76 92 70 Q74 72 66 94 Z" fill="${c}"/>`,
  bob: (c) => `<path d="M66 92 Q62 52 100 52 Q138 52 134 92 Q130 78 128 76 L72 76 Q70 80 66 92 Z" fill="${c}"/>`,
  wave: (c) => `<path d="M66 92 Q62 52 100 52 Q138 52 134 92 Q128 74 116 72 Q108 78 100 72 Q92 78 84 72 Q72 74 66 92 Z" fill="${c}"/>`,
  pony: (c) => `<path d="M67 90 Q64 52 100 52 Q136 52 133 90 Q126 70 108 68 Q100 78 88 70 Q72 74 67 90 Z" fill="${c}"/>`,
  bun: (c) => `<path d="M67 90 Q64 56 100 56 Q136 56 133 90 Q124 72 100 74 Q76 72 67 90 Z" fill="${c}"/>`,
};

const EYES = {
  dot: `<ellipse cx="88" cy="94" rx="3.2" ry="4" fill="${INK}"/><ellipse cx="112" cy="94" rx="3.2" ry="4" fill="${INK}"/>`,
  calm: `<path d="M83 95 Q88 91 93 95" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M107 95 Q112 91 117 95" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/><circle cx="88" cy="96" r="2.2" fill="${INK}"/><circle cx="112" cy="96" r="2.2" fill="${INK}"/>`,
  happy: `<path d="M83 96 Q88 90 93 96" stroke="${INK}" stroke-width="2.8" fill="none" stroke-linecap="round"/><path d="M107 96 Q112 90 117 96" stroke="${INK}" stroke-width="2.8" fill="none" stroke-linecap="round"/>`,
  wink: `<ellipse cx="88" cy="94" rx="3.2" ry="4" fill="${INK}"/><path d="M107 95 Q112 90 117 95" stroke="${INK}" stroke-width="2.8" fill="none" stroke-linecap="round"/>`,
  sparkle: `<ellipse cx="88" cy="94" rx="3.8" ry="4.6" fill="${INK}"/><ellipse cx="112" cy="94" rx="3.8" ry="4.6" fill="${INK}"/><circle cx="89.5" cy="92.5" r="1.4" fill="#fff"/><circle cx="113.5" cy="92.5" r="1.4" fill="#fff"/>`,
};

// 頭まわりの小物
const ACCESSORIES = {
  glasses: `<g stroke="${INK}" stroke-width="2" fill="rgba(255,255,255,.25)"><circle cx="88" cy="95" r="8"/><circle cx="112" cy="95" r="8"/><path d="M96 95 L104 95" fill="none"/></g>`,
  shades: `<g fill="${INK}"><path d="M78 89 L97 89 Q97 101 88 101 Q79 101 78 89 Z"/><path d="M103 89 L122 89 Q121 101 112 101 Q103 101 103 89 Z"/><rect x="95" y="89" width="10" height="2.5"/></g><path d="M82 91 L86 91" stroke="#fff" stroke-width="1.5" opacity=".7"/>`,
  flower: `<g transform="translate(126 66)"><circle cx="0" cy="-6" r="5" fill="#ff9fc0"/><circle cx="6" cy="0" r="5" fill="#ff9fc0"/><circle cx="0" cy="6" r="5" fill="#ff9fc0"/><circle cx="-6" cy="0" r="5" fill="#ff9fc0"/><circle r="3.5" fill="#ffd966"/></g>`,
  ribbon: `<g transform="translate(124 62)" fill="#ff7aa2"><path d="M0 0 L-12 -8 L-12 8 Z"/><path d="M0 0 L12 -8 L12 8 Z"/><circle r="3.5" fill="#ff5a8a"/></g>`,
  beret: `<path d="M66 70 Q70 42 104 44 Q136 46 136 66 Q124 60 100 62 Q80 62 66 70 Z" fill="#c2384f"/><circle cx="104" cy="44" r="3" fill="#c2384f"/>`,
  cap: `<path d="M68 74 Q68 48 100 48 Q132 48 132 74 Z" fill="#3b6e8f"/><path d="M68 74 Q56 74 50 80 Q70 82 100 74 Z" fill="#2c5570"/>`,
  tie: "",
};

// 手に持つ（またはそばに浮かぶ）アイテム
const PROPS = {
  chess: `<g transform="translate(150 104)" stroke="${INK}" stroke-width="2" stroke-linejoin="round">
    <path d="M-3 -16 L3 -16 M0 -20 L0 -12" fill="none"/>
    <path d="M-8 -10 Q0 -14 8 -10 L5 8 L-5 8 Z" fill="#f4f0ff"/>
    <rect x="-10" y="8" width="20" height="6" rx="2" fill="#f4f0ff"/>
    <rect x="-13" y="14" width="26" height="6" rx="2" fill="#f4f0ff"/></g>`,
  flask: `<g transform="translate(152 128)" stroke="${INK}" stroke-width="2" stroke-linejoin="round">
    <path d="M-5 -24 L5 -24 L5 -10 L16 12 Q18 18 12 18 L-12 18 Q-18 18 -16 12 L-5 -10 Z" fill="rgba(255,255,255,.75)"/>
    <path d="M-12 4 L12 4 L15 12 Q16 16 12 16 L-12 16 Q-16 16 -15 12 Z" fill="#7be0b0" stroke="none"/>
    <circle cx="-2" cy="-32" r="3" fill="#7be0b0" stroke="none"/><circle cx="6" cy="-40" r="2" fill="#7be0b0" stroke="none"/></g>`,
  flag: `<g stroke="${INK}" stroke-width="2.5" stroke-linejoin="round">
    <path d="M150 170 L150 50" fill="none" stroke-linecap="round"/>
    <path d="M150 52 Q166 46 180 54 Q170 64 182 74 Q166 68 150 74 Z" fill="#ffcf5c"/><circle cx="150" cy="48" r="3.5" fill="#ffcf5c"/></g>`,
  bulb: `<g transform="translate(142 40)">
    <g stroke="#fff3b0" stroke-width="3" stroke-linecap="round"><path d="M0 -22 L0 -28"/><path d="M-16 -15 L-20 -19"/><path d="M16 -15 L20 -19"/><path d="M-22 0 L-28 0"/><path d="M22 0 L28 0"/></g>
    <path d="M0 -16 Q14 -16 14 -2 Q14 6 6 12 L-6 12 Q-14 6 -14 -2 Q-14 -16 0 -16 Z" fill="#ffe66d" stroke="${INK}" stroke-width="2"/>
    <rect x="-6" y="12" width="12" height="7" rx="2" fill="#b9b2c9" stroke="${INK}" stroke-width="2"/></g>`,
  lantern: `<g transform="translate(152 158)" stroke="${INK}" stroke-width="2" stroke-linejoin="round">
    <circle cx="0" cy="12" r="22" fill="#ffe9a8" opacity=".35" stroke="none"/>
    <path d="M0 -8 L0 -2" fill="none"/>
    <rect x="-9" y="-2" width="18" height="4" rx="1" fill="#7a5b3a"/>
    <path d="M-10 2 Q-14 12 -10 22 L10 22 Q14 12 10 2 Z" fill="#ffd36b"/>
    <rect x="-9" y="22" width="18" height="4" rx="1" fill="#7a5b3a"/></g>`,
  feather: `<g transform="translate(152 120) rotate(20)" stroke="${INK}" stroke-width="2" stroke-linejoin="round">
    <path d="M0 30 Q-14 0 0 -30 Q14 0 0 30 Z" fill="#fff6fb"/><path d="M0 34 L0 -22" fill="none"/></g>`,
  star: `<g stroke="${INK}" stroke-width="2.5" stroke-linejoin="round">
    <path d="M150 172 L150 82" fill="none" stroke-linecap="round"/>
    <path d="M150 54 L156 68 L171 69 L159 78 L163 93 L150 85 L137 93 L141 78 L129 69 L144 68 Z" fill="#ffe066"/></g>`,
  balloon: `<g>
    <path d="M150 150 Q144 120 154 92" stroke="${INK}" stroke-width="1.5" fill="none"/>
    <path d="M154 92 Q132 74 136 56 Q140 42 154 50 Q168 42 172 56 Q176 74 154 92 Z" fill="#ff6f91" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M144 58 Q146 52 150 54" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".8"/></g>`,
  clipboard: `<g transform="translate(150 140) rotate(8)" stroke="${INK}" stroke-width="2" stroke-linejoin="round">
    <rect x="-15" y="-20" width="30" height="38" rx="3" fill="#c79a62"/>
    <rect x="-11" y="-14" width="22" height="28" fill="#fff"/>
    <rect x="-6" y="-23" width="12" height="6" rx="2" fill="#9aa4b5"/>
    <path d="M-8 -7 L-6 -4 L-2 -10 M-8 3 L-6 6 L-2 0" fill="none" stroke="#3aa76d"/>
    <path d="M1 -7 L8 -7 M1 3 L8 3" fill="none" stroke-width="1.5"/></g>`,
  shield: `<g transform="translate(152 138)" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round">
    <path d="M0 -24 L20 -16 Q20 12 0 24 Q-20 12 -20 -16 Z" fill="#e9f3ff"/>
    <path d="M0 10 Q-11 1 -8 -6 Q-5 -11 0 -6 Q5 -11 8 -6 Q11 1 0 10 Z" fill="#ff7a9a" stroke="none"/></g>`,
  briefcase: `<g transform="translate(152 172)" stroke="${INK}" stroke-width="2" stroke-linejoin="round">
    <path d="M-6 -16 L-6 -20 Q-6 -22 -4 -22 L4 -22 Q6 -22 6 -20 L6 -16" fill="none"/>
    <rect x="-18" y="-16" width="36" height="24" rx="4" fill="#7a4e2d"/>
    <path d="M-18 -6 L18 -6" fill="none"/><rect x="-3" y="-9" width="6" height="6" rx="1" fill="#e8c77a"/></g>`,
  teacup: `<g transform="translate(154 140)" stroke="${INK}" stroke-width="2" stroke-linejoin="round">
    <path d="M-6 -20 Q-10 -26 -6 -32 M2 -20 Q-2 -26 2 -32" stroke="#fff" fill="none" stroke-linecap="round" opacity=".85"/>
    <path d="M-14 -14 L14 -14 Q14 6 0 6 Q-14 6 -14 -14 Z" fill="#fff"/>
    <path d="M14 -10 Q22 -10 20 -2 Q18 2 12 0" fill="none"/>
    <ellipse cx="0" cy="8" rx="18" ry="3.5" fill="#f2d6e4"/>
    <path d="M-6 -6 Q0 -10 6 -6" stroke="#ff8fb1" fill="none"/></g>`,
  wrench: `<g>
    <g transform="translate(150 54)" fill="rgba(255,255,255,.55)"><path d="M-4 -18 L4 -18 L5 -12 L11 -9 L16 -13 L22 -7 L18 -2 L20 4 L26 5 L26 13 L20 14 L17 20 L21 25 L15 31 L10 27 L4 29 L3 35 L-5 35 L-6 29 L-12 26 L-17 30 L-23 24 L-19 19 L-21 13 L-27 12 L-27 4 L-21 3 L-18 -3 L-22 -8 L-16 -14 L-11 -10 L-5 -12 Z" transform="scale(.7)"/><circle cx="0" cy="6" r="5" fill="#d6a12f"/></g>
    <g transform="translate(152 132) rotate(-35)" stroke="${INK}" stroke-width="2" stroke-linejoin="round"><rect x="-4" y="-6" width="8" height="34" rx="3" fill="#c6ccd8"/><path d="M-10 -10 Q-10 -24 0 -24 L0 -16 L6 -16 L6 -24 Q12 -22 10 -10 Q8 -4 0 -4 Q-8 -4 -10 -10 Z" fill="#c6ccd8"/></g></g>`,
  palette: `<g transform="translate(152 146)" stroke="${INK}" stroke-width="2" stroke-linejoin="round">
    <path d="M-16 -36 L4 -8" stroke="#8a5a3a" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M-19 -40 L-14 -34" stroke="#ff6f91" stroke-width="5" stroke-linecap="round"/>
    <path d="M-2 -18 Q24 -20 26 0 Q28 16 6 16 Q-4 16 -4 8 Q-4 2 -10 4 Q-24 6 -20 -6 Q-16 -18 -2 -18 Z" fill="#f2dcb3"/>
    <circle cx="6" cy="-10" r="3.5" fill="#ff6f91" stroke="none"/><circle cx="16" cy="-4" r="3.5" fill="#5aa9ff" stroke="none"/><circle cx="16" cy="7" r="3.5" fill="#ffd34d" stroke="none"/><circle cx="4" cy="8" r="3" fill="#5ccf8a" stroke="none"/></g>`,
  bolt: `<g><path d="M150 30 L132 66 L146 66 L136 98 L166 56 L150 56 L162 30 Z" fill="#ffe14d" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/></g>`,
  mic: `<g>
    <g fill="#fff" opacity=".9"><path d="M162 48 L162 30 L172 27 L172 44" stroke="#fff" stroke-width="2.5" fill="none"/><ellipse cx="159" cy="48" rx="4.5" ry="3.5"/><ellipse cx="169" cy="44" rx="4.5" ry="3.5"/><path d="M136 70 L136 56" stroke="#fff" stroke-width="2.5"/><ellipse cx="133" cy="70" rx="4.5" ry="3.5"/></g>
    <g transform="translate(152 132) rotate(25)" stroke="${INK}" stroke-width="2" stroke-linejoin="round"><rect x="-4" y="-2" width="8" height="26" rx="3" fill="#4a4a5a"/><circle cx="0" cy="-10" r="10" fill="#cfd3dd"/><path d="M-8 -14 L8 -14 M-9 -9 L9 -9 M-7 -4 L7 -4" stroke="#9aa0ad" stroke-width="1.5" fill="none"/></g></g>`,
};

function typeIllustration(code) {
  const art = TYPE_ART[code];
  const g = TYPE_GROUPS[typeGroup(code)];
  const id = `tbg-${code}`;
  const back = HAIR_BACK[art.hair] ? HAIR_BACK[art.hair](art.hairColor) : "";
  const tie = art.acc === "tie" ? `<path d="M100 132 L95 138 L98 160 L100 164 L102 160 L105 138 Z" fill="#c2384f"/>` : "";
  return `<svg class="type-art" viewBox="0 0 200 200" role="img" aria-label="${code}タイプのイラスト" xmlns="http://www.w3.org/2000/svg">
  <defs><radialGradient id="${id}" cx="50%" cy="38%" r="65%"><stop offset="0" stop-color="${g.bg[0]}"/><stop offset="1" stop-color="${g.bg[1]}"/></radialGradient>
  <clipPath id="${id}-clip"><circle cx="100" cy="100" r="96"/></clipPath></defs>
  <circle cx="100" cy="100" r="96" fill="url(#${id})"/>
  <g fill="#fff" opacity=".7"><path d="M34 52 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2z"/><circle cx="52" cy="30" r="1.8"/><circle cx="40" cy="128" r="1.5"/><path d="M168 118 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5z"/></g>
  <g clip-path="url(#${id}-clip)">
    ${back}
    <path d="M56 204 Q56 136 100 130 Q144 136 144 204 Z" fill="${g.outfit}"/>
    <path d="M86 131 L100 148 L114 131 Q100 128 86 131 Z" fill="#fff" opacity=".9"/>
    ${tie}
    <path d="M74 146 Q62 160 60 176" stroke="${g.outfit2}" stroke-width="11" fill="none" stroke-linecap="round"/>
    <circle cx="60" cy="178" r="6.5" fill="${SKIN}"/>
    <path d="M126 146 Q138 152 146 154" stroke="${g.outfit2}" stroke-width="11" fill="none" stroke-linecap="round"/>
  </g>
  <rect x="93" y="112" width="14" height="20" rx="6" fill="#f5cfb3"/>
  <circle cx="100" cy="90" r="34" fill="${SKIN}"/>
  <circle cx="66" cy="94" r="5" fill="${SKIN}"/><circle cx="134" cy="94" r="5" fill="${SKIN}"/>
  ${HAIR_FRONT[art.hair](art.hairColor)}
  ${EYES[art.eyes]}
  <ellipse cx="80" cy="104" rx="5.5" ry="3.2" fill="#ff9fae" opacity=".55"/><ellipse cx="120" cy="104" rx="5.5" ry="3.2" fill="#ff9fae" opacity=".55"/>
  <path d="M95 106 Q100 111 105 106" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  ${ACCESSORIES[art.acc] || ""}
  ${PROPS[art.prop]}
  <circle cx="148" cy="154" r="6.5" fill="${SKIN}"/>
</svg>`;
}
