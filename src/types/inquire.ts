export type InquireContentType = 'question' | 'answer';

export type InquireContentRef = {
  id: string;
  contentType: InquireContentType;
  label?: string;
};

export type InquireGraphNode = {
  id: string;
  contentType: InquireContentType;
  label: string;
  questionId?: string;
  parent?: { id: string; contentType: InquireContentType };
  onPath?: boolean;
};

export type InquireGraphEdge = {
  from: string;
  to: string;
  kind: 'parent';
  onPath?: boolean;
};

export type InquireGraphResponse = {
  paths: Array<{ nodeIds: string[] }>;
  nodes: InquireGraphNode[];
  edges: InquireGraphEdge[];
};

export type InquireNodePosition = {
  id: string;
  x: number;
  y: number;
  z: number;
};
