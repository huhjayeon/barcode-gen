'use client';

import { useState } from 'react';
import { validateBarcodeInput, type Symbology } from '@/lib/barcode-utils';

export default function Home() {
  const [contents, setContents] = useState('8809560223070');
  const [symbology, setSymbology] = useState<Symbology>('ean13');
  const [quietZone, setQuietZone] = useState(10);
  const [fontSize, setFontSize] = useState(35);
  const [offsetLeft, setOffsetLeft] = useState(0);
  const [offsetMiddle, setOffsetMiddle] = useState(0);
  const [offsetRight, setOffsetRight] = useState(0);
  const [offsetBoxLeft, setOffsetBoxLeft] = useState(0);
  const [offsetBoxMiddle, setOffsetBoxMiddle] = useState(0);
  const [offsetBoxRight, setOffsetBoxRight] = useState(0);
  const [svgPreview, setSvgPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processedContents, setProcessedContents] = useState('');

  const handleGenerate = async () => {
    setError('');
    setSuccess('');

    // 유효성 검증
    const validation = validateBarcodeInput(contents, symbology);
    if (!validation.valid) {
      setError(validation.message || '입력값이 올바르지 않습니다.');
      return;
    }

    setLoading(true);
    const finalContents = validation.processedContents || contents;
    setProcessedContents(finalContents);

    try {
      console.log('Sending request to /api/preview with:', {
        contents: finalContents,
        symbology,
        quietZone,
      });

      const response = await fetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: finalContents,
          symbology,
          quietZone,
          fontSize,
          offsetLeft,
          offsetMiddle,
          offsetRight,
          offsetBoxLeft,
          offsetBoxMiddle,
          offsetBoxRight,
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorMessage = '바코드 생성에 실패했습니다.';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const svgText = await response.text();
      console.log('SVG Preview received, length:', svgText.length);
      console.log('SVG Preview first 200 chars:', svgText.substring(0, 200));
      
      if (!svgText || svgText.trim().length === 0) {
        throw new Error('서버로부터 빈 SVG를 받았습니다.');
      }

      setSvgPreview(svgText);
      console.log('svgPreview state updated');

      if (validation.message) {
        setSuccess(validation.message);
      } else {
        setSuccess('바코드가 생성되었습니다.');
      }
    } catch (err) {
      console.error('Error generating barcode:', err);
      setError(err instanceof Error ? err.message : '바코드 생성에 실패했습니다.');
      setSvgPreview(''); // 에러 발생 시 미리보기 초기화
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAI = async () => {
    if (!svgPreview) {
      setError('먼저 바코드를 생성해주세요.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/download-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: processedContents || contents,
          symbology,
          quietZone,
          fontSize,
          offsetLeft,
          offsetMiddle,
          offsetRight,
          offsetBoxLeft,
          offsetBoxMiddle,
          offsetBoxRight,
        }),
      });

      if (!response.ok) {
        throw new Error('AI 파일 다운로드에 실패했습니다.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `barcode_${symbology}_${processedContents || contents}.ai`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI 파일 다운로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSVG = async () => {
    if (!svgPreview) {
      setError('먼저 바코드를 생성해주세요.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/download-svg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: processedContents || contents,
          symbology,
          quietZone,
          fontSize,
          offsetLeft,
          offsetMiddle,
          offsetRight,
          offsetBoxLeft,
          offsetBoxMiddle,
          offsetBoxRight,
        }),
      });

      if (!response.ok) {
        throw new Error('SVG 파일 다운로드에 실패했습니다.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `barcode_${symbology}_${processedContents || contents}.svg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'SVG 파일 다운로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Free Barcode Generator (.AI)
        </h1>

        {/* 입력 폼 */}
        <div className="space-y-6 mb-8">
          <div>
            <label
              htmlFor="contents"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              바코드 번호 (Contents)
            </label>
            <input
              id="contents"
              type="text"
              value={contents}
              onChange={(e) => setContents(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="예: 8801234567890"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label
                htmlFor="symbology"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                심볼로지 (Symbology)
              </label>
              <select
                id="symbology"
                value={symbology}
                onChange={(e) => setSymbology(e.target.value as Symbology)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="ean13">EAN-13</option>
                <option value="code128">Code128</option>
                <option value="code39">Code39</option>
                <option value="ean8">EAN-8</option>
                <option value="upca">UPC-A</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="quietZone"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                자간
              </label>
              <input
                id="quietZone"
                type="number"
                value={quietZone}
                onChange={(e) => setQuietZone(Number(e.target.value))}
                min="0"
                max="50"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label
                htmlFor="fontSize"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                폰트 크기 (Font Size)
              </label>
              <input
                id="fontSize"
                type="number"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                min="8"
                max="45"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 오프셋 조정 */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-semibold text-gray-800">텍스트 위치 미세 조정 (px)</h3>
            <button
              onClick={() => {
                setOffsetLeft(0);
                setOffsetMiddle(0);
                setOffsetRight(0);
                setOffsetBoxLeft(0);
                setOffsetBoxMiddle(0);
                setOffsetBoxRight(0);
              }}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              Reset
            </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  왼쪽 오프셋: {offsetLeft.toFixed(1)}px
                </label>
                <input
                  type="range"
                  min="-20"
                  max="20"
                  step="0.5"
                  value={offsetLeft}
                  onChange={(e) => setOffsetLeft(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <input
                  type="number"
                  min="-20"
                  max="20"
                  step="0.5"
                  value={offsetLeft}
                  onChange={(e) => setOffsetLeft(Number(e.target.value))}
                  className="mt-2 w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  중앙 오프셋: {offsetMiddle.toFixed(1)}px
                </label>
                <input
                  type="range"
                  min="-20"
                  max="20"
                  step="0.5"
                  value={offsetMiddle}
                  onChange={(e) => setOffsetMiddle(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <input
                  type="number"
                  min="-20"
                  max="20"
                  step="0.5"
                  value={offsetMiddle}
                  onChange={(e) => setOffsetMiddle(Number(e.target.value))}
                  className="mt-2 w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  오른쪽 오프셋: {offsetRight.toFixed(1)}px
                </label>
                <input
                  type="range"
                  min="-20"
                  max="20"
                  step="0.5"
                  value={offsetRight}
                  onChange={(e) => setOffsetRight(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <input
                  type="number"
                  min="-20"
                  max="20"
                  step="0.5"
                  value={offsetRight}
                  onChange={(e) => setOffsetRight(Number(e.target.value))}
                  className="mt-2 w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* 흰색 박스 위치 조정 */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-md font-semibold text-gray-800 mb-4">흰색 박스 위치 미세 조정 (px)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  왼쪽 박스: {offsetBoxLeft.toFixed(1)}px
                </label>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="0.5"
                  value={offsetBoxLeft}
                  onChange={(e) => setOffsetBoxLeft(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <input
                  type="number"
                  min="-50"
                  max="50"
                  step="0.5"
                  value={offsetBoxLeft}
                  onChange={(e) => setOffsetBoxLeft(Number(e.target.value))}
                  className="mt-2 w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  중앙 박스: {offsetBoxMiddle.toFixed(1)}px
                </label>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="0.5"
                  value={offsetBoxMiddle}
                  onChange={(e) => setOffsetBoxMiddle(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <input
                  type="number"
                  min="-50"
                  max="50"
                  step="0.5"
                  value={offsetBoxMiddle}
                  onChange={(e) => setOffsetBoxMiddle(Number(e.target.value))}
                  className="mt-2 w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  오른쪽 박스: {offsetBoxRight.toFixed(1)}px
                </label>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="0.5"
                  value={offsetBoxRight}
                  onChange={(e) => setOffsetBoxRight(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <input
                  type="number"
                  min="-50"
                  max="50"
                  step="0.5"
                  value={offsetBoxRight}
                  onChange={(e) => setOffsetBoxRight(Number(e.target.value))}
                  className="mt-2 w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '생성 중...' : 'Make Barcode'}
          </button>
        </div>

        {/* 오류/성공 메시지 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {/* 미리보기 */}
        {svgPreview && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">미리보기</h2>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                폰트: OCR-B 10 BT
              </span>
            </div>
            <div className="bg-white p-8 rounded-lg border-2 border-gray-300 flex justify-center items-center overflow-x-auto min-h-[200px]">
              <div
                dangerouslySetInnerHTML={{ __html: svgPreview }}
                className="barcode-preview"
              />
            </div>

            {/* 다운로드 버튼 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <button
                onClick={handleDownloadAI}
                disabled={loading}
                className="bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Download .ai
              </button>
              <button
                onClick={handleDownloadSVG}
                disabled={loading}
                className="bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Download .svg
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}

