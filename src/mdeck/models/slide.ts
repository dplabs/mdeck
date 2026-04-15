import type { ContentItem, ParsedSlide } from '../parser.js';
import type { SlideOptions } from './slideshow.js';

export class Slide {
  properties: Record<string, string>;
  links: Record<string, { href: string; title?: string }>;
  content: ContentItem[];
  notes: ContentItem[];
  clone?: Window | null;

  private _slideIndex: number;
  private _slideNumber: number;

  constructor(slideIndex: number, slideNumber: number, slide: ParsedSlide, template?: Slide, options?: SlideOptions) {
    this._slideIndex = slideIndex;
    this._slideNumber = slideNumber;
    this.properties = { ...slide.properties };
    this.links = { ...slide.links };
    this.content = [...(slide.content || [])];
    this.notes = [...(slide.notes || [])] as ContentItem[];

    if (template) {
      inherit(this, template, options || {});
    }
  }

  getSlideIndex(): number { return this._slideIndex; }
  getSlideNumber(): number { return this._slideNumber; }

  expandVariables(contentOnly = false, content?: ContentItem[], expandResult: Record<string, string> = {}): Record<string, string> {
    const properties = this.properties;
    content = content !== undefined ? content : this.content;

    for (let i = 0; i < content.length; i++) {
      if (typeof content[i] === 'string') {
        (content as string[])[i] = (content[i] as string).replace(/(\\)?(\{\{([^\}\n]+)\}\})/g, expand);
      } else {
        this.expandVariables(contentOnly, (content[i] as { content: ContentItem[] }).content, expandResult);
      }
    }

    function expand(_match: string, escaped: string, unescapedMatch: string, property: string): string {
      const propertyName = property.trim();
      if (escaped) return contentOnly ? _match[0] : unescapedMatch;
      if (contentOnly && propertyName !== 'content') return _match;
      const val = properties[propertyName];
      if (val !== undefined) { expandResult[propertyName] = val; return val; }
      return propertyName === 'content' ? '' : unescapedMatch;
    }

    return expandResult;
  }
}

function inherit(slide: Slide, template: Slide, options: SlideOptions) {
  inheritProperties(slide, template);
  inheritContent(slide, template);
  inheritNotes(slide, template, options);
}

function inheritProperties(slide: Slide, template: Slide) {
  for (const property in template.properties) {
    if (!Object.prototype.hasOwnProperty.call(template.properties, property) || ignoreProperty(property)) continue;
    const value = [template.properties[property]];
    if (property === 'class' && slide.properties[property]) value.push(slide.properties[property]);
    if (property === 'class' || slide.properties[property] === undefined) {
      slide.properties[property] = value.join(', ');
    }
  }
}

function ignoreProperty(p: string) {
  return p === 'name' || p === 'layout' || p === 'count';
}

function inheritContent(slide: Slide, template: Slide) {
  slide.properties.content = slide.content.slice() as unknown as string;
  deepCopyContent(slide, template.content);
  const expanded = slide.expandVariables(true);
  if (expanded.content === undefined) {
    slide.content = slide.content.concat(slide.properties.content as unknown as ContentItem[]);
  }
  delete slide.properties.content;
}

function deepCopyContent(target: { content: ContentItem[] }, content: ContentItem[]) {
  target.content = [];
  for (const item of content) {
    if (typeof item === 'string') {
      target.content.push(item);
    } else {
      const copy: { block: boolean; class: string; content: ContentItem[] } = { block: item.block, class: item.class, content: [] };
      target.content.push(copy);
      deepCopyContent(copy, item.content);
    }
  }
}

function inheritNotes(slide: Slide, template: Slide, options: SlideOptions) {
  if (template.notes?.length && options.inheritPresenterNotes) {
    slide.notes = [...template.notes, '\n\n', ...slide.notes] as ContentItem[];
  }
}
