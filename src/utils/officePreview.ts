import * as XLSX from 'xlsx';
import { contentAssetService, type ContentAssetType } from '../services/contentAssetService';

export const DOCX_EXTENSIONS = /\.docx(\?|$)/i;
export const EXCEL_EXTENSIONS = /\.xlsx?(\?|$)/i;
/** Eski Word — client-side güvenilir önizleme yok */
export const LEGACY_WORD_EXTENSIONS = /\.doc(\?|$)/i;

export const EXCEL_MAX_ROWS = 100;
export const EXCEL_MAX_COLS = 30;

export type OfficePreviewKind = 'docx' | 'xlsx' | 'legacy_office' | null;

export interface OfficeAssetRef {
  key: string;
  type?: ContentAssetType;
  entityId?: string;
  ownerId?: string;
}

export function getOfficePreviewKind(filename: string): OfficePreviewKind {
  const name = (filename || '').trim();
  if (DOCX_EXTENSIONS.test(name)) return 'docx';
  if (EXCEL_EXTENSIONS.test(name)) return 'xlsx';
  if (LEGACY_WORD_EXTENSIONS.test(name)) return 'legacy_office';
  return null;
}

export async function fetchArrayBuffer(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  return res.arrayBuffer();
}

/**
 * Office dosyaları için tercih sırası:
 * 1) API download (auth + CORS sorunu yok)
 * 2) previewUrl fetch (local object URL / public)
 */
export async function loadOfficeArrayBuffer(
  previewUrl: string | undefined,
  asset?: OfficeAssetRef | null,
): Promise<ArrayBuffer> {
  if (asset?.key) {
    try {
      const blob = await contentAssetService.downloadAsset({
        key: asset.key,
        type: asset.type || 'question-attachment',
        entityId: asset.entityId,
        ownerId: asset.ownerId,
      });
      return blob.arrayBuffer();
    } catch {
      // fall through to URL fetch
    }
  }
  if (!previewUrl) throw new Error('No preview URL or asset key');
  return fetchArrayBuffer(previewUrl);
}

export interface ExcelPreviewData {
  sheetNames: string[];
  activeSheet: string;
  rows: string[][];
  truncated: boolean;
}

export function parseExcelWorkbook(
  arrayBuffer: ArrayBuffer,
  sheetName?: string,
): ExcelPreviewData {
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
  const sheetNames = workbook.SheetNames;
  if (!sheetNames.length) {
    return { sheetNames: [], activeSheet: '', rows: [], truncated: false };
  }
  const activeSheet = sheetName && sheetNames.includes(sheetName) ? sheetName : sheetNames[0];
  const sheet = workbook.Sheets[activeSheet];
  const raw = XLSX.utils.sheet_to_json<(string | number | boolean | Date | null)[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  }) as unknown[][];

  const truncated = raw.length > EXCEL_MAX_ROWS || raw.some((r) => (r?.length ?? 0) > EXCEL_MAX_COLS);
  const rows = raw.slice(0, EXCEL_MAX_ROWS).map((row) => {
    const cells = Array.isArray(row) ? row : [];
    return cells.slice(0, EXCEL_MAX_COLS).map((cell) => {
      if (cell == null) return '';
      if (cell instanceof Date) return cell.toLocaleString();
      return String(cell);
    });
  });

  const colCount = Math.min(
    EXCEL_MAX_COLS,
    Math.max(1, ...rows.map((r) => r.length), 0),
  );
  const normalized = rows.map((r) => {
    const next = [...r];
    while (next.length < colCount) next.push('');
    return next;
  });

  return { sheetNames, activeSheet, rows: normalized, truncated };
}
