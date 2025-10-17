"use client";

import { useEffect, useRef, useState } from "react";

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  type SelectedItem = { id: string; file: File; previewUrl: string };
  const [selectedFiles, setSelectedFiles] = useState<SelectedItem[]>([]);
  const selectedFilesRef = useRef<SelectedItem[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [mergedUrl, setMergedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const dragCounterRef = useRef(0);

  useEffect(() => {
    // keep a ref of current selectedFiles so the unmount cleanup can use it
    selectedFilesRef.current = selectedFiles;
  }, [selectedFiles]);

  useEffect(() => {
    // Revoke preview URLs only on unmount.
    // We already revoke replaced previews at the time we replace them in handlers.
    return () => {
      selectedFilesRef.current.forEach((item) => {
        try {
          URL.revokeObjectURL(item.previewUrl);
        } catch {}
      });
    };
  }, []);

  useEffect(() => {
    return () => {
      if (mergedUrl) URL.revokeObjectURL(mergedUrl);
    };
  }, [mergedUrl]);

  async function handleMerge() {
    if (selectedFiles.length < 2) {
      setError("2つ以上のPDFを選択してください。");
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

      const loadedDocs = await Promise.all(
        selectedFiles.map(async (item) => {
          const arrayBuffer = await item.file.arrayBuffer();
          return PDFDocument.load(arrayBuffer);
        }),
      );

      const mergedPdf = await PDFDocument.create();

      for (const doc of loadedDocs) {
        const copiedPages = await mergedPdf.copyPages(
          doc,
          doc.getPageIndices(),
        );
        copiedPages.forEach((page) => {
          mergedPdf.addPage(page);
        });
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

    // create SelectedItem array with stable ids and preview urls
    setSelectedFiles((prev) => {
      // revoke previous previews
      prev.forEach((p) => {
        try {
          URL.revokeObjectURL(p.previewUrl);
        } catch {}
      });
      const items = nextFiles.map((file, i) => ({
        id: `${Date.now()}-${i}`,
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      return items;
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

    setSelectedFiles((prev) => {
      prev.forEach((p) => {
        try {
          URL.revokeObjectURL(p.previewUrl);
        } catch {}
      });
      return files.map((file, i) => ({
        id: `${Date.now()}-${i}`,
        file,
        previewUrl: URL.createObjectURL(file),
      }));
    });
    setMergedUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });
    setError(null);
  }

  function moveUp(index: number) {
    if (index <= 0) return;
    setSelectedFiles((prev) => {
      const next = prev.slice();
      const tmp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = tmp;
      return next;
    });
  }

  function moveDown(index: number) {
    setSelectedFiles((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = prev.slice();
      const tmp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = tmp;
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
            disabled={isMerging || selectedFiles.length < 2}
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

        {selectedFiles.length > 0 && (
          <section className="w-full max-w-xl rounded-lg border border-dashed border-neutral-300 p-4 text-sm dark:border-neutral-700">
            <h2 className="mb-3 text-base font-semibold">選択中のPDF</h2>
            <ul className="space-y-2">
              {selectedFiles.map((item, index) => (
                <li key={item.id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{item.file.name}</span>
                      <div className="text-xs text-neutral-500">
                        {Math.round(item.file.size / 1024)} KB
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        aria-label={`Move ${item.file.name} up`}
                        className="rounded border px-2 py-1 text-sm disabled:opacity-50"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveDown(index)}
                        disabled={index === selectedFiles.length - 1}
                        aria-label={`Move ${item.file.name} down`}
                        className="rounded border px-2 py-1 text-sm disabled:opacity-50"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                  {item.previewUrl && (
                    <iframe
                      src={item.previewUrl}
                      title={`PDF preview ${index + 1}`}
                      className="h-48 w-full rounded border border-neutral-200 dark:border-neutral-800"
                    />
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {mergedUrl && (
          <section className="w-full max-w-xl rounded-lg border border-green-500/60 bg-green-50 p-4 text-sm dark:border-green-400/50 dark:bg-green-900/20">
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
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <span className="text-sm text-neutral-500">© PDF結合ツール</span>
      </footer>
    </div>
  );
}
