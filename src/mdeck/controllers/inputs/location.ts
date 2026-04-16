import type EventEmitter from 'eventemitter3';
import type { Dom } from '../../dom.js';
import type { SlideshowView } from '../../views/slideshowView.js';

export function register(events: EventEmitter, dom: Dom, slideshowView: SlideshowView): void {
  if (slideshowView.isEmbedded()) {
    events.emit('gotoSlide', 1);
  } else {
    events.on('hashchange', navigateByHash);
    events.on('slideChanged', updateHash);
    events.on('toggledPresenter', updateHash);
    navigateByHash();
  }

  function navigateByHash() {
    const slideNoOrName = (dom.getLocationHash() || '').slice(1);
    events.emit('gotoSlide', slideNoOrName);
  }

  function updateHash(slideNoOrName: string | number) {
    if (slideshowView.containerElement.classList.contains('remark-presenter-mode')) {
      dom.setLocationHash('#p' + slideNoOrName);
    } else {
      dom.setLocationHash('#' + slideNoOrName);
    }
  }
}
