# 星読みの部屋

タロット（1枚引き・3枚引き）・おみくじ・四柱推命・星座占い・数秘術・相性占い・ルーン・九星気学・夢占いの総合占い静的サイト（HTML/CSS/JS のみ）。

## 構成
- `index.html` / `app.js` … トップページと各占い
- `common.js` … 共通ヘッダー・フッター、月齢計算、SNSシェア、生年月日の保存
- `data.js` … 占いの文章データ
- `data-detail.js` … 星座の基本性格・相性の解説・ルーンの詳細・夢占い辞典
- 相性占いの「相性のいい生年月日を探す」は、相性占いと同じ点数計算でお相手の生まれ年の365日を採点
- `koyomi.js` … 干支・節入り・旧暦の計算
- `eastern.js` … 算命学・紫微斗数・宿曜・易・姓名判断、四柱推命の命式
- `kyusei.js` … 九星気学（本命星・月命星、年盤・月盤・日盤と吉方位）
- `profile.js` … プロフィール登録（ブラウザ内保存）と各占いの自動表示
- `astro.js` … ホロスコープ（天体位置の計算・出生図）。結果は要約→テーマ別の読み解き→詳しいデータの順（文章は `data-detail.js` の `HORO_READ`）
- `mbti.js` … 16タイプ性格診断
- `mbti-art.js` … 16タイプ診断結果のキャラクターイラスト（オリジナルSVG）
- `kanji-strokes.js` … 姓名判断用の画数表（Unicode Unihan の日本語字形の画数から抽出）
- `column/` … コラム記事、`terms.html` などフッターのページ
- コラムの `numerology.html`・`tarot.html` は `data.js` の内容から生成した静的HTML

## ローカル確認
```
python3 -m http.server 8000
```
→ http://localhost:8000

## デプロイ（Render）
1. GitHub にこのリポジトリを push
2. Render ダッシュボード → New → Blueprint → このリポジトリを選択（`render.yaml` を自動検出）

## ログイン機能（Supabase）の有効化
1. https://supabase.com でプロジェクトを作成
2. SQL Editor で `supabase/schema.sql` を実行
3. Authentication → URL Configuration の Site URL と Redirect URLs に公開URL（`/mypage.html` を含む）を登録
4. Google ログイン：Google Cloud Console で OAuth クライアント（ウェブ）を作成し、承認済みリダイレクト URI に `https://<プロジェクト>.supabase.co/auth/v1/callback` を登録。発行されたクライアントID・シークレットを Supabase の Authentication → Providers → Google に設定
5. Project Settings → API の Project URL と anon key を `config.js` に記入して push

`config.js` が空のままなら、ログインなし（ブラウザ内保存のみ）で動きます。
- `auth.js` … ログインとプロフィール・履歴の同期
- `mypage.html` … マイページ（ログイン・プロフィール・履歴・退会）
