/**
 * Rehype plugin: [text](ref:N) link'lerini <a> yerine <span data-ref="N"> olarak render eder.
 * Böylece tıklanınca sayfa yönlendirmesi olmaz.
 */
import { visit } from 'unist-util-visit';
import type { Element } from 'hast';

export function rehypeRefLinks() {
  return (tree: import('hast').Root) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'a') return;
      const href = node.properties?.href;
      if (typeof href !== 'string') return;
      const refMatch = href.match(/^ref:(\d+)$/);
      if (!refMatch) return;

      node.tagName = 'span';
      delete node.properties!.href;
      (node.properties as Record<string, unknown>)['data-ref'] = refMatch[1];
      (node.properties as Record<string, unknown>).role = 'button';
      (node.properties as Record<string, unknown>).tabIndex = 0;
    });
  };
}
