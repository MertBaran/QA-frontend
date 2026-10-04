import type {
  InquireGraphEdge,
  InquireGraphNode,
  InquireNodePosition,
} from '../../types/inquire';

const QUESTION_RING = 4.5;
const ANSWER_ORBIT = 1.35;
const PATH_SPACING = 3.2;

/**
 * Place path questions along X; answers orbit their parent question (or path slot).
 * Expanded (non-path) questions fan on a ring; their answers orbit them.
 */
export function layoutInquireGraph(
  nodes: InquireGraphNode[],
  edges: InquireGraphEdge[],
  pathNodeIds: string[]
): Map<string, InquireNodePosition> {
  const positions = new Map<string, InquireNodePosition>();
  const byId = new Map(nodes.map(n => [n.id, n]));

  const pathIds = pathNodeIds.filter(id => byId.has(id));
  const pathIndex = new Map(pathIds.map((id, i) => [id, i]));

  // Parent lookup from edges (child -> parent)
  const parentOf = new Map<string, string>();
  for (const e of edges) {
    if (e.kind === 'parent') parentOf.set(e.from, e.to);
  }

  const questionNodes = nodes.filter(n => n.contentType === 'question');
  const answerNodes = nodes.filter(n => n.contentType === 'answer');

  // Path questions first along X axis
  const pathQuestions = pathIds
    .map(id => byId.get(id))
    .filter((n): n is InquireGraphNode => !!n && n.contentType === 'question');

  pathQuestions.forEach((n, i) => {
    positions.set(n.id, {
      id: n.id,
      x: (i - (pathQuestions.length - 1) / 2) * PATH_SPACING,
      y: 0.4,
      z: 0,
    });
  });

  // Non-path questions on a ring
  const extraQuestions = questionNodes.filter(n => !positions.has(n.id));
  extraQuestions.forEach((n, i) => {
    const angle = (i / Math.max(extraQuestions.length, 1)) * Math.PI * 2;
    positions.set(n.id, {
      id: n.id,
      x: Math.cos(angle) * QUESTION_RING,
      y: -0.2,
      z: Math.sin(angle) * QUESTION_RING,
    });
  });

  // Answers: orbit parent question, or sit near path slot if parent unknown
  const answersByParent = new Map<string, InquireGraphNode[]>();
  for (const a of answerNodes) {
    const parentId =
      a.parent?.id ||
      parentOf.get(a.id) ||
      a.questionId ||
      '';
    const key = parentId && positions.has(parentId) ? parentId : '__orphan__';
    const list = answersByParent.get(key) || [];
    list.push(a);
    answersByParent.set(key, list);
  }

  for (const [parentId, answers] of answersByParent) {
    if (parentId === '__orphan__') {
      answers.forEach((a, i) => {
        const pathIdx = pathIndex.get(a.id);
        if (pathIdx !== undefined) {
          positions.set(a.id, {
            id: a.id,
            x: (pathIdx - (pathIds.length - 1) / 2) * (PATH_SPACING * 0.85),
            y: -0.9,
            z: 0.8,
          });
        } else {
          const angle = (i / Math.max(answers.length, 1)) * Math.PI * 2;
          positions.set(a.id, {
            id: a.id,
            x: Math.cos(angle) * (QUESTION_RING + 1.2),
            y: -1.2,
            z: Math.sin(angle) * (QUESTION_RING + 1.2),
          });
        }
      });
      continue;
    }

    const parentPos = positions.get(parentId)!;
    answers.forEach((a, i) => {
      const angle =
        (i / Math.max(answers.length, 1)) * Math.PI * 2 +
        (pathIndex.has(a.id) ? 0 : 0.4);
      const radius = pathIndex.has(a.id) ? ANSWER_ORBIT * 0.85 : ANSWER_ORBIT;
      positions.set(a.id, {
        id: a.id,
        x: parentPos.x + Math.cos(angle) * radius,
        y: parentPos.y - 0.55,
        z: parentPos.z + Math.sin(angle) * radius,
      });
    });
  }

  // Any remaining nodes
  let fallback = 0;
  for (const n of nodes) {
    if (positions.has(n.id)) continue;
    positions.set(n.id, {
      id: n.id,
      x: fallback * 1.2,
      y: 1.5,
      z: -QUESTION_RING,
    });
    fallback += 1;
  }

  return positions;
}
