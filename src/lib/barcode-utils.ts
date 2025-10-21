/**
 * EAN-13 체크디지트 계산
 */
export function calculateEAN13CheckDigit(code: string): string {
  if (code.length !== 12) {
    throw new Error('EAN-13 requires 12 digits for check digit calculation');
  }

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(code[i], 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return code + checkDigit.toString();
}

/**
 * UPC-A 체크디지트 계산
 */
export function calculateUPCACheckDigit(code: string): string {
  if (code.length !== 11) {
    throw new Error('UPC-A requires 11 digits for check digit calculation');
  }

  let sum = 0;
  for (let i = 0; i < 11; i++) {
    const digit = parseInt(code[i], 10);
    sum += i % 2 === 0 ? digit * 3 : digit;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return code + checkDigit.toString();
}

/**
 * EAN-8 체크디지트 계산
 */
export function calculateEAN8CheckDigit(code: string): string {
  if (code.length !== 7) {
    throw new Error('EAN-8 requires 7 digits for check digit calculation');
  }

  let sum = 0;
  for (let i = 0; i < 7; i++) {
    const digit = parseInt(code[i], 10);
    sum += i % 2 === 0 ? digit * 3 : digit;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return code + checkDigit.toString();
}

/**
 * 심볼로지 타입
 */
export type Symbology = 'ean13' | 'code128' | 'code39' | 'ean8' | 'upca';

/**
 * 바코드 입력값 검증
 */
export function validateBarcodeInput(
  contents: string,
  symbology: Symbology
): { valid: boolean; message?: string; processedContents?: string } {
  if (!contents || contents.trim() === '') {
    return { valid: false, message: '바코드 번호를 입력해주세요.' };
  }

  switch (symbology) {
    case 'ean13':
      // 12자리 또는 13자리 숫자만 허용
      if (!/^\d{12,13}$/.test(contents)) {
        return {
          valid: false,
          message: 'EAN-13은 12자리 또는 13자리 숫자만 입력 가능합니다.',
        };
      }
      // 12자리든 13자리든 앞 12자리로 체크디지트 재계산
      const base12 = contents.slice(0, 12);
      const correctEan13 = calculateEAN13CheckDigit(base12);
      return {
        valid: true,
        processedContents: correctEan13,
        message: contents.length === 13 
          ? '체크디지트가 자동으로 재계산되었습니다.' 
          : '체크디지트가 자동으로 추가되었습니다.',
      };

    case 'ean8':
      // 7자리 또는 8자리 숫자만 허용
      if (!/^\d{7,8}$/.test(contents)) {
        return {
          valid: false,
          message: 'EAN-8은 7자리 또는 8자리 숫자만 입력 가능합니다.',
        };
      }
      // 7자리든 8자리든 앞 7자리로 체크디지트 재계산
      const base7 = contents.slice(0, 7);
      const correctEan8 = calculateEAN8CheckDigit(base7);
      return {
        valid: true,
        processedContents: correctEan8,
        message: contents.length === 8 
          ? '체크디지트가 자동으로 재계산되었습니다.' 
          : '체크디지트가 자동으로 추가되었습니다.',
      };

    case 'upca':
      // 11자리 또는 12자리 숫자만 허용
      if (!/^\d{11,12}$/.test(contents)) {
        return {
          valid: false,
          message: 'UPC-A는 11자리 또는 12자리 숫자만 입력 가능합니다.',
        };
      }
      // 11자리든 12자리든 앞 11자리로 체크디지트 재계산
      const base11 = contents.slice(0, 11);
      const correctUpca = calculateUPCACheckDigit(base11);
      return {
        valid: true,
        processedContents: correctUpca,
        message: contents.length === 12 
          ? '체크디지트가 자동으로 재계산되었습니다.' 
          : '체크디지트가 자동으로 추가되었습니다.',
      };

    case 'code128':
      // Code128은 알파벳, 숫자 모두 허용
      if (contents.length > 80) {
        return {
          valid: false,
          message: 'Code128은 최대 80자까지 입력 가능합니다.',
        };
      }
      return { valid: true, processedContents: contents };

    case 'code39':
      // Code39는 대문자, 숫자, 일부 특수문자만 허용
      if (!/^[A-Z0-9\-. $/+%]+$/.test(contents)) {
        return {
          valid: false,
          message:
            'Code39는 대문자, 숫자, 특수문자(-, ., space, $, /, +, %)만 입력 가능합니다.',
        };
      }
      return { valid: true, processedContents: contents };

    default:
      return { valid: false, message: '지원하지 않는 심볼로지입니다.' };
  }
}

/**
 * bwip-js 옵션 생성
 */
export function getBarcodeOptions(
  symbology: Symbology,
  quietZone: number = 10
) {
  const baseOptions = {
    scale: 3,
    height: 15, // mm
    includetext: false, // 우리가 별도로 텍스트 렌더링
    textxalign: 'center',
  };

  // 심볼로지별 특수 설정
  const symbologyOptions: Record<Symbology, any> = {
    ean13: {
      bcid: 'ean13',
      guardwhitespace: true,
    },
    ean8: {
      bcid: 'ean8',
      guardwhitespace: true,
    },
    upca: {
      bcid: 'upca',
      guardwhitespace: true,
    },
    code128: {
      bcid: 'code128',
    },
    code39: {
      bcid: 'code39',
    },
  };

  return {
    ...baseOptions,
    ...symbologyOptions[symbology],
  };
}

