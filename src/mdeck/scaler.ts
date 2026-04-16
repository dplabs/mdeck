import type EventEmitter from 'eventemitter3';
import type { Slideshow } from './models/slideshow.js';

const referenceHeight = 681;

interface Ratio { width: number; height: number; ratio: number }
interface Dimensions { width: number; height: number }

export class Scaler {
  ratio: Ratio;
  dimensions: Dimensions;

  constructor(events: EventEmitter, slideshow: Slideshow) {
    this.ratio = getRatio(slideshow);
    this.dimensions = getDimensions(this.ratio);

    events.on('propertiesChanged', (changes: Record<string, unknown>) => {
      if ('ratio' in changes) {
        this.ratio = getRatio(slideshow);
        this.dimensions = getDimensions(this.ratio);
      }
    });
  }

  scaleToFit(element: HTMLElement, container: HTMLElement): void {
    const { clientHeight: containerHeight, clientWidth: containerWidth } = container;
    const { ratio, dimensions } = this;
    const scale = containerWidth / ratio.width > containerHeight / ratio.height
      ? containerHeight / dimensions.height
      : containerWidth / dimensions.width;
    const scaledWidth = dimensions.width * scale;
    const scaledHeight = dimensions.height * scale;
    const left = (containerWidth - scaledWidth) / 2;
    const top = (containerHeight - scaledHeight) / 2;

    (element.style as unknown as Record<string, string>)['-webkit-transform'] = `scale(${scale})`;
    element.style.transform = `scale(${scale})`;
    element.style.left = Math.max(left, 0) + 'px';
    element.style.top = Math.max(top, 0) + 'px';
  }
}

function getRatio(slideshow: Slideshow): Ratio {
  const parts = slideshow.getRatio().split(':');
  const width = parseInt(parts[0], 10);
  const height = parseInt(parts[1], 10);
  return { width, height, ratio: width / height };
}

function getDimensions(ratio: Ratio): Dimensions {
  return {
    width: Math.floor(referenceHeight * ratio.ratio),
    height: referenceHeight,
  };
}
