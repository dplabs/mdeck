import MarkdownIt from 'markdown-it';
import type { ContentItem } from './parser.js';

export const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: false,
  xhtmlOut: false,
  breaks: false,
});

const _el = document.createElement('div');

export function convertMarkdown(content: ContentItem[] | undefined, links: Record<string, { href: string; title?: string }> = {}, inline = false): string {
  if (!content || content.length === 0) return '';
  const raw = buildMarkdown(content);
  // Pass links to markdown-it env
  const env: { links?: Record<string, { href: string; title?: string }> } = { links };
  let html = md.render(raw, env);
  html = html.replace(/<p>\s*<\/p>/g, '');
  html = html.replace(/\n\r?$/, '');

  if (inline) {
    _el.innerHTML = html;
    if (_el.children.length === 1 && _el.children[0].tagName === 'P') {
      return _el.children[0].innerHTML;
    }
  }

  return html;
}

function buildMarkdown(content: ContentItem[]): string {
  let markdown = '';
  for (const item of content) {
    if (typeof item === 'string') {
      markdown += item;
    } else {
      const tag = item.block ? 'div' : 'span';
      markdown += `<${tag} class="${item.class}">`;
      markdown += buildMarkdown(item.content);
      markdown += `</${tag}>`;
    }
  }
  return markdown;
}
