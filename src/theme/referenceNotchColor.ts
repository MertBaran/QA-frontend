/**
 * Referans çentiğindeki nokta: içerik varsa yeşil, yoksa boş renk.
 * Papirüste success kahverengi olduğu için dolu hali kahverengi, boş gri de yeşile kaçıyordu.
 */
export function referenceNotchColor(
  themeName: string,
  mode: 'light' | 'dark',
  hasContent: boolean,
): string {
  if (themeName === 'papirus') {
    const present = mode === 'dark' ? '#6E9A6A' : '#2F7D46';
    const absent = mode === 'dark' ? '#A67C52' : '#8D6E63';
    return hasContent ? present : absent;
  }
  return hasContent ? 'success.main' : 'grey.500';
}
