/** Backend QuestionFeatureTemplate + Version (Prisma JSON fields) */

export type TableColumnType = 'number' | 'text' | 'date' | 'list';
export type FeatureFieldType = TableColumnType | 'table';

export interface TableColumnDef {
  columnId: string;
  title: string;
  type: TableColumnType;
  listAllowMultiple?: boolean;
  options?: string[];
}

/** Satır değerleri (anahtar = columnId) */
export type FeatureTableRow = Record<string, string | number | null | string[]>;

export interface QuestionFeatureFieldDef {
  fieldId: string;
  title: string;
  type: FeatureFieldType;
  required: boolean;
  /** Liste alanında birden fazla seçenek işaretlenebilir */
  listAllowMultiple?: boolean;
  options?: string[];
  columns?: TableColumnDef[];
  defaultValue?: string | number | null | string[] | FeatureTableRow[];
}

export interface QuestionFeatureTemplateVersion {
  id: string;
  templateId: string | null;
  version: number;
  fields: unknown;
  createdAt: string;
  createdByUserId: string | null;
}

export interface QuestionFeatureTemplate {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  currentVersionId: string | null;
  createdAt: string;
  updatedAt: string;
  currentVersion?: QuestionFeatureTemplateVersion | null;
  versions?: QuestionFeatureTemplateVersion[];
}

export interface TableColumnInputPayload {
  columnId?: string;
  title: string;
  type: TableColumnType;
  listAllowMultiple?: boolean;
  options?: string[];
}

export interface CreateQuestionFeatureTemplatePayload {
  name: string;
  description?: string;
  fields: FeatureFieldInputPayload[];
}

export interface UpdateQuestionFeatureTemplatePayload {
  name?: string;
  description?: string | null;
  fields?: FeatureFieldInputPayload[];
}

export interface FeatureFieldInputPayload {
  fieldId?: string;
  title: string;
  type: FeatureFieldType;
  required?: boolean;
  listAllowMultiple?: boolean;
  options?: string[];
  columns?: TableColumnInputPayload[];
  defaultValue?: string | number | null | string[] | FeatureTableRow[];
}
