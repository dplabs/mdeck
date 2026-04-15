import EventEmitter from 'eventemitter3';
import type { Slideshow, SlideshowOptions } from '../slideshow.js';

export function applyNavigation(self: Slideshow, events: EventEmitter, options: SlideshowOptions = {}): void {
  let currentSlideIndex = -1;
  let started: boolean | null = null;

  self.getCurrentSlideIndex = () => currentSlideIndex;
  self.gotoSlide = (slideNoOrName, noMessage) => gotoSlide(slideNoOrName, noMessage);
  self.gotoSlideNumber = (slideNumber, noMessage) => gotoSlideNumber(slideNumber, noMessage);
  self.gotoPreviousSlide = () => gotoSlideByIndex(currentSlideIndex - 1);
  self.gotoNextSlide = () => gotoSlideByIndex(currentSlideIndex + 1);
  self.gotoFirstSlide = () => gotoSlideByIndex(0);
  self.gotoLastSlide = () => gotoSlideByIndex(self.getSlideCount() - 1);
  self.pause = () => events.emit('pause');
  self.resume = () => events.emit('resume');

  events.on('gotoSlide', (n: string | number, noMsg?: boolean) => gotoSlide(n, noMsg));
  events.on('gotoSlideNumber', (n: string | number, noMsg?: boolean) => gotoSlideNumber(n, noMsg));
  events.on('gotoPreviousSlide', () => gotoSlideByIndex(currentSlideIndex - 1));
  events.on('gotoNextSlide', () => gotoSlideByIndex(currentSlideIndex + 1));
  events.on('gotoFirstSlide', () => gotoSlideByIndex(0));
  events.on('gotoLastSlide', () => gotoSlideByIndex(self.getSlideCount() - 1));

  events.on('slidesChanged', () => {
    if (currentSlideIndex > self.getSlideCount()) {
      currentSlideIndex = self.getSlideCount();
    }
  });

  events.on('createClone', () => {
    if (options.createClone) {
      self.clone = options.createClone();
    } else if (!self.clone || (self.clone as Window).closed) {
      self.clone = window.open(location.href, self.getCloneTarget(), 'location=no');
    } else {
      (self.clone as Window).focus();
    }
  });

  events.on('resetTimer', () => { started = false; });

  function gotoSlideByIndex(slideIndex: number, noMessage = false) {
    const alreadyOnSlide = slideIndex === currentSlideIndex;
    const slideOutOfRange = slideIndex < 0 || slideIndex > self.getSlideCount() - 1;
    if (alreadyOnSlide || slideOutOfRange) return;

    if (currentSlideIndex !== -1) events.emit('hideSlide', currentSlideIndex, false);

    if (started === null) {
      started = false;
    } else if (started === false) {
      events.emit('start');
      started = true;
    }

    events.emit('showSlide', slideIndex);
    currentSlideIndex = slideIndex;
    events.emit('slideChanged', slideIndex + 1);

    if (!noMessage) {
      if (self.clone && !(self.clone as Window).closed) {
        (self.clone as Window).postMessage('gotoSlide:' + (currentSlideIndex + 1), '*');
      }
      if (window.opener) {
        window.opener.postMessage('gotoSlide:' + (currentSlideIndex + 1), '*');
      }
    }
  }

  function gotoSlide(slideNoOrName: string | number, noMessage?: boolean) {
    gotoSlideByIndex(getSlideIndex(slideNoOrName), noMessage);
  }

  function gotoSlideNumber(slideNumber: string | number, noMessage?: boolean) {
    const slides = self.getSlidesByNumber(parseInt(String(slideNumber), 10));
    if (slides?.length) gotoSlideByIndex(slides[0].getSlideIndex(), noMessage);
  }

  function getSlideIndex(slideNoOrName: string | number): number {
    if (typeof slideNoOrName === 'number') return slideNoOrName - 1;
    const slideNo = parseInt(slideNoOrName, 10);
    if (slideNo.toString() === slideNoOrName) return slideNo - 1;
    if (/^p\d+$/.test(slideNoOrName)) {
      events.emit('forcePresenterMode');
      return parseInt(slideNoOrName.substr(1), 10) - 1;
    }
    const slide = self.getSlideByName(slideNoOrName);
    if (slide) return slide.getSlideIndex();
    return 0;
  }
}
