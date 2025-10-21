import { NextRequest, NextResponse } from 'next/server';
import bwipjs from 'bwip-js';
import PDFDocument from 'pdfkit';
import SVGtoPDF from 'svg-to-pdfkit';
import { BarcodeRequestSchema } from '@/lib/validation';
import { getBarcodeOptions } from '@/lib/barcode-utils';
import * as fs from 'fs';
import * as path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contents, symbology, quietZone } = BarcodeRequestSchema.parse(body);

    const options = getBarcodeOptions(symbology, quietZone);

    // bwip-js로 SVG 생성 (텍스트 없이)
    const svg = bwipjs.toSVG({
      ...options,
      text: contents,
    });

    // PDF 생성 (600x300 pt)
    const doc = new PDFDocument({
      size: [600, 300],
      margin: 0,
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    // SVG를 PDF에 삽입
    const svgElement = parseSVG(svg);
    if (svgElement) {
      // 중앙 배치 계산
      const barcodeWidth = svgElement.width || 400;
      const barcodeHeight = svgElement.height || 200;
      const x = (600 - barcodeWidth) / 2;
      const y = 50; // 상단에서 50pt

      SVGtoPDF(doc, svg, x, y, {
        width: barcodeWidth,
        height: barcodeHeight,
        preserveAspectRatio: 'xMidYMid meet',
      });
    }

    // Human-readable text 추가 (OCR-B 폰트)
    const fontPath = path.join(
      process.cwd(),
      'public',
      'fonts',
      'ocrb',
      'OCRB10BT.ttf'
    );

    let fontNotice = '';
    if (fs.existsSync(fontPath)) {
      doc.font(fontPath);
    } else {
      // 폰트 없으면 시스템 기본 폰트 사용
      doc.font('Courier');
      fontNotice = 'Missing OCRB font, using fallback';
    }

    doc.fontSize(14);

    // 텍스트 중앙 정렬 (letter-spacing 적용)
    const textWidth = doc.widthOfString(contents);
    const textX = (600 - textWidth) / 2;
    const textY = 250; // 하단에 배치

    // letter-spacing 시뮬레이션 (각 문자를 개별 렌더)
    const letterSpacing = -0.025; // -25/1000em
    let currentX = textX;

    for (let i = 0; i < contents.length; i++) {
      const char = contents[i];
      doc.text(char, currentX, textY, {
        lineBreak: false,
      });
      const charWidth = doc.widthOfString(char);
      currentX += charWidth + charWidth * letterSpacing;
    }

    doc.end();

    // PDF 버퍼 생성 대기
    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });

    const filename = `barcode_${symbology}_${contents}.ai`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    };

    if (fontNotice) {
      headers['X-Font-Notice'] = fontNotice;
    }

    return new NextResponse(new Uint8Array(pdfBuffer), { headers });
  } catch (error) {
    console.error('AI download error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'AI 파일 다운로드에 실패했습니다.',
      },
      { status: 400 }
    );
  }
}

function parseSVG(svg: string): { width?: number; height?: number } | null {
  const widthMatch = svg.match(/width="([^"]+)"/);
  const heightMatch = svg.match(/height="([^"]+)"/);

  if (!widthMatch || !heightMatch) return null;

  return {
    width: parseFloat(widthMatch[1]),
    height: parseFloat(heightMatch[1]),
  };
}

