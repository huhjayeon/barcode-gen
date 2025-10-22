import { z } from 'zod';

export const BarcodeRequestSchema = z.object({
  contents: z.string().min(1, '바코드 번호를 입력해주세요.'),
  symbology: z.enum(['ean13', 'code128', 'code39', 'ean8', 'upca']),
  quietZone: z.number().min(0).max(50).default(10),
  fontSize: z.number().min(8).max(45).default(35),
  offsetLeft: z.number().min(-20).max(20).default(0),
  offsetMiddle: z.number().min(-20).max(20).default(0),
  offsetRight: z.number().min(-20).max(20).default(0),
  offsetBoxLeft: z.number().min(-50).max(50).default(0),
  offsetBoxMiddle: z.number().min(-50).max(50).default(0),
  offsetBoxRight: z.number().min(-50).max(50).default(0),
});

export type BarcodeRequest = z.infer<typeof BarcodeRequestSchema>;

