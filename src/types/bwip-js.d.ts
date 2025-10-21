declare module 'bwip-js' {
  export interface BwipOptions {
    bcid: string;
    text: string;
    scale?: number;
    height?: number;
    includetext?: boolean;
    textxalign?: string;
    textyoffset?: number;
    guardwhitespace?: boolean;
    [key: string]: any;
  }

  export function toSVG(options: BwipOptions): string;
  export function toBuffer(options: BwipOptions): Promise<Buffer>;
  export function toCanvas(canvas: any, options: BwipOptions): void;

  const bwipjs: {
    toSVG: typeof toSVG;
    toBuffer: typeof toBuffer;
    toCanvas: typeof toCanvas;
  };

  export default bwipjs;
}

