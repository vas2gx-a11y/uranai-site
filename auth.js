// ログイン（Supabase）とプロフィール・履歴の同期
// common.js から、config.js と Supabase ライブラリの後に読み込まれる

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let currentUser = null;

const KIND_LABEL = {
  tarot: "タロット", zodiac: "星座占い", horo: "ホロスコープ", num: "数秘術", compat: "相性占い",
  rune: "ルーン", dream: "夢占い", shichu: "四柱推命", sanmei: "算命学", shibi: "紫微斗数",
  sukuyo: "宿曜占星術", kyusei: "九星気学", eki: "易", omikuji: "おみくじ", seimei: "姓名判断", type: "16タイプ性格診断",
};

// サーバーの行 ⇔ ブラウザのプロフィール
const toRow = (p) => ({
  sei: p.sei || null, mei: p.mei || null, birth: p.birth || null,
  time: p.time || null, time_unknown: !!p.timeUnknown, pref: p.pref ?? null, type16: p.type16 || null,
  updated_at: new Date().toISOString(),
});
const fromRow = (r) => ({
  sei: r.sei || "", mei: r.mei || "", birth: r.birth || "", time: r.time || "",
  timeUnknown: r.time_unknown, pref: r.pref ?? "", ...(r.type16 ? { type16: r.type16 } : {}),
});

async function pushProfile() {
  if (!currentUser) return;
  const p = loadProfile();
  if (!p.birth) return;
  const { error } = await sb.from("profiles").upsert({ id: currentUser.id, ...toRow(p) });
  if (error) console.error("プロフィールの保存に失敗しました", error);
}

// ログイン直後：サーバーにあればそれを使い、なければブラウザの内容を送る
async function syncOnLogin() {
  const { data, error } = await sb.from("profiles").select("*").eq("id", currentUser.id).maybeSingle();
  if (error) { console.error(error); return; }
  if (data && data.birth) {
    const before = JSON.stringify(loadProfile());
    clearProfile();
    saveProfile(fromRow(data));
    if (before !== JSON.stringify(loadProfile()) && typeof applyProfile === "function") applyProfile();
  } else {
    await pushProfile();
  }
  document.dispatchEvent(new Event("profile-synced"));
}

function updateNav() {
  document.querySelectorAll(".global-nav a[href='/mypage.html']").forEach((a) => {
    a.textContent = currentUser ? "マイページ" : "ログイン";
  });
}

sb.auth.onAuthStateChange((event, session) => {
  const wasUser = currentUser?.id;
  currentUser = session?.user ?? null;
  updateNav();
  if (currentUser && currentUser.id !== wasUser) syncOnLogin();
  document.dispatchEvent(new CustomEvent("auth-changed", { detail: { user: currentUser } }));
});

// プロフィールの保存・削除をサーバーにも反映
document.addEventListener("profile-saved", pushProfile);
document.addEventListener("profile-cleared", async () => {
  if (currentUser) await sb.from("profiles").delete().eq("id", currentUser.id);
});

// 自分で占った結果を履歴に残す（自動表示は残さない）
document.addEventListener("fortune-shown", async (e) => {
  if (!currentUser) return;
  const kind = e.detail.kind;
  if (!KIND_LABEL[kind]) return;
  const title = (e.detail.title || "").trim().slice(0, 200);
  const { error } = await sb.from("fortune_history").insert({ kind, title });
  if (error) console.error("履歴の保存に失敗しました", error);
});
