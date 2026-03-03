"use client";

import { memo, useEffect, useRef, useState } from "react";

type SelectedPage = {
  id: string;
  pageIndex: number;
  sourceFileName: string;
  rotation: number;
  pdfBytes: Uint8Array;
};

const PageItem = memo(
  ({
    page,
    index,
    totalPages,
    onRotateClockwise,
    onRotateCounterClockwise,
    onMoveUp,
    onMoveDown,
    onDelete,
  }: {
    page: SelectedPage;
    index: number;
    totalPages: number;
    onRotateClockwise: () => void;
    onRotateCounterClockwise: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onDelete: () => void;
  }) => {
    const previewUrlRef = useRef<string | null>(null);

    // Generate preview URL only once and store in ref
    if (!previewUrlRef.current) {
      const arrayBuffer = page.pdfBytes.buffer.slice(
        page.pdfBytes.byteOffset,
        page.pdfBytes.byteOffset + page.pdfBytes.byteLength,
      );
      const blob = new Blob([arrayBuffer as ArrayBuffer], {
        type: "application/pdf",
      });
      previewUrlRef.current = URL.createObjectURL(blob);
    }

    // Cleanup only on unmount
    useEffect(() => {
      return () => {
        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
          previewUrlRef.current = null;
        }
      };
    }, []);

    return (
      <li className="flex items-start gap-3 rounded border border-neutral-200 p-3 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
        <div className="w-32 h-44 flex-shrink-0 rounded border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
          <iframe
            src={previewUrlRef.current || undefined}
            title={`Page ${index + 1} preview`}
            className="w-full h-full"
            style={{
              transform: `rotate(${page.rotation}deg)`,
              transformOrigin: "center",
            }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            ページ {index + 1}
          </div>
          <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
            {page.sourceFileName}
          </div>
          <div className="text-xs text-neutral-500 mt-0.5">
            元のページ: {page.pageIndex + 1} • 回転: {page.rotation}°
          </div>

          <div className="flex flex-wrap gap-1 mt-3">
            <button
              type="button"
              onClick={onRotateCounterClockwise}
              title="左回転（-90°）"
              className="rounded border border-neutral-300 dark:border-neutral-600 px-3 py-1.5 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              ↺ 左回転
            </button>
            <button
              type="button"
              onClick={onRotateClockwise}
              title="右回転（+90°）"
              className="rounded border border-neutral-300 dark:border-neutral-600 px-3 py-1.5 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              ↻ 右回転
            </button>

            <button
              type="button"
              onClick={onMoveUp}
              disabled={index === 0}
              aria-label="Move page up"
              className="rounded border border-neutral-300 dark:border-neutral-600 px-3 py-1.5 text-sm disabled:opacity-50"
            >
              ↑ 上へ
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={index === totalPages - 1}
              aria-label="Move page down"
              className="rounded border border-neutral-300 dark:border-neutral-600 px-3 py-1.5 text-sm disabled:opacity-50"
            >
              ↓ 下へ
            </button>
            <button
              type="button"
              onClick={onDelete}
              aria-label="Delete page"
              className="rounded border border-red-300 dark:border-red-600 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              削除
            </button>
          </div>
        </div>
      </li>
    );
  },
);

PageItem.displayName = "PageItem";

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedPages, setSelectedPages] = useState<SelectedPage[]>([]);
  const selectedPagesRef = useRef<SelectedPage[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [mergedUrl, setMergedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const dragCounterRef = useRef(0);

  useEffect(() => {
    selectedPagesRef.current = selectedPages;
  }, [selectedPages]);

  useEffect(() => {
    return () => {
      if (mergedUrl) URL.revokeObjectURL(mergedUrl);
    };
  }, [mergedUrl]);

  async function handleMerge() {
    if (selectedPages.length < 2) {
      setError("2つ以上のページを選択してください。");
      return;
    }

    setIsMerging(true);
    setError(null);
    setMergedUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });

    try {
      const { PDFDocument } = await import("pdf-lib");

      const mergedPdf = await PDFDocument.create();

      for (const page of selectedPages) {
        const doc = await PDFDocument.load(page.pdfBytes);
        const copiedPages = await mergedPdf.copyPages(doc, [0]);
        const copiedPage = copiedPages[0];
        if (page.rotation !== 0) {
          const { degrees } = await import("pdf-lib");
          const rotationMap: Record<number, number> = {
            0: 0,
            90: 90,
            180: 180,
            270: 270,
          };
          copiedPage.setRotation(degrees(rotationMap[page.rotation] || 0));
        }
        mergedPdf.addPage(copiedPage);
      }

      const mergedBytes = await mergedPdf.save();
      const arrayBuffer = mergedBytes.buffer.slice(
        mergedBytes.byteOffset,
        mergedBytes.byteOffset + mergedBytes.byteLength,
      ) as ArrayBuffer;
      const blob = new Blob([arrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      setMergedUrl(url);
    } catch (err) {
      console.error(err);
      setError("PDFの結合に失敗しました。ファイルを確認してください。");
    } finally {
      setIsMerging(false);
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files) return;

    const nextFiles = Array.from(files);
    setSelectedPages([]);

    nextFiles.forEach((file) => {
      (async () => {
        try {
          const { PDFDocument } = await import("pdf-lib");
          const arrayBuffer = await file.arrayBuffer();
          const doc = await PDFDocument.load(arrayBuffer);
          const pageIndices = doc.getPageIndices();

          for (const pageIndex of pageIndices) {
            const singlePagePdf = await PDFDocument.create();
            const pages = await singlePagePdf.copyPages(doc, [pageIndex]);
            singlePagePdf.addPage(pages[0]);
            const pdfBytes = await singlePagePdf.save();

            const pageId = `${Date.now()}-${file.name}-${pageIndex}`;
            setSelectedPages((prev) => [
              ...prev,
              {
                id: pageId,
                pageIndex,
                sourceFileName: file.name,
                rotation: 0,
                pdfBytes,
              } as SelectedPage,
            ]);
          }
        } catch (err) {
          console.error(`Failed to process PDF ${file.name}:`, err);
          setError(`Failed to process ${file.name}`);
        }
      })();
    });

    setMergedUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });
    setError(null);
  }

  // ドラッグ＆ドロップのハンドラ（ドラッグ入れ子問題を dragCounter で安定化）
  function handleDrop(e: React.DragEvent<HTMLElement>) {
    e.preventDefault();
    e.stopPropagation();

    dragCounterRef.current = 0;
    setIsDragActive(false);

    const dt = e.dataTransfer;
    if (!dt) return;
    const files = Array.from(dt.files).filter(
      (f) => f.type === "application/pdf",
    );
    if (files.length === 0) return;

    setSelectedPages([]);

    files.forEach((file) => {
      (async () => {
        try {
          const { PDFDocument } = await import("pdf-lib");
          const arrayBuffer = await file.arrayBuffer();
          const doc = await PDFDocument.load(arrayBuffer);
          const pageIndices = doc.getPageIndices();

          for (const pageIndex of pageIndices) {
            const singlePagePdf = await PDFDocument.create();
            const pages = await singlePagePdf.copyPages(doc, [pageIndex]);
            singlePagePdf.addPage(pages[0]);
            const pdfBytes = await singlePagePdf.save();

            const pageId = `${Date.now()}-${file.name}-${pageIndex}`;
            setSelectedPages((prev) => [
              ...prev,
              {
                id: pageId,
                pageIndex,
                sourceFileName: file.name,
                rotation: 0,
                pdfBytes,
              } as SelectedPage,
            ]);
          }
        } catch (err) {
          console.error(`Failed to process PDF ${file.name}:`, err);
          setError(`Failed to process ${file.name}`);
        }
      })();
    });

    setMergedUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });
    setError(null);
  }

  function moveUpPage(index: number) {
    if (index <= 0) return;
    setSelectedPages((prev) => {
      const next = prev.slice();
      const tmp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = tmp;
      return next;
    });
  }

  function moveDownPage(index: number) {
    setSelectedPages((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = prev.slice();
      const tmp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = tmp;
      return next;
    });
  }

  function deletePageAtIndex(index: number) {
    setSelectedPages((prev) => prev.filter((_, i) => i !== index));
  }

  function rotatePageClockwise(index: number) {
    setSelectedPages((prev) => {
      const next = prev.slice();
      next[index] = {
        ...next[index],
        rotation: (next[index].rotation + 90) % 360,
      };
      return next;
    });
  }

  function rotatePageCounterClockwise(index: number) {
    setSelectedPages((prev) => {
      const next = prev.slice();
      next[index] = {
        ...next[index],
        rotation: (next[index].rotation - 90 + 360) % 360,
      };
      return next;
    });
  }

  function handleDragOver(e: React.DragEvent<HTMLElement>) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }

  function handleDragEnter(e: React.DragEvent<HTMLElement>) {
    e.preventDefault();
    dragCounterRef.current += 1;
    if (dragCounterRef.current > 0) setIsDragActive(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLElement>) {
    e.preventDefault();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragActive(false);
    }
  }

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <h1 className="text-xl sm:text-2xl font-bold">PDFファイル結合ツール</h1>
        <p className="text-sm text-center sm:text-left text-neutral-600 dark:text-neutral-300">
          複数のPDFファイルを選択して結合し、1つのPDFとしてダウンロードできます。
        </p>

        <form
          onSubmit={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          className={`flex w-full max-w-xl flex-col gap-3 rounded-lg border p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/40 ${
            isDragActive
              ? "border-4 border-dashed border-blue-500 bg-blue-50/30 dark:bg-blue-900/30"
              : "border-neutral-200 bg-white/10"
          }`}
          style={{ position: "relative" }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            multiple
            onChange={handleFileChange}
            className="w-full cursor-pointer rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700"
          />
          <button
            type="button"
            onClick={handleMerge}
            disabled={isMerging || selectedPages.length < 2}
            className="flex h-11 items-center justify-center rounded bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isMerging ? "結合中..." : "PDFを結合する"}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}

          {/* ドラッグ中に表示される強調オーバーレイ（pointer-events-none にして drop を下のフォームで受ける） */}
          {isDragActive && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg pointer-events-none">
              <div className="flex flex-col items-center gap-2 rounded-lg bg-blue-600/85 px-6 py-5 text-center text-white shadow-lg">
                <div className="text-2xl font-semibold">
                  ここに PDF をドロップ
                </div>
                <div className="text-sm opacity-90">
                  複数の PDF を一度にドロップできます
                </div>
              </div>
            </div>
          )}
        </form>

        {mergedUrl && (
          <section className="w-full max-w-4xl rounded-lg border border-green-500/60 bg-green-50 p-4 text-sm dark:border-green-400/50 dark:bg-green-900/20">
            <h2 className="mb-3 text-base font-semibold text-green-700 dark:text-green-300">
              結合が完了しました
            </h2>
            <a
              href={mergedUrl}
              download="merged.pdf"
              className="text-sm font-semibold text-blue-600 underline underline-offset-2 hover:text-blue-500"
            >
              結合されたPDFをダウンロード
            </a>
            <iframe
              src={mergedUrl}
              title="Merged PDF Preview"
              className="mt-3 h-72 w-full rounded border border-neutral-200 dark:border-neutral-800"
            />
          </section>
        )}

        {selectedPages.length > 0 && (
          <section className="w-full max-w-4xl rounded-lg border border-dashed border-neutral-300 p-4 text-sm dark:border-neutral-700">
            <h2 className="mb-3 text-base font-semibold">
              選択中のページ ({selectedPages.length}ページ)
            </h2>
            <ul className="space-y-3">
              {selectedPages.map((page, index) => (
                <PageItem
                  key={page.id}
                  page={page}
                  index={index}
                  totalPages={selectedPages.length}
                  onRotateClockwise={() => rotatePageClockwise(index)}
                  onRotateCounterClockwise={() =>
                    rotatePageCounterClockwise(index)
                  }
                  onMoveUp={() => moveUpPage(index)}
                  onMoveDown={() => moveDownPage(index)}
                  onDelete={() => deletePageAtIndex(index)}
                />
              ))}
            </ul>
          </section>
        )}
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <span className="text-sm text-neutral-500">© PDF結合ツール</span>
      </footer>
    </div>
  );
}
