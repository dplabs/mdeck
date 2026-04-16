import { describe, it, expect, beforeEach } from 'vitest';
import { Lexer } from '../mdeck/lexer.js';

describe('Lexer', () => {
  let lexer: Lexer;

  beforeEach(() => {
    lexer = new Lexer();
  });

  describe('text', () => {
    it('recognizes plain text', () => {
      expect(lexer.lex('hello')).toEqual([{ type: 'text', text: 'hello' }]);
    });

    it('treats empty source as empty text token', () => {
      expect(lexer.lex('')).toEqual([{ type: 'text', text: '' }]);
    });

    it('merges adjacent text tokens into one', () => {
      const tokens = lexer.lex('hello world');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('text');
    });
  });

  describe('slide separators', () => {
    it('recognizes --- separator', () => {
      expect(lexer.lex('\n---')).toEqual([{ type: 'separator', text: '---' }]);
    });

    it('does not preserve trailing newline of --- separator', () => {
      expect(lexer.lex('\n---\n')).toEqual([{ type: 'separator', text: '---' }]);
    });

    it('recognizes silent <!-- break --> separator', () => {
      expect(lexer.lex('\n<!-- break -->')).toEqual([
        { type: 'separator', text: '<!-- break -->' },
      ]);
    });

    it('ignores extra whitespace inside <!-- break --> separator', () => {
      expect(lexer.lex('\n<!--    break  -->')).toEqual([
        { type: 'separator', text: '<!--    break  -->' },
      ]);
    });

    it('recognizes -- incremental separator', () => {
      expect(lexer.lex('\n--')).toEqual([{ type: 'separator', text: '--' }]);
    });
  });

  describe('notes separator', () => {
    it('recognizes ??? notes separator', () => {
      expect(lexer.lex('\n???\n')).toEqual([{ type: 'notes_separator', text: '???' }]);
    });

    it('recognizes ??? with trailing spaces (issue #1)', () => {
      expect(lexer.lex('\n???   \n')).toEqual([{ type: 'notes_separator', text: '???' }]);
    });

    it('recognizes ??? with trailing tabs (issue #1)', () => {
      expect(lexer.lex('\n???\t\n')).toEqual([{ type: 'notes_separator', text: '???' }]);
    });
  });

  describe('code blocks', () => {
    it('recognizes indented code block', () => {
      expect(lexer.lex('    code')).toEqual([{ type: 'code', text: '    code' }]);
    });

    it('recognizes inline code with single backticks', () => {
      expect(lexer.lex('`code`')).toEqual([{ type: 'text', text: '`code`' }]);
    });

    it('recognizes inline code with multiple backticks', () => {
      expect(lexer.lex('``code``')).toEqual([{ type: 'text', text: '``code``' }]);
    });

    it('recognizes inline code containing escaped backtick', () => {
      expect(lexer.lex('`` `code` ``')).toEqual([{ type: 'text', text: '`` `code` ``' }]);
    });

    it('recognizes fenced code block', () => {
      expect(lexer.lex('```\ncode\n```')).toEqual([
        { type: 'fences', text: '```\ncode\n```' },
      ]);
    });

    it('recognizes fenced code block with language specifier', () => {
      const tokens = lexer.lex('```js\nconst x = 1;\n```');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('fences');
    });

    it('captures full fenced code block including blank lines inside', () => {
      const src = '```\nline1\n\nline2\n```';
      const tokens = lexer.lex(src);
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('fences');
      expect((tokens[0] as { type: string; text: string }).text).toContain('line1');
      expect((tokens[0] as { type: string; text: string }).text).toContain('line2');
    });

    it('leaves --- separator inside fences as-is', () => {
      const tokens = lexer.lex('```\n---\n```');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('fences');
    });

    it('leaves content class inside fences as-is', () => {
      const tokens = lexer.lex('```\n.class[x]\n```');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('fences');
    });

    it('leaves content class inside indented code as-is', () => {
      const tokens = lexer.lex('    .class[x]');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('code');
    });

    it('leaves content class inside inline code as-is', () => {
      const tokens = lexer.lex('`.class[x]`');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('text');
    });
  });

  describe('content classes', () => {
    it('recognizes single content class', () => {
      expect(lexer.lex('.classA[content]')).toEqual([
        { type: 'content_start', classes: ['classA'], block: false },
        { type: 'text', text: 'content' },
        { type: 'content_end', block: false },
      ]);
    });

    it('recognizes multiple content classes on same bracket', () => {
      expect(lexer.lex('.c1.c2[content]')).toEqual([
        { type: 'content_start', classes: ['c1', 'c2'], block: false },
        { type: 'text', text: 'content' },
        { type: 'content_end', block: false },
      ]);
    });

    it('sets block=true when content spans multiple lines', () => {
      expect(lexer.lex('.cls[\ncontent\n]')).toEqual([
        { type: 'content_start', classes: ['cls'], block: true },
        { type: 'text', text: '\ncontent\n' },
        { type: 'content_end', block: true },
      ]);
    });

    it('ignores escaped content class (leading backslash)', () => {
      expect(lexer.lex('\\.class[content]')).toEqual([
        { type: 'text', text: '.class[content]' },
      ]);
    });

    it('treats unclosed content class as text', () => {
      expect(lexer.lex('text .class[content')).toEqual([
        { type: 'text', text: 'text .class[content' },
      ]);
    });

    it('leaves --- separator inside content class as-is', () => {
      expect(lexer.lex('.class[\n---\n]')).toEqual([
        { type: 'content_start', classes: ['class'], block: true },
        { type: 'text', text: '\n---\n' },
        { type: 'content_end', block: true },
      ]);
    });

    it('lexes content classes recursively', () => {
      expect(lexer.lex('.c1[.c2[x]]')).toEqual([
        { type: 'content_start', classes: ['c1'], block: false },
        { type: 'content_start', classes: ['c2'], block: false },
        { type: 'text', text: 'x' },
        { type: 'content_end', block: false },
        { type: 'content_end', block: false },
      ]);
    });
  });

  describe('link definitions', () => {
    it('recognizes link definition with title', () => {
      expect(lexer.lex('[id]: http://url.com "website"')).toEqual([
        { type: 'def', id: 'id', href: 'http://url.com', title: 'website' },
      ]);
    });

    it('recognizes link definition without title', () => {
      const tokens = lexer.lex('[id]: http://url.com');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('def');
    });
  });

  describe('macros', () => {
    it('recognizes macro with args and object', () => {
      expect(lexer.lex('![:piechart a, b, c](d)')).toEqual([
        { type: 'macro', name: 'piechart', args: ['a', 'b', 'c'], obj: 'd' },
      ]);
    });

    it('recognizes macro with no object', () => {
      const tokens = lexer.lex('![:badge New]');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('macro');
    });
  });
});
