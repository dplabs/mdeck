import { Api } from './mdeck/api.js';
import { styler } from './mdeck/components/styler/styler.js';

const mdeck = new Api();

(window as unknown as Record<string, unknown>).mdeck = mdeck;

styler.styleDocument();

export default mdeck;
export { Api };
export type { SlideshowOptions } from './mdeck/models/slideshow.js';
