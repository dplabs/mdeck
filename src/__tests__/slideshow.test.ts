import { describe, it, expect, beforeEach, vi } from 'vitest';
import EventEmitter from 'eventemitter3';
import { Slideshow } from '../mdeck/models/slideshow.js';
import type { Dom } from '../mdeck/dom.js';

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

/** Build a Dom whose XHR automatically resolves each URL to a given content map. */
function makeDomWithUrls(urlMap: Record<string, string>): Dom {
  const XHRMock = class {
    url = '';
    readyState = 0;
    status = 0;
    responseText = '';
    onload?: () => void;
    onerror?: () => void;
    open(_method: string, url: string) { this.url = url; }
    send() {
      // Resolve asynchronously so Promise.all works correctly
      Promise.resolve().then(() => {
        if (this.url in urlMap) {
          this.readyState = 4;
          this.status = 200;
          this.responseText = urlMap[this.url];
          this.onload?.();
        } else {
          this.onerror?.();
        }
      });
    }
  };
  return {
    getHTMLElement: () => document.documentElement,
    getBodyElement: () => document.body as HTMLBodyElement,
    getElementById: () => null,
    getLocationHash: () => '',
    setLocationHash: () => {},
    XMLHttpRequest: XHRMock as unknown as typeof XMLHttpRequest,
  } as unknown as Dom;
}

describe('Slideshow', () => {
  let events: EventEmitter;
  let slideshow: Slideshow;
  let dom: Dom;

  beforeEach(() => {
    events = new EventEmitter();
    dom = makeDom();
    slideshow = new Slideshow(events, dom, {});
  });

  describe('loading from string', () => {
    it('creates slides', () => {
      slideshow.loadFromString('a\n---\nb');
      expect(slideshow.getSlides()).toHaveLength(2);
    });

    it('assigns slide numbers sequentially', () => {
      slideshow.loadFromString('a\n---\nb\n---\nc');
      slideshow.getSlides().forEach((slide, i) => {
        expect(slide.getSlideNumber()).toBe(i + 1);
      });
    });

    it('replaces previous slides on reload', () => {
      slideshow.loadFromString('a\n---\nb\n---\nc');
      slideshow.loadFromString('x\n---\ny');
      expect(slideshow.getSlides()).toHaveLength(2);
    });

    it('collects styles from slides', () => {
      slideshow.loadFromString('<style>.red { color: red; }</style>\n# Slide 1');
      expect(slideshow.getStyles()).toContain('.red { color: red; }');
    });

    it('emits slidesChanged event', () => {
      const handler = vi.fn();
      events.on('slidesChanged', handler);
      slideshow.loadFromString('a\n---\nb');
      expect(handler).toHaveBeenCalledOnce();
    });
  });

  describe('getSlideCount', () => {
    it('returns the correct slide count', () => {
      slideshow.loadFromString('a\n---\nb\n---\nc');
      expect(slideshow.getSlideCount()).toBe(3);
    });
  });

  describe('incremental slides', () => {
    it('marks -- slide as continued', () => {
      slideshow.loadFromString('a\n--\nb');
      expect(slideshow.getSlides()[1].properties.continued).toBe('true');
    });

    it('counts incremental slides by default', () => {
      slideshow.loadFromString('a\n--\nb');
      slideshow.getSlides().forEach((slide, i) => {
        expect(slide.getSlideNumber()).toBe(i + 1);
      });
    });

    it('does not count incremental slides when countIncrementalSlides=false', () => {
      slideshow = new Slideshow(events, dom, { countIncrementalSlides: false });
      slideshow.loadFromString('a\n--\nb');
      slideshow.getSlides().forEach((slide) => {
        expect(slide.getSlideNumber()).toBe(1);
      });
    });
  });

  describe('non-countable slides', () => {
    it('does not increment slide number for count:false slides', () => {
      slideshow.loadFromString('a\n---\ncount: false\n\nb\n---\nc');
      const numbers = slideshow.getSlides().map((s) => s.getSlideNumber());
      expect(numbers[0]).toBe(1);
      expect(numbers[1]).toBe(1);
      expect(numbers[2]).toBe(2);
    });
  });

  describe('name mapping', () => {
    it('retrieves a named slide by name', () => {
      slideshow.loadFromString('name: slide-a\na\n---\nno name\n---\nname: slide-b\nb');
      expect(slideshow.getSlideByName('slide-a')).toBeDefined();
      expect(slideshow.getSlideByName('slide-b')).toBeDefined();
    });

    it('returns undefined for unknown name', () => {
      slideshow.loadFromString('a');
      expect(slideshow.getSlideByName('nope')).toBeUndefined();
    });
  });

  describe('number mapping', () => {
    it('retrieves slides by slide number', () => {
      slideshow.loadFromString('a\n---\nb');
      expect(slideshow.getSlidesByNumber(1)).toHaveLength(1);
      expect(slideshow.getSlidesByNumber(2)).toHaveLength(1);
    });

    it('groups count:false slides with predecessor under same number', () => {
      slideshow.loadFromString('a\n---\ncount: false\n\nb\n---\nc');
      expect(slideshow.getSlidesByNumber(1)).toHaveLength(2);
    });

    describe('jump-to-slide with countIncrementalSlides: false (issue #10)', () => {
      // Source: Slide 1, Slide 2, Slide 2b (incremental --), Slide 3
      // With countIncrementalSlides:false the displayed numbers are 1, 2, 2, 3.
      // Typing "3" + Enter must navigate to "Slide 3", not an unexpected slide.
      const source = '# Slide 1\n---\n# Slide 2\n--\n## Slide 2b\n---\n# Slide 3';

      beforeEach(() => {
        slideshow = new Slideshow(events, dom, { countIncrementalSlides: false });
        slideshow.loadFromString(source);
      });

      it('slide numbers are 1, 2, 2, 3', () => {
        const numbers = slideshow.getSlides().map((s) => s.getSlideNumber());
        expect(numbers).toEqual([1, 2, 2, 3]);
      });

      it('byNumber[1] contains only Slide 1', () => {
        expect(slideshow.getSlidesByNumber(1)).toHaveLength(1);
        expect(slideshow.getSlidesByNumber(1)![0].getSlideNumber()).toBe(1);
      });

      it('byNumber[2] groups Slide 2 and its incremental Slide 2b', () => {
        expect(slideshow.getSlidesByNumber(2)).toHaveLength(2);
      });

      it('byNumber[3] contains only Slide 3', () => {
        expect(slideshow.getSlidesByNumber(3)).toHaveLength(1);
      });

      it('jumping to displayed number 3 lands on Slide 3 (last slide)', () => {
        // gotoSlideNumber resolves via byNumber; the first entry in byNumber[3]
        // must be the actual "Slide 3", i.e. the last slide in the deck.
        const slides = slideshow.getSlidesByNumber(3)!;
        expect(slides).toHaveLength(1);
        const lastSlideIndex = slideshow.getSlideCount() - 1;
        expect(slides[0].getSlideIndex()).toBe(lastSlideIndex);
      });

      it('byNumber[4] is undefined (no slide with displayed number 4)', () => {
        expect(slideshow.getSlidesByNumber(4)).toBeUndefined();
      });
    });
  });

  describe('layout slides', () => {
    it('omits layout slides from the slide list', () => {
      slideshow.loadFromString('layout: true\na\n---\nb');
      expect(slideshow.getSlides()).toHaveLength(1);
    });

    it('does not count layout slides toward slide numbers', () => {
      slideshow.loadFromString('layout: true\na\n---\nb\n---\nc');
      slideshow.getSlides().forEach((slide, i) => {
        expect(slide.getSlideNumber()).toBe(i + 1);
      });
    });

    it('applies layout slide content to subsequent slides', () => {
      slideshow.loadFromString('layout: true\nheader\n---\nbody');
      expect(slideshow.getSlides()[0].content.join('')).toContain('header');
      expect(slideshow.getSlides()[0].content.join('')).toContain('body');
    });

    it('new layout slide replaces previous layout slide', () => {
      slideshow.loadFromString('layout: true\na\n---\nlayout: true\nb\n---\nc');
      const content = slideshow.getSlides()[0].content.join('');
      expect(content).toContain('b');
      expect(content).toContain('c');
      expect(content).not.toContain('\na\n');
    });
  });

  describe('templates', () => {
    it('inherits properties from named template slide', () => {
      slideshow.loadFromString('name: base\nprop: val\na\n---\ntemplate: base\nb');
      expect(slideshow.getSlides()[1].properties.prop).toBe('val');
    });

    it('inherits content from named template slide', () => {
      slideshow.loadFromString('name: base\nbase content\n---\ntemplate: base\nslide content');
      const content = slideshow.getSlides()[1].content.join('');
      expect(content).toContain('base content');
      expect(content).toContain('slide content');
    });
  });

  describe('presenter notes', () => {
    it('includes notes by default', () => {
      slideshow.loadFromString('content\n???\nnotes');
      expect(slideshow.getSlides()[0].notes).toBeDefined();
      expect(slideshow.getSlides()[0].notes.length).toBeGreaterThan(0);
    });

    it('excludes notes when includePresenterNotes=false', () => {
      slideshow = new Slideshow(events, dom, { includePresenterNotes: false });
      slideshow.loadFromString('content\n???\nnotes');
      expect(slideshow.getSlides()[0].notes).toHaveLength(0);
    });
  });

  describe('option defaults', () => {
    it('getRatio defaults to 4:3', () => {
      expect(slideshow.getRatio()).toBe('4:3');
    });

    it('getHighlightStyle defaults to default', () => {
      expect(slideshow.getHighlightStyle()).toBe('default');
    });

    it('getShowSlideNumber defaults to true', () => {
      expect(slideshow.getShowSlideNumber()).toBe(true);
    });

    it('getShowSlideNumber returns false when explicitly set', () => {
      slideshow = new Slideshow(events, dom, { showSlideNumber: false });
      expect(slideshow.getShowSlideNumber()).toBe(false);
    });

    it('getHighlightLines defaults to false', () => {
      expect(slideshow.getHighlightLines()).toBe(false);
    });

    it('getHighlightSpans defaults to false', () => {
      expect(slideshow.getHighlightSpans()).toBe(false);
    });
  });

  describe('sourceUrls (issue #7)', () => {
    it('loads and concatenates multiple URLs in order', async () => {
      const urlDom = makeDomWithUrls({
        'a.md': '# Slide A',
        'b.md': '# Slide B',
        'c.md': '# Slide C',
      });
      let ss!: Slideshow;
      await new Promise<void>((resolve) => {
        ss = new Slideshow(new EventEmitter(), urlDom, { sourceUrls: ['a.md', 'b.md', 'c.md'] }, () => resolve());
      });
      expect(ss.getSlideCount()).toBe(3);
    });

    it('creates the correct number of slides from multiple URLs', async () => {
      const urlDom = makeDomWithUrls({
        'intro.md': '# Intro',
        'chapter.md': '# Chapter 1\n---\n# Chapter 2',
      });
      let ss!: Slideshow;
      await new Promise<void>((resolve) => {
        ss = new Slideshow(events, urlDom, { sourceUrls: ['intro.md', 'chapter.md'] }, () => resolve());
      });
      expect(ss.getSlideCount()).toBe(3);
    });

    it('preserves content from each URL', async () => {
      const urlDom = makeDomWithUrls({
        'part1.md': 'First',
        'part2.md': 'Second',
      });
      let ss!: Slideshow;
      await new Promise<void>((resolve) => {
        ss = new Slideshow(events, urlDom, { sourceUrls: ['part1.md', 'part2.md'] }, () => resolve());
      });
      const content = ss.getSlides().map((s) => s.content.join(''));
      expect(content.some((c) => c.includes('First'))).toBe(true);
      expect(content.some((c) => c.includes('Second'))).toBe(true);
    });

    it('loadFromUrls works as a public method', async () => {
      const urlDom = makeDomWithUrls({
        'x.md': '# X',
        'y.md': '# Y',
      });
      let ss!: Slideshow;
      await new Promise<void>((resolve) => {
        ss = new Slideshow(events, urlDom, {});
        ss.loadFromUrls(['x.md', 'y.md'], () => resolve());
      });
      expect(ss.getSlideCount()).toBe(2);
    });

    it('sourceUrls takes precedence over sourceUrl when both provided', async () => {
      const urlDom = makeDomWithUrls({
        'single.md': '# Single',
        'multi1.md': '# Multi 1',
        'multi2.md': '# Multi 2',
      });
      let ss!: Slideshow;
      await new Promise<void>((resolve) => {
        ss = new Slideshow(events, urlDom, {
          sourceUrl: 'single.md',
          sourceUrls: ['multi1.md', 'multi2.md'],
        }, () => resolve());
      });
      expect(ss.getSlideCount()).toBe(2);
    });
  });
});
