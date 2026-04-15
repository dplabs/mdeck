import { styler } from './mdeck/components/styler/styler.js';

export { createSlideshow, convert, markdownIt, highlighter, macros, version } from './mdeck/api.js';
export type { SlideshowOptions } from './mdeck/api.js';

// Apply embedded styles when loaded as a browser script
styler.styleDocument();
