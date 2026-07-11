import { act, renderHook, waitFor } from "@testing-library/react";
import { PDFDocument } from "pdf-lib";
import { describe, expect, it, type MockInstance, vi } from "vitest";
import { usePdfPages } from "./usePdfPages";
import * as pdfUtils from "../utils/pdfUtils";

describe("usePdfPages", () => {
  // フックが初期化時に空の状態で開始することを確認
  it("should initialize with empty state", () => {
    const { result } = renderHook(() => usePdfPages());

    expect(result.current.selectedPages).toEqual([]);
    expect(result.current.isMerging).toBe(false);
    expect(result.current.mergedUrl).toBeNull();
    expect(result.current.error).toBeNull();
  });

  describe("addPagesFromFiles", () => {
    // PDFファイルからページを追加する機能をテスト
    it("should add pages from PDF files", async () => {
      const { result } = renderHook(() => usePdfPages());

      // Create a test PDF
      const pdfDoc = await PDFDocument.create();
      pdfDoc.addPage();
      pdfDoc.addPage();
      const pdfBytes = await pdfDoc.save();

      const file = new File([pdfBytes as BlobPart], "test.pdf", {
        type: "application/pdf",
      });

      act(() => {
        result.current.addPagesFromFiles([file]);
      });

      // Wait for async processing
      await waitFor(
        () => {
          expect(result.current.selectedPages.length).toBe(2);
        },
        { timeout: 3000 },
      );

      expect(result.current.selectedPages[0].sourceFileName).toBe("test.pdf");
      expect(result.current.selectedPages[0].rotation).toBe(0);
    });

    it("should set error when file processing fails", async () => {
      const spy: MockInstance = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const { result } = renderHook(() => usePdfPages());

      const corruptedData = new Uint8Array([0, 1, 2, 3]);
      const file = new File([corruptedData as BlobPart], "corrupted.pdf", {
        type: "application/pdf",
      });

      act(() => {
        result.current.addPagesFromFiles([file]);
      });

      await waitFor(
        () => {
          expect(result.current.error).toBe("Failed to process corrupted.pdf");
        },
        { timeout: 3000 },
      );

      expect(result.current.selectedPages).toEqual([]);
      spy.mockRestore();
    });

    it("should accumulate pages when called multiple times", async () => {
      const { result } = renderHook(() => usePdfPages());

      const pdfDoc1 = await PDFDocument.create();
      pdfDoc1.addPage();
      const pdfBytes1 = await pdfDoc1.save();
      const file1 = new File([pdfBytes1 as BlobPart], "first.pdf", {
        type: "application/pdf",
      });

      act(() => {
        result.current.addPagesFromFiles([file1]);
      });

      await waitFor(
        () => {
          expect(result.current.selectedPages.length).toBe(1);
        },
        { timeout: 3000 },
      );

      const pdfDoc2 = await PDFDocument.create();
      pdfDoc2.addPage();
      pdfDoc2.addPage();
      const pdfBytes2 = await pdfDoc2.save();
      const file2 = new File([pdfBytes2 as BlobPart], "second.pdf", {
        type: "application/pdf",
      });

      act(() => {
        result.current.addPagesFromFiles([file2]);
      });

      await waitFor(
        () => {
          expect(result.current.selectedPages.length).toBe(3);
        },
        { timeout: 3000 },
      );

      expect(result.current.selectedPages[0].sourceFileName).toBe("first.pdf");
      expect(result.current.selectedPages[1].sourceFileName).toBe("second.pdf");
      expect(result.current.selectedPages[2].sourceFileName).toBe("second.pdf");
    });

    it("should clear mergedUrl when adding new files", async () => {
      const { result } = renderHook(() => usePdfPages());

      const pdfDoc = await PDFDocument.create();
      pdfDoc.addPage();
      pdfDoc.addPage();
      const pdfBytes = await pdfDoc.save();
      const file = new File([pdfBytes as BlobPart], "test.pdf", {
        type: "application/pdf",
      });

      act(() => {
        result.current.addPagesFromFiles([file]);
      });

      await waitFor(
        () => {
          expect(result.current.selectedPages.length).toBe(2);
        },
        { timeout: 3000 },
      );

      await act(async () => {
        await result.current.mergePages();
      });

      expect(result.current.mergedUrl).not.toBeNull();

      const file2 = new File([pdfBytes as BlobPart], "another.pdf", {
        type: "application/pdf",
      });

      act(() => {
        result.current.addPagesFromFiles([file2]);
      });

      expect(result.current.mergedUrl).toBeNull();
    });
  });

  describe("page operations", () => {
    // ページの上下移動、削除、回転などの操作をテスト
    it("should move page up", async () => {
      const { result } = renderHook(() => usePdfPages());

      // Create test pages
      const pdfDoc = await PDFDocument.create();
      pdfDoc.addPage();
      pdfDoc.addPage();
      const pdfBytes = await pdfDoc.save();

      const file = new File([pdfBytes as BlobPart], "test.pdf", {
        type: "application/pdf",
      });

      act(() => {
        result.current.addPagesFromFiles([file]);
      });

      await waitFor(() => {
        expect(result.current.selectedPages.length).toBe(2);
      });

      const firstPageId = result.current.selectedPages[0].id;
      const secondPageId = result.current.selectedPages[1].id;

      act(() => {
        result.current.movePageUp(1);
      });

      expect(result.current.selectedPages[0].id).toBe(secondPageId);
      expect(result.current.selectedPages[1].id).toBe(firstPageId);
    });

    // ページを下へ移動する操作が正しく機能することを確認
    it("should move page down", async () => {
      const { result } = renderHook(() => usePdfPages());

      const pdfDoc = await PDFDocument.create();
      pdfDoc.addPage();
      pdfDoc.addPage();
      const pdfBytes = await pdfDoc.save();

      const file = new File([pdfBytes as BlobPart], "test.pdf", {
        type: "application/pdf",
      });

      act(() => {
        result.current.addPagesFromFiles([file]);
      });

      await waitFor(() => {
        expect(result.current.selectedPages.length).toBe(2);
      });

      const firstPageId = result.current.selectedPages[0].id;
      const secondPageId = result.current.selectedPages[1].id;

      act(() => {
        result.current.movePageDown(0);
      });

      expect(result.current.selectedPages[0].id).toBe(secondPageId);
      expect(result.current.selectedPages[1].id).toBe(firstPageId);
    });

    // ページを削除する操作が正しく機能することを確認
    it("should delete page", async () => {
      const { result } = renderHook(() => usePdfPages());

      const pdfDoc = await PDFDocument.create();
      pdfDoc.addPage();
      pdfDoc.addPage();
      const pdfBytes = await pdfDoc.save();

      const file = new File([pdfBytes as BlobPart], "test.pdf", {
        type: "application/pdf",
      });

      act(() => {
        result.current.addPagesFromFiles([file]);
      });

      await waitFor(() => {
        expect(result.current.selectedPages.length).toBe(2);
      });

      act(() => {
        result.current.deletePage(0);
      });

      expect(result.current.selectedPages.length).toBe(1);
    });

    // ページを時計回りに回転させる操作が正しく機能することを確認（90°ずつ回転）
    it("should rotate page clockwise", async () => {
      const { result } = renderHook(() => usePdfPages());

      const pdfDoc = await PDFDocument.create();
      pdfDoc.addPage();
      const pdfBytes = await pdfDoc.save();

      const file = new File([pdfBytes as BlobPart], "test.pdf", {
        type: "application/pdf",
      });

      act(() => {
        result.current.addPagesFromFiles([file]);
      });

      await waitFor(() => {
        expect(result.current.selectedPages.length).toBe(1);
      });

      expect(result.current.selectedPages[0].rotation).toBe(0);

      act(() => {
        result.current.rotatePageClockwise(0);
      });

      expect(result.current.selectedPages[0].rotation).toBe(90);

      act(() => {
        result.current.rotatePageClockwise(0);
      });

      expect(result.current.selectedPages[0].rotation).toBe(180);
    });

    it("should not change order when moving first page up", async () => {
      const { result } = renderHook(() => usePdfPages());

      const pdfDoc = await PDFDocument.create();
      pdfDoc.addPage();
      pdfDoc.addPage();
      const pdfBytes = await pdfDoc.save();

      const file = new File([pdfBytes as BlobPart], "test.pdf", {
        type: "application/pdf",
      });

      act(() => {
        result.current.addPagesFromFiles([file]);
      });

      await waitFor(() => {
        expect(result.current.selectedPages.length).toBe(2);
      });

      const firstPageId = result.current.selectedPages[0].id;
      const secondPageId = result.current.selectedPages[1].id;

      act(() => {
        result.current.movePageUp(0);
      });

      expect(result.current.selectedPages[0].id).toBe(firstPageId);
      expect(result.current.selectedPages[1].id).toBe(secondPageId);
    });

    it("should not change order when moving last page down", async () => {
      const { result } = renderHook(() => usePdfPages());

      const pdfDoc = await PDFDocument.create();
      pdfDoc.addPage();
      pdfDoc.addPage();
      const pdfBytes = await pdfDoc.save();

      const file = new File([pdfBytes as BlobPart], "test.pdf", {
        type: "application/pdf",
      });

      act(() => {
        result.current.addPagesFromFiles([file]);
      });

      await waitFor(() => {
        expect(result.current.selectedPages.length).toBe(2);
      });

      const firstPageId = result.current.selectedPages[0].id;
      const secondPageId = result.current.selectedPages[1].id;

      act(() => {
        result.current.movePageDown(1);
      });

      expect(result.current.selectedPages[0].id).toBe(firstPageId);
      expect(result.current.selectedPages[1].id).toBe(secondPageId);
    });

    // ページを反時計回りに回転させる操作が正しく機能することを確認
    it("should rotate page counter-clockwise", async () => {
      const { result } = renderHook(() => usePdfPages());

      const pdfDoc = await PDFDocument.create();
      pdfDoc.addPage();
      const pdfBytes = await pdfDoc.save();

      const file = new File([pdfBytes as BlobPart], "test.pdf", {
        type: "application/pdf",
      });

      act(() => {
        result.current.addPagesFromFiles([file]);
      });

      await waitFor(() => {
        expect(result.current.selectedPages.length).toBe(1);
      });

      act(() => {
        result.current.rotatePageCounterClockwise(0);
      });

      expect(result.current.selectedPages[0].rotation).toBe(270);
    });

    it("should reorder page from one position to another", async () => {
      const { result } = renderHook(() => usePdfPages());

      const pdfDoc = await PDFDocument.create();
      pdfDoc.addPage();
      pdfDoc.addPage();
      pdfDoc.addPage();
      const pdfBytes = await pdfDoc.save();

      const file = new File([pdfBytes as BlobPart], "test.pdf", {
        type: "application/pdf",
      });

      act(() => {
        result.current.addPagesFromFiles([file]);
      });

      await waitFor(() => {
        expect(result.current.selectedPages.length).toBe(3);
      });

      const ids = result.current.selectedPages.map((p) => p.id);

      act(() => {
        result.current.reorderPage(0, 2);
      });

      expect(result.current.selectedPages[0].id).toBe(ids[1]);
      expect(result.current.selectedPages[1].id).toBe(ids[2]);
      expect(result.current.selectedPages[2].id).toBe(ids[0]);
    });

    it("should not reorder when fromIndex equals toIndex", async () => {
      const { result } = renderHook(() => usePdfPages());

      const pdfDoc = await PDFDocument.create();
      pdfDoc.addPage();
      pdfDoc.addPage();
      const pdfBytes = await pdfDoc.save();

      const file = new File([pdfBytes as BlobPart], "test.pdf", {
        type: "application/pdf",
      });

      act(() => {
        result.current.addPagesFromFiles([file]);
      });

      await waitFor(() => {
        expect(result.current.selectedPages.length).toBe(2);
      });

      const ids = result.current.selectedPages.map((p) => p.id);

      act(() => {
        result.current.reorderPage(0, 0);
      });

      expect(result.current.selectedPages[0].id).toBe(ids[0]);
      expect(result.current.selectedPages[1].id).toBe(ids[1]);
    });
  });

  describe("mergePages", () => {
    // 複数のページを1つのPDFにマージする機能をテスト
    it("should merge pages successfully", async () => {
      const { result } = renderHook(() => usePdfPages());

      const pdfDoc = await PDFDocument.create();
      pdfDoc.addPage();
      pdfDoc.addPage();
      const pdfBytes = await pdfDoc.save();

      const file = new File([pdfBytes as BlobPart], "test.pdf", {
        type: "application/pdf",
      });

      act(() => {
        result.current.addPagesFromFiles([file]);
      });

      await waitFor(() => {
        expect(result.current.selectedPages.length).toBe(2);
      });

      await act(async () => {
        await result.current.mergePages();
      });

      await waitFor(() => {
        expect(result.current.mergedUrl).not.toBeNull();
      });

      expect(result.current.mergedUrl).toMatch(/^blob:/);
      expect(result.current.isMerging).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should set error when merge processing fails", async () => {
      const consoleSpy: MockInstance = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const mergeSpy: MockInstance = vi
        .spyOn(pdfUtils, "mergePdfPages")
        .mockRejectedValue(new Error("merge failed"));
      const { result } = renderHook(() => usePdfPages());

      const pdfDoc = await PDFDocument.create();
      pdfDoc.addPage();
      pdfDoc.addPage();
      const pdfBytes = await pdfDoc.save();

      const file = new File([pdfBytes as BlobPart], "test.pdf", {
        type: "application/pdf",
      });

      act(() => {
        result.current.addPagesFromFiles([file]);
      });

      await waitFor(() => {
        expect(result.current.selectedPages.length).toBe(2);
      });

      await act(async () => {
        await result.current.mergePages();
      });

      expect(result.current.error).toBe(
        "PDFの結合に失敗しました。ファイルを確認してください。",
      );
      expect(result.current.mergedUrl).toBeNull();
      expect(result.current.isMerging).toBe(false);
      mergeSpy.mockRestore();
      consoleSpy.mockRestore();
    });

    // 2ページ未満の場合、マージ時にエラーが表示されることを確認
    it("should show error when less than 2 pages", async () => {
      const { result } = renderHook(() => usePdfPages());

      const pdfDoc = await PDFDocument.create();
      pdfDoc.addPage();
      const pdfBytes = await pdfDoc.save();

      const file = new File([pdfBytes as BlobPart], "test.pdf", {
        type: "application/pdf",
      });

      act(() => {
        result.current.addPagesFromFiles([file]);
      });

      await waitFor(() => {
        expect(result.current.selectedPages.length).toBe(1);
      });

      await act(async () => {
        await result.current.mergePages();
      });

      expect(result.current.error).toBe("2つ以上のページを選択してください。");
      expect(result.current.mergedUrl).toBeNull();
    });
  });
});
