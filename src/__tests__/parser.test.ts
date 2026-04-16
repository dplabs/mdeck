import { describe, it, expect, beforeEach } from 'vitest';
import { Parser } from '../mdeck/parser.js';

describe('Parser', () => {
  let parser: Parser;

  beforeEach(() => {
    parser = new Parser();
  });

  describe('slide count', () => {
    it('handles single slide', () => {
      expect(parser.parse('1')).toHaveLength(1);
    });

    it('handles multiple slides', () => {
      expect(parser.parse('1\n---\n2\n---\n3')).toHaveLength(3);
    });

    it('handles silent <!-- break --> separator', () => {
      expect(parser.parse('1\n<!-- break -->\n2\n<!-- break -->\n3')).toHaveLength(3);
    });

    it('treats empty source as single slide', () => {
      expect(parser.parse('')).toHaveLength(1);
    });

    it('ignores --- separator inside fences', () => {
      expect(parser.parse('1\n---\n```\n---\n```\n---\n3')).toHaveLength(3);
    });

    it('ignores --- separator inside content class', () => {
      expect(parser.parse('1\n---\n2\n.class[\n---\n]\n---\n3')).toHaveLength(3);
    });

    it('handles multiple-backtick inline code followed by fenced block', () => {
      expect(parser.parse('1\n---\nTest ``code``\n---\n```\ncode\n```')).toHaveLength(3);
    });
  });

  describe('slide content', () => {
    it('maps content of single slide', () => {
      expect(parser.parse('1')[0].content).toEqual(['1']);
    });

    it('maps content of each slide', () => {
      const slides = parser.parse('1\n---\n2\n---\n3');
      expect(slides[0].content).toEqual(['1']);
      expect(slides[1].content).toEqual(['2']);
      expect(slides[2].content).toEqual(['3']);
    });

    it('handles empty source', () => {
      expect(parser.parse('')[0].content).toEqual(['']);
    });

    it('omits excluded slides from output', () => {
      const slides = parser.parse('1\n---\nexclude: true\n\n2\n---\n3');
      expect(slides).toHaveLength(2);
      expect(slides[0].content).toEqual(['1']);
    });
  });

  describe('speaker notes', () => {
    it('parses notes after ???', () => {
      expect(parser.parse('content\n???\nnotes')[0].notes).toEqual(['notes']);
    });

    it('removes notes from slide content', () => {
      expect(parser.parse('content\n???\nnotes')[0].content).toEqual(['content']);
    });
  });

  describe('fenced code blocks', () => {
    it('includes fenced block in slide content', () => {
      const slides = parser.parse('1\n```\n\n```\n2\n---\n3\n```\n\n```\n4');
      expect(slides[0].content).toEqual(['1\n```\n\n```\n2']);
      expect(slides[1].content).toEqual(['3\n```\n\n```\n4']);
    });

    it('ignores content class inside fences', () => {
      expect(parser.parse('```\n.class[x]\n```')[0].content).toEqual(['```\n.class[x]\n```']);
    });

    it('captures full fenced block with blank lines (remark compat)', () => {
      const src = '```remark\nname: a\nclass: b\n\n# Heading\n```';
      expect(parser.parse(src)[0].content[0]).toContain('# Heading');
    });
  });

  describe('indented code blocks', () => {
    it('includes indented code in content', () => {
      const slides = parser.parse('1\n\n    code\n2\n---\n3\n\n    code\n4');
      expect(slides[0].content).toEqual(['1\n\n    code\n2']);
      expect(slides[1].content).toEqual(['3\n\n    code\n4']);
    });

    it('ignores content class inside indented code', () => {
      expect(parser.parse('some code\n\n    .class[x]')[0].content).toEqual([
        'some code\n\n    .class[x]',
      ]);
    });
  });

  describe('link definitions', () => {
    it('extracts link definitions into slide.links', () => {
      const links = parser.parse('[id]: http://url.com "title"')[0].links;
      expect(links['id']).toEqual({ href: 'http://url.com', title: 'title' });
    });
  });

  describe('macros', () => {
    it('expands macro to its return value', () => {
      const macros = {
        sum: (...args: string[]) => String(args.reduce((acc, a) => acc + parseInt(a, 10), 0)),
      };
      expect(parser.parse('a ![:sum 1, 2, 3] b', macros)[0].content).toEqual(['a 6 b']);
    });

    it('expands macros recursively', () => {
      const macros = {
        upper: function (this: string | undefined) { return (this ?? '').toUpperCase(); },
        addupper: () => '![:upper](word)',
      };
      expect(parser.parse('Uppercase => ![:addupper](word)', macros)[0].content).toEqual([
        'Uppercase => WORD',
      ]);
    });
  });

  describe('content classes', () => {
    it('converts block content class', () => {
      expect(parser.parse('1 .class[\nx\n] 2')[0].content).toEqual([
        '1 ',
        { class: 'class', block: true, content: ['\nx\n'] },
        ' 2',
      ]);
    });

    it('converts inline content class', () => {
      expect(parser.parse('1 .class[x] 2')[0].content).toEqual([
        '1 ',
        { class: 'class', block: false, content: ['x'] },
        ' 2',
      ]);
    });

    it('joins multiple class names with space', () => {
      expect(parser.parse('1 .c1.c2[x]')[0].content).toEqual([
        '1 ',
        { class: 'c1 c2', block: false, content: ['x'] },
      ]);
    });

    it('ignores unclosed inline content class', () => {
      expect(parser.parse('1 .class[x 2')[0].content).toEqual(['1 .class[x 2']);
    });

    it('ignores unclosed block content class', () => {
      expect(parser.parse('1 .class[\n2')[0].content).toEqual(['1 .class[\n2']);
    });

    it('parses nested content classes', () => {
      expect(parser.parse('.c1[.c2[x]]')[0].content).toEqual([
        { class: 'c1', block: false, content: [{ class: 'c2', block: false, content: ['x'] }] },
      ]);
    });
  });

  describe('incremental slides', () => {
    it('marks -- slide as continued=true', () => {
      expect(parser.parse('1\n--\n2')[1].properties.continued).toBe('true');
    });

    it('marks preceding slide as continued=false', () => {
      expect(parser.parse('1\n--\n2')[0].properties.continued).toBe('false');
    });

    it('marks normal slide after incremental as continued=false', () => {
      expect(parser.parse('1\n--\n2\n---\n3')[2].properties.continued).toBe('false');
    });
  });

  describe('slide properties', () => {
    it('extracts a single property', () => {
      expect(parser.parse('name: a\n1')[0].properties.name).toBe('a');
    });

    it('extracts multiple properties', () => {
      const props = parser.parse('name: a\nclass: b\n1')[0].properties;
      expect(props.name).toBe('a');
      expect(props.class).toBe('b');
    });

    it('allows property with empty value', () => {
      expect(parser.parse('a:   \n\nContent.')[0].properties.a).toBe('');
    });

    it('removes extracted properties from content', () => {
      expect(parser.parse('name: a\n1')[0].content).toEqual(['1']);
    });

    it('does not consume a word:value line that appears after other content (issue #4)', () => {
      // "Example: this line disappears" appears after real content — must stay as content.
      const slide = parser.parse('# Heading\n\nExample: this line disappears\n\nMore content.')[0];
      expect(slide.properties['Example']).toBeUndefined();
      expect(slide.content.join('')).toContain('Example: this line disappears');
    });

    it('does not consume a word:value line mixed in with regular content', () => {
      const slide = parser.parse('Some intro\n\nNote: this should stay\n\nMore text')[0];
      expect(slide.properties['Note']).toBeUndefined();
      expect(slide.content.join('')).toContain('Note: this should stay');
    });

    it('stops extracting properties at the first non-property line', () => {
      // "name" is a valid property but the next line is not, so class:b further down stays as content.
      const slide = parser.parse('name: a\nNot valid prop\nclass: b')[0];
      expect(slide.properties.name).toBe('a');
      expect(slide.properties.class).toBeUndefined();
      expect(slide.content.join('')).toContain('class: b');
    });

    it('stops extracting properties at a blank line separating front-matter from content', () => {
      const slide = parser.parse('name: a\n\nclass: b')[0];
      expect(slide.properties.name).toBe('a');
      // class: b is after a blank line — it is content, not a property
      expect(slide.properties.class).toBeUndefined();
      expect(slide.content.join('')).toContain('class: b');
    });
  });

  describe('indentation normalization', () => {
    it('strips common leading whitespace from all slides', () => {
      const slides = parser.parse('      1\n      ---\n      2\n      ---\n      3');
      expect(slides[0].content).toEqual(['1']);
      expect(slides[1].content).toEqual(['2']);
      expect(slides[2].content).toEqual(['3']);
    });

    it('ignores empty lines when computing minimum whitespace', () => {
      const slides = parser.parse('      1\n\n      1\n      ---\n      2');
      expect(slides[0].content).toEqual(['1\n\n1']);
    });
  });
});
