import { NextRequest, NextResponse } from 'next/server';
import bwipjs from 'bwip-js';
import { BarcodeRequestSchema } from '@/lib/validation';
import { getBarcodeOptions } from '@/lib/barcode-utils';
import { createCanvas, registerFont } from 'canvas';
import { jsPDF } from 'jspdf';
import * as fs from 'fs';
import * as path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contents, symbology, quietZone, fontSize, offsetLeft, offsetMiddle, offsetRight, offsetBoxLeft, offsetBoxMiddle, offsetBoxRight } = BarcodeRequestSchema.parse(body);

    const options = getBarcodeOptions(symbology, quietZone);

    // OCR-B 폰트 등록
    try {
      const fontPath = path.join(process.cwd(), 'public', 'fonts', 'ocrb', 'ocr-b-10-bt.ttf');
      if (fs.existsSync(fontPath)) {
        registerFont(fontPath, { family: 'OCR-B' });
      }
    } catch (fontError) {
      console.warn('Font registration failed, using fallback:', fontError);
    }

    // bwip-js로 PNG 생성 (바코드만)
    const barcodeBuffer = bwipjs.toBuffer({
      ...options,
      bcid: symbology,
      text: contents,
      scale: 3,
      height: 15,
      includetext: false,
    });

    // Canvas 생성
    const canvas = createCanvas(1200, 600);
    const ctx = canvas.getContext('2d');

    // 흰색 배경
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 바코드 이미지 로드
    const img = await loadImage(barcodeBuffer);
    const barcodeWidth = img.width;
    const barcodeHeight = img.height;
    
    // 바코드를 캔버스 중앙 상단에 배치
    const xOffset = (canvas.width - barcodeWidth) / 2;
    const yOffset = 50;
    ctx.drawImage(img, xOffset, yOffset);

    // 텍스트 추가 (EAN-13용)
    if (symbology === 'ean13' && contents.length >= 13) {
      ctx.font = `${fontSize}px OCR-B, monospace`;
      ctx.fillStyle = 'black';
      ctx.textAlign = 'center';

      const baseX = xOffset;
      const baseY = yOffset + barcodeHeight + fontSize / 2;
      
      // 첫 번째 숫자 (왼쪽 밖)
      const adjustedOffsetLeft = offsetLeft - 16;
      ctx.textAlign = 'start';
      ctx.fillText(contents[0], baseX + barcodeWidth * 0.06 + adjustedOffsetLeft, baseY);

      // 중간 6자리
      ctx.textAlign = 'center';
      const adjustedOffsetMiddle = offsetMiddle + 3.5;
      const leftGroupStart = baseX + barcodeWidth * 0.165 + adjustedOffsetMiddle;
      const charSpacing = barcodeWidth * 0.051;
      for (let i = 0; i < 6; i++) {
        ctx.fillText(contents[1 + i], leftGroupStart + i * charSpacing, baseY);
      }

      // 오른쪽 6자리
      const adjustedOffsetRight = offsetRight + 5;
      const rightGroupStart = baseX + barcodeWidth * 0.545 + adjustedOffsetRight;
      for (let i = 0; i < 6; i++) {
        ctx.fillText(contents[7 + i], rightGroupStart + i * charSpacing, baseY);
      }
    }

    // Canvas를 PNG로 변환
    const pngBuffer = canvas.toBuffer('image/png');

    // PDF 생성
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    // 이미지를 PDF에 추가 (A4 landscape에 맞게 조정)
    const pdfWidth = 297; // A4 landscape width in mm
    const pdfHeight = 210; // A4 landscape height in mm
    const imgWidth = 200; // 이미지 너비 (mm)
    const imgHeight = (imgWidth * canvas.height) / canvas.width; // 비율 유지
    
    const x = (pdfWidth - imgWidth) / 2;
    const y = (pdfHeight - imgHeight) / 2;

    pdf.addImage(pngBuffer, 'PNG', x, y, imgWidth, imgHeight);

    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));
    const filename = `barcode_${symbology}_${contents}.ai`;

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
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

// 이미지 로드 헬퍼 함수
async function loadImage(buffer: Buffer): Promise<any> {
  const { loadImage } = await import('canvas');
  return loadImage(buffer);
}
