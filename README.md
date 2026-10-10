# 星読みの部屋

タロット（1枚引き・3枚引き）・おみくじ・四柱推命・星座占い・数秘術・相性占い・ルーン・九星気学・夢占いの総合占い静的サイト（HTML/CSS/JS のみ）。

## 構成
- `index.html` / `app.js` … トップページと各占い
- `common.js` … 共通ヘッダー・フッター、月齢計算、SNSシェア、生年月日の保存
- `data.js` … 占いの文章データ
- `koyomi.js` … 干支・節入り・旧暦の計算
- `eastern.js` … 算命学・紫微斗数・宿曜・易・姓名判断、四柱推命の命式
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
