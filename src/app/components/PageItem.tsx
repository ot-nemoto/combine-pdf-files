"use client";

import { memo, useEffect, useRef } from "react";

export type PageItemProps = {
  page: {
    id: string;
    pageIndex: number;
    sourceFileName: string;
    rotation: number;
    pdfBytes: Uint8Array;
  };
  index: number;
  totalPages: number;
  onRotateClockwise: () => void;
  onRotateCounterClockwise: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
};

export const PageItem = memo(
  ({
    page,
    index,
    totalPages,
    onRotateClockwise,
    onRotateCounterClockwise,
    onMoveUp,
    onMoveDown,
    onDelete,
  }: PageItemProps) => {
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
      <li className="flex items-start gap-4 rounded border border-neutral-200 p-4 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
        <div className="w-48 h-64 flex-shrink-0 rounded border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
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
