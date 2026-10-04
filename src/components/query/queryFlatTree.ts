import type {
  FlatClauseRow,
  QueryCombinator,
  QueryNode,
  QueryOp,
  QueryRowEntity,
} from '../../types/query';

export function createEmptyRow(
  combinator: QueryCombinator = 'AND',
  entity: QueryRowEntity = 'question'
): FlatClauseRow {
  return {
    id: crypto.randomUUID(),
    entity,
    combinator,
    indent: 0,
    field: '',
    op: 'contains',
    value: '',
    selected: false,
  };
}

/** Build a clause tree from rows of a single entity type only. */
export function flatToTreeForEntity(
  rows: FlatClauseRow[],
  entity: QueryRowEntity
): QueryNode {
  return flatToTree(rows.filter(r => r.entity === entity));
}

/**
 * Flat Azure-style rows → nested QueryNode tree.
 * Higher indent = nested group. Sibling combinator = first non-leading row's And/Or at that level.
 */
export function flatToTree(rows: FlatClauseRow[]): QueryNode {
  const valid = rows.filter(r => r.field && r.op);
  if (valid.length === 0) {
    return { type: 'group', combinator: 'AND', children: [] };
  }
  const [children, combinator] = parseLevel(valid, 0, 0) as [
    QueryNode[],
    QueryCombinator,
    number,
  ];
  return { type: 'group', combinator, children };
}

function parseLevel(
  rows: FlatClauseRow[],
  start: number,
  indent: number
): [QueryNode[], QueryCombinator, number] {
  const nodes: QueryNode[] = [];
  let combinator: QueryCombinator = 'AND';
  let i = start;

  while (i < rows.length && rows[i]!.indent >= indent) {
    if (rows[i]!.indent > indent) {
      const [nested, nestedComb, next] = parseLevel(rows, i, indent + 1);
      if (nested.length > 0) {
        nodes.push({ type: 'group', combinator: nestedComb, children: nested });
      }
      i = next;
      continue;
    }

    const row = rows[i]!;
    if (nodes.length > 0) {
      combinator = row.combinator;
    }
    i += 1;

    if (i < rows.length && rows[i]!.indent > indent) {
      const [nested, nestedComb, next] = parseLevel(rows, i, indent + 1);
      nodes.push({
        type: 'group',
        combinator: nestedComb,
        children: [
          {
            type: 'clause',
            field: row.field,
            op: row.op as QueryOp,
            value: row.value,
          },
          ...nested,
        ],
      });
      i = next;
    } else {
      nodes.push({
        type: 'clause',
        field: row.field,
        op: row.op as QueryOp,
        value: row.value,
      });
    }
  }

  return [nodes, combinator, i];
}

export function groupSelectedRows(rows: FlatClauseRow[]): FlatClauseRow[] {
  const selectedIdx = rows
    .map((r, i) => (r.selected ? i : -1))
    .filter(i => i >= 0);
  if (selectedIdx.length < 2) return rows;

  const min = Math.min(...selectedIdx);
  const max = Math.max(...selectedIdx);
  for (let i = min; i <= max; i++) {
    if (!rows[i]?.selected) return rows;
  }

  const baseIndent = Math.min(...selectedIdx.map(i => rows[i]!.indent));
  return rows.map((r, i) => {
    if (i < min || i > max) return r;
    return { ...r, indent: Math.min(baseIndent + 1, 5), selected: false };
  });
}

export function ungroupSelectedRows(rows: FlatClauseRow[]): FlatClauseRow[] {
  return rows.map(r => {
    if (!r.selected || r.indent <= 0) return { ...r, selected: false };
    return { ...r, indent: r.indent - 1, selected: false };
  });
}
