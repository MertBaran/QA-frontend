export type QueryEntity = 'question' | 'answer' | 'user';

export type QueryOp =
  | '='
  | '!='
  | '>'
  | '>='
  | '<'
  | '<='
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'in'
  | 'notIn'
  | 'isEmpty'
  | 'isNotEmpty'
  | 'directChildOf'
  | 'childAtDepth'
  | 'descendantOf'
  | 'directParentOf'
  | 'parentAtDepth'
  | 'ancestorOf';

export type QueryCombinator = 'AND' | 'OR';

export type QueryNode =
  | { type: 'clause'; field: string; op: QueryOp; value?: unknown }
  | { type: 'group'; combinator: QueryCombinator; children: QueryNode[] };

export type QueryFieldDef = {
  key: string;
  labelKey: string;
  label?: string;
  group?: string;
  type:
    | 'text'
    | 'string'
    | 'number'
    | 'date'
    | 'enum'
    | 'string[]'
    | 'boolean'
    | 'tree'
    | 'user'
    | 'feature';
  ops: QueryOp[];
  valueSource?: 'tags' | 'category' | 'users' | 'content' | 'featureOptions';
  options?: string[];
  optionLabels?: Record<string, string>;
  templateId?: string;
  fieldId?: string;
  featureType?: 'number' | 'text' | 'date' | 'list' | 'table';
};

export type QueryRowEntity = 'question' | 'answer';

export type FlatClauseRow = {
  id: string;
  /** Per-row type column — drives which fields are available */
  entity: QueryRowEntity;
  combinator: QueryCombinator;
  indent: number;
  field: string;
  op: QueryOp;
  value: unknown;
  selected: boolean;
};

export type QueryPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type QueryMatchExplanation = {
  field: string;
  op: QueryOp;
  value?: unknown;
  labelKey: string;
  label?: string;
  group?: string;
};
