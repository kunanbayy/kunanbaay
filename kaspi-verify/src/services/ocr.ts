import OpenAI from 'openai';
import { pdf } from 'pdf-to-img';
import { config } from '../lib/config';
import { log } from '../lib/logger';
import type { ExtractedReceipt } from '../types';

const client = new OpenAI({ apiKey: config.openaiApiKey });

const SYSTEM = `You are an OCR extraction engine for Kaspi Bank (Kazakhstan) money-transfer receipts.
Return STRICT JSON only. Read the receipt carefully and extract the fields.
Kaspi receipts contain: receipt/check number (Чек нөмірі / Квитанция), amount (Сома, in ₸/тенге),
merchant/receiver name (Алушы / Получатель / Сатушы), transfer type (Аударым / Перевод), date & time.`;

const PROMPT = `Extract these fields from the receipt image and return JSON with EXACTLY this shape:
{
  "receiptNumber": string|null,   // the long transaction/check number, digits only
  "amount": number|null,          // integer tenge, no spaces or symbols (e.g. 990)
  "receiverName": string|null,    // merchant/recipient as printed, e.g. "BAY GROUP"
  "payerName": string|null,       // sender/payer name (Жіберуші / Отправитель / От кого), as printed
  "comment": string|null,         // payment purpose / comment (Назначение / Комментарий / Ескертпе), full text
  "paymentDate": string|null,     // strict Kaspi local time format "DD.MM.YYYY HH:mm", no seconds
  "transferType": string|null,
  "confidence": number,           // 0..1 — how sure you are the fields are correct
  "isReadable": boolean,          // false if blurry, cropped or not a Kaspi receipt
  "looksEdited": boolean          // true if fonts/alignment suggest tampering
}
Do not invent values. If a field is not clearly visible, use null and lower the confidence.
If the receipt shows BAY GROUP with spaces, punctuation, Cyrillic/Latin lookalikes, preserve it as printed in receiverName.`;

async function toPngDataUrl(buffer: Buffer, mime: string): Promise<string> {
  if (mime === 'application/pdf') {
    const doc = await pdf(buffer, { scale: 2 });
    for await (const page of doc) {
      return `data:image/png;base64,${page.toString('base64')}`; // first page
    }
    throw new Error('empty_pdf');
  }
  // images: pass straight through
  return `data:${mime};base64,${buffer.toString('base64')}`;
}

export async function extractReceipt(buffer: Buffer, mime: string): Promise<ExtractedReceipt> {
  const dataUrl = await toPngDataUrl(buffer, mime);

  const res = await client.chat.completions.create({
    model: config.openaiModel,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM },
      {
        role: 'user',
        content: [
          { type: 'text', text: PROMPT },
          { type: 'image_url', image_url: { url: dataUrl, detail: 'high' } },
        ],
      },
    ],
  });

  const content = res.choices[0]?.message?.content ?? '{}';
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content);
  } catch {
    log('error', 'ocr json parse failed', content);
    throw new Error('ocr_parse_error');
  }

  const digits = (v: unknown) => (typeof v === 'string' ? v.replace(/\D/g, '') : '');
  const num = (v: unknown) => {
    if (typeof v === 'number') return Math.round(v);
    if (typeof v === 'string') { const n = Number(v.replace(/[^\d]/g, '')); return Number.isFinite(n) ? n : null; }
    return null;
  };

  return {
    receiptNumber: digits(parsed.receiptNumber) || null,
    amount: num(parsed.amount),
    receiverName: (parsed.receiverName as string) ?? null,
    payerName: (parsed.payerName as string) ?? null,
    comment: (parsed.comment as string) ?? null,
    paymentDate: (parsed.paymentDate as string) ?? null,
    transferType: (parsed.transferType as string) ?? null,
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
    isReadable: parsed.isReadable !== false,
    looksEdited: parsed.looksEdited === true,
    rawText: content,
  };
}
