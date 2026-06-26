# PDFファイル結合ツール

[![Pages](https://github.com/ot-nemoto/combine-pdf-files/actions/workflows/deploy-github-pages.yml/badge.svg)](https://github.com/ot-nemoto/combine-pdf-files/actions/workflows/deploy-github-pages.yml)
[![CI](https://github.com/ot-nemoto/combine-pdf-files/actions/workflows/ci.yml/badge.svg)](https://github.com/ot-nemoto/combine-pdf-files/actions/workflows/ci.yml)
[![Dependabot](https://github.com/ot-nemoto/combine-pdf-files/actions/workflows/dependabot/dependabot-updates/badge.svg)](https://github.com/ot-nemoto/combine-pdf-files/actions/workflows/dependabot/dependabot-updates/)
[![License](https://img.shields.io/github/license/ot-nemoto/combine-pdf-files)](https://github.com/ot-nemoto/combine-pdf-files/blob/master/LICENSE)

複数のPDFファイルをブラウザ上で結合し、1つのPDFとしてダウンロードできるWebアプリケーションです。サーバーへのファイル送信なしに、クライアントサイドで完結します。

## 機能

- ドラッグ＆ドロップによるPDFアップロード（複数同時対応）
- ページ単位のプレビュー・並び替え・回転・削除
- クライアントサイドでのPDF結合・ダウンロード
- ダークモード対応

## ドキュメント

| ドキュメント | 内容 |
|-------------|------|
| [docs/product.md](docs/product.md) | プロダクトの目的・対象ユーザー・ゴール |
| [docs/requirements.md](docs/requirements.md) | 機能要件・非機能要件 |
| [docs/architecture.md](docs/architecture.md) | 技術スタック・構成・設計 |
| [docs/ui.md](docs/ui.md) | 画面仕様・コンポーネント・UI規約 |
| [docs/development.md](docs/development.md) | 開発・運用手順 |
| [docs/testing.md](docs/testing.md) | テスト方針・カバレッジ |
| [docs/e2e-scenarios.md](docs/e2e-scenarios.md) | E2Eテストシナリオ |
| [docs/tasks.md](docs/tasks.md) | フェーズ構成・進捗管理 |

## クイックスタート

```bash
npm install
npm run dev
```

詳細は [docs/development.md](docs/development.md) を参照。
