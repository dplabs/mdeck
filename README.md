# mdeck

A modern, extensible browser-based Markdown slideshow library — built on [Vite](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/), and [markdown-it](https://github.com/markdown-it/markdown-it).

**mdeck is based on [remark](https://github.com/gnab/remark)** by [gnab](https://github.com/gnab). It preserves full compatibility with remark's Markdown slide syntax while modernizing the tooling and opening up the parser for extensibility via markdown-it plugins.

---

## Features

- **Full remark Markdown compatibility** — existing slide decks work without changes
- **markdown-it powered** — access the parser instance to attach any markdown-it plugin
- **Syntax highlighting** via [highlight.js](https://highlightjs.org/)
- **Presenter mode** with speaker notes, next-slide preview, and timer
- **Clone mode** — sync two windows via `postMessage` (laptop + projector)
- **Slide scaling** — consistent layout across all screen resolutions
- **Touch support** — swipe to navigate on mobile/tablet
- **URL deep linking** — current slide tracked in the hash (`#3`)
- **Content classes** — apply CSS classes to inline or block content
- **Macros** — reusable slide directives
- **TypeScript** — fully typed, ESM-first, with a UMD build for `<script>` tags

---

## Quick start

### Via `<script>` tag (UMD)

```html
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
<textarea id="source">
# Slide 1

Hello, world!

---

# Slide 2

Another slide.
</textarea>
<script src="mdeck.umd.cjs"></script>
<script>
  mdeck.createSlideshow();
</script>
</body>
</html>
```

### Via npm (ESM)

```bash
npm install mdeck
```

```javascript
import { createSlideshow } from 'mdeck';

createSlideshow({ source: '# Hello\n---\n# World' });
```

---

## Markdown syntax

Slides are separated by `---` on its own line:

```markdown
# Slide 1

Content here.

---

# Slide 2

More content.
```

### Slide properties

Set per-slide properties at the top of a slide:

```markdown
class: center, middle
name: my-slide
background-image: url(bg.jpg)

# Centered slide
```

### Templates

Use `template: name` to inherit content from a named slide:

```markdown
name: base
layout: true

Header on every slide

---

template: base

# Slide using the base template
```

### Content classes

Wrap inline or block content with a CSS class using `.className[…]`:

```markdown
.center[This is centered]

.pull-left[
  ## Left column
]

.pull-right[
  ## Right column
]

Here is a .red[red word] inline.
```

### Speaker notes

Add notes after `???` — visible only in presenter mode:

```markdown
# My slide

Visible content.

???

These notes appear in presenter mode only.
They support **Markdown**.
```

### Macros

Define reusable slide directives and call them with `!name(arg)`:

```javascript
mdeck.macros.badge = (text) =>
  `<span class="badge">${text}</span>`;
```

```markdown
!badge(New)

# My slide
```

---

## API

### `createSlideshow(options?, callback?)`

Mounts a slideshow and returns the `Slideshow` instance.

```javascript
const slideshow = mdeck.createSlideshow(options, (ss) => {
  console.log('mounted', ss);
});
```

If no `source` or `sourceUrl` is provided, the content of `<textarea id="source">` is used automatically and the element is hidden.

#### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `source` | `string` | `<textarea>` content | Markdown source string |
| `sourceUrl` | `string` | — | URL of an external `.md` file to fetch |
| `container` | `HTMLElement` | `<body>` | Element to mount the slideshow into |
| `ratio` | `string` | `'4:3'` | Slide aspect ratio (e.g. `'16:9'`) |
| `highlightStyle` | `string` | `'default'` | highlight.js theme name |
| `highlightLines` | `boolean` | `true` | Enable line highlighting in code blocks |
| `highlightSpans` | `boolean` | `true` | Enable span highlighting in code blocks |
| `navigation` | `object` | see below | Input control options |

#### `navigation` options

| Option | Default | Description |
|---|---|---|
| `click` | `false` | Left-click advances, right-click goes back |
| `scroll` | `true` | Mouse wheel navigates between slides |
| `touch` | `true` | Swipe/tap navigates on touch devices |

### `convert(markdown)`

Converts a markdown string to HTML (single slide, inline rendering).

```javascript
const html = mdeck.convert('# Hello **world**');
```

### `markdownIt`

The shared `markdown-it` instance. Attach plugins before calling `createSlideshow()`:

```javascript
import markdownItMark from 'markdown-it-mark';

mdeck.markdownIt.use(markdownItMark);
mdeck.createSlideshow();
```

### `highlighter`

The [highlight.js](https://highlightjs.org/) instance, for registering custom languages:

```javascript
mdeck.highlighter.registerLanguage('mylang', definition);
```

### `macros`

The macro registry object. Add functions to register new macros:

```javascript
mdeck.macros.badge = (text) => `<span class="badge">${text}</span>`;
```

### `version`

The current mdeck version string.

```javascript
console.log(mdeck.version); // '1.0.0'
```

---

## Controls

### Keyboard

| Key(s) | Action |
|---|---|
| `→` `↓` `Page↓` `Space` | Next slide |
| `←` `↑` `Page↑` `Shift+Space` | Previous slide |
| `J` | Next slide (Vim-style) |
| `K` | Previous slide (Vim-style) |
| `Home` | First slide |
| `End` | Last slide |
| _number_ + `Enter` | Jump to slide number |
| `P` | Toggle presenter mode |
| `C` | Clone slideshow in a new window |
| `F` | Toggle fullscreen |
| `B` | Toggle blackout |
| `M` | Toggle mirrored mode |
| `S` | Start / pause timer |
| `T` | Reset timer |
| `Esc` | Close active overlay |
| `H` or `?` | Toggle help overlay |

### Mouse

| Action | Result |
|---|---|
| Left-click _(opt-in)_ | Next slide |
| Right-click _(opt-in)_ | Previous slide |
| Scroll down | Next slide |
| Scroll up | Previous slide |

Click navigation is off by default — enable with `navigation: { click: true }`.

### Touch

| Gesture | Result |
|---|---|
| Swipe left | Next slide |
| Swipe right | Previous slide |
| Tap right half | Next slide |
| Tap left half | Previous slide |

---

## Presenter mode

Press **P** to open presenter mode, or **C** to clone the slideshow into a second synchronized window.

Presenter view shows:
- Current slide
- Speaker notes (written after `???`)
- Preview of the next slide
- Presentation timer (**S** to start/pause, **T** to reset)

---

## Building from source

```bash
git clone https://github.com/your-org/mdeck
cd mdeck
npm install
npm run dev      # start dev server at localhost:5173
npm run build    # produce dist/mdeck.js and dist/mdeck.umd.cjs
npm test         # run tests
```

---

## Examples

The `examples/` directory contains ready-to-run HTML files (open via `npm run preview` or any static server after `npm run build`):

| File | Description |
|---|---|
| `index.html` | Quick demo with a default deck |
| `introduction.html` | Full feature tour (ported from remarkjs.com) |
| `advanced.html` | Custom CSS classes, markdown-it plugins, macros |
| `controls.html` | All keyboard, mouse, and touch controls |
| `external.html` | Load slides from an external `.md` file via `sourceUrl` |
| `inline-source.html` | Pass Markdown directly via the `source` option |

---

## Credits

mdeck is based on **[remark](https://github.com/gnab/remark)** by [gnab](https://github.com/gnab) and contributors, which pioneered the browser-based Markdown slideshow format and established the slide syntax this library is compatible with.

Key differences from remark:

| | remark | mdeck |
|---|---|---|
| Tooling | Plain JS, no bundler | TypeScript, Vite |
| Markdown parser | marked | markdown-it (extensible) |
| Distribution | Single-file CDN script | ESM + UMD, npm package |
| API | Class-based (`remark.create()`) | Named exports (`createSlideshow()`) |
| Plugin system | None | Full markdown-it plugin ecosystem |

---

## License

MIT
