import EventEmitter from 'eventemitter3';
import { styler } from '../styler/styler.js';

const LANDSCAPE = 'landscape';
const PORTRAIT = 'portrait';
const PAGE_HEIGHT = 681;
const PAGE_WIDTH = 908;

class PrintComponent extends EventEmitter {
  private _orientation = LANDSCAPE;
  private _pageHeight = PAGE_HEIGHT;
  private _pageWidth = PAGE_WIDTH;

  init(): void {
    this.setPageOrientation(LANDSCAPE);
    if (!window.matchMedia) return;
    window.matchMedia('print').addEventListener('change', (e) => this.onPrint(e));
  }

  onPrint(e: MediaQueryListEvent): void {
    if (!e.matches) return;
    this.emit('print', { isPortrait: this._orientation === PORTRAIT, pageHeight: this._pageHeight, pageWidth: this._pageWidth });
  }

  setPageOrientation(orientation: string): void {
    if (orientation === PORTRAIT) {
      this._pageHeight = PAGE_WIDTH;
      this._pageWidth = PAGE_HEIGHT;
    } else if (orientation === LANDSCAPE) {
      this._pageHeight = PAGE_HEIGHT;
      this._pageWidth = PAGE_WIDTH;
    } else {
      throw new Error('Unknown print orientation: ' + orientation);
    }
    this._orientation = orientation;
    styler.setPageSize(this._pageWidth + 'px ' + this._pageHeight + 'px');
  }
}

export const printing = new PrintComponent();
