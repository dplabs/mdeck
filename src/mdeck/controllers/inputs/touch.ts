import type EventEmitter from 'eventemitter3';

export function register(events: EventEmitter, options: Record<string, unknown>): void {
  addTouchEventListeners(events, options);
}

export function unregister(events: EventEmitter): void {
  events.removeAllListeners('touchstart');
  events.removeAllListeners('touchend');
  events.removeAllListeners('touchmove');
}

function addTouchEventListeners(events: EventEmitter, options: Record<string, unknown>): void {
  if (options.touch === false) return;
  let startX = 0, endX = 0;
  events.on('touchstart', (event: TouchEvent) => { startX = event.touches[0].clientX; });
  events.on('touchend', (event: TouchEvent) => {
    if ((event.target as HTMLElement).nodeName.toUpperCase() === 'A') return;
    endX = event.changedTouches[0].clientX;
    if (Math.abs(startX - endX) < 10) events.emit('tap', endX);
    else startX > endX ? events.emit('gotoNextSlide') : events.emit('gotoPreviousSlide');
  });
  events.on('touchmove', (event: TouchEvent) => { event.preventDefault(); });
}
