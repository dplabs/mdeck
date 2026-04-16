import type EventEmitter from 'eventemitter3';
import type { KeyboardShortcutsConfig } from '../../models/slideshow.js';

/**
 * Default keyboard shortcuts. Keys use KeyboardEvent.key values.
 * Multiple keys can be bound to one action.
 */
export const DEFAULT_SHORTCUTS: Record<string, string[]> = {
  gotoNextSlide:       ['ArrowRight', 'ArrowDown', 'PageDown', 'j', ' '],
  gotoPreviousSlide:   ['ArrowLeft', 'ArrowUp', 'PageUp', 'k'],
  gotoFirstSlide:      ['Home'],
  gotoLastSlide:       ['End'],
  toggleBlackout:      ['b'],
  toggleMirrored:      ['m'],
  createClone:         ['c'],
  togglePresenterMode: ['p'],
  toggleFullscreen:    ['f'],
  toggleTimer:         ['s'],
  resetTimer:          ['t'],
  toggleHelp:          ['h', '?'],
  hideOverlay:         ['Escape'],
};

/** Resolve the effective shortcut map by merging defaults with user overrides. */
function resolveShortcuts(userConfig?: KeyboardShortcutsConfig): Record<string, string[]> {
  const result: Record<string, string[]> = {};

  for (const [action, keys] of Object.entries(DEFAULT_SHORTCUTS)) {
    const override = userConfig?.[action];
    if (override === null) continue;                    // disabled
    if (override === undefined) {
      result[action] = keys;                           // keep default
    } else {
      result[action] = Array.isArray(override) ? override : [override]; // user override
    }
  }

  // Allow user to define entirely new action → key bindings
  if (userConfig) {
    for (const [action, keys] of Object.entries(userConfig)) {
      if (action in DEFAULT_SHORTCUTS) continue;       // already handled above
      if (keys === null || keys === undefined) continue;
      result[action] = Array.isArray(keys) ? keys : [keys];
    }
  }

  return result;
}

/** Build an inverted map: normalised key string → action name. */
function buildKeyMap(shortcuts: Record<string, string[]>): Map<string, string> {
  const map = new Map<string, string>();
  for (const [action, keys] of Object.entries(shortcuts)) {
    for (const k of keys) {
      map.set(normaliseKey(k), action);
    }
  }
  return map;
}

/** Normalise a key string to lowercase for case-insensitive single-char keys. */
function normaliseKey(key: string): string {
  return key.length === 1 ? key.toLowerCase() : key;
}

export class Keyboard {
  private _events: EventEmitter;
  private _keyMap: Map<string, string>;
  private _gotoSlideNumber = '';
  private _handler: ((event: KeyboardEvent) => void) | null = null;

  constructor(events: EventEmitter, shortcuts?: KeyboardShortcutsConfig) {
    this._events = events;
    this._keyMap = buildKeyMap(resolveShortcuts(shortcuts));
    this.activate();
  }

  activate() {
    this._gotoSlideNumber = '';
    this._handler = (event: KeyboardEvent) => this._onKeydown(event);
    this._events.on('keydown', this._handler);
  }

  deactivate() {
    if (this._handler) {
      this._events.removeListener('keydown', this._handler);
      this._handler = null;
    }
  }

  private _onKeydown(event: KeyboardEvent) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    const key = event.key;

    // Digit accumulator: 0-9 builds a slide number, Enter commits it.
    if (/^[0-9]$/.test(key)) {
      this._gotoSlideNumber += key;
      event.preventDefault?.();
      return;
    }
    if (key === 'Enter') {
      if (this._gotoSlideNumber) {
        this._events.emit('gotoSlideNumber', this._gotoSlideNumber);
        this._gotoSlideNumber = '';
      }
      return;
    }

    // Shift+Space → previous slide (special case, not in keymap).
    if (key === ' ' && event.shiftKey) {
      this._events.emit('gotoPreviousSlide');
      event.preventDefault?.();
      return;
    }

    const normKey = normaliseKey(key);
    const action = this._keyMap.get(normKey);
    if (action) {
      this._events.emit(action);
      event.preventDefault?.();
    }
  }
}
