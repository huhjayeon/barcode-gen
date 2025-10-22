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

    // EAN-13의 경우 가드바 조정 및 바코드 그룹화
    if (symbology === 'ean13') {
      svg = adjustEAN13Guards(svg);
      svg = groupBarcodePaths(svg);
      svg = addEAN13TextGroups(svg, contents, fontSize, offsetLeft, offsetMiddle, offsetRight);
    } else {
      // 다른 심볼로지는 간단한 처리
      svg = groupBarcodePaths(svg);
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
 * EAN-13 가드바의 높이를 조정하고 데이터바는 짧게 만듦
 */
function adjustEAN13Guards(svg: string): string {
  try {
    const viewBoxMatch = svg.match(/viewBox="([^"]+)"/);
    if (!viewBoxMatch) return svg;

    const viewBoxValues = viewBoxMatch[1].split(' ');
    const vbWidth = parseFloat(viewBoxValues[2]);
    const vbHeight = parseFloat(viewBoxValues[3]);

    // path들을 추출
    const pathMatches = svg.matchAll(/<path[^>]*stroke="[^"]*"[^>]*d="([^"]+)"[^>]*\/>/g);
    let paths = [];
    
    for (const match of pathMatches) {
      paths.push(match[0]);
    }

    // 각 path의 x 좌표를 분석하여 가드바인지 확인
    let newPaths = paths.map(pathStr => {
      const dMatch = pathStr.match(/d="M([0-9.]+) /);
      if (!dMatch) return pathStr;
      
      const x = parseFloat(dMatch[1]);
      const xRatio = x / vbWidth;
      
      // 가드바 위치 (EAN-13 구조)
      // 시작 가드: 0-0.03 (약 3%)
      // 중앙 가드: 0.46-0.52 (약 46-52%)
      // 끝 가드: 0.97-1.0 (약 97-100%)
      const isGuard = 
        xRatio < 0.05 ||  // 시작 가드
        (xRatio > 0.45 && xRatio < 0.53) ||  // 중앙 가드
        xRatio > 0.95;  // 끝 가드
      
      if (!isGuard) {
        // 데이터바는 높이를 줄임 (상단에서 20pt 아래로)
        const heightReduction = 20;
        return pathStr.replace(
          /d="M([0-9.]+) ([0-9.]+)L([0-9.]+) ([0-9.]+)"/,
          (match, x1, y1, x2, y2) => {
            const newY1 = parseFloat(y1) + heightReduction;
            return `d="M${x1} ${newY1}L${x2} ${y2}"`;
          }
        );
      }
      
      return pathStr;
    });

    // 원래 path들을 새로운 것으로 교체
    let result = svg;
    paths.forEach((oldPath, i) => {
      result = result.replace(oldPath, newPaths[i]);
    });

    return result;
  } catch (error) {
    console.error('Error adjusting EAN13 guards:', error);
    return svg;
  }
}

/**
 * 모든 바코드 path를 하나의 그룹으로 묶음
 */
function groupBarcodePaths(svg: string): string {
  try {
    // 모든 path를 찾아서 그룹화
    const pathRegex = /<path[^>]*\/>/g;
    const paths = svg.match(pathRegex) || [];
    
    if (paths.length === 0) return svg;
    
    // 모든 path를 그룹으로 묶음
    const groupedPaths = `
  <g id="barcode-bars">
    ${paths.join('\n    ')}
  </g>`;
    
    // 첫 번째 path를 그룹으로 교체
    let result = svg.replace(paths[0], groupedPaths);
    
    // 나머지 path들 제거
    for (let i = 1; i < paths.length; i++) {
      result = result.replace(paths[i], '');
    }
    
    return result;
  } catch (error) {
    console.error('Error grouping barcode paths:', error);
    return svg;
  }
}

/**
 * EAN-13 텍스트를 3개 그룹으로 추가 (왼쪽 1자리, 중간 6자리, 오른쪽 6자리)
 */
function addEAN13TextGroups(svg: string, text: string, fontSize: number = 35, offsetLeft: number = 0, offsetMiddle: number = 0, offsetRight: number = 0): string {
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

    const firstDigit = text[0];
    const leftGroup = text.substring(1, 7);
    const rightGroup = text.substring(7, 13);

    const charSpacing = vbWidth * 0.051;
    const textY = vbHeight - 2;
    
    // 왼쪽 첫 번째 숫자 그룹 (1자리)
    const firstDigitX = vbWidth * 0.06 + (-16) + offsetLeft;
    const firstDigitGroup = `
  <g id="first-digit">
    <text x="${firstDigitX}" y="${textY}" font-family="OCR-B, OCRB, 'OCR B', monospace" font-size="${fontSize - 1}" text-anchor="start" fill="#000000">${firstDigit}</text>
  </g>`;

    // 중앙 그룹 (6자리)
    const leftGroupStartX = vbWidth * 0.165 + 3.5 + offsetMiddle;
    let leftGroupTexts = '';
    for (let i = 0; i < leftGroup.length; i++) {
      leftGroupTexts += `
    <text x="${leftGroupStartX + i * charSpacing}" y="${textY}" font-family="OCR-B, OCRB, 'OCR B', monospace" font-size="${fontSize}" text-anchor="middle" fill="#000000">${leftGroup[i]}</text>`;
    }
    const leftGroupElement = `
  <g id="left-group">${leftGroupTexts}
  </g>`;

    // 오른쪽 그룹 (6자리)
    const rightGroupStartX = vbWidth * 0.545 + 5 + offsetRight;
    let rightGroupTexts = '';
    for (let i = 0; i < rightGroup.length; i++) {
      rightGroupTexts += `
    <text x="${rightGroupStartX + i * charSpacing}" y="${textY}" font-family="OCR-B, OCRB, 'OCR B', monospace" font-size="${fontSize}" text-anchor="middle" fill="#000000">${rightGroup[i]}</text>`;
    }
    const rightGroupElement = `
  <g id="right-group">${rightGroupTexts}
  </g>`;

    // viewBox 높이를 텍스트 포함하도록 확장
    const newHeight = vbHeight + 10;
    let modifiedSvg = svg.replace(
      /viewBox="([^"]+)"/,
      `viewBox="${viewBoxValues[0]} ${viewBoxValues[1]} ${vbWidth} ${newHeight}"`
    );
    modifiedSvg = modifiedSvg.replace(
      /height="[^"]+"/,
      `height="${newHeight}"`
    );
    
    // </svg> 앞에 텍스트 그룹 추가
    modifiedSvg = modifiedSvg.replace('</svg>', `${firstDigitGroup}${leftGroupElement}${rightGroupElement}\n</svg>`);
    
    return modifiedSvg;
  } catch (error) {
    console.error('Error adding EAN13 text groups:', error);
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
