import { describe, it, expect } from 'vitest';

// Mirror the fixed pattern from slideView.ts highlightBlockSpans.
// Uses a lookbehind so no preceding character is consumed, fixing:
//   issue #2 – spans at the start of a line were never matched
//   issue #3 – adjacent spans like `foo`(`bar`) incorrectly captured (
function applyHighlightPattern(html: string): string {
  const pattern = /(?<![`\\])`([^`]+?)`/g;
  return html.replace(pattern, (_m, c) => {
    return `<span class="remark-code-span-highlighted">${c}</span>`;
  });
}

describe('highlightSpans regex', () => {
  describe('basic highlighting', () => {
    it('highlights a span preceded by a non-backtick character', () => {
      const result = applyHighlightPattern('call `method`(arg)');
      expect(result).toContain('<span class="remark-code-span-highlighted">method</span>');
      expect(result).toContain('(arg)');
    });

    it('does not treat fenced code delimiters (```) as highlight spans', () => {
      const result = applyHighlightPattern('```js\ncode\n```');
      expect(result).not.toContain('remark-code-span-highlighted');
    });
  });

  describe('issue #2 – span at start of line', () => {
    it('highlights a span at the very start of a string', () => {
      const result = applyHighlightPattern('`highlightedMethod`(arg1, arg2)');
      expect(result).toContain('<span class="remark-code-span-highlighted">highlightedMethod</span>');
    });

    it('highlights a span at the start of a new line', () => {
      const html = 'normalMethod(a)\n`highlightedMethod`(b)';
      const result = applyHighlightPattern(html);
      expect(result).toContain('<span class="remark-code-span-highlighted">highlightedMethod</span>');
      expect(result).toContain('normalMethod(a)');
    });
  });

  describe('issue #3 – trailing parenthesis not captured', () => {
    it('does not include ( after closing backtick in the highlighted span', () => {
      const result = applyHighlightPattern('case `class Token`(value)');
      expect(result).toContain('<span class="remark-code-span-highlighted">class Token</span>');
      expect(result).toMatch(/<\/span>\(value\)/);
    });

    it('correctly highlights both spans in `foo`(`bar`)', () => {
      const result = applyHighlightPattern('`foo`(`bar`)');
      expect(result).toContain('<span class="remark-code-span-highlighted">foo</span>');
      expect(result).toContain('<span class="remark-code-span-highlighted">bar</span>');
      // ( must not be inside either span
      expect(result).not.toContain('remark-code-span-highlighted">(');
      expect(result).not.toContain('(</span>');
    });

    it('does not capture ( when it follows the closing backtick with spaces', () => {
      const result = applyHighlightPattern('`method` (arg)');
      expect(result).toMatch(/<\/span> \(arg\)/);
    });
  });

  describe('escape handling', () => {
    it('does not highlight a backtick span preceded by a backslash', () => {
      const result = applyHighlightPattern('\\`notHighlighted`');
      expect(result).not.toContain('remark-code-span-highlighted');
    });
  });
});
