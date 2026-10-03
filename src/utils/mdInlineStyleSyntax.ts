import { DEFAULT_HIGHLIGHT_BG } from './mdHighlightStyle';

export type MdInlineStyleAttrs = {
  color?: string;
  bg?: string;
};

const ATTR = '(?:color|bg):#[0-9A-Fa-f]{3,8}';
const ATTRS = `(?:${ATTR})(?:;(?:${ATTR}))*`;

/** Whole-string wrap: {color:#x;bg:#y}(inner) */
export const MD_STYLE_WRAP_EXACT_RE = new RegExp(`^\\{(${ATTRS})\\}\\(([^)]*)\\)$`);

/** Find wraps in a larger string */
export const MD_STYLE_WRAP_FIND_RE = new RegExp(`\\{(${ATTRS})\\}\\(([^)]*)\\)`, 'g');

export const MD_EQ_HIGHLIGHT_FIND_RE = /==((?:(?!==)[\s\S])+?)==/g;

export function parseStyleAttrs(attrStr: string): MdInlineStyleAttrs {
  const attrs: MdInlineStyleAttrs = {};
  for (const part of attrStr.split(';')) {
    const idx = part.indexOf(':');
    if (idx < 0) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if ((key === 'color' || key === 'bg') && value) {
      attrs[key] = value;
    }
  }
  return attrs;
}

export function formatStyleWrap(attrs: MdInlineStyleAttrs, inner: string): string {
  const parts: string[] = [];
  if (attrs.color) parts.push(`color:${attrs.color}`);
  if (attrs.bg) parts.push(`bg:${attrs.bg}`);
  return `{${parts.join(';')}}(${inner})`;
}

export function parseExactStyleWrap(
  selected: string,
): { attrs: MdInlineStyleAttrs; inner: string } | null {
  const m = selected.match(MD_STYLE_WRAP_EXACT_RE);
  if (!m) return null;
  const attrs = parseStyleAttrs(m[1]);
  if (!attrs.color && !attrs.bg) return null;
  return { attrs, inner: m[2] };
}

export function findEnclosingStyleWrap(
  md: string,
  start: number,
  end: number,
): { start: number; end: number; attrs: MdInlineStyleAttrs; inner: string } | null {
  MD_STYLE_WRAP_FIND_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = MD_STYLE_WRAP_FIND_RE.exec(md)) !== null) {
    const wrapStart = m.index;
    const wrapEnd = m.index + m[0].length;
    if (start >= wrapStart && end <= wrapEnd) {
      return {
        start: wrapStart,
        end: wrapEnd,
        attrs: parseStyleAttrs(m[1]),
        inner: m[2],
      };
    }
    if (wrapStart > end) break;
  }

  MD_EQ_HIGHLIGHT_FIND_RE.lastIndex = 0;
  while ((m = MD_EQ_HIGHLIGHT_FIND_RE.exec(md)) !== null) {
    const wrapStart = m.index;
    const wrapEnd = m.index + m[0].length;
    if (start >= wrapStart && end <= wrapEnd) {
      return {
        start: wrapStart,
        end: wrapEnd,
        attrs: { bg: DEFAULT_HIGHLIGHT_BG },
        inner: m[1],
      };
    }
    if (wrapStart > end) break;
  }

  return null;
}
