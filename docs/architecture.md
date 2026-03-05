# アプリケーション設計書

## 概要

**combine-pdf-files** は、ブラウザ上で完結するPDF結合ツール。
複数のPDFファイルを読み込み、ページ単位で並び替え・回転・削除を行ってから1つのPDFとして出力する。
サーバーサイド処理は一切なく、PDF操作はすべてクライアント側の `pdf-lib` で実行される。

---

## 技術スタック

| カテゴリ | ライブラリ / バージョン |
|----------|------------------------|
| フレームワーク | Next.js 15.5.5 (App Router) |
| UI ライブラリ | React 19.1.0 |
| スタイリング | Tailwind CSS v4 |
| PDF 処理 | pdf-lib ^1.17.1 |
| 言語 | TypeScript ^5 |
| テスト | Vitest ^2.1.8 + @testing-library/react |
| Lint / Format | Biome 2.2.0 |
| デプロイ | GitHub Pages (静的エクスポート) |

---

## ディレクトリ構成

```
src/app/
├── layout.tsx               # RootLayout: フォント・メタデータ設定
├── page.tsx                 # Home: ページルート（メイン画面）
├── globals.css              # グローバルスタイル
├── components/
│   └── PageItem.tsx         # 個別ページの表示・操作 UI
├── hooks/
│   └── usePdfPages.ts       # ページ状態管理カスタムフック
└── utils/
    └── pdfUtils.ts          # PDF 処理ユーティリティ関数
```

---

## コンポーネント・モジュール関係図

```
page.tsx (Home)
  │
  ├── usePdfPages (hooks/usePdfPages.ts)
  │     ├── splitPdfIntoPages  (utils/pdfUtils.ts)
  │     ├── mergePdfPages      (utils/pdfUtils.ts)
  │     └── createPdfBlobUrl   (utils/pdfUtils.ts)
  │
  └── PageItem (components/PageItem.tsx)
        └── [内部で pdfBytes → Blob URL を生成して iframe プレビュー]
```

---

## データフロー

```
[ユーザー操作]
  ファイル選択 or ドラッグ&ドロップ
         │
         ▼
  addPagesFromFiles(files: File[])
         │
         ├─ splitPdfIntoPages(file) → ProcessedPage[]
         │    各ファイルをページ単位の Uint8Array に分解
         │
         ▼
  selectedPages: SelectedPage[]  ← useState で管理
         │
         ├─ [ページ操作] movePageUp / movePageDown / deletePage
         │                rotatePageClockwise / rotatePageCounterClockwise
         │
         ▼
  mergePages()
         │
         ├─ mergePdfPages(pages) → Uint8Array
         │    各ページを 1 つの PDF に結合 (回転も適用)
         │
         ├─ createPdfBlobUrl(bytes) → blob: URL
         │
         ▼
  mergedUrl (useState)
         │
         └─ <a download> でダウンロード + <iframe> でプレビュー
```

---

## 型定義

### `ProcessedPage` (pdfUtils.ts)

```ts
type ProcessedPage = {
  pageIndex: number;        // 元 PDF 内のページ番号 (0-indexed)
  sourceFileName: string;   // 元ファイル名
  pdfBytes: Uint8Array;     // 1 ページ分の PDF バイナリ
};
```

### `SelectedPage` (usePdfPages.ts)

```ts
type SelectedPage = {
  id: string;               // 一意 ID (Date.now + fileName + pageIndex)
  pageIndex: number;        // 元 PDF 内のページ番号
  sourceFileName: string;   // 元ファイル名
  rotation: number;         // 現在の回転角度 (0 / 90 / 180 / 270)
  pdfBytes: Uint8Array;     // 1 ページ分の PDF バイナリ
};
```

### `PageItemProps` (PageItem.tsx)

```ts
type PageItemProps = {
  page: SelectedPage;
  index: number;            // 表示順インデックス
  totalPages: number;       // 全ページ数 (ボタン disabled 判定に使用)
  onRotateClockwise: () => void;
  onRotateCounterClockwise: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
};
```

---

## 状態管理 (`usePdfPages`)

カスタムフック `usePdfPages` がアプリ全体の状態を集中管理する。
`page.tsx` がこのフックを呼び出し、返り値を `PageItem` に props として渡す構造。

| state | 型 | 初期値 | 役割 |
|-------|----|--------|------|
| `selectedPages` | `SelectedPage[]` | `[]` | 編集対象のページ一覧 |
| `isMerging` | `boolean` | `false` | 結合処理中フラグ |
| `mergedUrl` | `string \| null` | `null` | 結合済み PDF の Blob URL |
| `error` | `string \| null` | `null` | エラーメッセージ |

**競合防止:** `addRequestIdRef` (useRef) でリクエスト ID を管理し、古い非同期処理の結果を破棄する。

**メモリ管理:** `useEffect` で `mergedUrl` の変化を監視し、古い Blob URL を `URL.revokeObjectURL` で解放する。

---

## PDF ユーティリティ関数 (`pdfUtils.ts`)

### `splitPdfIntoPages(file: File): Promise<ProcessedPage[]>`

1. `file.arrayBuffer()` でバイナリ取得
2. `PDFDocument.load()` でドキュメント解析
3. 各ページを独立した 1 ページ PDF として `PDFDocument.create()` + `copyPages()` で複製
4. `ProcessedPage[]` として返す

### `mergePdfPages(pages): Promise<Uint8Array>`

1. `PDFDocument.create()` で空ドキュメント生成
2. 各ページの `pdfBytes` を読み込み、`copyPages()` でコピー
3. `rotation !== 0` の場合 `copiedPage.setRotation(degrees(...))` で回転を付与
4. `mergedPdf.save()` でバイナリ出力

### `createPdfBlobUrl(pdfBytes: Uint8Array): string`

`Uint8Array` → `ArrayBuffer` → `Blob` → `URL.createObjectURL()` の変換チェーン。
`byteOffset` / `byteLength` を考慮した安全なスライスを行う。

---

## コンポーネント詳細

### `PageItem` (components/PageItem.tsx)

- `React.memo` でラップし、props 変化時のみ再レンダリング。
- `useEffect` 内で `page.pdfBytes` から Blob URL を生成し `<iframe>` でページをプレビュー。
  - 依存配列: `[page.id, page.pdfBytes.byteOffset, page.pdfBytes.byteLength]`
  - クリーンアップ: `URL.revokeObjectURL` でメモリリークを防止。
- CSS `transform: rotate(${page.rotation}deg)` で iframe を回転させてプレビュー表示に反映。

---

## ドラッグ&ドロップ実装 (`page.tsx`)

ドラッグネスト問題（子要素への移動で `dragleave` が発火する問題）を `dragCounterRef` (useRef) で解決:

```
dragenter: counter += 1 → counter > 0 なら isDragActive = true
dragleave: counter -= 1 → counter <= 0 なら isDragActive = false
drop:      counter = 0, isDragActive = false
```

ドロップ時は `f.type === "application/pdf"` でフィルタリングし、PDF 以外は無視する。

---

## ビルド・デプロイ構成

### 通常ビルド (開発・SSR)

```bash
npm run dev    # next dev
npm run build  # next build
```

### 静的エクスポート (GitHub Pages)

```bash
npm run build:static  # BUILD_MODE=static next build
```

`next.config.ts` で `BUILD_MODE === "static"` のとき以下を適用:

| オプション | 値 |
|------------|----|
| `output` | `"export"` |
| `trailingSlash` | `true` |
| `basePath` | `"/combine-pdf-files"` |
| `assetPrefix` | `"/combine-pdf-files"` |
| `images.unoptimized` | `true` |

出力先: `./out/`

### CI/CD (`.github/workflows/deploy.yml`)

- トリガー: `master` ブランチへの push
- Node.js 20、`npm ci` → `npm run build:static` → GitHub Pages にデプロイ

---

## テスト構成

```
src/app/__tests__/
├── pdfUtils.test.ts      # splitPdfIntoPages / mergePdfPages / createPdfBlobUrl の単体テスト
├── usePdfPages.test.ts   # usePdfPages フックの統合テスト (renderHook)
└── PageItem.test.tsx     # PageItem コンポーネントの UI テスト
```

テストランナー: Vitest + jsdom
カバレッジ: `@vitest/coverage-v8`

---

## 設計上の特徴・判断

1. **サーバーレス設計** - PDF 処理をすべてクライアントで完結させ、プライバシーを確保。ファイルはサーバーに送信されない。

2. **ページ単位のバイナリ管理** - 各ページを個別の `Uint8Array` として保持することで、任意の順序での結合・削除を効率的に実現。

3. **useRef による副作用の分離** - `dragCounterRef`、`addRequestIdRef`、`lastUrlRef` を使い、レンダリングに影響しない値を ref で管理。

4. **競合防止パターン** - `addRequestIdRef` により、複数ファイルを素早く選び直した場合に古い非同期処理の結果がステートを汚染しない。

5. **memo + 最小依存配列** - `PageItem` を `memo` でラップし、`useEffect` の依存を `page.id` と `pdfBytes` のバイト位置・長さに限定してプレビュー URL の不要な再生成を防止。
