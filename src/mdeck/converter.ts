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
  const env = buildEnv(links);
  return postProcessHtml(renderContent(content, env), inline);
}

/**
 * Like `convertMarkdown` but supports an optional async `renderer` callback.
 * When provided, the callback is used to render raw markdown text chunks while block/inline
 * CSS class structures (`.class[...]`) are handled structurally by mdeck itself.
 * Falls back to the built-in renderer on null or error.
 *
 * Note: because `.class[...]` blocks are rendered independently, per-slide features
 * that collect state across the whole markdown string (e.g. TOC, anchors) may not
 * work correctly when mixed with CSS-class blocks on the same slide.
 */
export async function convertMarkdownAsync(
  content: ContentItem[] | undefined,
  links: Record<string, { href: string; title?: string }> = {},
  inline = false,
  renderer?: (markdown: string) => string | null | Promise<string | null>,
): Promise<string> {
  if (!content || content.length === 0) return '';
  const env = buildEnv(links);
  if (renderer) {
    try {
      const html = await renderContentWithRenderer(content, env, renderer);
      return postProcessHtml(html, inline);
    } catch (err) {
      console.error('[mdeck] markdownRenderer failed, using built-in renderer', err);
    }
  }
  return postProcessHtml(renderContent(content, env), inline);
}

/**
 * Async variant of `renderContent` that uses a custom renderer for raw markdown text chunks.
 *
 * Block CSS-class containers are handled structurally (rendered as `<div class="...">...</div>`).
 * Inline CSS-class spans use a placeholder in the pending markdown so they remain inline in the
 * paragraph flow. Their inner content is rendered through the custom renderer first (preserving
 * markdown-in-spans support and security), then injected after the outer chunk is rendered.
 */
async function renderContentWithRenderer(
  content: ContentItem[],
  env: MdEnv,
  renderer: (markdown: string) => string | null | Promise<string | null>,
  _isRoot = true,
): Promise<string> {
  let html = '';
  let pendingMarkdown = (_isRoot && env._linkDefs) ? env._linkDefs : '';
  let spanPlaceholders: Array<{ placeholder: string; spanHtml: string }> = [];
  let spanCount = 0;

  const flushMarkdown = async () => {
    if (pendingMarkdown) {
      const chunk = pendingMarkdown;
      const currentPlaceholders = [...spanPlaceholders];
      pendingMarkdown = '';
      spanPlaceholders = [];
      let rendered: string;
      try {
        const result = await Promise.resolve(renderer(chunk));
        rendered = result != null ? result : md.render(chunk, env);
      } catch {
        rendered = md.render(chunk, env);
      }
      for (const { placeholder, spanHtml } of currentPlaceholders) {
        rendered = rendered.split(placeholder).join(spanHtml);
      }
      html += rendered;
    }
  };

  for (const item of content) {
    if (typeof item === 'string') {
      pendingMarkdown += item;
    } else if (item.block) {
      await flushMarkdown();
      const innerHtml = await renderContentWithRenderer(item.content, env, renderer, false);
      html += `<div class="${item.class}">${innerHtml}</div>\n`;
    } else {
      // Inline span: use a placeholder so the span stays inline within the paragraph flow.
      // The inner content is rendered through the custom renderer (for markdown support and
      // security), then the outer <p> wrapper is stripped for inline use via postProcessHtml.
      const placeholder = `MDECKSPAN${spanCount++}MDECKSPAN`;
      const innerHtml = await renderContentWithRenderer(item.content, env, renderer, false);
      const inlineInner = postProcessHtml(innerHtml, true);
      spanPlaceholders.push({
        placeholder,
        spanHtml: `<span class="${item.class}">${inlineInner}</span>`,
      });
      pendingMarkdown += placeholder;
    }
  }

  await flushMarkdown();
  return html;
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

type MdEnv = { links?: Record<string, { href: string; title?: string }>; _linkDefs?: string };

/**
 * Build the markdown-it `env` object from a links map.
 * Link definitions are serialized as `[id]: url "title"` and prepended to the first
 * markdown chunk so markdown-it can resolve reference-style links natively.
 */
function buildEnv(links: Record<string, { href: string; title?: string }>): MdEnv {
  const defs = Object.entries(links).map(([k, { href, title }]) =>
    title ? `[${k}]: ${href} "${title}"\n` : `[${k}]: ${href}\n`
  ).join('');
  return { links, _linkDefs: defs };
}

/**
 * Render content items to final HTML.
 * Block content classes are rendered independently to avoid the CommonMark HTML block
 * type-6 problem: <div> blocks in a markdown stream terminate at the first blank line,
 * which would cut off code blocks inside .left-column/.right-column etc.
 */
function renderContent(content: ContentItem[], env: MdEnv, _isRoot = true): string {
  let html = '';
  // Prepend link definitions on the root call so reference-style links resolve correctly.
  let pendingMarkdown = (_isRoot && env._linkDefs) ? env._linkDefs : '';

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
      const innerHtml = renderContent(item.content, env, false);
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
