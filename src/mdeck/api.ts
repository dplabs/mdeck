import EventEmitter from 'eventemitter3';
import { engine as highlighter } from './highlighter.js';
import { convertMarkdown } from './converter.js';
import { Parser } from './parser.js';
import { Slideshow, type SlideshowOptions } from './models/slideshow.js';
import { SlideshowView } from './views/slideshowView.js';
import { DefaultController } from './controllers/defaultController.js';
import { Dom } from './dom.js';
import macros from './macros.js';
import { version } from './resources.js';

export { md as markdownIt } from './converter.js';

export class Api {
  macros = macros;
  highlighter = highlighter;
  version = version;
  dom: Dom;

  constructor(dom?: Dom) {
    this.dom = dom ?? new Dom();
  }

  convert(markdown: string): string {
    const parser = new Parser();
    const content = parser.parse(markdown || '', macros)[0].content;
    return convertMarkdown(content, {}, true);
  }

  create(options: SlideshowOptions, callback?: (slideshow: Slideshow) => void): Slideshow {
    const dom = this.dom;
    options = applyDefaults(dom, options);

    const events = new EventEmitter();

    const slideshow = new Slideshow(events, dom, options, (ss) => {
      const slideshowView = new SlideshowView(events, dom, options, ss);
      const controller = (options.controller as DefaultController) || new DefaultController(events, dom, slideshowView, (options.navigation ?? {}) as Record<string, unknown>);
      void controller;
      callback?.(ss);
    });

    return slideshow;
  }
}

function applyDefaults(dom: Dom, options: SlideshowOptions): SlideshowOptions {
  options = options || {};

  if (!('source' in options)) {
    const sourceElement = dom.getElementById('source');
    if (sourceElement) {
      options.source = unescape(sourceElement.innerHTML);
      (sourceElement as HTMLElement).style.display = 'none';
    }
  }

  if (!(options.container instanceof HTMLElement)) {
    options.container = dom.getBodyElement();
  }

  return options;
}

function unescape(source: string): string {
  source = source.replace(/&[l|g]t;/g, (m) => m === '&lt;' ? '<' : '>');
  source = source.replace(/&amp;/g, '&');
  source = source.replace(/&quot;/g, '"');
  return source;
}
