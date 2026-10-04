/**
 * [text](ref:N) formatındaki referans linklerini sadece köşeli parantez içindeki metne çevirir.
 * Placeholder metinler (ref-N, ref-N soru vb.) tamamen kaldırılır.
 * Sadece görüntüleme (display) için kullanılır - oluşturma/düzenleme editöründe ham format kalmalı.
 */
export function stripRefLinksForDisplay(text: string | undefined | null): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\[([^\]]*)\]\(ref:\d+\)/g, (_, linkText) => {
      const t = (linkText || '').trim();
      if (!t || /^ref-\d+(\s|$)/.test(t)) return '';
      return t;
    })
    .replace(/\s{2,}/g, ' ');
}
