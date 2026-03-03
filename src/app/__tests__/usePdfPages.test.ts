import { act, renderHook, waitFor } from "@testing-library/react";
import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { usePdfPages } from "../hooks/usePdfPages";

describe("usePdfPages", () => {
  it("should initialize with empty state", () => {
    const { result } = renderHook(() => usePdfPages());

    expect(result.current.selectedPages).toEqual([]);
    expect(result.current.isMerging).toBe(false);
    expect(result.current.mergedUrl).toBeNull();
    expect(result.current.error).toBeNull();
  });

  describe("addPagesFromFiles", () => {
    it("should add pages from PDF files", async () => {
      const { result } = renderHook(() => usePdfPages());

      // Create a test PDF
      const pdfDoc = await PDFDocument.create();
      pdfDoc.addPage();
      pdfDoc.addPage();
      const pdfBytes = await pdfDoc.save();

      const file = new File([pdfBytes], "test.pdf", {
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
    it("should move page up", async () => {
      const { result } = renderHook(() => usePdfPages());

      // Create test pages
      const pdfDoc = await PDFDocument.create();
      pdfDoc.addPage();
      pdfDoc.addPage();
      const pdfBytes = await pdfDoc.save();

      const file = new File([pdfBytes], "test.pdf", {
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

    it("should move page down", async () => {
      const { result } = renderHook(() => usePdfPages());

      const pdfDoc = await PDFDocument.create();
      pdfDoc.addPage();
      pdfDoc.addPage();
      const pdfBytes = await pdfDoc.save();

      const file = new File([pdfBytes], "test.pdf", {
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

    it("should delete page", async () => {
      const { result } = renderHook(() => usePdfPages());

      const pdfDoc = await PDFDocument.create();
      pdfDoc.addPage();
      pdfDoc.addPage();
      const pdfBytes = await pdfDoc.save();

      const file = new File([pdfBytes], "test.pdf", {
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

    it("should rotate page clockwise", async () => {
      const { result } = renderHook(() => usePdfPages());

      const pdfDoc = await PDFDocument.create();
      pdfDoc.addPage();
      const pdfBytes = await pdfDoc.save();

      const file = new File([pdfBytes], "test.pdf", {
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

    it("should rotate page counter-clockwise", async () => {
      const { result } = renderHook(() => usePdfPages());

      const pdfDoc = await PDFDocument.create();
      pdfDoc.addPage();
      const pdfBytes = await pdfDoc.save();

      const file = new File([pdfBytes], "test.pdf", {
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
    it("should merge pages successfully", async () => {
      const { result } = renderHook(() => usePdfPages());

      const pdfDoc = await PDFDocument.create();
      pdfDoc.addPage();
      pdfDoc.addPage();
      const pdfBytes = await pdfDoc.save();

      const file = new File([pdfBytes], "test.pdf", {
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

    it("should show error when less than 2 pages", async () => {
      const { result } = renderHook(() => usePdfPages());

      const pdfDoc = await PDFDocument.create();
      pdfDoc.addPage();
      const pdfBytes = await pdfDoc.save();

      const file = new File([pdfBytes], "test.pdf", {
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
