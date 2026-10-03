/**
 * Soru silme ve ActionButtons ile aynı tema bazlı “negatif” renk (çöp kutusu vb.).
 */
export function getNegativeActionColor(themeName: string, mode: 'light' | 'dark'): string {
  if (themeName === 'molume') return '#FF3B30';
  if (themeName === 'papirus') return mode === 'dark' ? '#A0522D' : '#8B4513';
  return '#DB7093';
}
