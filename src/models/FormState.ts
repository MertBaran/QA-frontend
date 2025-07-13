export interface FormState {
  drafts: Record<string, any>;
  lastVisited: Record<string, any>;
  searchHistory: Record<string, any[]>;
  filters: Record<string, any>;
  values: Record<string, any>;
  errors: Record<string, any>;
  isSubmitting: boolean;
}
