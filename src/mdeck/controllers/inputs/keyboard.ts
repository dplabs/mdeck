import type EventEmitter from 'eventemitter3';

export class Keyboard {
  private _events: EventEmitter;
  private _gotoSlideNumber = '';

  constructor(events: EventEmitter) {
    this._events = events;
    this.activate();
  }

  activate() {
    this._gotoSlideNumber = '';
    this.addKeyboardEventListeners();
  }

  deactivate() {
    this.removeKeyboardEventListeners();
  }

  addKeyboardEventListeners() {
    const events = this._events;
    events.on('keydown', (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      switch (event.keyCode) {
        case 33: case 37: case 38: events.emit('gotoPreviousSlide'); break;
        case 32: event.shiftKey ? events.emit('gotoPreviousSlide') : events.emit('gotoNextSlide'); break;
        case 34: case 39: case 40: events.emit('gotoNextSlide'); break;
        case 36: events.emit('gotoFirstSlide'); break;
        case 35: events.emit('gotoLastSlide'); break;
        case 27: events.emit('hideOverlay'); break;
        case 13:
          if (this._gotoSlideNumber) { events.emit('gotoSlideNumber', this._gotoSlideNumber); this._gotoSlideNumber = ''; }
          break;
      }
    });
    events.on('keypress', (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey) return;
      const key = String.fromCharCode(event.which).toLowerCase();
      let prevent = true;
      switch (key) {
        case 'j': events.emit('gotoNextSlide'); break;
        case 'k': events.emit('gotoPreviousSlide'); break;
        case 'b': events.emit('toggleBlackout'); break;
        case 'm': events.emit('toggleMirrored'); break;
        case 'c': events.emit('createClone'); break;
        case 'p': events.emit('togglePresenterMode'); break;
        case 'f': events.emit('toggleFullscreen'); break;
        case 's': events.emit('toggleTimer'); break;
        case 't': events.emit('resetTimer'); break;
        case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9': case '0':
          this._gotoSlideNumber += key; break;
        case 'h': case '?': events.emit('toggleHelp'); break;
        default: prevent = false;
      }
      if (prevent) event.preventDefault?.();
    });
  }

  removeKeyboardEventListeners() {
    this._events.removeAllListeners('keydown');
    this._events.removeAllListeners('keypress');
  }
}
