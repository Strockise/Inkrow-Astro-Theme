/**
 * Renders Strapi "blocks" rich text to HTML that matches Webflow's rich-text output,
 * so the existing `.w-richtext` styles apply unchanged.
 */
type Node = {
  type: string;
  text?: string;
  children?: Node[];
  level?: number;
  format?: 'ordered' | 'unordered';
  url?: string;
  image?: { url: string; alternativeText?: string | null; width?: number; height?: number };
  language?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function text(node: Node) {
  let out = esc(node.text ?? '').replace(/\n/g, '<br/>');
  if (node.code) out = `<code>${out}</code>`;
  if (node.strikethrough) out = `<s>${out}</s>`;
  if (node.underline) out = `<u>${out}</u>`;
  if (node.italic) out = `<em>${out}</em>`;
  if (node.bold) out = `<strong>${out}</strong>`;
  return out;
}

function children(nodes: Node[] = [], resolveUrl: (u: string) => string) {
  return nodes.map((n) => render(n, resolveUrl)).join('');
}

function render(node: Node, resolveUrl: (u: string) => string): string {
  const inner = () => children(node.children, resolveUrl);
  switch (node.type) {
    case 'text':
      return text(node);
    case 'link':
      return `<a href="${esc(node.url ?? '#')}">${inner()}</a>`;
    case 'paragraph':
      return `<p>${inner()}</p>`;
    case 'heading':
      return `<h${node.level}>${inner()}</h${node.level}>`;
    case 'list': {
      const tag = node.format === 'ordered' ? 'ol' : 'ul';
      return `<${tag} role="list">${inner()}</${tag}>`;
    }
    case 'list-item':
      return `<li>${inner()}</li>`;
    case 'quote':
      return `<blockquote>${inner()}</blockquote>`;
    case 'code':
      return `<pre><code>${esc((node.children ?? []).map((c) => c.text ?? '').join(''))}</code></pre>`;
    case 'image': {
      const img = node.image;
      if (!img) return '';
      return `<figure class="w-richtext-align-fullwidth w-richtext-figure-type-image"><div><img src="${esc(resolveUrl(img.url))}" alt="${esc(img.alternativeText ?? '')}" loading="lazy"/></div></figure>`;
    }
    default:
      return inner();
  }
}

export function blocksToHtml(blocks: unknown[], resolveUrl: (u: string) => string = (u) => u) {
  return children(blocks as Node[], resolveUrl);
}
