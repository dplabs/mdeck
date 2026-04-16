import EventEmitter from 'eventemitter3';
import { convertMarkdown } from './converter.js';
import { Parser } from './parser.js';
import { Slideshow, type SlideshowOptions } from './models/slideshow.js';
import { SlideshowView } from './views/slideshowView.js';
import { DefaultController } from './controllers/defaultController.js';
import { Dom } from './dom.js';
import macros from './macros.js';
import { styler } from './components/styler/styler.js';

// Re-export extensibility surface
export { md as markdownIt } from './converter.js';
export { engine as highlighter } from './highlighter.js';
export { version } from './resources.js';
export { default as macros } from './macros.js';
export type { SlideshowOptions } from './models/slideshow.js';

const _dom = new Dom();

/**
 * Create and mount a slideshow. If no `source` or `sourceUrl` is provided,
 * the content of `<textarea id="source">` is used automatically.
 */
export function createSlideshow(options: SlideshowOptions = {}, callback?: (slideshow: Slideshow) => void): Slideshow {
  options = applyDefaults(_dom, options);

  if (options.highlightStyle) styler.injectHighlightTheme(options.highlightStyle);

  const events = new EventEmitter();

  const slideshow = new Slideshow(events, _dom, options, (ss) => {
    const slideshowView = new SlideshowView(events, _dom, options, ss);
    if (!options.controller) {
      new DefaultController(events, _dom, slideshowView, (options.navigation ?? {}) as Record<string, unknown>);
    }
    callback?.(ss);
  });

  return slideshow;
}

/**
 * Convert a markdown string to HTML (single-slide, inline rendering).
 */
export function convert(markdown: string): string {
  const parser = new Parser();
  const content = parser.parse(markdown || '', macros)[0].content;
  return convertMarkdown(content, {}, true);
}

function applyDefaults(dom: Dom, options: SlideshowOptions): SlideshowOptions {
  if (!('source' in options) && !('sourceUrl' in options)) {
    const sourceElement = dom.getElementById('source');
    if (sourceElement) {
      options.source = unescapeHtml((sourceElement as HTMLTextAreaElement).value || sourceElement.innerHTML);
      (sourceElement as HTMLElement).style.display = 'none';
    }
  }

  if (!(options.container instanceof HTMLElement)) {
    options.container = dom.getBodyElement();
  }

  return options;
}

function unescapeHtml(source: string): string {
  source = source.replace(/&[l|g]t;/g, (m) => m === '&lt;' ? '<' : '>');
  source = source.replace(/&amp;/g, '&');
  source = source.replace(/&quot;/g, '"');
  return source;
}
