import type EventEmitter from 'eventemitter3';
import type { Slideshow } from '../models/slideshow.js';
import type { Slide } from '../models/slide.js';
import type { Scaler } from '../scaler.js';
import { convertMarkdown, convertMarkdownAsync } from '../converter.js';
import { engine as highlighter } from '../highlighter.js';
import { SlideNumber } from '../components/slide-number/slide-number.js';

export class SlideView {
  containerElement!: HTMLElement;
  scalingElement!: HTMLElement;
  element!: HTMLElement;
  contentElement!: HTMLElement;
  notesElement!: HTMLElement;
  backgroundSizeSet = false;
  originalBackgroundSize?: string;
  originalBackgroundPosition?: string;
  private slideNumber: SlideNumber;

  constructor(events: EventEmitter, private slideshow: Slideshow, private scaler: Scaler, private slide: Slide) {
    this.slideNumber = new SlideNumber(slide, slideshow);
    this.configureElements();
    this.updateDimensions();

    events.on('propertiesChanged', (changes: Record<string, unknown>) => {
      if ('ratio' in changes) this.updateDimensions();
    });
  }

  updateDimensions(): void {
    const { width, height } = this.scaler.dimensions;
    this.scalingElement.style.width = width + 'px';
    this.scalingElement.style.height = height + 'px';
  }

  scale(containerElement: HTMLElement): void {
    this.scaler.scaleToFit(this.scalingElement, containerElement);
  }

  show(): void {
    this.containerElement.classList.add('remark-visible', 'mdeck-visible');
    this.containerElement.classList.remove('remark-fading', 'mdeck-fading');
  }

  hide(): void {
    this.containerElement.classList.remove('remark-visible', 'mdeck-visible');
    this.containerElement.classList.add('remark-fading', 'mdeck-fading');
    setTimeout(() => this.containerElement.classList.remove('remark-fading', 'mdeck-fading'), 1000);
  }

  configureElements(): void {
    this.containerElement = document.createElement('div');
    this.containerElement.className = 'remark-slide-container mdeck-slide-container';

    this.scalingElement = document.createElement('div');
    this.scalingElement.className = 'remark-slide-scaler mdeck-slide-scaler';

    this.element = createSlideElement(this.slide);
    this.contentElement = createContentElement(this.slideshow, this.slide);
    this.notesElement = createNotesElement(this.slideshow, this.slide.notes);

    this.contentElement.appendChild(this.slideNumber.element);
    this.element.appendChild(this.contentElement);
    this.scalingElement.appendChild(this.element);
    this.containerElement.appendChild(this.scalingElement);
    this.containerElement.appendChild(this.notesElement);
  }

  scaleBackgroundImage(dimensions: { width: number; height: number }): void {
    const styles = window.getComputedStyle(this.contentElement);
    const backgroundImage = styles.backgroundImage;
    const backgroundSize = styles.backgroundSize;
    const backgroundPosition = styles.backgroundPosition;

    if ((backgroundSize || backgroundPosition) && !this.backgroundSizeSet) return;

    const match = /^url\(("?)([^)]+?)\1\)/.exec(backgroundImage);
    if (!match) return;

    const image = new Image();
    image.onload = () => {
      if (image.width > dimensions.width || image.height > dimensions.height) {
        if (!this.originalBackgroundSize) {
          this.originalBackgroundSize = this.contentElement.style.backgroundSize;
          this.originalBackgroundPosition = this.contentElement.style.backgroundPosition;
          this.backgroundSizeSet = true;
          const scale = dimensions.width / image.width < dimensions.height / image.height
            ? dimensions.width / image.width : dimensions.height / image.height;
          this.contentElement.style.backgroundSize = image.width * scale + 'px ' + image.height * scale + 'px';
          this.contentElement.style.backgroundPosition = '50% ' + ((dimensions.height - image.height * scale) / 2) + 'px';
        }
      } else if (this.backgroundSizeSet) {
        this.contentElement.style.backgroundSize = this.originalBackgroundSize || '';
        this.contentElement.style.backgroundPosition = this.originalBackgroundPosition || '';
        this.backgroundSizeSet = false;
      }
    };
    image.src = match[2];
  }
}

function createSlideElement(slide: Slide): HTMLElement {
  const element = document.createElement('div');
  element.className = 'remark-slide mdeck-slide';
  if (slide.properties.continued === 'true') element.classList.add('remark-slide-incremental', 'mdeck-slide-incremental');
  return element;
}

function createContentElement(slideshow: Slideshow, slide: Slide): HTMLElement {
  const element = document.createElement('div');
  if (slide.properties.name) element.id = 'slide-' + slide.properties.name;
  styleContentElement(slideshow, element, slide.properties);

  const renderer = slideshow.getMarkdownRenderer();
  if (renderer) {
    convertMarkdownAsync(slide.content, slideshow.getLinks(), false, renderer).then((html) => {
      const extras = Array.from(element.childNodes);
      element.innerHTML = html;
      highlightCodeBlocks(element, slideshow);
      extras.forEach((n) => element.appendChild(n));
    });
  } else {
    element.innerHTML = convertMarkdown(slide.content, slideshow.getLinks());
    highlightCodeBlocks(element, slideshow);
  }

  return element;
}

function styleContentElement(slideshow: Slideshow, element: HTMLElement, properties: Record<string, string>): void {
  element.className = '';
  element.classList.add('remark-slide-content', 'mdeck-slide-content');
  (properties['class'] || '').split(/,| /).filter(Boolean).forEach((c) => element.classList.add(c));

  const highlightStyle = properties['highlight-style'] || slideshow.getHighlightStyle();
  if (highlightStyle) element.classList.add('hljs-' + highlightStyle);

  if (properties['background-image']) element.style.backgroundImage = properties['background-image'];
  if (properties['background-color']) element.style.backgroundColor = properties['background-color'];
  if (properties['background-size']) element.style.backgroundSize = properties['background-size'];
  if (properties['background-position']) element.style.backgroundPosition = properties['background-position'];
}

function createNotesElement(slideshow: Slideshow, notes: unknown[]): HTMLElement {
  const element = document.createElement('div');
  element.className = 'remark-slide-notes mdeck-slide-notes';

  const renderer = slideshow.getMarkdownRenderer();
  if (renderer) {
    convertMarkdownAsync(notes as Parameters<typeof convertMarkdown>[0], slideshow.getLinks(), false, renderer).then((html) => {
      element.innerHTML = html;
      highlightCodeBlocks(element, slideshow);
      element.dispatchEvent(new CustomEvent('notesRendered'));
    });
  } else {
    element.innerHTML = convertMarkdown(notes as Parameters<typeof convertMarkdown>[0], slideshow.getLinks());
    highlightCodeBlocks(element, slideshow);
  }

  return element;
}

function highlightCodeBlocks(content: HTMLElement, slideshow: Slideshow): void {
  const codeBlocks = Array.from(content.getElementsByTagName('code'));
  const highlightLines = slideshow.getHighlightLines();
  const highlightSpans = slideshow.getHighlightSpans();
  const highlightInline = slideshow.getHighlightInlineCode();

  codeBlocks.forEach((block) => {
    if (block.className === '') block.className = slideshow.getHighlightLanguage();

    if (block.parentElement?.tagName !== 'PRE') {
      block.classList.add('remark-inline-code', 'mdeck-inline-code');
      if (highlightInline) highlighter.highlightElement(block);
      return;
    }

    let meta: { highlightedLines: number[] } = { highlightedLines: [] };
    if (highlightLines) meta = extractMetadata(block);

    if (block.className !== '') highlighter.highlightElement(block);

    wrapLines(block);

    if (highlightLines) highlightBlockLines(block, meta.highlightedLines);
    if (highlightSpans) highlightBlockSpans(block, highlightSpans);

    block.classList.add('remark-code', 'mdeck-code');
  });
}

function extractMetadata(block: HTMLElement): { highlightedLines: number[] } {
  const highlightedLines: number[] = [];
  block.innerHTML = block.innerHTML.split(/\r?\n/).map((line, i) => {
    if (line.startsWith('*')) { highlightedLines.push(i); return line.replace(/^\*( )?/, '$1$1'); }
    return line;
  }).join('\n');
  return { highlightedLines };
}

function wrapLines(block: HTMLElement): void {
  const lines = block.innerHTML.split(/\r?\n/).map((line) => `<div class="remark-code-line mdeck-code-line">${line}</div>`);
  if (lines.length && lines[lines.length - 1].includes('><')) lines.pop();
  block.innerHTML = lines.join('');
}

function highlightBlockLines(block: HTMLElement, lines: number[]): void {
  lines.forEach((i) => (block.childNodes[i] as HTMLElement).classList.add('remark-code-line-highlighted', 'mdeck-code-line-highlighted'));
}

function highlightBlockSpans(block: HTMLElement, highlightSpans: boolean | RegExp): void {
  let pattern: RegExp;
  if (highlightSpans === true) {
    pattern = /(^|[^`])`([^`]+?)`/gm;
  } else if (highlightSpans instanceof RegExp) {
    if (!highlightSpans.global) throw new Error('highlightSpans RegExp must have /g flag');
    pattern = new RegExp('(^|[\\s\\S])' + highlightSpans.source, (highlightSpans.flags || 'g') + 'm');
  } else {
    throw new Error('Illegal value for highlightSpans');
  }
  Array.from(block.childNodes).forEach((node) => {
    if (node instanceof HTMLElement) {
      node.innerHTML = node.innerHTML.replace(pattern, (m, e, c) => {
        if (e === '\\') return m.slice(1);
        return e + `<span class="remark-code-span-highlighted mdeck-code-span-highlighted">${c}</span>`;
      });
    }
  });
}
