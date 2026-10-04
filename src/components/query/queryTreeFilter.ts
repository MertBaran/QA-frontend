import type { QueryFieldDef, QueryNode } from '../../types/query';

/** Keep only clauses whose fields exist in the entity catalog. */
export function filterTreeForFields(
  node: QueryNode,
  allowedKeys: Set<string>
): QueryNode | null {
  if (node.type === 'clause') {
    return allowedKeys.has(node.field) ? node : null;
  }
  const children = node.children
    .map(c => filterTreeForFields(c, allowedKeys))
    .filter((c): c is QueryNode => c != null);
  if (children.length === 0) return null;
  return { type: 'group', combinator: node.combinator, children };
}

export function fieldKeySet(fields: QueryFieldDef[]): Set<string> {
  return new Set(fields.map(f => f.key));
}

export function mergeFieldCatalogs(
  questionFields: QueryFieldDef[],
  answerFields: QueryFieldDef[]
): QueryFieldDef[] {
  const map = new Map<string, QueryFieldDef>();
  for (const f of questionFields) map.set(f.key, f);
  for (const f of answerFields) {
    if (!map.has(f.key)) map.set(f.key, f);
  }
  return [...map.values()];
}
