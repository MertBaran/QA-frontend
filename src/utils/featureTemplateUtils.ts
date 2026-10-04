import { format, isValid, parse } from 'date-fns';
import { parseISO } from 'date-fns';
import type {
  FeatureFieldType,
  QuestionFeatureFieldDef,
  TableColumnDef,
  TableColumnType,
  FeatureTableRow,
} from '../types/questionFeatureTemplate';
import { MAX_TABLE_TEXT_CELL_LENGTH } from '../constants/questionFeatureTemplateLimits';

/** Görüntüleme ve form değeri (soru özellik alanı tarih tipi) */
export const FEATURE_TEMPLATE_DATE_DISPLAY = 'dd.MM.yyyy HH:mm';

export function parseFeatureFieldDefs(raw: unknown): QuestionFeatureFieldDef[] {
  if (!Array.isArray(raw)) return [];
  const out: QuestionFeatureFieldDef[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const typ = String(o['type']) as FeatureFieldType;
    if (
      typeof o['fieldId'] !== 'string' ||
      typeof o['title'] !== 'string' ||
      !['number', 'text', 'date', 'list', 'table'].includes(typ)
    ) {
      continue;
    }
    if (typ === 'table') {
      if (!Array.isArray(o['columns'])) continue;
      const columns: TableColumnDef[] = [];
      for (const c of o['columns']) {
        if (!c || typeof c !== 'object') continue;
        const col = c as Record<string, unknown>;
        if (typeof col['columnId'] !== 'string' || typeof col['title'] !== 'string') continue;
        const ct = String(col['type']) as TableColumnType;
        if (!['number', 'text', 'date', 'list'].includes(ct)) continue;
        columns.push({
          columnId: col['columnId'],
          title: col['title'],
          type: ct,
          ...(col['listAllowMultiple'] === true ? { listAllowMultiple: true } : {}),
          ...(Array.isArray(col['options']) ? { options: col['options'] as string[] } : {}),
        });
      }
      if (columns.length === 0) continue;
      out.push({
        fieldId: o['fieldId'],
        title: o['title'],
        type: 'table',
        required: Boolean(o['required']),
        columns,
        ...(o['defaultValue'] !== undefined
          ? { defaultValue: o['defaultValue'] as QuestionFeatureFieldDef['defaultValue'] }
          : {}),
      });
      continue;
    }
    out.push({
      fieldId: o['fieldId'],
      title: o['title'],
      type: typ,
      required: Boolean(o['required']),
      ...(o['listAllowMultiple'] === true ? { listAllowMultiple: true } : {}),
      ...(Array.isArray(o['options']) ? { options: o['options'] as string[] } : {}),
      ...(o['defaultValue'] !== undefined
        ? {
            defaultValue: o['defaultValue'] as QuestionFeatureFieldDef['defaultValue'],
          }
        : {}),
    });
  }
  return out;
}

export function formatFeatureTemplateDate(d: Date): string {
  return format(d, FEATURE_TEMPLATE_DATE_DISPLAY);
}

/** Form/düzenleme için string → Date (görüntü formatı, ISO ve eski yyyy-MM-dd). */
export function parseFeatureTemplateDateInput(s: string): Date | null {
  const trimmed = (s ?? '').trim();
  if (!trimmed) return null;
  const ref = new Date(2000, 0, 1, 12, 0, 0);
  const fromDisplay = parse(trimmed, FEATURE_TEMPLATE_DATE_DISPLAY, ref);
  if (isValid(fromDisplay)) return fromDisplay;
  try {
    const iso = parseISO(trimmed);
    if (isValid(iso)) return iso;
  } catch {
    /* ignore */
  }
  const ymdHm = parse(trimmed, 'yyyy-MM-dd HH:mm', ref);
  if (isValid(ymdHm)) return ymdHm;
  const ymd = parse(trimmed, 'yyyy-MM-dd', ref);
  if (isValid(ymd)) return ymd;
  return null;
}

/** Yerel saat; HTML `datetime-local` değeri (yyyy-MM-ddTHH:mm). */
export function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** `datetime-local` çıktısı → Date (yerel). */
export function parseDatetimeLocalValue(s: string): Date | null {
  const t = (s ?? '').trim();
  if (!t) return null;
  const d = new Date(t);
  return isValid(d) ? d : null;
}

/** Detay paneli vb. için tek tip dd.MM.yyyy HH:mm; ayrıştılamazsa ham metin. */
export function normalizeFeatureDateDisplay(raw: string): string {
  const d = parseFeatureTemplateDateInput(raw);
  return d != null && isValid(d) ? formatFeatureTemplateDate(d) : raw;
}

export type FeatureFieldFormValue = string | string[] | FeatureTableRow[];

function defaultValueNonEmpty(f: QuestionFeatureFieldDef): boolean {
  const dv = f.defaultValue;
  if (dv === undefined || dv === null) return false;
  if (Array.isArray(dv)) return dv.length > 0;
  if (typeof dv === 'string') return dv.trim() !== '';
  return true;
}

function cloneTableDefault(rows: FeatureTableRow[]): FeatureTableRow[] {
  return rows.map((r) => {
    const o: FeatureTableRow = {};
    for (const k of Object.keys(r)) {
      const v = r[k];
      if (Array.isArray(v)) o[k] = [...v];
      else o[k] = v as string | number | null;
    }
    return o;
  });
}

/** Form state: metin / tek seçim / çoklu liste / tablo satırları */
export function initialFormValuesFromDefs(defs: QuestionFeatureFieldDef[]): Record<string, FeatureFieldFormValue> {
  const o: Record<string, FeatureFieldFormValue> = {};
  for (const f of defs) {
    if (f.type === 'table') {
      if (!defaultValueNonEmpty(f)) {
        o[f.fieldId] = [];
        continue;
      }
      const dv = f.defaultValue;
      if (Array.isArray(dv) && dv.length > 0 && typeof dv[0] === 'object' && dv[0] !== null) {
        o[f.fieldId] = cloneTableDefault(dv as FeatureTableRow[]);
      } else {
        o[f.fieldId] = [];
      }
      continue;
    }
    if (!defaultValueNonEmpty(f)) {
      o[f.fieldId] = f.type === 'list' && f.listAllowMultiple ? [] : '';
      continue;
    }
    const dv = f.defaultValue!;
    if (f.type === 'list' && f.listAllowMultiple && Array.isArray(dv)) {
      o[f.fieldId] = dv.map(String);
    } else if (f.type === 'date') {
      o[f.fieldId] = normalizeFeatureDateDisplay(String(dv));
    } else {
      o[f.fieldId] = String(dv);
    }
  }
  return o;
}

function normalizeTableCellForApi(col: TableColumnDef, v: unknown): string | number | null | string[] {
  if (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) {
    return null;
  }
  if (col.type === 'number') {
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : null;
  }
  if (col.type === 'date') {
    const parsed = parseFeatureTemplateDateInput(String(v));
    return parsed != null && isValid(parsed) ? format(parsed, "yyyy-MM-dd'T'HH:mm") : '';
  }
  if (col.type === 'list' && col.listAllowMultiple && Array.isArray(v)) {
    return v.map(String);
  }
  if (col.type === 'text') {
    const s = String(v);
    return s.length > MAX_TABLE_TEXT_CELL_LENGTH ? s.slice(0, MAX_TABLE_TEXT_CELL_LENGTH) : s;
  }
  return String(v);
}

export function normalizeTableRowForApi(row: FeatureTableRow, columns: TableColumnDef[]): FeatureTableRow {
  const out: FeatureTableRow = {};
  for (const c of columns) {
    out[c.columnId] = normalizeTableCellForApi(c, row[c.columnId]);
  }
  return out;
}

export function tableRowFromApiToForm(row: FeatureTableRow, columns: TableColumnDef[]): FeatureTableRow {
  const out: FeatureTableRow = {};
  for (const c of columns) {
    const v = row[c.columnId];
    if (v === undefined || v === null) {
      out[c.columnId] = null;
      continue;
    }
    if (c.type === 'date' && typeof v === 'string') {
      out[c.columnId] = normalizeFeatureDateDisplay(v);
    } else if (c.type === 'list' && c.listAllowMultiple && Array.isArray(v)) {
      out[c.columnId] = v.map(String);
    } else {
      out[c.columnId] = v as string | number;
    }
  }
  return out;
}

export function valuesFormToApi(
  raw: Record<string, FeatureFieldFormValue>,
  defs: QuestionFeatureFieldDef[],
): Record<string, string | number | null | string[] | FeatureTableRow[]> {
  const out: Record<string, string | number | null | string[] | FeatureTableRow[]> = {};
  for (const d of defs) {
    const v = raw[d.fieldId];
    if (d.type === 'table') {
      const cols = d.columns ?? [];
      const empty = v === undefined || !Array.isArray(v) || v.length === 0;
      if (empty) {
        if (!d.required) continue;
        out[d.fieldId] = [];
        continue;
      }
      out[d.fieldId] = (v as FeatureTableRow[]).map((row) => normalizeTableRowForApi(row, cols));
      continue;
    }
    const empty =
      v === undefined ||
      v === '' ||
      (Array.isArray(v) && v.length === 0);
    if (empty) {
      if (!d.required) continue;
      if (d.type === 'number') {
        out[d.fieldId] = null;
      } else if (d.type === 'list' && d.listAllowMultiple) {
        out[d.fieldId] = [];
      } else {
        out[d.fieldId] = '';
      }
      continue;
    }
    if (d.type === 'number') {
      const n = Number(v as string);
      out[d.fieldId] = Number.isFinite(n) ? n : null;
    } else if (d.type === 'date') {
      const parsed = parseFeatureTemplateDateInput(String(v));
      out[d.fieldId] =
        parsed != null && isValid(parsed) ? format(parsed, "yyyy-MM-dd'T'HH:mm") : '';
    } else if (d.type === 'list' && d.listAllowMultiple) {
      out[d.fieldId] = (v as string[]).map(String);
    } else {
      out[d.fieldId] = String(v);
    }
  }
  return out;
}

export function valuesApiToForm(
  apiVals: Record<string, unknown> | null | undefined,
  defs: QuestionFeatureFieldDef[],
): Record<string, FeatureFieldFormValue> {
  const o = initialFormValuesFromDefs(defs);
  if (!apiVals || typeof apiVals !== 'object') return o;
  for (const d of defs) {
    const v = apiVals[d.fieldId];
    if (d.type === 'table') {
      const cols = d.columns ?? [];
      if (!Array.isArray(v)) {
        o[d.fieldId] = [];
      } else {
        o[d.fieldId] = (v as FeatureTableRow[]).map((row) => tableRowFromApiToForm(row, cols));
      }
      continue;
    }
    if (v === undefined || v === null) {
      o[d.fieldId] = d.type === 'list' && d.listAllowMultiple ? [] : '';
    } else if (d.type === 'list' && d.listAllowMultiple && Array.isArray(v)) {
      o[d.fieldId] = v.map(String);
    } else if (d.type === 'date') {
      o[d.fieldId] = normalizeFeatureDateDisplay(String(v));
    } else {
      o[d.fieldId] = String(v);
    }
  }
  return o;
}

/** Tek satır özeti (liste / detay modalı) */
export function formatFeatureFieldSummary(def: QuestionFeatureFieldDef, raw: unknown): string {
  if (raw == null || raw === '') return '—';
  if (def.type === 'table' && Array.isArray(raw)) {
    const cols = def.columns?.length ?? 0;
    const rows = raw.length;
    return `${rows}×${cols}`;
  }
  if (def.type === 'list' && def.listAllowMultiple && Array.isArray(raw)) {
    return raw.map(String).join(', ');
  }
  if (def.type === 'date') {
    return normalizeFeatureDateDisplay(String(raw));
  }
  return String(raw);
}

/** Modal / clipboard için düz metin */
export function formatFeatureFieldDetailText(def: QuestionFeatureFieldDef, raw: unknown): string {
  if (def.type === 'table' && Array.isArray(raw) && def.columns?.length) {
    const cols = def.columns;
    const header = cols.map((c) => c.title).join('\t');
    const lines = (raw as FeatureTableRow[]).map((row) =>
      cols.map((c) => formatFeatureTableCellDisplay(c, row[c.columnId])).join('\t')
    );
    return [header, ...lines].join('\n');
  }
  return formatFeatureFieldSummary(def, raw);
}

/** Tablo hücresi görüntü metni (ör. soru detayı tablosu, pano metni) */
export function formatFeatureTableCellDisplay(col: TableColumnDef, v: unknown): string {
  if (v == null || v === '') return '';
  if (col.type === 'date') return normalizeFeatureDateDisplay(String(v));
  if (col.type === 'list' && col.listAllowMultiple && Array.isArray(v)) return v.map(String).join(', ');
  return String(v);
}

export function emptyTableRow(columns: TableColumnDef[]): FeatureTableRow {
  const r: FeatureTableRow = {};
  for (const c of columns) {
    r[c.columnId] =
      c.type === 'list' && c.listAllowMultiple ? [] : '';
  }
  return r;
}
