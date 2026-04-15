# API Reference

## `createSlideshow(options?, callback?)`

Mounts a slideshow and returns the `Slideshow` instance.

```javascript
// UMD
const slideshow = mdeck.createSlideshow(options, (ss) => {
  console.log('mounted', ss.getSlideCount(), 'slides');
});

// ESM
import { createSlideshow } from 'mdeck';
const slideshow = createSlideshow(options);
```

If no `source` or `sourceUrl` is provided, mdeck reads the content of `<textarea id="source">` and hides it.

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `source` | `string` | `<textarea>` content | Markdown source string |
| `sourceUrl` | `string` | — | URL of an external `.md` file to fetch |
| `container` | `HTMLElement` | `<body>` | Element to mount the slideshow into |
| `ratio` | `string` | `'4:3'` | Slide aspect ratio (e.g. `'16:9'`) |
| `highlightStyle` | `string` | `'default'` | highlight.js theme name |
| `highlightLines` | `boolean` | `false` | Line highlighting in code blocks (prefix line with `*`) |
| `highlightSpans` | `boolean\|RegExp` | `false` | Span highlighting in code blocks |
| `highlightInlineCode` | `boolean` | `false` | Apply highlight.js to inline `code` elements |
| `highlightLanguage` | `string` | `''` | Default language for unlabelled fenced code blocks |
| `slideNumberFormat` | `string\|function` | `'%current% / %total%'` | Slide number format; use `%current%` and `%total%` tokens, or pass `(current, total) => string` |
| `showSlideNumber` | `boolean` | `true` | Show or hide the slide number |
| `navigation` | `object` | see below | Input control options |
| `countIncrementalSlides` | `boolean` | `true` | Count `--` incremental slides in the total |
| `disableIncrementalSlides` | `boolean` | `false` | Treat `--` as a full slide separator (disables incremental reveal) |
| `excludedClasses` | `string[]` | `[]` | Slides with any of these CSS classes are excluded from the deck |
| `includePresenterNotes` | `boolean` | `true` | Parse and include speaker notes (`???`) |
| `inheritPresenterNotes` | `boolean` | `false` | Inherit speaker notes from layout/template slides |
| `cloneTarget` | `string` | `'_blank'` | Window target used when pressing `C` to open a clone window |
| `markdownRenderer` | `(md: string) => string\|null\|Promise` | — | Override the built-in markdown renderer on a per-slide basis |

### `navigation` options

| Option | Default | Description |
|---|---|---|
| `click` | `false` | Left-click = next slide, right-click = previous slide |
| `scroll` | `true` | Mouse wheel navigates between slides |
| `touch` | `true` | Swipe/tap navigates on touch devices |

---

## `convert(markdown)`

Renders a Markdown string to an HTML string (single slide, no slideshow scaffold):

```javascript
import { convert } from 'mdeck';

const html = convert('# Hello **world**');
// '<h1>Hello <strong>world</strong></h1>'
```

---

## `markdownIt`

The shared `markdown-it` instance used for all slide rendering. Attach plugins **before** calling `createSlideshow()`:

```javascript
import { markdownIt, createSlideshow } from 'mdeck';
import markdownItMark from 'markdown-it-mark';

markdownIt.use(markdownItMark);
createSlideshow();
```

---

## `highlighter`

The [highlight.js](https://highlightjs.org/) instance. Use it to register custom languages or pre-populate theme CSS.

**Register a custom language:**

```javascript
import { highlighter } from 'mdeck';
import myLang from './my-lang-definition.js';

highlighter.registerLanguage('mylang', myLang);
```

**Pre-populate a custom theme** so it can be used as `highlightStyle` without a CDN:

```javascript
import { highlighter } from 'mdeck';

highlighter.styles['mytheme'] = `
  .hljs { background: #1e1e1e; color: #d4d4d4; }
  .hljs-keyword { color: #569cd6; }
`;

createSlideshow({ highlightStyle: 'mytheme' });
```

---

## `macros`

The macro registry. Assign functions to register new macros; the function receives any arguments passed in the slide source and must return an HTML string. When the `![:name ...](obj)` form is used, `this` is bound to the object.

```javascript
import { macros } from 'mdeck';

macros.badge = function(text, color = 'blue') {
  return `<span class="badge badge--${color}">${text}</span>`;
};

macros.icon = function(name) {
  return `<svg class="icon"><use href="#${name}"></use></svg>`;
};
```

Usage in slides:

```markdown
!badge(New, green)

![:icon arrow-right]()
```

---

## `version`

The current mdeck version string:

```javascript
import { version } from 'mdeck';
console.log(version); // e.g. '1.0.0'
```

---

## `Slideshow` instance

Returned by `createSlideshow()`. All methods are synchronous unless noted.

### Slide access

| Method | Returns | Description |
|---|---|---|
| `getSlides()` | `Slide[]` | All slides in the deck |
| `getSlideCount()` | `number` | Total number of slides |
| `getSlideByName(name)` | `Slide\|undefined` | Find a slide by its `name` property |
| `getSlidesByNumber(n)` | `Slide[]` | All slides at logical slide number `n` (incremental slides share a number) |
| `getCurrentSlideIndex()` | `number` | Zero-based index of the current slide |

### Navigation

| Method | Description |
|---|---|
| `gotoSlide(n)` | Go to slide by zero-based index |
| `gotoSlideNumber(n)` | Go to slide by one-based slide number |
| `gotoPreviousSlide()` | Go to the previous slide |
| `gotoNextSlide()` | Go to the next slide |
| `gotoFirstSlide()` | Go to the first slide |
| `gotoLastSlide()` | Go to the last slide |

### Loading

| Method | Description |
|---|---|
| `loadFromString(source)` | Replace the deck with new Markdown source |
| `loadFromUrl(url, callback?)` | Fetch a `.md` file and replace the deck; optional callback fires after load |

### UI toggles

| Method | Description |
|---|---|
| `togglePresenterMode()` | Open/close presenter mode in a new window |
| `toggleHelp()` | Show/hide the keyboard shortcut overlay |
| `toggleBlackout()` | Toggle blackout (blank) screen |
| `toggleMirrored()` | Flip the slide horizontally |
| `toggleFullscreen()` | Enter/exit fullscreen |
| `toggleTimer()` | Start or pause the presentation timer |
| `resetTimer()` | Reset the timer to 0:00 |
| `pause()` | Pause all playback |
| `resume()` | Resume playback |
