// 暦の計算：干支・節入り・旧暦（Meeus『天文アルゴリズム』の簡易式による）

const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const STEM_ELEMENT = ["木", "木", "火", "火", "土", "土", "金", "金", "水", "水"];
const BRANCH_ELEMENT = ["水", "土", "木", "木", "土", "火", "火", "土", "金", "金", "土", "水"];

const RAD = Math.PI / 180;
const JST = 9 / 24;
const mod = (a, n) => ((a % n) + n) % n;

// 六十干支の番号（甲子=0）
const kanshiIndex = (stem, branch) => mod(6 * stem - 5 * branch, 60);
const kanshiName = (i) => STEMS[i % 10] + BRANCHES[i % 12];

// 日付 ⇔ ユリウス日（JST の 0時）
function jdFromDate(y, m, d) {
  return Date.UTC(y, m - 1, d) / 86400000 + 2440587.5 - JST;
}
function dateFromJd(jd) {
  const dt = new Date(Math.round((jd + JST - 2440587.5) * 86400000));
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}
// その瞬間を含む JST の日付の 0時のユリウス日
const jstDayStart = (jd) => Math.floor(jd + JST + 0.5) - 0.5 - JST;

// 太陽の視黄経（度）
function sunLongitude(jd) {
  const T = (jd - 2451545) / 36525;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * RAD;
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M)
    + (0.019993 - 0.000101 * T) * Math.sin(2 * M) + 0.000289 * Math.sin(3 * M);
  const omega = (125.04 - 1934.136 * T) * RAD;
  return mod(L0 + C - 0.00569 - 0.00478 * Math.sin(omega), 360);
}

// k 番目の新月の時刻（ユリウス日）
function newMoonJd(k) {
  const T = k / 1236.85;
  let jde = 2451550.09766 + 29.530588861 * k + 0.00015437 * T * T - 0.00000015 * T ** 3 + 0.00000000073 * T ** 4;
  const E = 1 - 0.002516 * T - 0.0000074 * T * T;
  const M = (2.5534 + 29.1053567 * k - 0.0000014 * T * T) * RAD;
  const Mp = (201.5643 + 385.81693528 * k + 0.0107582 * T * T + 0.00001238 * T ** 3) * RAD;
  const F = (160.7108 + 390.67050284 * k - 0.0016118 * T * T - 0.00000227 * T ** 3) * RAD;
  const Om = (124.7746 - 1.56375588 * k + 0.0020672 * T * T) * RAD;
  jde += -0.4072 * Math.sin(Mp) + 0.17241 * E * Math.sin(M) + 0.01608 * Math.sin(2 * Mp)
    + 0.01039 * Math.sin(2 * F) + 0.00739 * E * Math.sin(Mp - M) - 0.00514 * E * Math.sin(Mp + M)
    + 0.00208 * E * E * Math.sin(2 * M) - 0.00111 * Math.sin(Mp - 2 * F) - 0.00057 * Math.sin(Mp + 2 * F)
    + 0.00056 * E * Math.sin(2 * Mp + M) - 0.00042 * Math.sin(3 * Mp) + 0.00042 * E * Math.sin(M + 2 * F)
    + 0.00038 * E * Math.sin(M - 2 * F) - 0.00024 * E * Math.sin(2 * Mp - M) - 0.00017 * Math.sin(Om);
  return jde - 70 / 86400; // ΔT のおおよその補正
}

// 指定日（JST 0時）以前で最も近い新月の日の 0時と、その次の新月の日の 0時
function lunarMonthBounds(jd0) {
  let k = Math.floor((jd0 - 2451550.09766) / 29.530588861) + 1;
  while (jstDayStart(newMoonJd(k)) > jd0) k--;
  return { k, start: jstDayStart(newMoonJd(k)), end: jstDayStart(newMoonJd(k + 1)) };
}

// その朔望月に含まれる中気から月番号を求める（中気が無ければ null＝閏月）
function monthNumberOf(start, end) {
  const a = sunLongitude(start), b = sunLongitude(end);
  const ia = Math.floor(a / 30), ib = Math.floor(mod(b, 360) / 30);
  if (ia === ib) return null;
  const L = mod(ib * 30, 360); // 越えた中気の黄経
  const n = mod(L / 30 + 2, 12);
  return n === 0 ? 12 : n;
}

// 新暦 → 旧暦
function toLunar(y, m, d) {
  const jd0 = jdFromDate(y, m, d);
  let { k, start, end } = lunarMonthBounds(jd0);
  const day = Math.round(jd0 - start) + 1;
  let month = monthNumberOf(start, end);
  let leap = false;
  if (month === null) {
    // 中気の無い月は前月の閏月
    let kk = k - 1;
    let prev = null;
    while (prev === null) {
      prev = monthNumberOf(jstDayStart(newMoonJd(kk)), jstDayStart(newMoonJd(kk + 1)));
      kk--;
    }
    month = prev;
    leap = true;
  }
  return { month, day, leap };
}

// 節入り（太陽黄経が 15°+30°n を越える日）を考慮した干支暦の月（寅月=1〜丑月=12）
function solarMonth(y, m, d) {
  const L = sunLongitude(jdFromDate(y, m, d) + 1); // その日の終わり時点
  return mod(Math.floor((L - 315) / 30), 12) + 1;
}

// 四柱（年・月・日・時）。hour が null なら時柱なし
function fourPillars(y, m, d, hour) {
  const sm = solarMonth(y, m, d);
  // 立春前（丑月・子月で 1〜2月）は前年扱い
  const yy = m <= 2 && sm >= 11 ? y - 1 : y;
  const yearIdx = mod(yy - 4, 60);
  const monthBranch = mod(sm + 1, 12); // 寅=2
  const monthStem = mod((yearIdx % 10 % 5) * 2 + 2 + (sm - 1), 10);
  const dayIdx = mod(Math.round(jdFromDate(y, m, d) + JST - 2415020.5) + 10, 60); // 1900-01-01 = 甲戌(10)
  const pillars = {
    year: yearIdx,
    month: kanshiIndex(monthStem, monthBranch),
    day: dayIdx,
    hour: null,
  };
  if (hour !== null && hour !== undefined) {
    const hb = Math.floor(((hour + 1) % 24) / 2); // 23時〜は子
    const hs = mod((dayIdx % 10 % 5) * 2 + hb, 10);
    pillars.hour = kanshiIndex(hs, hb);
  }
  return pillars;
}
