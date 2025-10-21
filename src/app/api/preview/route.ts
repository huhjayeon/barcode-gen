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
      includetext: true, // bwip-js 내장 텍스트 사용
    });

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

function addHumanReadableText(svg: string, text: string): string {
  try {
    // SVG 파싱
    const widthMatch = svg.match(/width="([^"]+)"/);
    const heightMatch = svg.match(/height="([^"]+)"/);
    
    if (!widthMatch || !heightMatch) {
      console.log('No width/height found in SVG');
      return svg;
    }

    const width = parseFloat(widthMatch[1]);
    const height = parseFloat(heightMatch[1]);

    // 텍스트 위치 계산
    const textY = height + 15;
    const textX = width / 2;

    const textElement = `
  <text x="${textX}" y="${textY}" font-family="OCR-B, OCRB, monospace" font-size="12" text-anchor="middle" letter-spacing="-0.025em" style="font-feature-settings: 'lnum', 'tnum';" fill="#000000">${text}</text>`;

    // SVG 높이 확장
    const newHeight = height + 25;

    const modifiedSvg = svg
      .replace(/height="[^"]*"/, `height="${newHeight}"`)
      .replace('</svg>', `${textElement}</svg>`);

    return modifiedSvg;
  } catch (error) {
    console.error('Error adding text to SVG:', error);
    return svg;
  }
}

