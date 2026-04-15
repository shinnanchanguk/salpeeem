import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// pdf.js worker setup — use bundled worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

// ── Types ──

export interface ExtractionResult {
  success: boolean;
  text: string;
  needsVision: boolean;
  images?: string[];
  error?: string;
}

// ── Main entry point ──

export async function extractText(file: File): Promise<ExtractionResult> {
  const ext = getExtension(file.name);

  try {
    switch (ext) {
      case 'txt':
      case 'csv':
        return await extractPlainText(file);
      case 'xlsx':
      case 'xls':
        return await extractXlsx(file);
      case 'pdf':
        return await extractPdf(file);
      case 'docx':
        return await extractDocx(file);
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return await extractImage(file);
      case 'hwp':
      case 'hwpx':
        return {
          success: false,
          text: '',
          needsVision: false,
          error: `HWP 파일은 아직 지원되지 않습니다. PDF로 변환 후 업로드해주세요.`,
        };
      default:
        return await extractPlainText(file);
    }
  } catch (err) {
    return {
      success: false,
      text: '',
      needsVision: false,
      error: `파일 처리 실패 (${file.name}): ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ── Format-specific extractors ──

async function extractPlainText(file: File): Promise<ExtractionResult> {
  const text = await file.text();
  return { success: true, text, needsVision: false };
}

async function extractXlsx(file: File): Promise<ExtractionResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  const parts: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '', raw: false });

    if (rows.length === 0) continue;

    if (workbook.SheetNames.length > 1) {
      parts.push(`## ${sheetName}\n`);
    }

    // Build markdown table
    const header = rows[0] as string[];
    const headerLine = '| ' + header.map(cellToString).join(' | ') + ' |';
    const sepLine = '| ' + header.map(() => '---').join(' | ') + ' |';

    const bodyLines = rows.slice(1).map(
      (row) => '| ' + (row as string[]).map(cellToString).join(' | ') + ' |',
    );

    parts.push([headerLine, sepLine, ...bodyLines].join('\n'));
  }

  const text = parts.join('\n\n');
  return { success: true, text, needsVision: false };
}

async function extractPdf(file: File): Promise<ExtractionResult> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  // First pass: try text extraction
  let fullText = '';
  let hasText = false;

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .trim();
    if (pageText.length > 30) {
      hasText = true;
    }
    fullText += pageText + '\n\n';
  }

  fullText = fullText.trim();

  // If text was extracted successfully, return it
  if (hasText && fullText.length > 50) {
    return { success: true, text: fullText, needsVision: false };
  }

  // No text layer — render pages to images for Vision API
  const images: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.5 }); // ~180 DPI

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;

    await page.render({ canvasContext: ctx, canvas, viewport }).promise;

    // Convert to JPEG base64 (smaller than PNG)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    images.push(dataUrl);

    // Clean up
    canvas.width = 0;
    canvas.height = 0;
  }

  return {
    success: true,
    text: '',
    needsVision: true,
    images,
  };
}

async function extractDocx(file: File): Promise<ExtractionResult> {
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return { success: true, text: result.value, needsVision: false };
}

async function extractImage(file: File): Promise<ExtractionResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      resolve({
        success: true,
        text: '',
        needsVision: true,
        images: [dataUrl],
      });
    };
    reader.onerror = () => reject(new Error('이미지 파일 읽기 실패'));
    reader.readAsDataURL(file);
  });
}

// ── Helpers ──

function getExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? '';
}

function cellToString(cell: unknown): string {
  if (cell === null || cell === undefined || cell === '') return '';
  return String(cell).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}
