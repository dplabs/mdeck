import { describe, it, expect, beforeEach, vi } from 'vitest';
import EventEmitter from 'eventemitter3';
import { Keyboard, DEFAULT_SHORTCUTS } from '../mdeck/controllers/inputs/keyboard.js';

function fakeKey(key: string, extra: Partial<KeyboardEvent> = {}): KeyboardEvent {
  return { key, metaKey: false, ctrlKey: false, altKey: false, shiftKey: false, preventDefault: vi.fn(), ...extra } as unknown as KeyboardEvent;
}

describe('Keyboard', () => {
  let events: EventEmitter;
  let emitted: string[];

  beforeEach(() => {
    events = new EventEmitter();
    emitted = [];
    // Track all emitted actions
    for (const action of Object.keys(DEFAULT_SHORTCUTS)) {
      events.on(action, () => emitted.push(action));
    }
    events.on('gotoSlideNumber', (n: string) => emitted.push(`gotoSlideNumber:${n}`));
  });

  function press(_kb: unknown, key: string, extra: Partial<KeyboardEvent> = {}) {
    events.emit('keydown', fakeKey(key, extra));
  }

  describe('default shortcuts', () => {
    it('ArrowRight emits gotoNextSlide', () => {
      new Keyboard(events);
      press(null!, 'ArrowRight');
      expect(emitted).toContain('gotoNextSlide');
    });

    it('j emits gotoNextSlide', () => {
      new Keyboard(events);
      press(null!, 'j');
      expect(emitted).toContain('gotoNextSlide');
    });

    it('Space emits gotoNextSlide', () => {
      new Keyboard(events);
      press(null!, ' ');
      expect(emitted).toContain('gotoNextSlide');
    });

    it('Shift+Space emits gotoPreviousSlide', () => {
      new Keyboard(events);
      press(null!, ' ', { shiftKey: true });
      expect(emitted).toContain('gotoPreviousSlide');
      expect(emitted).not.toContain('gotoNextSlide');
    });

    it('ArrowLeft emits gotoPreviousSlide', () => {
      new Keyboard(events);
      press(null!, 'ArrowLeft');
      expect(emitted).toContain('gotoPreviousSlide');
    });

    it('p emits togglePresenterMode', () => {
      new Keyboard(events);
      press(null!, 'p');
      expect(emitted).toContain('togglePresenterMode');
    });

    it('Escape emits hideOverlay', () => {
      new Keyboard(events);
      events.on('hideOverlay', () => emitted.push('hideOverlay'));
      press(null!, 'Escape');
      expect(emitted).toContain('hideOverlay');
    });

    it('digits then Enter emits gotoSlideNumber', () => {
      new Keyboard(events);
      press(null!, '4');
      press(null!, '2');
      press(null!, 'Enter');
      expect(emitted).toContain('gotoSlideNumber:42');
    });

    it('Enter without digits does nothing', () => {
      new Keyboard(events);
      press(null!, 'Enter');
      expect(emitted).toHaveLength(0);
    });

    it('ignores keydown with metaKey', () => {
      new Keyboard(events);
      press(null!, 'j', { metaKey: true });
      expect(emitted).toHaveLength(0);
    });

    it('ignores keydown with ctrlKey', () => {
      new Keyboard(events);
      press(null!, 'j', { ctrlKey: true });
      expect(emitted).toHaveLength(0);
    });
  });

  describe('keyboardShortcuts config', () => {
    it('overrides a default binding with a new key', () => {
      new Keyboard(events, { gotoNextSlide: 'n' });
      press(null!, 'n');
      expect(emitted).toContain('gotoNextSlide');
    });

    it('original key no longer triggers action when overridden', () => {
      new Keyboard(events, { gotoNextSlide: 'n' });
      press(null!, 'j');
      expect(emitted).not.toContain('gotoNextSlide');
    });

    it('accepts an array of keys for one action', () => {
      new Keyboard(events, { gotoNextSlide: ['n', 'ArrowRight'] });
      press(null!, 'n');
      press(null!, 'ArrowRight');
      expect(emitted.filter(e => e === 'gotoNextSlide')).toHaveLength(2);
    });

    it('disables a default binding when set to null', () => {
      new Keyboard(events, { gotoNextSlide: null });
      press(null!, 'ArrowRight');
      press(null!, 'j');
      expect(emitted).not.toContain('gotoNextSlide');
    });

    it('keeps unmentioned defaults intact', () => {
      new Keyboard(events, { gotoNextSlide: 'n' });
      press(null!, 'ArrowLeft');
      expect(emitted).toContain('gotoPreviousSlide');
    });

    it('allows binding a completely new action', () => {
      events.on('customAction', () => emitted.push('customAction'));
      new Keyboard(events, { customAction: 'x' });
      press(null!, 'x');
      expect(emitted).toContain('customAction');
    });
  });

  describe('deactivate / activate', () => {
    it('deactivate stops responding to keys', () => {
      const kb = new Keyboard(events);
      kb.deactivate();
      press(null!, 'ArrowRight');
      expect(emitted).toHaveLength(0);
    });

    it('activate restores key handling after deactivate', () => {
      const kb = new Keyboard(events);
      kb.deactivate();
      kb.activate();
      press(null!, 'ArrowRight');
      expect(emitted).toContain('gotoNextSlide');
    });
  });
});
