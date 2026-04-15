import type EventEmitter from 'eventemitter3';

export function register(events: EventEmitter): void {
  events.on('message', (message: MessageEvent) => {
    const cap = /^gotoSlide:(\d+)$/.exec(message.data);
    if (cap) events.emit('gotoSlide', parseInt(cap[1], 10), true);
    else if (message.data === 'toggleBlackout') events.emit('toggleBlackout', { propagate: false });
  });
}
