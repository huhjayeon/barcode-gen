'use client';

import { useState } from 'react';
import { validateBarcodeInput, type Symbology } from '@/lib/barcode-utils';

export default function Home() {
  const [contents, setContents] = useState('8809560223070');
  const [symbology, setSymbology] = useState<Symbology>('ean13');
  const [quietZone, setQuietZone] = useState(10);
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
      const response = await fetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: finalContents,
          symbology,
          quietZone,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '바코드 생성에 실패했습니다.');
      }

      const svgText = await response.text();
      console.log('SVG Preview received:', svgText.substring(0, 100));
      setSvgPreview(svgText);

      if (validation.message) {
        setSuccess(validation.message);
      } else {
        setSuccess('바코드가 생성되었습니다.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '바코드 생성에 실패했습니다.');
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                여백 (Quiet Zone)
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
                폰트: bwip-js 내장 (OCR-B 스타일)
              </span>
            </div>
            <div className="bg-white p-8 rounded-lg border-2 border-gray-300 flex justify-center items-center overflow-x-auto min-h-[200px]">
              <div
                dangerouslySetInnerHTML={{ __html: svgPreview }}
                className="barcode-preview"
                style={{ display: 'block', width: 'auto', height: 'auto' }}
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

        {/* 푸터 */}
        <footer className="text-center text-sm text-gray-500 mt-8 pt-8 border-t border-gray-200">
          <p>
            Powered by{' '}
            <a
              href="https://github.com/metafloor/bwip-js"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:underline"
            >
              bwip-js
            </a>
            . Not affiliated with original site.
          </p>
          <p className="mt-2 text-xs">
            OCR-B 10 BT 폰트는 별도로 제공되지 않습니다. 폰트 파일을 /public/fonts/ocrb/에
            배치하세요.
          </p>
        </footer>
      </div>
    </main>
  );
}

