"use client";

import { memo, useEffect, useRef, useState } from "react";

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
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const lastUrlRef = useRef<string | null>(null);

    // biome-ignore lint/correctness/useExhaustiveDependencies: page.id is intentionally included to refresh preview when page identity changes
    useEffect(() => {
      const arrayBuffer = page.pdfBytes.buffer.slice(
        page.pdfBytes.byteOffset,
        page.pdfBytes.byteOffset + page.pdfBytes.byteLength,
      );
      const blob = new Blob([arrayBuffer as ArrayBuffer], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);
      // store and expose
      lastUrlRef.current = url;
      setPreviewUrl(url);

      return () => {
        if (lastUrlRef.current) {
          try {
            URL.revokeObjectURL(lastUrlRef.current);
          } catch {
            // ignore
          }
          lastUrlRef.current = null;
        }
        setPreviewUrl(null);
      };
    }, [page.id, page.pdfBytes.byteOffset, page.pdfBytes.byteLength]);

    return (
      <li className="card-shadow flex items-start gap-4 rounded-[10px] bg-white p-4 transition-shadow">
        <div className="w-48 h-64 flex-shrink-0 rounded-[10px] border border-neutral-200 bg-neutral-100 flex items-center justify-center overflow-hidden">
          <iframe
            src={previewUrl || undefined}
            title={`Page ${index + 1} preview`}
            className="w-full h-full"
            style={{
              transform: `rotate(${page.rotation}deg)`,
              transformOrigin: "center",
            }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-[16px] font-bold text-[#333333]">
            ページ {index + 1}
          </div>
          <div className="text-[14px] text-[#646464] mt-1">
            {page.sourceFileName}
          </div>
          <div className="text-[14px] text-[#909090] mt-0.5">
            元のページ: {page.pageIndex + 1} • 回転: {page.rotation}°
          </div>

          <div className="flex flex-wrap gap-1 mt-3">
            <button
              type="button"
              onClick={onRotateCounterClockwise}
              title="左回転（-90°）"
              className="rounded-[100px] border border-neutral-300 px-3 py-1.5 text-[14px] text-[#333333] hover:bg-neutral-100"
            >
              ↺ 左回転
            </button>
            <button
              type="button"
              onClick={onRotateClockwise}
              title="右回転（+90°）"
              className="rounded-[100px] border border-neutral-300 px-3 py-1.5 text-[14px] text-[#333333] hover:bg-neutral-100"
            >
              ↻ 右回転
            </button>

            <button
              type="button"
              onClick={onMoveUp}
              disabled={index === 0}
              aria-label="Move page up"
              className="rounded-[100px] border border-neutral-300 px-3 py-1.5 text-[14px] text-[#333333] disabled:opacity-50"
            >
              ↑ 上へ
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={index === totalPages - 1}
              aria-label="Move page down"
              className="rounded-[100px] border border-neutral-300 px-3 py-1.5 text-[14px] text-[#333333] disabled:opacity-50"
            >
              ↓ 下へ
            </button>
            <button
              type="button"
              onClick={onDelete}
              aria-label="Delete page"
              className="rounded-[100px] border border-red-300 px-3 py-1.5 text-[14px] text-red-600 hover:bg-red-50"
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
