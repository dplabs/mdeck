import { describe, it, expect } from 'vitest';
import { Parser } from '../mdeck/parser.js';
import { Slideshow } from '../mdeck/models/slideshow.js';
import { convertMarkdown } from '../mdeck/converter.js';
import type { Dom } from '../mdeck/dom.js';
import EventEmitter from 'eventemitter3';

function makeDom(): Dom {
  return {
    getHTMLElement: () => document.documentElement,
    getBodyElement: () => document.body as HTMLBodyElement,
    getElementById: () => null,
    getLocationHash: () => '',
    setLocationHash: () => {},
    XMLHttpRequest: class {
      open() {}
      send() {}
      onload?: () => void;
      readyState = 0;
      status = 0;
      responseText = '';
    } as unknown as typeof XMLHttpRequest,
  } as unknown as Dom;
}

describe('incremental list items', () => {
  const src = `# Agenda

   - Testing Integrations
--
   - OpenAPI
--
   - Pact
--
   - Conclusions
--
   - Questions`;

  it('parses into 5 slides', () => {
    const parser = new Parser();
    expect(parser.parse(src)).toHaveLength(5);
  });

  it('renders each incremental slide with the correct number of list items', () => {
    const slideshow = new Slideshow(new EventEmitter(), makeDom(), {});
    slideshow.loadFromString(src);
    const slides = slideshow.getSlides();

    slides.forEach((slide, i) => {
      const html = convertMarkdown(slide.content);
      const liCount = (html.match(/<li>/g) || []).length;
      expect(liCount).toBe(i + 1);
    });
  });
});
