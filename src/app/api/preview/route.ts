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
      includetext: false, // 텍스트는 수동으로 추가
    });

    // SVG에 명시적인 width와 height 추가
    svg = addSVGDimensions(svg);
    
    // SVG에 폰트 스타일 추가
    svg = addFontStyle(svg);

    // EAN-13, EAN-8, UPC-A의 경우 표준 레이아웃으로 텍스트 + 흰색 박스 추가
    if (symbology === 'ean13' || symbology === 'ean8' || symbology === 'upca') {
      svg = addEANText(svg, contents, symbology, fontSize, offsetLeft, offsetMiddle, offsetRight, offsetBoxLeft, offsetBoxMiddle, offsetBoxRight);
    } else {
      // 다른 심볼로지는 중앙 하단에 텍스트 추가
      svg = addCenterText(svg, contents, fontSize);
    }

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
      },
    });
  } catch (error) {
    console.error('Preview error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : '바코드 생성에 실패했습니다.',
      },
      { status: 400 }
    );
  }
}

function addSVGDimensions(svg: string): string {
  try {
    // viewBox에서 크기 추출
    const viewBoxMatch = svg.match(/viewBox="([^"]+)"/);
    if (viewBoxMatch) {
      const viewBoxValues = viewBoxMatch[1].split(' ');
      const width = viewBoxValues[2];
      const height = viewBoxValues[3];
      
      // svg 태그에 width와 height 추가
      svg = svg.replace(
        /<svg /,
        `<svg width="${width}" height="${height}" `
      );
    }
    return svg;
  } catch (error) {
    console.error('Error adding SVG dimensions:', error);
    return svg;
  }
}

/**
 * SVG에 OCR-B 폰트 스타일 추가
 */
function addFontStyle(svg: string): string {
  try {
    const fontStyle = `
  <defs>
    <style type="text/css">
      @font-face {
        font-family: 'OCR-B';
        src: url('/fonts/ocrb/ocr-b-10-bt.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
      }
    </style>
  </defs>`;
    
    // <svg> 태그 직후에 스타일 삽입
    svg = svg.replace(/<svg ([^>]*)>/, `<svg $1>${fontStyle}`);
    return svg;
  } catch (error) {
    console.error('Error adding font style:', error);
    return svg;
  }
}

/**
 * EAN-13, EAN-8, UPC-A 표준 레이아웃으로 텍스트 + 흰색 박스 추가
 */
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

    let elements = ''; // 흰색 박스 + 텍스트
    const textY = vbHeight - 2; // 바코드와 겹치도록
    const paddingX = 5; // 박스 좌우 여백
    const paddingY = 0; // 박스 상하 여백
    
    // SVG 높이는 텍스트를 포함하도록 약간만 확장
    const newHeight = vbHeight + 10;

    if (symbology === 'ean13') {
      // EAN-13: 8 809560 223070 형식
      const firstDigit = text[0]; // 8
      const leftGroup = text.substring(1, 7); // 809560
      const rightGroup = text.substring(7, 13); // 223070

      const charSpacing = vbWidth * 0.051;
      
      // ===== 왼쪽 첫 번째 숫자 (1자리) =====
      const firstDigitX = vbWidth * 0.06 + (-16) + offsetLeft;
      const firstDigitWidth = (fontSize - 1) * 0.6; // 대략적인 문자 너비
      const firstDigitBoxX = firstDigitX - paddingX + offsetBoxLeft;
      const firstDigitBoxY = textY - fontSize - paddingY;
      const firstDigitBoxWidth = firstDigitWidth + paddingX * 2;
      const firstDigitBoxHeight = fontSize + paddingY * 2;
      
      // 왼쪽 그룹 흰색 박스
      elements += `
  <rect x="${firstDigitBoxX}" y="${firstDigitBoxY}" width="${firstDigitBoxWidth}" height="${firstDigitBoxHeight}" fill="white" stroke="none"/>`;
      
      // 왼쪽 첫 번째 숫자 텍스트
      elements += `
  <text x="${firstDigitX}" y="${textY}" font-family="OCR-B, OCRB, 'OCR B', monospace" font-size="${fontSize - 1}" text-anchor="start" fill="#000000">${firstDigit}</text>`;

      // ===== 중앙 그룹 (6자리) =====
      const leftGroupStartX = vbWidth * 0.165 + 3.5 + offsetMiddle;
      const leftGroupBoxWidth = 120;
      const leftGroupBoxHeight = 20;
      const leftGroupBoxX = leftGroupStartX - leftGroupBoxWidth / 2 + 44 + offsetBoxMiddle;
      const leftGroupBoxY = textY - 27;
      
      // 중앙 그룹 흰색 박스
      elements += `
  <rect x="${leftGroupBoxX}" y="${leftGroupBoxY}" width="${leftGroupBoxWidth}" height="${leftGroupBoxHeight}" fill="white" stroke="none"/>`;
      
      // 중앙 그룹 텍스트
      for (let i = 0; i < leftGroup.length; i++) {
        elements += `
  <text x="${leftGroupStartX + i * charSpacing}" y="${textY}" font-family="OCR-B, OCRB, 'OCR B', monospace" font-size="${fontSize}" text-anchor="middle" fill="#000000">${leftGroup[i]}</text>`;
      }

      // ===== 오른쪽 그룹 (6자리) =====
      const rightGroupStartX = vbWidth * 0.545 + 5 + offsetRight;
      const rightGroupBoxWidth = 120;
      const rightGroupBoxHeight = 20;
      const rightGroupBoxX = rightGroupStartX - rightGroupBoxWidth / 2 + 43.5 + offsetBoxRight;
      const rightGroupBoxY = textY - 27;
      
      // 오른쪽 그룹 흰색 박스
      elements += `
  <rect x="${rightGroupBoxX}" y="${rightGroupBoxY}" width="${rightGroupBoxWidth}" height="${rightGroupBoxHeight}" fill="white" stroke="none"/>`;
      
      // 오른쪽 그룹 텍스트
      for (let i = 0; i < rightGroup.length; i++) {
        elements += `
  <text x="${rightGroupStartX + i * charSpacing}" y="${textY}" font-family="OCR-B, OCRB, 'OCR B', monospace" font-size="${fontSize}" text-anchor="middle" fill="#000000">${rightGroup[i]}</text>`;
      }

    } else if (symbology === 'ean8') {
      // EAN-8: 1234 5678 형식 (흰색 박스는 간단히 구현)
      const leftGroup = text.substring(0, 4);
      const rightGroup = text.substring(4, 8);

      const charSpacing = vbWidth * 0.045;
      const leftGroupCenterX = vbWidth * 0.32 + offsetMiddle;
      const leftStartX = leftGroupCenterX - (charSpacing * 1.5);
      
      for (let i = 0; i < leftGroup.length; i++) {
        elements += `
  <text x="${leftStartX + i * charSpacing}" y="${textY}" font-family="OCR-B, OCRB, 'OCR B', monospace" font-size="${fontSize}" text-anchor="middle" fill="#000000">${leftGroup[i]}</text>`;
      }
      
      const rightGroupCenterX = vbWidth * 0.70 + offsetRight;
      const rightStartX = rightGroupCenterX - (charSpacing * 1.5);
      for (let i = 0; i < rightGroup.length; i++) {
        elements += `
  <text x="${rightStartX + i * charSpacing}" y="${textY}" font-family="OCR-B, OCRB, 'OCR B', monospace" font-size="${fontSize}" text-anchor="middle" fill="#000000">${rightGroup[i]}</text>`;
      }

    } else if (symbology === 'upca') {
      // UPC-A: 0 12345 67890 1 형식 (흰색 박스는 간단히 구현)
      const firstDigit = text[0];
      const leftGroup = text.substring(1, 6);
      const rightGroup = text.substring(6, 11);
      const lastDigit = text[11];

      const firstDigitX = vbWidth * 0.08 + offsetLeft;
      const sideDigitY = vbHeight * 0.65;
      
      elements += `
  <text x="${firstDigitX}" y="${sideDigitY}" font-family="OCR-B, OCRB, 'OCR B', monospace" font-size="${fontSize - 3}" text-anchor="middle" fill="#000000">${firstDigit}</text>`;

      const charSpacing = vbWidth * 0.038;
      const leftGroupCenterX = vbWidth * 0.32 + offsetMiddle;
      const leftStartX = leftGroupCenterX - (charSpacing * 2);
      
      for (let i = 0; i < leftGroup.length; i++) {
        elements += `
  <text x="${leftStartX + i * charSpacing}" y="${textY}" font-family="OCR-B, OCRB, 'OCR B', monospace" font-size="${fontSize}" text-anchor="middle" fill="#000000">${leftGroup[i]}</text>`;
      }

      const rightGroupCenterX = vbWidth * 0.70 + offsetRight;
      const rightStartX = rightGroupCenterX - (charSpacing * 2);
      for (let i = 0; i < rightGroup.length; i++) {
        elements += `
  <text x="${rightStartX + i * charSpacing}" y="${textY}" font-family="OCR-B, OCRB, 'OCR B', monospace" font-size="${fontSize}" text-anchor="middle" fill="#000000">${rightGroup[i]}</text>`;
      }

      const lastDigitX = vbWidth * 0.92 + offsetRight;
      elements += `
  <text x="${lastDigitX}" y="${sideDigitY}" font-family="OCR-B, OCRB, 'OCR B', monospace" font-size="${fontSize - 3}" text-anchor="middle" fill="#000000">${lastDigit}</text>`;
    }

    // viewBox와 height 업데이트
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

/**
 * 중앙 하단에 텍스트 추가 (Code128, Code39 등)
 */
function addCenterText(svg: string, text: string, fontSize: number = 16): string {
  try {
    const viewBoxMatch = svg.match(/viewBox="([^"]+)"/);
    
    if (!viewBoxMatch) {
      return svg;
    }

    const viewBoxValues = viewBoxMatch[1].split(' ');
    const vbWidth = parseFloat(viewBoxValues[2]);
    const vbHeight = parseFloat(viewBoxValues[3]);

    const textElement = `
  <text x="${vbWidth / 2}" y="${vbHeight - 2}" font-family="OCR-B, OCRB, 'OCR B', monospace" font-size="${fontSize}" text-anchor="middle" fill="#000000">${text}</text>`;

    const modifiedSvg = svg.replace('</svg>', `${textElement}\n</svg>`);
    return modifiedSvg;
  } catch (error) {
    console.error('Error adding center text:', error);
    return svg;
  }
}

