import { NextRequest, NextResponse } from 'next/server';
import bwipjs from 'bwip-js';
import { BarcodeRequestSchema } from '@/lib/validation';
import { getBarcodeOptions } from '@/lib/barcode-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contents, symbology, quietZone, fontSize, offsetLeft, offsetMiddle, offsetRight, offsetBoxLeft, offsetBoxMiddle, offsetBoxRight } = BarcodeRequestSchema.parse(body);

    const options = getBarcodeOptions(symbology, quietZone);

    // bwip-js로 SVG 생성 (바코드만, 텍스트 제외)
    let svg = bwipjs.toSVG({
      ...options,
      text: contents,
      includetext: false,
    });

    // SVG에 명시적인 width와 height 추가
    svg = addSVGDimensions(svg);

    // EAN-13, EAN-8, UPC-A의 경우 표준 레이아웃으로 텍스트 + 흰색 박스 추가
    if (symbology === 'ean13' || symbology === 'ean8' || symbology === 'upca') {
      svg = addEANText(svg, contents, symbology, fontSize, offsetLeft, offsetMiddle, offsetRight, offsetBoxLeft, offsetBoxMiddle, offsetBoxRight);
    } else {
      // 다른 심볼로지는 중앙 하단에 텍스트 추가
      svg = addCenterText(svg, contents, fontSize);
    }

    const filename = `barcode_${symbology}_${contents}.ai`;

    // SVG를 .ai 확장자로 제공 (Illustrator가 SVG를 네이티브로 열 수 있음)
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Content-Disposition': `attachment; filename="${filename}"`,
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

function addSVGDimensions(svg: string): string {
  try {
    const viewBoxMatch = svg.match(/viewBox="([^"]+)"/);
    if (!viewBoxMatch) return svg;

    const viewBoxValues = viewBoxMatch[1].split(' ');
    const width = parseFloat(viewBoxValues[2]);
    const height = parseFloat(viewBoxValues[3]);

    // width와 height 속성 추가
    if (!svg.match(/width="/)) {
      svg = svg.replace(/<svg /, `<svg width="${width}" height="${height}" `);
    } else if (!svg.match(/height="/)) {
      svg = svg.replace(/<svg /, `<svg height="${height}" `);
    }

    return svg;
  } catch (error) {
    console.error('Error adding SVG dimensions:', error);
    return svg;
  }
}

function addEANText(svg: string, text: string, symbology: string, fontSize: number = 16, offsetLeft: number = 0, offsetMiddle: number = 0, offsetRight: number = 0, offsetBoxLeft: number = 0, offsetBoxMiddle: number = 0, offsetBoxRight: number = 0): string {
  try {
    const widthMatch = svg.match(/width="([^"]+)"/);
    const heightMatch = svg.match(/height="([^"]+)"/);
    const viewBoxMatch = svg.match(/viewBox="([^"]+)"/);
    
    if (!widthMatch || !heightMatch || !viewBoxMatch) {
      return svg;
    }

    const width = parseFloat(widthMatch[1]);
    const height = parseFloat(heightMatch[1]);
    const viewBoxValues = viewBoxMatch[1].split(' ');
    const vbWidth = parseFloat(viewBoxValues[2]);
    const vbHeight = parseFloat(viewBoxValues[3]);

    let elements = '';
    const textY = vbHeight - 2;
    const paddingX = 5;
    const paddingY = 0;
    
    const newHeight = vbHeight + 10;

    if (symbology === 'ean13') {
      const firstDigit = text[0];
      const leftGroup = text.substring(1, 7);
      const rightGroup = text.substring(7, 13);

      const charSpacing = vbWidth * 0.051;
      
      const firstDigitX = vbWidth * 0.06 + (-16) + offsetLeft;
      const firstDigitWidth = (fontSize - 1) * 0.6;
      const firstDigitBoxX = firstDigitX - paddingX + offsetBoxLeft;
      const firstDigitBoxY = textY - fontSize - paddingY;
      const firstDigitBoxWidth = firstDigitWidth + paddingX * 2;
      const firstDigitBoxHeight = fontSize + paddingY * 2;
      
      elements += `<rect x="${firstDigitBoxX}" y="${firstDigitBoxY}" width="${firstDigitBoxWidth}" height="${firstDigitBoxHeight}" fill="white" stroke="none"/>`;
      elements += `<text x="${firstDigitX}" y="${textY}" font-family="OCR-B, OCRB, 'OCR B', monospace" font-size="${fontSize - 1}" text-anchor="start" fill="#000000">${firstDigit}</text>`;

      const leftGroupStartX = vbWidth * 0.165 + 3.5 + offsetMiddle;
      const leftGroupBoxWidth = 120;
      const leftGroupBoxHeight = 20;
      const leftGroupBoxX = leftGroupStartX - leftGroupBoxWidth / 2 + 44 + offsetBoxMiddle;
      const leftGroupBoxY = textY - 27;
      
      elements += `<rect x="${leftGroupBoxX}" y="${leftGroupBoxY}" width="${leftGroupBoxWidth}" height="${leftGroupBoxHeight}" fill="white" stroke="none"/>`;
      
      for (let i = 0; i < leftGroup.length; i++) {
        elements += `<text x="${leftGroupStartX + i * charSpacing}" y="${textY}" font-family="OCR-B, OCRB, 'OCR B', monospace" font-size="${fontSize}" text-anchor="middle" fill="#000000">${leftGroup[i]}</text>`;
      }

      const rightGroupStartX = vbWidth * 0.545 + 5 + offsetRight;
      const rightGroupBoxWidth = 120;
      const rightGroupBoxHeight = 20;
      const rightGroupBoxX = rightGroupStartX - rightGroupBoxWidth / 2 + 43.5 + offsetBoxRight;
      const rightGroupBoxY = textY - 27;
      
      elements += `<rect x="${rightGroupBoxX}" y="${rightGroupBoxY}" width="${rightGroupBoxWidth}" height="${rightGroupBoxHeight}" fill="white" stroke="none"/>`;
      
      for (let i = 0; i < rightGroup.length; i++) {
        elements += `<text x="${rightGroupStartX + i * charSpacing}" y="${textY}" font-family="OCR-B, OCRB, 'OCR B', monospace" font-size="${fontSize}" text-anchor="middle" fill="#000000">${rightGroup[i]}</text>`;
      }
    }

    let modifiedSvg = svg.replace(
      /viewBox="([^"]+)"/,
      `viewBox="${viewBoxValues[0]} ${viewBoxValues[1]} ${vbWidth} ${newHeight}"`
    );
    modifiedSvg = modifiedSvg.replace(
      /height="[^"]+"/,
      `height="${newHeight}"`
    );
    modifiedSvg = modifiedSvg.replace('</svg>', `${elements}\n</svg>`);
    return modifiedSvg;
  } catch (error) {
    console.error('Error adding EAN text:', error);
    return svg;
  }
}

function addCenterText(svg: string, text: string, fontSize: number = 16): string {
  try {
    const widthMatch = svg.match(/width="([^"]+)"/);
    const heightMatch = svg.match(/height="([^"]+)"/);
    const viewBoxMatch = svg.match(/viewBox="([^"]+)"/);
    
    if (!widthMatch || !heightMatch || !viewBoxMatch) {
      return svg;
    }

    const viewBoxValues = viewBoxMatch[1].split(' ');
    const vbWidth = parseFloat(viewBoxValues[2]);
    const vbHeight = parseFloat(viewBoxValues[3]);

    const textY = vbHeight - 2;
    const textX = vbWidth / 2;
    const newHeight = vbHeight + 10;

    const textElement = `
  <text x="${textX}" y="${textY}" font-family="OCR-B, OCRB, 'OCR B', monospace" font-size="${fontSize}" text-anchor="middle" fill="#000000">${text}</text>`;

    let modifiedSvg = svg.replace(
      /viewBox="([^"]+)"/,
      `viewBox="${viewBoxValues[0]} ${viewBoxValues[1]} ${vbWidth} ${newHeight}"`
    );
    modifiedSvg = modifiedSvg.replace(
      /height="[^"]+"/,
      `height="${newHeight}"`
    );
    modifiedSvg = modifiedSvg.replace('</svg>', `${textElement}\n</svg>`);
    return modifiedSvg;
  } catch (error) {
    console.error('Error adding center text:', error);
    return svg;
  }
}

