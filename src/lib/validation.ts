import { z } from 'zod';

export const BarcodeRequestSchema = z.object({
  contents: z.string().min(1, '바코드 번호를 입력해주세요.'),
  symbology: z.enum(['ean13', 'code128', 'code39', 'ean8', 'upca']),
  quietZone: z.number().min(0).max(50).default(10),
});

export type BarcodeRequest = z.infer<typeof BarcodeRequestSchema>;

