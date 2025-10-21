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

    // SVG에 텍스트 추가
    const svgWithText = addHumanReadableText(svg, contents);

    const filename = `barcode_${symbology}_${contents}.svg`;

    return new NextResponse(svgWithText, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('SVG download error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'SVG 다운로드에 실패했습니다.',
      },
      { status: 400 }
    );
  }
}

function addHumanReadableText(svg: string, text: string): string {
  const viewBoxMatch = svg.match(/viewBox="([^"]+)"/);
  const widthMatch = svg.match(/width="([^"]+)"/);
  const heightMatch = svg.match(/height="([^"]+)"/);
  
  if (!viewBoxMatch || !widthMatch || !heightMatch) return svg;

  const viewBoxParts = viewBoxMatch[1].split(' ').map(Number);
  const viewBoxWidth = viewBoxParts[2] || parseFloat(widthMatch[1]);
  const viewBoxHeight = viewBoxParts[3] || parseFloat(heightMatch[1]);

  const textY = viewBoxHeight + 15;
  const textX = viewBoxWidth / 2;

  const textElement = `<text x="${textX}" y="${textY}" font-family="OCR-B, OCRB, monospace" font-size="12" text-anchor="middle" letter-spacing="-0.025em" style="font-feature-settings: 'lnum', 'tnum';" fill="#000000">${text}</text>`;

  const newHeight = viewBoxHeight + 25;
  const newViewBox = `0 0 ${viewBoxWidth} ${newHeight}`;

  const modifiedSvg = svg
    .replace(/viewBox="[^"]*"/, `viewBox="${newViewBox}"`)
    .replace(/height="[^"]*"/, `height="${newHeight}"`)
    .replace('</svg>', `${textElement}</svg>`);

  return modifiedSvg;
}

