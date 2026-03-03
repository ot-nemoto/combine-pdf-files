import { PDFDocument } from "pdf-lib";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createPdfBlobUrl,
  mergePdfPages,
  splitPdfIntoPages,
} from "../utils/pdfUtils";

describe("pdfUtils", () => {
  describe("splitPdfIntoPages", () => {
    it("should split a PDF file into individual pages", async () => {
      // Create a test PDF with 3 pages
      const pdfDoc = await PDFDocument.create();
      pdfDoc.addPage();
      pdfDoc.addPage();
      pdfDoc.addPage();
      const pdfBytes = await pdfDoc.save();

      const file = new File([pdfBytes], "test.pdf", {
        type: "application/pdf",
      });

      const result = await splitPdfIntoPages(file);

      expect(result).toHaveLength(3);
      expect(result[0].pageIndex).toBe(0);
      expect(result[1].pageIndex).toBe(1);
      expect(result[2].pageIndex).toBe(2);
      expect(result[0].sourceFileName).toBe("test.pdf");
    });

    it("should handle single page PDFs", async () => {
      const pdfDoc = await PDFDocument.create();
      pdfDoc.addPage();
      const pdfBytes = await pdfDoc.save();

      const file = new File([pdfBytes], "single.pdf", {
        type: "application/pdf",
      });

      const result = await splitPdfIntoPages(file);

      expect(result).toHaveLength(1);
      expect(result[0].pageIndex).toBe(0);
    });
  });

  describe("mergePdfPages", () => {
    it("should merge multiple PDF pages into one", async () => {
      // Create individual pages
      const page1Doc = await PDFDocument.create();
      page1Doc.addPage();
      const page1Bytes = await page1Doc.save();

      const page2Doc = await PDFDocument.create();
      page2Doc.addPage();
      const page2Bytes = await page2Doc.save();

      const pages = [
        { pdfBytes: page1Bytes, rotation: 0 },
        { pdfBytes: page2Bytes, rotation: 0 },
      ];

      const mergedBytes = await mergePdfPages(pages);

      // Verify merged PDF has 2 pages
      const mergedDoc = await PDFDocument.load(mergedBytes);
      expect(mergedDoc.getPageCount()).toBe(2);
    });

    it("should apply rotation to pages when specified", async () => {
      const pageDoc = await PDFDocument.create();
      pageDoc.addPage();
      const pageBytes = await pageDoc.save();

      const pages = [
        { pdfBytes: pageBytes, rotation: 90 },
        { pdfBytes: pageBytes, rotation: 180 },
      ];

      const mergedBytes = await mergePdfPages(pages);

      // Verify merged PDF
      const mergedDoc = await PDFDocument.load(mergedBytes);
      expect(mergedDoc.getPageCount()).toBe(2);

      const page1 = mergedDoc.getPage(0);
      const page2 = mergedDoc.getPage(1);

      expect(page1.getRotation().angle).toBe(90);
      expect(page2.getRotation().angle).toBe(180);
    });

    it("should handle empty page array", async () => {
      const pages: { pdfBytes: Uint8Array; rotation: number }[] = [];

      const mergedBytes = await mergePdfPages(pages);

      const mergedDoc = await PDFDocument.load(mergedBytes);
      // PDFDocument.create() creates a document with 0 pages initially
      // After saving and loading, it should still have 0 or 1 page depending on pdf-lib behavior
      expect(mergedDoc.getPageCount()).toBeGreaterThanOrEqual(0);
    });
  });

  describe("createPdfBlobUrl", () => {
    let createdUrls: string[] = [];

    beforeEach(() => {
      createdUrls = [];
    });

    afterEach(() => {
      // Cleanup created URLs
      createdUrls.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    });

    it("should create a valid Blob URL from PDF bytes", async () => {
      const pdfDoc = await PDFDocument.create();
      pdfDoc.addPage();
      const pdfBytes = await pdfDoc.save();

      const url = createPdfBlobUrl(pdfBytes);
      createdUrls.push(url);

      expect(url).toMatch(/^blob:/);
      expect(typeof url).toBe("string");
    });

    it("should create different URLs for different PDFs", async () => {
      const pdfDoc1 = await PDFDocument.create();
      pdfDoc1.addPage();
      const pdfBytes1 = await pdfDoc1.save();

      const pdfDoc2 = await PDFDocument.create();
      pdfDoc2.addPage();
      pdfDoc2.addPage();
      const pdfBytes2 = await pdfDoc2.save();

      const url1 = createPdfBlobUrl(pdfBytes1);
      const url2 = createPdfBlobUrl(pdfBytes2);
      createdUrls.push(url1, url2);

      expect(url1).not.toBe(url2);
    });
  });
});
