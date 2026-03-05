import { degrees, PDFDocument } from "pdf-lib";

export type ProcessedPage = {
  pageIndex: number;
  sourceFileName: string;
  pdfBytes: Uint8Array;
};

/**
 * PDFファイルを個別のページに分割
 */
export async function splitPdfIntoPages(file: File): Promise<ProcessedPage[]> {
  const arrayBuffer = await file.arrayBuffer();
  const doc = await PDFDocument.load(arrayBuffer);
  const pageIndices = doc.getPageIndices();

  const pages: ProcessedPage[] = [];

  for (const pageIndex of pageIndices) {
    const singlePagePdf = await PDFDocument.create();
    const copiedPages = await singlePagePdf.copyPages(doc, [pageIndex]);
    singlePagePdf.addPage(copiedPages[0]);
    const pdfBytes = await singlePagePdf.save();

    pages.push({
      pageIndex,
      sourceFileName: file.name,
      pdfBytes,
    });
  }

  return pages;
}

/**
 * 複数のページを1つのPDFに結合
 */
export async function mergePdfPages(
  pages: { pdfBytes: Uint8Array; rotation: number }[],
): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const page of pages) {
    const doc = await PDFDocument.load(page.pdfBytes);
    const copiedPages = await mergedPdf.copyPages(doc, [0]);
    const copiedPage = copiedPages[0];

    if (page.rotation !== 0) {
      const rotationMap: Record<number, number> = {
        0: 0,
        90: 90,
        180: 180,
        270: 270,
      };
      copiedPage.setRotation(degrees(rotationMap[page.rotation] || 0));
    }

    mergedPdf.addPage(copiedPage);
  }

  return await mergedPdf.save();
}

/**
 * Uint8ArrayからBlob URLを生成
 */
export function createPdfBlobUrl(pdfBytes: Uint8Array): string {
  const arrayBuffer = pdfBytes.buffer.slice(
    pdfBytes.byteOffset,
    pdfBytes.byteOffset + pdfBytes.byteLength,
  ) as ArrayBuffer;
  const blob = new Blob([arrayBuffer], { type: "application/pdf" });
  return URL.createObjectURL(blob);
}
