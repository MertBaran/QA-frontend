import { visit } from 'unist-util-visit';
import type { Root, PhrasingContent } from 'mdast';
import { DEFAULT_HIGHLIGHT_BG } from './mdHighlightStyle';
import { MD_STYLE_WRAP_FIND_RE, parseStyleAttrs } from './mdInlineStyleSyntax';

/**
 * Inline markdown extensions:
 * - ==highlighted text==
 * - {bg:#FFE082}(text)
 * - {color:#e53935}(text)
 * - {color:#e53935;bg:#FFE082}(text)  — font + highlight together
 */
const INLINE_STYLE_RE = new RegExp(
  `==((?:(?!==)[\\s\\S])+?)==|${MD_STYLE_WRAP_FIND_RE.source}`,
  'g',
);

function styledNode(attrs: { color?: string; bg?: string }, text: string): PhrasingContent {
  const hasBg = Boolean(attrs.bg);
  const hasColor = Boolean(attrs.color);

  if (hasBg) {
    return {
      type: 'strong',
      data: {
        hName: 'mark',
        hProperties: {
          className: ['md-highlight', ...(hasColor ? ['md-color'] : [])],
          'data-md-bg': attrs.bg,
          ...(hasColor ? { 'data-md-color': attrs.color } : {}),
        },
      },
      children: [{ type: 'text', value: text }],
    };
  }

  return {
    type: 'emphasis',
    data: {
      hName: 'span',
      hProperties: {
        'data-md-color': attrs.color,
        className: ['md-color'],
      },
    },
    children: [{ type: 'text', value: text }],
  };
}

function splitStyledText(value: string): PhrasingContent[] {
  const nodes: PhrasingContent[] = [];
  let lastIndex = 0;
  const re = new RegExp(INLINE_STYLE_RE.source, 'g');
  let match: RegExpExecArray | null;

  while ((match = re.exec(value)) !== null) {
    if (match.index > lastIndex) {
      nodes.push({ type: 'text', value: value.slice(lastIndex, match.index) });
    }

    if (match[1] != null) {
      nodes.push(styledNode({ bg: DEFAULT_HIGHLIGHT_BG }, match[1]));
    } else if (match[2] != null && match[3] != null) {
      nodes.push(styledNode(parseStyleAttrs(match[2]), match[3]));
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < value.length) {
    nodes.push({ type: 'text', value: value.slice(lastIndex) });
  }

  return nodes;
}

export function remarkInlineStyles() {
  return (tree: Root) => {
    visit(tree, 'text', (node, index, parent) => {
      if (index == null || !parent) return;

      const value = node.value;
      if (!value.includes('==') && !value.includes('{color:') && !value.includes('{bg:')) {
        return;
      }

      const parts = splitStyledText(value);
      if (parts.length === 0 || (parts.length === 1 && parts[0].type === 'text')) {
        return;
      }

      parent.children.splice(index, 1, ...parts);
      return index + parts.length;
    });
  };
}
