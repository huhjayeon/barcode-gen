import { NextRequest, NextResponse } from 'next/server';
import bwipjs from 'bwip-js';
import { BarcodeRequestSchema } from '@/lib/validation';
import { getBarcodeOptions } from '@/lib/barcode-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contents, symbology, quietZone } = BarcodeRequestSchema.parse(body);

    const options = getBarcodeOptions(symbology, quietZone);

    // bwip-js로 SVG 생성
    const svg = bwipjs.toSVG({
      ...options,
      text: contents,
    });

    // SVG에 텍스트 추가 (OCR-B 폰트, letter-spacing -0.025em)
    const svgWithText = addHumanReadableText(svg, contents);

    return new NextResponse(svgWithText, {
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

function addHumanReadableText(svg: string, text: string): string {
  // SVG 파싱 및 텍스트 추가
  // SVG의 viewBox를 확인하고 하단에 텍스트 추가
  const viewBoxMatch = svg.match(/viewBox="([^"]+)"/);
  if (!viewBoxMatch) return svg;

  const [, , , width, height] = viewBoxMatch[1].split(' ').map(Number);

  // 기존 SVG를 그룹으로 감싸고 텍스트 추가
  const textY = height + 20; // 바코드 아래 20pt 위치
  const textX = width / 2;

  const textElement = `
  <text 
    x="${textX}" 
    y="${textY}" 
    font-family="OCR-B, OCRB, monospace" 
    font-size="14" 
    text-anchor="middle"
    letter-spacing="-0.025em"
    style="font-feature-settings: 'lnum', 'tnum';"
  >${text}</text>`;

  // SVG 높이 확장
  const newHeight = height + 30;
  const modifiedSvg = svg
    .replace(
      /viewBox="([^"]+)"/,
      `viewBox="0 0 ${width} ${newHeight}"`
    )
    .replace(
      /height="([^"]+)"/,
      `height="${newHeight}"`
    )
    .replace('</svg>', `${textElement}\n</svg>`);

  return modifiedSvg;
}

