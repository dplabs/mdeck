import { describe, it, expect } from 'vitest';
import { convertMarkdown } from '../mdeck/converter.js';

type ContentItem = string | { block: boolean; class: string; content: ContentItem[] };

describe('convertMarkdown', () => {
  describe('basic rendering', () => {
    it('converts empty content to empty string', () => {
      expect(convertMarkdown([''])).toBe('');
    });

    it('returns empty string for undefined content', () => {
      expect(convertMarkdown(undefined)).toBe('');
    });

    it('converts a paragraph', () => {
      expect(convertMarkdown(['paragraph'])).toBe('<p>paragraph</p>');
    });

    it('converts bold text', () => {
      expect(convertMarkdown(['**bold**'])).toBe('<p><strong>bold</strong></p>');
    });

    it('converts italic text', () => {
      expect(convertMarkdown(['_italic_'])).toBe('<p><em>italic</em></p>');
    });
  });

  describe('headings', () => {
    it('converts # heading with space', () => {
      expect(convertMarkdown(['# Hello'])).toBe('<h1>Hello</h1>');
    });

    it('converts #heading without space — remark compatibility', () => {
      expect(convertMarkdown(['#hello'])).toBe('<h1>hello</h1>');
    });

    it('converts ##heading (level 2) without space', () => {
      expect(convertMarkdown(['##hello'])).toBe('<h2>hello</h2>');
    });

    it('converts all heading levels 1–6 without space', () => {
      for (let i = 1; i <= 6; i++) {
        expect(convertMarkdown(['#'.repeat(i) + 'title'])).toBe(`<h${i}>title</h${i}>`);
      }
    });
  });

  describe('inline content classes', () => {
    it('wraps inline class in <span>', () => {
      const content: ContentItem[] = [
        'before ',
        { block: false, class: 'red', content: ['word'] },
        ' after',
      ];
      expect(convertMarkdown(content)).toBe(
        '<p>before <span class="red">word</span> after</p>',
      );
    });

    it('renders markdown inside inline content class', () => {
      const content: ContentItem[] = [
        { block: false, class: 'x', content: ['some _fancy_ content'] },
      ];
      expect(convertMarkdown(content)).toBe(
        '<p><span class="x">some <em>fancy</em> content</span></p>',
      );
    });
  });

  describe('block content classes', () => {
    it('wraps block class in <div> and renders inner markdown', () => {
      const content: ContentItem[] = [
        { block: true, class: 'left-column', content: ['## Heading\n'] },
      ];
      const html = convertMarkdown(content);
      expect(html).toContain('<div class="left-column">');
      expect(html).toContain('<h2>Heading</h2>');
      expect(html).not.toContain('## Heading');
    });

    it('renders fenced code block with blank lines inside block content class', () => {
      const src = '\n```python\nname = "a"\n\nx = 1\n```\n';
      const content: ContentItem[] = [
        { block: true, class: 'right-column', content: [src] },
      ];
      const html = convertMarkdown(content);
      expect(html).toContain('name =');
      expect(html).toContain('x = 1');
      // x = 1 must be inside the code block, not split into a paragraph
      expect(html).not.toMatch(/<p>x = 1<\/p>/);
    });

    it('renders two side-by-side block columns', () => {
      const content: ContentItem[] = [
        { block: true, class: 'left-column', content: ['\n## Left\n'] },
        { block: true, class: 'right-column', content: ['\n## Right\n'] },
      ];
      const html = convertMarkdown(content);
      expect(html).toContain('<div class="left-column">');
      expect(html).toContain('<div class="right-column">');
      expect(html).toContain('<h2>Left</h2>');
      expect(html).toContain('<h2>Right</h2>');
    });
  });

  describe('links', () => {
    it('resolves reference-style links via link map', () => {
      const content: ContentItem[] = ['[link][id]'];
      const links = { id: { href: 'https://example.com', title: 'Example' } };
      expect(convertMarkdown(content, links)).toBe(
        '<p><a href="https://example.com" title="Example">link</a></p>',
      );
    });

    it('renders inline links without link map', () => {
      const html = convertMarkdown(['[click](https://example.com)']);
      expect(html).toContain('<a href="https://example.com">click</a>');
    });
  });

  describe('code blocks', () => {
    it('renders fenced code block', () => {
      const html = convertMarkdown(['```\nconst x = 1;\n```']);
      expect(html).toContain('<pre>');
      expect(html).toContain('const x = 1;');
    });

    it('preserves blank lines inside fenced code block', () => {
      const html = convertMarkdown(['```\nline1\n\nline2\n```']);
      expect(html).toContain('line1');
      expect(html).toContain('line2');
      expect(html).not.toMatch(/<p>line2<\/p>/);
    });
  });

  describe('lists', () => {
    it('renders unordered list', () => {
      const html = convertMarkdown(['- item 1\n- item 2']);
      expect(html).toContain('<ul>');
      expect(html).toContain('<li>item 1</li>');
    });

    it('renders ordered list', () => {
      const html = convertMarkdown(['1. first\n2. second']);
      expect(html).toContain('<ol>');
      expect(html).toContain('<li>first</li>');
    });
  });

  describe('inline mode', () => {
    it('unwraps single paragraph in inline mode', () => {
      expect(convertMarkdown(['hello **world**'], {}, true)).toBe(
        'hello <strong>world</strong>',
      );
    });

    it('does not unwrap when result has multiple block elements', () => {
      const html = convertMarkdown(['para\n\n- list'], {}, true);
      expect(html).toContain('<p>');
    });
  });
});
