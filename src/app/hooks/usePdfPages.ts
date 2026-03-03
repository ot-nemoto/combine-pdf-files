import { useCallback, useEffect, useRef, useState } from "react";
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
  const addRequestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      if (mergedUrl) URL.revokeObjectURL(mergedUrl);
    };
  }, [mergedUrl]);

  const addPagesFromFiles = useCallback((files: File[]) => {
    addRequestIdRef.current += 1;
    const requestId = addRequestIdRef.current;

    setSelectedPages([]);
    setError(null);
    setMergedUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });

    files.forEach((file) => {
      (async () => {
        try {
          const pages = await splitPdfIntoPages(file);
          if (requestId !== addRequestIdRef.current) return;

          setSelectedPages((prev) => [
            ...prev,
            ...pages.map((page, idx) => ({
              id: `${Date.now()}-${file.name}-${page.pageIndex}-${idx}`,
              pageIndex: page.pageIndex,
              sourceFileName: page.sourceFileName,
              rotation: 0,
              pdfBytes: page.pdfBytes,
            })),
          ]);
        } catch (err) {
          if (requestId !== addRequestIdRef.current) return;
          console.error(`Failed to process PDF ${file.name}:`, err);
          setError(`Failed to process ${file.name}`);
        }
      })();
    });
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

  const mergePages = useCallback(async () => {
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
    deletePage,
    rotatePageClockwise,
    rotatePageCounterClockwise,
    mergePages,
  };
}
