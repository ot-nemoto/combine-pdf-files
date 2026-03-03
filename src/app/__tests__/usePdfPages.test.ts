import { act, renderHook, waitFor } from "@testing-library/react";
import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { usePdfPages } from "../hooks/usePdfPages";

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
