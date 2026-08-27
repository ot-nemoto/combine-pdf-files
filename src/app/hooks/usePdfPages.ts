import { useCallback, useEffect, useState } from "react";
import {
  createPdfBlobUrl,
  mergePdfPages,
  splitPdfIntoPages,
} from "../utils/pdfUtils";

export type SelectedPage = {
  id: string;
  pageIndex: number;
  sourceFileName: string;
  rotation: number;
  pdfBytes: Uint8Array;
};

export function usePdfPages() {
  const [selectedPages, setSelectedPages] = useState<SelectedPage[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [mergedUrl, setMergedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (mergedUrl) URL.revokeObjectURL(mergedUrl);
    };
  }, [mergedUrl]);

  const addPagesFromFiles = useCallback((files: File[]) => {
    setError(null);
    setMergedUrl(null);

    for (const file of files) {
      (async () => {
        try {
          const pages = await splitPdfIntoPages(file);

          setSelectedPages((prev) => [
            ...prev,
            ...pages.map((page) => ({
              id: crypto.randomUUID(),
              pageIndex: page.pageIndex,
              sourceFileName: page.sourceFileName,
              rotation: 0,
              pdfBytes: page.pdfBytes,
            })),
          ]);
        } catch (err) {
          console.error(`Failed to process PDF ${file.name}:`, err);
          setError(`Failed to process ${file.name}`);
        }
      })();
    }
  }, []);

  const movePageUp = useCallback((index: number) => {
    if (index <= 0) return;
    setSelectedPages((prev) => {
      const next = prev.slice();
      const tmp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = tmp;
      return next;
    });
  }, []);

  const movePageDown = useCallback((index: number) => {
    setSelectedPages((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = prev.slice();
      const tmp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = tmp;
      return next;
    });
  }, []);

  const reorderPage = useCallback((fromIndex: number, toIndex: number) => {
    setSelectedPages((prev) => {
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= prev.length ||
        toIndex >= prev.length
      ) {
        return prev;
      }
      const next = prev.slice();
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  const deletePage = useCallback((index: number) => {
    setSelectedPages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const rotatePageClockwise = useCallback((index: number) => {
    setSelectedPages((prev) => {
      const next = prev.slice();
      next[index] = {
        ...next[index],
        rotation: (next[index].rotation + 90) % 360,
      };
      return next;
    });
  }, []);

  const rotatePageCounterClockwise = useCallback((index: number) => {
    setSelectedPages((prev) => {
      const next = prev.slice();
      next[index] = {
        ...next[index],
        rotation: (next[index].rotation - 90 + 360) % 360,
      };
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    setSelectedPages([]);
    setMergedUrl(null);
    setError(null);
  }, []);

  const mergePages = useCallback(async () => {
    if (selectedPages.length < 2) {
      setError("2つ以上のページを選択してください。");
      return;
    }

    setIsMerging(true);
    setError(null);
    setMergedUrl(null);

    try {
      const mergedBytes = await mergePdfPages(
        selectedPages.map((page) => ({
          pdfBytes: page.pdfBytes,
          rotation: page.rotation,
        })),
      );

      const url = createPdfBlobUrl(mergedBytes);
      setMergedUrl(url);
    } catch (err) {
      console.error(err);
      setError("PDFの結合に失敗しました。ファイルを確認してください。");
    } finally {
      setIsMerging(false);
    }
  }, [selectedPages]);

  return {
    selectedPages,
    isMerging,
    mergedUrl,
    error,
    addPagesFromFiles,
    movePageUp,
    movePageDown,
    reorderPage,
    deletePage,
    rotatePageClockwise,
    rotatePageCounterClockwise,
    mergePages,
    resetAll,
  };
}
