import type { Slide } from '../../models/slide.js';
import type { Slideshow } from '../../models/slideshow.js';

export class SlideNumber {
  element: HTMLElement;

  constructor(slide: Slide, slideshow: Slideshow) {
    this.element = document.createElement('div');
    this.element.className = 'remark-slide-number';
    this.element.innerHTML = formatSlideNumber(slide, slideshow);
  }
}

function formatSlideNumber(slide: Slide, slideshow: Slideshow): string {
  const format = slideshow.getSlideNumberFormat();
  const slides = slideshow.getSlides();
  const current = slide.getSlideNumber();
  const total = slides[slides.length - 1]?.getSlideNumber() ?? 0;

  if (typeof format === 'function') {
    return format.call(slideshow, current, total);
  }
  return format.replace('%current%', String(current)).replace('%total%', String(total));
}
