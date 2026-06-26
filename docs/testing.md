# テスト方針

## テスト種別

| 種別 | ツール | 対象 |
|------|--------|------|
| ユニットテスト | Vitest + jsdom | ユーティリティ関数、カスタムフック、コンポーネント |

## テストファイル構成

```
src/app/__tests__/
├── pdfUtils.test.ts       # splitPdfIntoPages / mergePdfPages / createPdfBlobUrl
├── usePdfPages.test.ts    # usePdfPages フックの統合テスト（renderHook）
└── PageItem.test.tsx      # PageItem コンポーネントの UI テスト
```

## 完了条件

- API ルートの実装はユニットテストの作成をもって完了とする
- `lib/` 配下（本プロジェクトでは `utils/`）のユーティリティ関数もユニットテストの作成をもって完了とする
- UI コンポーネントのユニットテストは必須としない

## カバレッジ方針

- カバレッジツール: `@vitest/coverage-v8`
- 最低カバレッジ閾値は設定しないが、ユーティリティ関数は網羅的にテストする

## 実行手順

```bash
# テスト実行
npm test

# UI 付きで実行
npm run test:ui

# カバレッジ付きで実行
npm run test:coverage
```

## CI 連携

PR 作成時に `ci.yml` ワークフローで `npm run lint` および `npm run test` が自動実行される。
