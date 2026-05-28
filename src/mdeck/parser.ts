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
            const parsed = this.parse(value, macros);
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
      // Join all leading string items in content to ensure extractProperties sees the whole front-matter.
      // The lexer might have split them if there were mixed indentation or other tokens.
      let joinedContent = '';
      let consumedCount = 0;
      while (consumedCount < slide.content.length && typeof slide.content[consumedCount] === 'string') {
        joinedContent += slide.content[consumedCount];
        consumedCount++;
      }

      if (consumedCount > 0) {
        const remaining = extractProperties(joinedContent, slide.properties);
        slide.content.splice(0, consumedCount, remaining);
      }
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
  if (typeof source !== 'string') return source as unknown as string;

  // Extract inline HTML comment properties anywhere in the source (they are invisible markers).
  const commentFinder = /\n*(?:<!--\s*)([-\w]+):([^$\n]*?)(?:\s*-->)/gi;
  let match: RegExpExecArray | null;
  while ((match = commentFinder.exec(source)) !== null) {
    source = source.slice(0, match.index) + source.slice(match.index + match[0].length);
    properties[match[1].trim()] = match[2].trim();
    commentFinder.lastIndex = match.index;
  }

  // Extract plain `key: value` properties only from the leading front-matter block.
  // Stop as soon as a line that is not a property, a <style> block, or a blank line
  // followed by one of those is encountered.
  const lines = source.split('\n');
  let i = 0;
  let started = false;

  while (i < lines.length) {
    const line = lines[i];
    const lineTrim = line.trim();

    if (lineTrim === '') {
      if (started) {
        // Look ahead: if the next non-blank line is a <style> block, continue.
        // Otherwise, a blank line ends the front-matter block.
        let j = i + 1;
        while (j < lines.length && lines[j].trim() === '') j++;
        if (j < lines.length && /^<style(?:\s+[^>]*)?>/i.test(lines[j].trim())) {
          i = j;
          continue;
        }
        break;
      }
      i++;
      continue; // Leading blank lines are ignored.
    }

    // Try matching <style> block.
    const styleBlockStart = /^<style(?:\s+[^>]*)?>/i;
    if (styleBlockStart.test(lineTrim)) {
      started = true;
      let styleContent = '';
      let j = i;
      let foundClose = false;
      while (j < lines.length) {
        const currentLine = lines[j];
        styleContent += currentLine + '\n';
        const closeIndex = currentLine.toLowerCase().indexOf('</style>');
        if (closeIndex !== -1) {
          foundClose = true;
          const match = /<style(?:\s+[^>]*)?>([\s\S]*?)<\/style>/i.exec(styleContent);
          if (match) {
            properties.styles = (properties.styles || '') + match[1];
            const afterStyle = currentLine.slice(closeIndex + '</style>'.length);
            lines[j] = afterStyle;
            i = afterStyle.trim() === '' ? j + 1 : j;
          } else {
            i = j + 1;
          }
          break;
        }
        j++;
      }
      if (foundClose) continue;
    }

    // Try matching property line.
    const propertyLine = /^([-\w]+):([^$\n]*)$/i;
    const m = propertyLine.exec(line);
    if (m) {
      started = true;
      properties[m[1].trim()] = m[2].trim();
      i++;
      continue;
    }

    break;
  }

  return lines.slice(i).join('\n');
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
