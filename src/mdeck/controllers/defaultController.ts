import type EventEmitter from 'eventemitter3';
import type { Dom } from '../dom.js';
import type { SlideshowView } from '../views/slideshowView.js';
import type { KeyboardShortcutsConfig } from '../models/slideshow.js';
import { Keyboard } from './inputs/keyboard.js';
import * as mouse from './inputs/mouse.js';
import * as touch from './inputs/touch.js';
import * as message from './inputs/message.js';
import * as location from './inputs/location.js';

export class DefaultController {
  constructor(events: EventEmitter, dom: Dom, slideshowView: SlideshowView, options: Record<string, unknown> = {}) {
    const keyboard = options.keyboard !== false
      ? new Keyboard(events, options.keyboardShortcuts as KeyboardShortcutsConfig | undefined)
      : null;
    message.register(events);
    location.register(events, dom, slideshowView);
    mouse.register(events, options);
    touch.register(events, options);

    events.on('pause', () => {
      keyboard?.deactivate();
      mouse.unregister(events);
      touch.unregister(events);
    });
    events.on('resume', () => {
      keyboard?.activate();
      mouse.register(events, options);
      touch.register(events, options);
    });
  }
}
