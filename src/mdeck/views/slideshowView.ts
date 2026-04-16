import type EventEmitter from 'eventemitter3';
import type { Dom } from '../dom.js';
import type { SlideshowOptions, Slideshow } from '../models/slideshow.js';
import { SlideView } from './slideView.js';
import { NotesView } from './notesView.js';
import { Scaler } from '../scaler.js';
import { containerLayout } from '../resources.js';
import { printing } from '../components/printing/printing.js';
import { Timer } from '../components/timer/timer.js';
import { getPrefixedProperty } from '../utils.js';

export class SlideshowView {
  containerElement!: HTMLElement;
  elementArea!: HTMLElement;
  previewArea!: HTMLElement;
  notesArea!: HTMLElement;
  backdropElement!: HTMLElement;
  helpElement!: HTMLElement;
  timerElement!: HTMLElement;
  pauseElement!: HTMLElement;
  slideViews: SlideView[] = [];

  private scaler: Scaler;

  constructor(private events: EventEmitter, private dom: Dom, options: SlideshowOptions, private slideshow: Slideshow) {
    const containerElement = options.container!;
    this.scaler = new Scaler(events, slideshow);

    this.configureContainerElement(containerElement);
    this.configureChildElements();
    this.updateDimensions();
    this.scaleElements();
    this.updateSlideViews();

    new Timer(events, this.timerElement, options.timer as Record<string, unknown>);

    events.on('slidesChanged', () => this.updateSlideViews());

    events.on('hideSlide', (slideIndex: number) => {
      Array.from(this.elementArea.getElementsByClassName('remark-fading')).forEach((s) => {
        (s as HTMLElement).classList.remove('remark-fading', 'mdeck-fading');
      });
      this.hideSlide(slideIndex);
    });

    events.on('showSlide', (slideIndex: number) => this.showSlide(slideIndex));

    events.on('forcePresenterMode', () => {
      if (!this.containerElement.classList.contains('remark-presenter-mode')) {
        this.containerElement.classList.add('remark-presenter-mode', 'mdeck-presenter-mode');
        this.scaleElements();
        printing.setPageOrientation('landscape');
      }
    });

    events.on('togglePresenterMode', () => {
      this.containerElement.classList.toggle('remark-presenter-mode');
      this.containerElement.classList.toggle('mdeck-presenter-mode');
      this.scaleElements();
      events.emit('toggledPresenter', this.slideshow.getCurrentSlideIndex() + 1);
      printing.setPageOrientation(this.containerElement.classList.contains('remark-presenter-mode') ? 'portrait' : 'landscape');
    });

    events.on('toggleHelp', () => {
      this.containerElement.classList.toggle('remark-help-mode');
      this.containerElement.classList.toggle('mdeck-help-mode');
    });
    events.on('toggleBlackout', () => {
      this.containerElement.classList.toggle('remark-blackout-mode');
      this.containerElement.classList.toggle('mdeck-blackout-mode');
    });
    events.on('toggleMirrored', () => {
      this.containerElement.classList.toggle('remark-mirrored-mode');
      this.containerElement.classList.toggle('mdeck-mirrored-mode');
    });

    events.on('hideOverlay', () => {
      this.containerElement.classList.remove('remark-blackout-mode', 'mdeck-blackout-mode');
      this.containerElement.classList.remove('remark-help-mode', 'mdeck-help-mode');
    });

    events.on('pause', () => {
      this.containerElement.classList.toggle('remark-pause-mode');
      this.containerElement.classList.toggle('mdeck-pause-mode');
    });
    events.on('resume', () => {
      this.containerElement.classList.toggle('remark-pause-mode');
      this.containerElement.classList.toggle('mdeck-pause-mode');
    });

    this.handleFullscreen();
  }

  isEmbedded(): boolean {
    return this.containerElement !== this.dom.getBodyElement();
  }

  configureContainerElement(element: HTMLElement): void {
    this.containerElement = element;
    element.classList.add('remark-container', 'mdeck-container');

    if (element === this.dom.getBodyElement()) {
      this.dom.getHTMLElement().classList.add('remark-container', 'mdeck-container');
      forwardEvents(this.events, window, ['hashchange', 'resize', 'keydown', 'keypress', 'mousewheel', 'message', 'DOMMouseScroll']);
      forwardEvents(this.events, element, ['touchstart', 'touchmove', 'touchend', 'click', 'contextmenu']);
    } else {
      element.style.position = 'absolute';
      element.tabIndex = -1;
      forwardEvents(this.events, window, ['resize']);
      forwardEvents(this.events, element, ['keydown', 'keypress', 'mousewheel', 'touchstart', 'touchmove', 'touchend']);
    }

    this.events.on('tap', (endX: number) => {
      if (endX < this.containerElement.clientWidth / 2) this.slideshow.gotoPreviousSlide();
      else this.slideshow.gotoNextSlide();
    });
  }

  configureChildElements(): void {
    this.containerElement.innerHTML += containerLayout;
    this.elementArea = this.containerElement.getElementsByClassName('mdeck-slides-area')[0] as HTMLElement;
    this.previewArea = this.containerElement.getElementsByClassName('mdeck-preview-area')[0] as HTMLElement;
    this.notesArea = this.containerElement.getElementsByClassName('mdeck-notes-area')[0] as HTMLElement;

    void new NotesView(this.events, this.notesArea, () => this.slideViews);

    this.backdropElement = this.containerElement.getElementsByClassName('mdeck-backdrop')[0] as HTMLElement;
    this.helpElement = this.containerElement.getElementsByClassName('mdeck-help')[0] as HTMLElement;
    this.timerElement = this.notesArea.getElementsByClassName('mdeck-toolbar-timer')[0] as HTMLElement;
    this.pauseElement = this.containerElement.getElementsByClassName('mdeck-pause')[0] as HTMLElement;

    this.events.on('propertiesChanged', (changes: Record<string, unknown>) => {
      if ('ratio' in changes) this.updateDimensions();
    });
    this.events.on('resize', () => this.scaleElements());

    printing.init();
    printing.on('print', (e: { isPortrait: boolean; pageHeight: number; pageWidth: number }) => {
      const slideHeight = e.isPortrait ? e.pageHeight * 0.4 : e.pageHeight;
      this.slideViews.forEach((sv) => {
        sv.scale({ clientWidth: e.pageWidth, clientHeight: slideHeight } as HTMLElement);
        if (e.isPortrait) {
          sv.scalingElement.style.top = '20px';
          sv.notesElement.style.top = slideHeight + 40 + 'px';
        }
      });
    });
  }

  updateSlideViews(): void {
    this.slideViews.forEach((sv) => this.elementArea.removeChild(sv.containerElement));
    this.slideViews = this.slideshow.getSlides().map((slide) => new SlideView(this.events, this.slideshow, this.scaler, slide));
    this.slideViews.forEach((sv) => this.elementArea.appendChild(sv.containerElement));
    this.updateDimensions();
    if (this.slideshow.getCurrentSlideIndex() > -1) this.showSlide(this.slideshow.getCurrentSlideIndex());
  }

  showSlide(slideIndex: number): void {
    this.events.emit('beforeShowSlide', slideIndex);
    this.slideViews[slideIndex].show();
    const next = this.slideViews[slideIndex + 1];
    this.previewArea.innerHTML = next ? next.containerElement.outerHTML : '';
    this.events.emit('afterShowSlide', slideIndex);
  }

  hideSlide(slideIndex: number): void {
    this.events.emit('beforeHideSlide', slideIndex);
    this.slideViews[slideIndex].hide();
    this.events.emit('afterHideSlide', slideIndex);
  }

  updateDimensions(): void {
    const { width, height } = this.scaler.dimensions;
    this.helpElement.style.width = width + 'px';
    this.helpElement.style.height = height + 'px';
    this.slideViews.forEach((sv) => sv.scaleBackgroundImage(this.scaler.dimensions));
    this.scaleElements();
  }

  scaleElements(): void {
    this.slideViews.forEach((sv) => sv.scale(this.elementArea));
    if (this.previewArea.children.length) {
      this.scaler.scaleToFit(this.previewArea.children[0].children[0] as HTMLElement, this.previewArea);
    }
    this.scaler.scaleToFit(this.helpElement, this.containerElement);
    this.scaler.scaleToFit(this.pauseElement, this.containerElement);
  }

  private handleFullscreen(): void {
    const requestFullscreen = getPrefixedProperty(this.containerElement as unknown as Record<string, unknown>, 'requestFullScreen') as (() => void) | undefined;
    const cancelFullscreen = getPrefixedProperty(document as unknown as Record<string, unknown>, 'cancelFullScreen') as (() => void) | undefined;

    this.events.on('toggleFullscreen', () => {
      const fullscreenEl = getPrefixedProperty(document as unknown as Record<string, unknown>, 'fullscreenElement') || getPrefixedProperty(document as unknown as Record<string, unknown>, 'fullScreenElement');
      if (!fullscreenEl && requestFullscreen) requestFullscreen.call(this.containerElement);
      else if (cancelFullscreen) cancelFullscreen.call(document);
      this.scaleElements();
    });
  }
}

function forwardEvents(target: EventEmitter, source: Window | HTMLElement, eventNames: string[]): void {
  eventNames.forEach((name) => {
    source.addEventListener(name, (...args) => {
      target.emit(name, ...args);
    });
  });
}
