import { Lexer, type Token, type ContentStartToken } from './lexer.js';

export interface ContentClass {
  block: boolean;
  class: string;
  content: ContentItem[];
}

export type ContentItem = string | ContentClass;

export interface LinkDef {
  href: string;
  title: string | undefined;
}

export interface ParsedSlide {
  properties: Record<string, string>;
  notes?: ContentItem[];
  links: Record<string, LinkDef>;
  content: ContentItem[];
}

export interface ParserOptions {
  disableIncrementalSlides?: boolean;
}

export type MacroFn = (this: string | undefined, ...args: string[]) => string | undefined | void;
export type MacroMap = Record<string, MacroFn>;

export class Parser {
  parse(src: string, macros: MacroMap = {}, options: ParserOptions = {}): ParsedSlide[] {
    const self = this;
    const lexer = new Lexer();
    const tokens = lexer.lex(cleanInput(src));
    const slides: ParsedSlide[] = [];
    let stack: Array<ParsedSlide | ContentClass> = [createSlide()];

    tokens.forEach((token: Token) => {
      switch (token.type) {
        case 'text':
        case 'code':
        case 'fences':
          appendTo(stack[stack.length - 1], token.text);
          break;
        case 'def': {
          const slide = stack[0] as ParsedSlide;
          slide.links[token.id] = { href: token.href, title: token.title };
          break;
        }
        case 'macro': {
          const macro = macros[token.name];
          if (typeof macro !== 'function') {
            throw new Error(`Macro "${token.name}" not found. You need to define it using mdeck.macros['${token.name}'] = function () { ... };`);
          }
          const value = macro.apply(token.obj, token.args);
          if (typeof value === 'string') {
            const parsed = self.parse(value, macros);
            appendTo(stack[stack.length - 1], parsed[0].content[0]);
          } else {
            appendTo(stack[stack.length - 1], value === undefined ? '' : String(value));
          }
          break;
        }
        case 'content_start':
          stack.push(createContentClass(token));
          break;
        case 'content_end':
          appendTo(stack[stack.length - 2], stack[stack.length - 1] as ContentClass);
          stack.pop();
          break;
        case 'separator':
          if (token.text === '--' && options.disableIncrementalSlides === true) {
            const s = stack[0] as ParsedSlide;
            if (s.notes !== undefined) delete s.notes;
            break;
          }
          slides.push(stack[0] as ParsedSlide);
          stack = [createSlide()];
          (stack[0] as ParsedSlide).properties.continued = (token.text === '--').toString();
          break;
        case 'notes_separator':
          (stack[0] as ParsedSlide).notes = [];
          break;
      }
    });

    slides.push(stack[0] as ParsedSlide);

    slides.forEach((slide) => {
      slide.content[0] = extractProperties(slide.content[0] as string || '', slide.properties);
    });

    return slides.filter((slide) => {
      return (slide.properties.exclude || '').toLowerCase() !== 'true';
    });
  }
}

function createSlide(): ParsedSlide {
  return { content: [], properties: { continued: 'false' }, links: {} };
}

function createContentClass(token: ContentStartToken): ContentClass {
  return { class: token.classes.join(' '), block: token.block, content: [] };
}

function appendTo(element: ParsedSlide | ContentClass, content: ContentItem): void {
  const target = ('notes' in element && element.notes !== undefined) ? element.notes : element.content;
  const lastIdx = target.length - 1;
  if (typeof target[lastIdx] === 'string' && typeof content === 'string') {
    (target as string[])[lastIdx] += content;
  } else {
    target.push(content as never);
  }
}

function extractProperties(source: string, properties: Record<string, string>): string {
  const propertyFinder = /^\n*([-\w]+):([^$\n]*)|\n*(?:<!--\s*)([-\w]+):([^$\n]*?)(?:\s*-->)/i;
  let match: RegExpExecArray | null;
  while ((match = propertyFinder.exec(source)) !== null) {
    source = source.slice(0, match.index) + source.slice(match.index + match[0].length);
    if (match[1] !== undefined) {
      properties[match[1].trim()] = match[2].trim();
    } else {
      properties[match[3].trim()] = match[4].trim();
    }
    propertyFinder.lastIndex = match.index;
  }
  return source;
}

function cleanInput(source: string): string {
  const leadingWhitespacePattern = /^([ \t]*)[^ \t\n]/gm;
  const results: number[] = [];
  let match: RegExpExecArray | null;
  while ((match = leadingWhitespacePattern.exec(source)) !== null) {
    results.push(match[1].length);
  }
  const minWhitespace = results.length ? Math.min(...results) : 0;
  if (minWhitespace === 0) return source;
  const trimPattern = new RegExp(`^[ \\t]{0,${minWhitespace}}`, 'gm');
  return source.replace(trimPattern, '');
}
