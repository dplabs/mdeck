import { documentStyles } from '../../resources.js';

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
