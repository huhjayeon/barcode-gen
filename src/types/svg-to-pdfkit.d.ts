declare module 'svg-to-pdfkit' {
  import PDFDocument from 'pdfkit';

  function SVGtoPDF(
    doc: typeof PDFDocument.prototype,
    svg: string,
    x: number,
    y: number,
    options?: {
      width?: number;
      height?: number;
      preserveAspectRatio?: string;
      [key: string]: any;
    }
  ): void;

  export default SVGtoPDF;
}

