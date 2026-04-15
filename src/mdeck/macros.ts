import type { MacroMap } from './parser.js';

const macros: MacroMap = {
  hello() {
    return 'hello!';
  },
};

export default macros;
