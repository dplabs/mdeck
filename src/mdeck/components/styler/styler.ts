import { documentStyles } from '../../resources.js';
import { styles as bundledStyles } from '../../highlighter.js';

export const styler = {
  styleDocument(): void {
    if (getRemarkStylesheet()) return;
    const head = document.getElementsByTagName('head')[0];
    const style = document.createElement('style');
    style.type = 'text/css';
    style.title = 'remark';
    const css = documentStyles;
    style.innerHTML = css;
    head.insertBefore(style, head.firstChild);
  },

  injectHighlightTheme(style: string): void {
    const id = 'mdeck-hljs-theme-' + style;
    if (document.getElementById(id)) return;

    // If a CSS string was manually registered (e.g. mdeck.highlighter.styles['mytheme'] = css),
    // inject it scoped to the slide element so it doesn't bleed globally.
    if (bundledStyles[style]) {
      const el = document.createElement('style');
      el.id = id;
      el.innerHTML = bundledStyles[style];
      document.head.appendChild(el);
      return;
    }

    // Fall back to loading from jsDelivr CDN.
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = `https://cdn.jsdelivr.net/npm/highlight.js@11/styles/${style}.min.css`;
    document.head.appendChild(link);
  },

  setPageSize(size: string): void {
    const stylesheet = getRemarkStylesheet();
    if (!stylesheet) return;
    const pageRule = getPageRule(stylesheet);
    if (pageRule) (pageRule as CSSPageRule).style.setProperty('size', size);
  },
};

function getRemarkStylesheet(): CSSStyleSheet | undefined {
  for (let i = 0; i < document.styleSheets.length; i++) {
    if (document.styleSheets[i].title === 'remark') return document.styleSheets[i];
  }
  return undefined;
}

function getPageRule(stylesheet: CSSStyleSheet): CSSRule | undefined {
  for (let i = 0; i < stylesheet.cssRules.length; i++) {
    if (stylesheet.cssRules[i] instanceof CSSPageRule) return stylesheet.cssRules[i];
  }
  return undefined;
}
