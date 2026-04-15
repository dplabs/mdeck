import EventEmitter from 'eventemitter3';
import type { Slideshow } from '../slideshow.js';

export function applyEvents(self: Slideshow, events: EventEmitter): void {
  const externalEmitter = new EventEmitter();

  self.on = (...args: Parameters<EventEmitter['on']>) => {
    externalEmitter.on(...args);
    return self;
  };

  const slideEvents = ['showSlide','hideSlide','beforeShowSlide','afterShowSlide','beforeHideSlide','afterHideSlide','toggledPresenter'];
  slideEvents.forEach((eventName) => {
    events.on(eventName, (slideIndex: number) => {
      const slide = self.getSlides()[slideIndex];
      externalEmitter.emit(eventName, slide);
    });
  });
}
