export class Dom {
  getHTMLElement(): HTMLElement {
    return document.getElementsByTagName('html')[0];
  }

  getBodyElement(): HTMLBodyElement {
    return document.body as HTMLBodyElement;
  }

  getElementById(id: string): HTMLElement | null {
    return document.getElementById(id);
  }

  getLocationHash(): string {
    return window.location.hash;
  }

  setLocationHash(hash: string): void {
    if (typeof window.history.replaceState === 'function' && window.origin !== 'null') {
      window.history.replaceState(undefined, '', hash);
    } else {
      window.location.hash = hash;
    }
  }

  XMLHttpRequest = XMLHttpRequest;
}
