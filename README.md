<p align="center">
  <img src="docs/logo.svg" alt="mdeck" width="300" height="90">
</p>

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

---

## Examples

Live demos are published to GitHub Pages on every release:

| Example | Description |
|---|---|
| [Default deck](https://dplabs.github.io/mdeck/examples/index.html) | Quick demo with a default deck |
| [Advanced](https://dplabs.github.io/mdeck/examples/advanced.html) | Custom CSS classes, markdown-it plugins, macros |
| [Controls](https://dplabs.github.io/mdeck/examples/controls.html) | All keyboard, mouse, and touch controls |
| [External source](https://dplabs.github.io/mdeck/examples/external.html) | Load slides from an external `.md` file via `sourceUrl` |
| [Inline source](https://dplabs.github.io/mdeck/examples/inline-source.html) | Pass Markdown directly via the `source` option |
| [remark.js compat](https://dplabs.github.io/mdeck/examples/remarkjs-compat.html) | remark.js compatibility demo |

To run the examples locally, see [Getting started](docs/getting-started.md#running-the-examples-locally).

---

## Documentation

- [Getting started](docs/getting-started.md) — installation, ESM/UMD usage, `sourceUrl`, running examples, building from source
- [Markdown syntax](docs/markdown-syntax.md) — separators, incremental slides, properties, templates, content classes, speaker notes, macros, code highlighting
- [API reference](docs/api.md) — `createSlideshow()`, all options, `convert()`, `markdownIt`, `highlighter`, `macros`, `Slideshow` instance methods
- [Controls](docs/controls.md) — keyboard shortcuts, mouse, touch gestures
- [Presenter mode](docs/presenter-mode.md) — presenter view, clone mode, timer, speaker notes, `inheritPresenterNotes`

---

## Credits

mdeck is based on **[remark](https://github.com/gnab/remark)** by [gnab](https://github.com/gnab) and contributors, which pioneered the browser-based Markdown slideshow format and established the slide syntax this library is compatible with.

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
