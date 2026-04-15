import MarkdownIt from 'markdown-it';
import type { ContentItem } from './parser.js';

export const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: false,
  xhtmlOut: false,
  breaks: false,
});

// Patch: allow ATX headings without a space after # (e.g. #heading).
// CommonMark requires a space; remark/marked.js does not. This restores compat.
md.block.ruler.at('heading', function (state, startLine, _endLine, silent) {
  let pos = state.bMarks[startLine] + state.tShift[startLine];
  const max = state.eMarks[startLine];

  if (state.sCount[startLine] - state.blkIndent >= 4) return false;

  let ch = state.src.charCodeAt(pos);
  if (ch !== 0x23 /* # */ || pos >= max) return false;

  let level = 1;
  ch = state.src.charCodeAt(++pos);
  while (ch === 0x23 /* # */ && pos < max && level <= 6) {
    level++;
    ch = state.src.charCodeAt(++pos);
  }

  // Changed from original: allow heading content immediately after # with no space.
  if (level > 6) return false;

  if (silent) return true;

  // Trim trailing hashes: "## heading ##" → "heading"
  let end = state.skipSpacesBack(max, pos);
  const tmp = state.skipCharsBack(end, 0x23 /* # */, pos);
  if (tmp > pos && state.src.charCodeAt(tmp - 1) === 0x20 /* space */) end = tmp;

  state.line = startLine + 1;

  const tokenOpen = state.push('heading_open', 'h' + level, 1);
  tokenOpen.markup = '########'.slice(0, level);
  tokenOpen.map = [startLine, state.line];

  const tokenInline = state.push('inline', '', 0);
  tokenInline.content = state.src.slice(pos, end).trim();
  tokenInline.map = [startLine, state.line];
  tokenInline.children = [];

  const tokenClose = state.push('heading_close', 'h' + level, -1);
  tokenClose.markup = '########'.slice(0, level);

  return true;
});

const _el = document.createElement('div');

export function convertMarkdown(content: ContentItem[] | undefined, links: Record<string, { href: string; title?: string }> = {}, inline = false): string {
  if (!content || content.length === 0) return '';
  const env: { links?: Record<string, { href: string; title?: string }> } = { links };
  return postProcessHtml(renderContent(content, env), inline);
}

/**
 * Like `convertMarkdown` but supports an optional async `renderer` callback.
 * When provided, the callback replaces `md.render()` — it receives the same raw markdown
 * string (per-slide) and must return HTML. Falls back to the built-in renderer on null or error.
 */
export async function convertMarkdownAsync(
  content: ContentItem[] | undefined,
  links: Record<string, { href: string; title?: string }> = {},
  inline = false,
  renderer?: (markdown: string) => string | null | Promise<string | null>,
): Promise<string> {
  if (!content || content.length === 0) return '';
  const env: { links?: Record<string, { href: string; title?: string }> } = { links };
  // When a custom renderer is provided, collect the full raw markdown and pass it through,
  // falling back to the built-in pipeline on null or error.
  if (renderer) {
    const raw = buildRawMarkdown(content);
    try {
      const result = await Promise.resolve(renderer(raw));
      if (result != null) return postProcessHtml(result, inline);
    } catch (err) {
      console.error('[mdeck] markdownRenderer failed, using built-in renderer', err);
    }
  }
  return postProcessHtml(renderContent(content, env), inline);
}

/** Apply mdeck's standard HTML post-processing (strip empty paragraphs, handle inline mode). */
export function postProcessHtml(html: string, inline = false): string {
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

/**
 * Render content items to final HTML.
 * Block content classes are rendered independently to avoid the CommonMark HTML block
 * type-6 problem: <div> blocks in a markdown stream terminate at the first blank line,
 * which would cut off code blocks inside .left-column/.right-column etc.
 */
function renderContent(content: ContentItem[], env: { links?: Record<string, { href: string; title?: string }> }): string {
  let html = '';
  let pendingMarkdown = '';

  const flushMarkdown = () => {
    if (pendingMarkdown) {
      html += md.render(pendingMarkdown, env);
      pendingMarkdown = '';
    }
  };

  for (const item of content) {
    if (typeof item === 'string') {
      pendingMarkdown += item;
    } else if (item.block) {
      // Flush any preceding raw markdown before inserting the block div.
      // This prevents the outer md.render() from ever seeing a <div> + blank-line combo.
      flushMarkdown();
      const innerHtml = renderContent(item.content, env);
      html += `<div class="${item.class}">${innerHtml}</div>\n`;
    } else {
      // Inline span: stays in the markdown stream.
      // <span> is not a CommonMark block-level element so markdown inside it is still processed.
      pendingMarkdown += `<span class="${item.class}">${buildRawMarkdown(item.content)}</span>`;
    }
  }

  flushMarkdown();
  return html;
}

/** Recursively concatenate content items into a single raw markdown string (no rendering). */
function buildRawMarkdown(content: ContentItem[]): string {
  let markdown = '';
  for (const item of content) {
    if (typeof item === 'string') {
      markdown += item;
    } else {
      const tag = item.block ? 'div' : 'span';
      markdown += `<${tag} class="${item.class}">${buildRawMarkdown(item.content)}</${tag}>`;
    }
  }
  return markdown;
}
