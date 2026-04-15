import type EventEmitter from 'eventemitter3';

export function register(events: EventEmitter, options: Record<string, unknown>): void {
  addMouseEventListeners(events, options);
}

export function unregister(events: EventEmitter): void {
  events.removeAllListeners('click');
  events.removeAllListeners('contextmenu');
  events.removeAllListeners('mousewheel');
}

function addMouseEventListeners(events: EventEmitter, options: Record<string, unknown>): void {
  if (options.click) {
    events.on('click', (event: MouseEvent) => {
      if ((event.target as HTMLElement).nodeName === 'A') return;
      if (event.button === 0) events.emit('gotoNextSlide');
    });
    events.on('contextmenu', (event: MouseEvent) => {
      if ((event.target as HTMLElement).nodeName === 'A') return;
      event.preventDefault();
      events.emit('gotoPreviousSlide');
    });
  }
  if (options.scroll !== false) {
    const scrollHandler = (event: WheelEvent & { wheelDeltaY?: number; detail?: number }) => {
      if ((event.wheelDeltaY ?? 0) > 0 || (event.detail ?? 0) < 0) events.emit('gotoPreviousSlide');
      else if ((event.wheelDeltaY ?? 0) < 0 || (event.detail ?? 0) > 0) events.emit('gotoNextSlide');
    };
    events.on('mousewheel', scrollHandler);
    events.on('DOMMouseScroll', scrollHandler);
  }
}
