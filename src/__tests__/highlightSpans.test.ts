import { describe, it, expect } from 'vitest';

// Test the highlight-spans regex behaviour directly.
// The bug (issue #2): a backtick span at the very start of a line was not
// recognised because the pattern required a non-backtick character before the
// opening backtick.  The fix adds `^` as an alternative via the `m` flag.

function applyHighlightPattern(html: string): string {
  // Mirrors the fixed pattern in highlightBlockSpans (highlightSpans === true).
  const pattern = /(^|[^`])`([^`]+?)`/gm;
  return html.replace(pattern, (m, e, c) => {
    if (e === '\\') return m.slice(1);
    return e + `<span class="remark-code-span-highlighted">${c}</span>`;
  });
}

describe('highlightSpans regex (issue #2)', () => {
  it('highlights a span preceded by a non-backtick character', () => {
    const result = applyHighlightPattern('call `method`(arg)');
    expect(result).toContain('<span class="remark-code-span-highlighted">method</span>');
  });

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

  it('does not double-highlight adjacent backtick spans', () => {
    const result = applyHighlightPattern('`a` and `b`');
    expect(result).toContain('<span class="remark-code-span-highlighted">a</span>');
    expect(result).toContain('<span class="remark-code-span-highlighted">b</span>');
  });

  it('does not highlight a backtick span that is escaped', () => {
    const result = applyHighlightPattern('\\`notHighlighted`');
    expect(result).not.toContain('remark-code-span-highlighted');
  });

  it('does not treat fenced code delimiters (```) as highlight spans', () => {
    const result = applyHighlightPattern('```js\ncode\n```');
    expect(result).not.toContain('remark-code-span-highlighted');
  });
});
