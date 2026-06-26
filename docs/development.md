# 開発手順

## ローカルセットアップ

### 前提条件

- Node.js 24（推奨）
- npm

### セットアップ

```bash
git clone https://github.com/ot-nemoto/combine-pdf-files.git
cd combine-pdf-files
npm install
```

### 開発サーバー起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) にアクセス。

### DevContainer（VS Code）

`.devcontainer/devcontainer.json` が同梱されているため、VS Code の Dev Containers 拡張で開発環境を構築可能。

## 環境変数

| 変数 | 用途 | 既定値 |
|------|------|--------|
| `BUILD_MODE` | `static` を指定すると GitHub Pages 向け静的エクスポートを有効化 | なし |

## npm スクリプト

| コマンド | 概要 |
|----------|------|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | 本番ビルド（SSR） |
| `npm run build:static` | 静的エクスポートビルド |
| `npm run start` | 本番ビルド起動 |
| `npm run lint` | Biome による静的解析 |
| `npm run format` | Biome によるフォーマット |
| `npm test` | Vitest によるテスト実行 |
| `npm run test:ui` | Vitest UI でテスト実行 |
| `npm run test:coverage` | カバレッジ付きテスト実行 |

## デプロイ手順

GitHub Pages への自動デプロイ。

1. `develop` ブランチに push する
2. GitHub Actions（`deploy-github-pages.yml`）が自動実行
3. `npm run build:static` で `./out` に静的ファイルを生成
4. GitHub Pages にデプロイ

手動デプロイは不要。
