import type { QuestionMetadataItem, QuestionReference } from '../types/question';

export function filledReferences(items?: QuestionReference[]): QuestionReference[] {
  return (items ?? []).filter(item => item.content?.trim());
}

export function referenceNeedsDescription(type: string): boolean {
  return type === 'soru' || type === 'cevap' || type === 'yorum';
}

export function filledMetadata(items?: QuestionMetadataItem[]): QuestionMetadataItem[] {
  return (items ?? []).filter(item => item.key?.trim() && item.value?.trim());
}
