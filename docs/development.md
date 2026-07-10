# 開発手順

## ローカルセットアップ

### 前提条件

- Node.js 24
- npm

### セットアップ

```bash
git clone https://github.com/ot-nemoto/combine-pdf-files.git
cd combine-pdf-files
npm install
npm run dev
```

開発サーバーは [http://localhost:3000](http://localhost:3000) で起動する。

### DevContainer（VS Code）

`.devcontainer/devcontainer.json` を同梱しているため、VS Code の Dev Containers 拡張で開発環境を再現できる。

## 環境変数

| 変数 | 用途 |
|------|------|
| `BUILD_MODE` | `static` を指定すると GitHub Pages 向け静的エクスポートを有効化する |

## npm スクリプト

主なコマンドは以下。**定義の一覧は `package.json` の `scripts` を source of truth とする。**

- `npm run dev` — 開発サーバー起動
- `npm run build` / `npm run build:static` — 本番ビルド / 静的エクスポートビルド
- `npm run lint` / `npm run format` — Biome による静的解析 / フォーマット
- `npm test` / `npm run test:coverage` — テスト実行 / カバレッジ付き実行

## デプロイ

GitHub Pages への自動デプロイ。`develop` への push を契機に `.github/workflows/deploy-github-pages.yml` が実行され、静的エクスポート結果を公開する。手動デプロイは不要。トリガー・手順の詳細はワークフローを参照。
