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
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start w-full max-w-6xl">
        <div className="text-center sm:text-left">
          <h1 className="text-[30px] font-bold text-[#333333] leading-[1.6]">
            PDFファイル結合ツール
          </h1>
          <p className="mt-2 text-[18px] text-[#646464] leading-[1.6]">
            複数のPDFファイルを選択して結合し、1つのPDFとしてダウンロードできます。
          </p>
        </div>

        <form
          onSubmit={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          className={`relative flex w-full flex-col gap-3 rounded-[10px] border p-5 bg-white ${
            isDragActive
              ? "border-4 border-dashed border-[#ee1d23] bg-red-50/30"
              : "border-neutral-200"
          }`}
          style={{ boxShadow: "2px 2px 5px #cccccc" }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            multiple
            onChange={handleFileChange}
            className="w-full cursor-pointer rounded-[50px] border-none bg-[#e7e7e7] px-5 py-3 text-[16px]"
          />
          <button
            type="button"
            onClick={mergePages}
            disabled={isMerging || selectedPages.length < 2}
            className="flex h-11 items-center justify-center rounded-[100px] border border-[#ee1d23] bg-white px-[45px] py-[10px] text-[18px] font-bold text-[#ee1d23] transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isMerging ? "結合中..." : "PDFを結合する"}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}

          {isDragActive && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[10px] pointer-events-none">
              <div className="flex flex-col items-center gap-2 rounded-[10px] bg-[#ee1d23]/90 px-6 py-5 text-center text-white shadow-lg">
                <div className="text-2xl font-bold">ここに PDF をドロップ</div>
                <div className="text-sm opacity-90">
                  複数の PDF を一度にドロップできます
                </div>
              </div>
            </div>
          )}
        </form>

        {mergedUrl && (
          <section
            className="w-full rounded-[10px] border border-green-500/60 bg-green-50 p-5"
            style={{ boxShadow: "2px 2px 5px #cccccc" }}
          >
            <h2 className="mb-3 text-[18px] font-bold text-green-700">
              結合が完了しました
            </h2>
            <a
              href={mergedUrl}
              download="merged.pdf"
              className="text-[16px] font-bold text-[#ee1d23] underline underline-offset-2 hover:opacity-80"
            >
              結合されたPDFをダウンロード
            </a>
            <iframe
              src={mergedUrl}
              title="Merged PDF Preview"
              className="mt-3 h-72 w-full rounded-[10px] border border-neutral-200"
            />
          </section>
        )}

        {selectedPages.length > 0 && (
          <section className="w-full rounded-[10px] bg-[#f6f6f6] p-5">
            <h2 className="mb-3 text-[18px] font-bold text-[#333333]">
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
      <footer className="row-start-3" />
    </div>
  );
}
