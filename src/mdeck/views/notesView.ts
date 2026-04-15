import type EventEmitter from 'eventemitter3';
import type { SlideView } from './slideView.js';

export class NotesView {
  private notesElement!: HTMLElement;
  private notesPreviewElement!: HTMLElement;

  constructor(events: EventEmitter, private element: HTMLElement, private slideViewsAccessor: () => SlideView[]) {
    this.configureElements();
    events.on('showSlide', (slideIndex: number) => this.showSlide(slideIndex));
  }

  showSlide(slideIndex: number): void {
    const slideViews = this.slideViewsAccessor();
    const slideView = slideViews[slideIndex];
    const nextSlideView = slideViews[slideIndex + 1];

    this.notesElement.innerHTML = slideView.notesElement.innerHTML;
    this.notesPreviewElement.innerHTML = nextSlideView ? nextSlideView.notesElement.innerHTML : '';
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
