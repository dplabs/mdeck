import type EventEmitter from 'eventemitter3';
import type { SlideView } from './slideView.js';

export class NotesView {
  private notesElement!: HTMLElement;
  private notesPreviewElement!: HTMLElement;
  private currentSlideView: import('./slideView.js').SlideView | null = null;
  private notesRenderedHandler: (() => void) | null = null;

  constructor(events: EventEmitter, private element: HTMLElement, private slideViewsAccessor: () => SlideView[]) {
    this.configureElements();
    events.on('showSlide', (slideIndex: number) => this.showSlide(slideIndex));
  }

  showSlide(slideIndex: number): void {
    const slideViews = this.slideViewsAccessor();
    const slideView = slideViews[slideIndex];
    const nextSlideView = slideViews[slideIndex + 1];

    // Remove stale listener from any previously tracked slide
    if (this.currentSlideView && this.notesRenderedHandler) {
      this.currentSlideView.notesElement.removeEventListener('notesRendered', this.notesRenderedHandler);
      this.notesRenderedHandler = null;
    }

    this.notesElement.innerHTML = slideView.notesElement.innerHTML;
    this.notesPreviewElement.innerHTML = nextSlideView ? nextSlideView.notesElement.innerHTML : '';

    // If the async renderer hasn't resolved yet, update when it does
    this.currentSlideView = slideView;
    this.notesRenderedHandler = () => {
      this.notesElement.innerHTML = slideView.notesElement.innerHTML;
      this.notesRenderedHandler = null;
    };
    slideView.notesElement.addEventListener('notesRendered', this.notesRenderedHandler, { once: true });
  }

  configureElements(): void {
    this.notesElement = this.element.getElementsByClassName('remark-notes')[0] as HTMLElement;
    this.notesPreviewElement = this.element.getElementsByClassName('remark-notes-preview')[0] as HTMLElement;

    this.notesElement.addEventListener('wheel', (e) => e.stopPropagation());
    this.notesPreviewElement.addEventListener('wheel', (e) => e.stopPropagation());

    const toolbar = this.element.getElementsByClassName('remark-toolbar')[0] as HTMLElement;
    const links = toolbar.getElementsByTagName('a');

    const commands: Record<string, () => void> = {
      increase: () => {
        this.notesElement.style.fontSize = ((parseFloat(this.notesElement.style.fontSize) || 1) + 0.1) + 'em';
      },
      decrease: () => {
        this.notesElement.style.fontSize = ((parseFloat(this.notesElement.style.fontSize) || 1) - 0.1) + 'em';
      },
    };

    Array.from(links).forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const command = (e.target as HTMLAnchorElement).hash.substr(1);
        commands[command]?.();
      });
    });
  }
}
