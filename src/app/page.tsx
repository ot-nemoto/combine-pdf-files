"use client";

import type React from "react";
import { useRef, useState } from "react";
import { PageItem } from "./components/PageItem";
import { usePdfPages } from "./hooks/usePdfPages";

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const dragCounterRef = useRef(0);

  const {
    selectedPages,
    isMerging,
    mergedUrl,
    error,
    addPagesFromFiles,
    movePageUp,
    movePageDown,
    deletePage,
    rotatePageClockwise,
    rotatePageCounterClockwise,
    mergePages,
  } = usePdfPages();

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files) return;
    addPagesFromFiles(Array.from(files));
  }

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

    addPagesFromFiles(files);
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
            onClick={mergePages}
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
          <section className="w-full max-w-6xl rounded-lg border border-green-500/60 bg-green-50 p-4 text-sm dark:border-green-400/50 dark:bg-green-900/20">
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
          <section className="w-full max-w-6xl rounded-lg border border-dashed border-neutral-300 p-4 text-sm dark:border-neutral-700">
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
                  onMoveUp={() => movePageUp(index)}
                  onMoveDown={() => movePageDown(index)}
                  onDelete={() => deletePage(index)}
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
