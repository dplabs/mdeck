import EventEmitter from 'eventemitter3';
import { Parser } from '../parser.js';
import macros from '../macros.js';
import { Slide } from './slide.js';
import { applyNavigation } from './slideshow/navigation.js';
import { applyEvents } from './slideshow/events.js';
import type { Dom } from '../dom.js';

export interface SlideshowOptions {
  source?: string;
  sourceUrl?: string;
  container?: HTMLElement;
  ratio?: string;
  highlightStyle?: string;
  highlightLines?: boolean;
  highlightSpans?: boolean | RegExp;
  highlightInlineCode?: boolean;
  highlightLanguage?: string;
  slideNumberFormat?: string | ((current: number, total: number) => string);
  cloneTarget?: string;
  navigation?: Record<string, unknown>;
  controller?: unknown;
  countIncrementalSlides?: boolean;
  excludedClasses?: string[];
  disableIncrementalSlides?: boolean;
  includePresenterNotes?: boolean;
  inheritPresenterNotes?: boolean;
  timer?: Record<string, unknown>;
}

export type SlideOptions = Pick<SlideshowOptions, 'countIncrementalSlides' | 'excludedClasses' | 'disableIncrementalSlides' | 'includePresenterNotes' | 'inheritPresenterNotes'>;

export class Slideshow {
  clone?: Window | null;

  getCurrentSlideIndex!: () => number;
  gotoSlide!: (n: string | number, noMessage?: boolean) => void;
  gotoSlideNumber!: (n: string | number, noMessage?: boolean) => void;
  gotoPreviousSlide!: () => void;
  gotoNextSlide!: () => void;
  gotoFirstSlide!: () => void;
  gotoLastSlide!: () => void;
  pause!: () => void;
  resume!: () => void;

  on!: (...args: Parameters<EventEmitter['on']>) => this;

  private _slides: Slide[] = [];
  private _links: Record<string, { href: string; title?: string }> = {};

  constructor(private _events: EventEmitter, private _dom: Dom, private _options: SlideshowOptions, callback?: (slideshow: Slideshow) => void) {
    applyEvents(this, _events);
    applyNavigation(this, _events);

    if (_options.sourceUrl) {
      this._loadFromUrl(_options.sourceUrl, callback);
    } else {
      this._loadFromString(_options.source || '');
      callback?.(this);
    }
  }

  loadFromString(source: string): void { this._loadFromString(source); }
  loadFromUrl(url: string, callback?: (s: Slideshow) => void): void { this._loadFromUrl(url, callback); }

  update(): void { this._events.emit('resize'); }
  getLinks() { return this._links; }
  getSlides(): Slide[] { return [...this._slides]; }
  getSlideCount(): number { return this._slides.length; }
  getSlideByName(name: string): Slide | undefined { return (this._slides as unknown as { byName: Record<string, Slide> }).byName?.[name]; }
  getSlidesByNumber(number: number): Slide[] | undefined { return (this._slides as unknown as { byNumber: Record<number, Slide[]> }).byNumber?.[number]; }

  togglePresenterMode() { this._events.emit('togglePresenterMode'); }
  toggleHelp() { this._events.emit('toggleHelp'); }
  toggleBlackout() { this._events.emit('toggleBlackout'); }
  toggleMirrored() { this._events.emit('toggleMirrored'); }
  toggleFullscreen() { this._events.emit('toggleFullscreen'); }
  createClone() { this._events.emit('createClone'); }
  resetTimer() { this._events.emit('resetTimer'); }

  getRatio(): string { return this._options.ratio ?? '4:3'; }
  getHighlightStyle(): string { return this._options.highlightStyle ?? 'default'; }
  getHighlightLines(): boolean { return this._options.highlightLines ?? false; }
  getHighlightSpans(): boolean | RegExp { return this._options.highlightSpans ?? false; }
  getHighlightInlineCode(): boolean { return this._options.highlightInlineCode ?? false; }
  getHighlightLanguage(): string { return this._options.highlightLanguage ?? ''; }
  getSlideNumberFormat(): string | ((current: number, total: number) => string) { return this._options.slideNumberFormat ?? '%current% / %total%'; }
  getCloneTarget(): string { return this._options.cloneTarget ?? '_blank'; }

  private _loadFromString(source: string): void {
    this._slides = createSlides(source, this._options);
    expandVariables(this._slides);
    this._links = {};
    this._slides.forEach((slide) => {
      Object.assign(this._links, slide.links);
    });
    this._events.emit('slidesChanged');
  }

  private _loadFromUrl(url: string, callback?: (s: Slideshow) => void): void {
    const xhr = new (this._dom.XMLHttpRequest)();
    xhr.open('GET', url, true);
    xhr.onload = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          this._options.source = xhr.responseText.replace(/\r\n/g, '\n');
          this._loadFromString(this._options.source);
          callback?.(this);
        } else {
          throw new Error(xhr.statusText);
        }
      }
    };
    xhr.onerror = () => { throw new Error(xhr.statusText); };
    xhr.send(null);
  }
}

function createSlides(source: string, options: SlideshowOptions): Slide[] {
  const parser = new Parser();
  const parsed = parser.parse(source, macros, options);
  const slides: Slide[] = [];
  const byName: Record<string, Slide> = {};
  const byNumber: Record<number, Slide[]> = {};
  let layoutSlide: Slide | undefined;
  let slideNumber = 0;

  (slides as unknown as { byName: Record<string, Slide>; byNumber: Record<number, Slide[]> }).byName = byName;
  (slides as unknown as { byName: Record<string, Slide>; byNumber: Record<number, Slide[]> }).byNumber = byNumber;

  parsed.forEach((parsedSlide, i) => {
    let template: Slide | undefined;

    if (parsedSlide.properties.continued === 'true' && i > 0) {
      template = slides[slides.length - 1];
    } else if (byName[parsedSlide.properties.template]) {
      template = byName[parsedSlide.properties.template];
    } else if (parsedSlide.properties.layout === 'false') {
      layoutSlide = undefined;
    } else if (layoutSlide && parsedSlide.properties.layout !== 'true') {
      template = layoutSlide;
    }

    if (parsedSlide.properties.continued === 'true' && options.countIncrementalSlides === false && parsedSlide.properties.count === undefined) {
      parsedSlide.properties.count = 'false';
    }

    const slideClasses = (parsedSlide.properties['class'] || '').split(/,| /);
    const excludedClasses = options.excludedClasses || [];
    const slideIsIncluded = slideClasses.filter((c) => excludedClasses.includes(c)).length === 0;

    if (slideIsIncluded && parsedSlide.properties.layout !== 'true' && parsedSlide.properties.count !== 'false') {
      slideNumber++;
      byNumber[slideNumber] = [];
    }

    if (!options.includePresenterNotes) {
      parsedSlide.notes = undefined;
    }

    const slideViewModel = new Slide(slides.length, slideNumber, parsedSlide, template, options);

    if (parsedSlide.properties.name) {
      byName[parsedSlide.properties.name] = slideViewModel;
    }

    if (parsedSlide.properties.layout === 'true') {
      layoutSlide = slideViewModel;
    } else {
      if (slideIsIncluded) {
        slides.push(slideViewModel);
        if (byNumber[slideNumber] !== undefined) {
          byNumber[slideNumber].push(slideViewModel);
        }
      }
      if (parsedSlide.properties.name) {
        (slides as unknown as { byName: Record<string, Slide> }).byName[parsedSlide.properties.name] = slideViewModel;
      }
    }
  });

  return slides;
}

function expandVariables(slides: Slide[]) {
  slides.forEach((slide) => slide.expandVariables());
}
