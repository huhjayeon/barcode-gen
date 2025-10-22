import { NextRequest, NextResponse } from 'next/server';
import bwipjs from 'bwip-js';
import { BarcodeRequestSchema } from '@/lib/validation';
import { getBarcodeOptions } from '@/lib/barcode-utils';
import * as fs from 'fs';
import * as path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contents, symbology, quietZone, fontSize, offsetLeft, offsetMiddle, offsetRight } = BarcodeRequestSchema.parse(body);

    const options = getBarcodeOptions(symbology, quietZone);

    // bwip-js로 SVG 생성 (바코드만, 텍스트 제외)
    let svg = bwipjs.toSVG({
      ...options,
      text: contents,
      includetext: false,
    });

    // SVG에 명시적인 width와 height 추가
    svg = addSVGDimensions(svg);
    
    // SVG에 폰트 스타일 추가
    svg = addFontStyle(svg);

    // EAN-13의 경우 처리
    if (symbology === 'ean13') {
      // 가드바 길이 조정 + 바코드 그룹화 + 숫자 추가를 한 번에 처리
      svg = processEAN13(svg, contents, fontSize, offsetLeft, offsetMiddle, offsetRight);
    } else {
      // 다른 심볼로지는 간단한 처리
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
      { error: error instanceof Error ? error.message : '바코드 생성에 실패했습니다.' },
      { status: 400 }
    );
  }
}

function addSVGDimensions(svg: string): string {
  try {
    const viewBoxMatch = svg.match(/viewBox="([^"]+)"/);
    if (viewBoxMatch) {
      const viewBoxValues = viewBoxMatch[1].split(' ');
      const width = viewBoxValues[2];
      const height = viewBoxValues[3];
      
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

// 폰트를 base64로 캐싱
let cachedFontBase64: string | null = null;

function getFontBase64(): string {
  if (cachedFontBase64) {
    return cachedFontBase64;
  }
  
  try {
    const fontPath = path.join(process.cwd(), 'public', 'fonts', 'ocrb', 'ocr-b-10-bt.ttf');
    const fontBuffer = fs.readFileSync(fontPath);
    cachedFontBase64 = fontBuffer.toString('base64');
    return cachedFontBase64;
  } catch (error) {
    console.error('Error loading font:', error);
    return '';
  }
}

function addFontStyle(svg: string): string {
  try {
    const fontBase64 = getFontBase64();
    
    const fontStyle = fontBase64 ? `
  <defs>
    <style type="text/css">
      @font-face {
        font-family: 'OCR-B';
        src: url(data:font/truetype;charset=utf-8;base64,${fontBase64}) format('truetype');
        font-weight: normal;
        font-style: normal;
      }
    </style>
  </defs>` : `
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
    
    svg = svg.replace(/<svg ([^>]*)>/, `<svg $1>${fontStyle}`);
    return svg;
  } catch (error) {
    console.error('Error adding font style:', error);
    return svg;
  }
}

/**
 * EAN-13 처리: 가드바 길이 차별화 + 바코드 그룹화 + 숫자 그룹 추가
 */
function processEAN13(svg: string, text: string, fontSize: number = 35, offsetLeft: number = 0, offsetMiddle: number = 0, offsetRight: number = 0): string {
  try {
    const viewBoxMatch = svg.match(/viewBox="([^"]+)"/);
    if (!viewBoxMatch) return svg;

    const viewBoxValues = viewBoxMatch[1].split(' ');
    const vbWidth = parseFloat(viewBoxValues[2]);
    const vbHeight = parseFloat(viewBoxValues[3]);

    // 모든 path 추출
    const pathMatches = Array.from(svg.matchAll(/<path[^>]*d="([^"]+)"[^>]*\/>/g));
    
    // 각 path를 분석하고 재구성
    const newPaths: string[] = [];
    
    pathMatches.forEach((match) => {
      const fullPath = match[0];
      const dAttr = match[1];
      
      // M 커맨드들을 분리 (한 path에 여러 선이 있을 수 있음)
      const lines = dAttr.split('M').filter(s => s.trim());
      
      lines.forEach(line => {
        const coords = line.match(/([0-9.]+)\s+([0-9.]+)L([0-9.]+)\s+([0-9.]+)/);
        if (!coords) return;
        
        const x1 = parseFloat(coords[1]);
        const y1 = parseFloat(coords[2]);
        const x2 = parseFloat(coords[3]);
        const y2 = parseFloat(coords[4]);
        
        // X 위치로 가드바 판단
        const xRatio = x1 / vbWidth;
        const isGuard = 
          xRatio < 0.06 ||  // 왼쪽 가드
          (xRatio > 0.46 && xRatio < 0.54) ||  // 중앙 가드
          xRatio > 0.94;  // 오른쪽 가드
        
        // 가드바가 아니면 위쪽을 20pt 짧게
        const newY1 = isGuard ? y1 : y1 + 20;
        
        // stroke-width 추출
        const widthMatch = fullPath.match(/stroke-width="([^"]+)"/);
        const strokeWidth = widthMatch ? widthMatch[1] : '3';
        
        newPaths.push(`<path stroke="#000000" stroke-width="${strokeWidth}" d="M${x1} ${newY1}L${x2} ${y2}" />`);
      });
    });

    // 기존 paths를 모두 제거하고 그룹으로 교체
    let result = svg;
    pathMatches.forEach((match) => {
      result = result.replace(match[0], '');
    });
    
    // 그룹화된 paths 추가
    const groupedPaths = `
  <g id="barcode-bars">
${newPaths.map(p => `    ${p}`).join('\n')}
  </g>
`;
    
    // </svg> 앞에 그룹 삽입
    result = result.replace('</svg>', `${groupedPaths}</svg>`);
    
    // 숫자 그룹 추가
    const firstDigit = text[0];
    const leftGroup = text.substring(1, 7);
    const rightGroup = text.substring(7, 13);

    const textY = vbHeight - 2;
    
    // 왼쪽 첫 번째 숫자 (단일 text)
    const firstDigitX = vbWidth * 0.06 + (-16) + offsetLeft;
    const firstDigitGroup = `
  <g id="first-digit">
    <text x="${firstDigitX}" y="${textY}" font-family="OCR-B, OCRB, 'OCR B', monospace" font-size="${fontSize - 1}" text-anchor="start" fill="#000000">${firstDigit}</text>
  </g>`;

    // 중앙 그룹 (단일 text)
    const leftGroupStartX = vbWidth * 0.165 + 3.5 + offsetMiddle;
    const leftGroupElement = `
  <g id="left-group">
    <text x="${leftGroupStartX}" y="${textY}" font-family="OCR-B, OCRB, 'OCR B', monospace" font-size="${fontSize}" letter-spacing="-0.025em" fill="#000000">${leftGroup}</text>
  </g>`;

    // 오른쪽 그룹 (단일 text)
    const rightGroupStartX = vbWidth * 0.545 + 5 + offsetRight;
    const rightGroupElement = `
  <g id="right-group">
    <text x="${rightGroupStartX}" y="${textY}" font-family="OCR-B, OCRB, 'OCR B', monospace" font-size="${fontSize}" letter-spacing="-0.025em" fill="#000000">${rightGroup}</text>
  </g>`;

    // viewBox 높이를 텍스트 포함하도록 확장
    const newHeight = vbHeight + 10;
    result = result.replace(
      /viewBox="([^"]+)"/,
      `viewBox="${viewBoxValues[0]} ${viewBoxValues[1]} ${vbWidth} ${newHeight}"`
    );
    result = result.replace(
      /height="[^"]+"/,
      `height="${newHeight}"`
    );
    
    // </svg> 앞에 텍스트 그룹 추가
    result = result.replace('</svg>', `${firstDigitGroup}${leftGroupElement}${rightGroupElement}\n</svg>`);
    
    return result;
  } catch (error) {
    console.error('Error processing EAN13:', error);
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
