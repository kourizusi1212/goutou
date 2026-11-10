# どろぼうマルチ 🕵️
最大5人で遊べる、カートゥーン調の怪盗ゲーム（フィクション）。ルームコードで参加、盗む→車に積む→売る→ツール強化。

## ローカルで動かす
```
npm install
npm start   # http://localhost:3000
```

## GitHub にアップロード
```
git init && git add . && git commit -m "init"
git branch -M main
git remote add origin https://github.com/<あなた>/<repo>.git
git push -u origin main
```

## Render にデプロイ
1. Render で **New + → Web Service** → GitHub のリポジトリを選ぶ
2. Build Command: `npm install` / Start Command: `npm start`
   （`render.yaml` があるので **Blueprint** でもOK）
3. 公開URLを開き、1人がルーム作成 → 他の人がコードで参加

## 遊び方
- WASD/矢印キー: 移動 / **Eを長押し**: 家の鍵開け / **車の近くでE**: 持ち物を積む
- 右のパネル（ショップの近くで操作）: 売却・強化・セーブ・ロード・次の日へ
- お金・強化・トランクはルーム全員で共有

## メモ
- セーブはブラウザの localStorage に保存（Render無料プランはディスクが消えるため）。
- 無料プランはスリープ/再起動でルームが消えます。
