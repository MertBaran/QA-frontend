export const actions = {
  delete: {
    tr: 'Sil',
    en: 'Delete',
    de: 'Löschen',
  },
  delete_question: {
    tr: 'Soruyu Sil',
    en: 'Delete Question',
    de: 'Frage löschen',
  },
  delete_answer: {
    tr: 'Cevabı Sil',
    en: 'Delete Answer',
    de: 'Antwort löschen',
  },
  confirm_delete: {
    tr: 'Silmek istediğinize emin misiniz?',
    en: 'Are you sure you want to delete?',
    de: 'Sind Sie sicher, dass Sie löschen möchten?',
  },
  delete_success: {
    tr: 'Başarıyla silindi',
    en: 'Successfully deleted',
    de: 'Erfolgreich gelöscht',
  },
  delete_failed: {
    tr: 'Silme işlemi başarısız oldu',
    en: 'Delete operation failed',
    de: 'Löschvorgang fehlgeschlagen',
  },
} as const;
