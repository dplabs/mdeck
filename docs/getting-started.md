# Getting Started

## Installation

### Via npm

```bash
npm install mdeck
```

### Via `<script>` tag (UMD)

Download `mdeck.umd.cjs` from the [releases page](https://github.com/dplabs/mdeck/releases) or build it yourself (see [Building from source](#building-from-source)).

---

## Minimal HTML example

Create an HTML file that loads the UMD bundle, puts your Markdown in a `<textarea id="source">`, and calls `mdeck.createSlideshow()`:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>My Slideshow</title>
</head>
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

When no `source` or `sourceUrl` option is provided, mdeck reads the content of `<textarea id="source">` automatically and hides the element.

---

## ESM import

```javascript
import { createSlideshow } from 'mdeck';

createSlideshow({
  source: `
# Hello

---

# World
  `,
});
```

Or with a callback to access the `Slideshow` instance after mounting:

```javascript
import { createSlideshow } from 'mdeck';

createSlideshow({ source: '# Hello\n---\n# World' }, (slideshow) => {
  console.log('Loaded', slideshow.getSlideCount(), 'slides');
});
```

---

## Loading slides from an external file

Use the `sourceUrl` option to fetch a `.md` file at runtime:

```html
<script src="mdeck.umd.cjs"></script>
<script>
  mdeck.createSlideshow({ sourceUrl: 'slides.md' });
</script>
```

```javascript
// ESM
import { createSlideshow } from 'mdeck';
createSlideshow({ sourceUrl: '/content/talk.md' });
```

The file is fetched with `fetch()` so it must be served from the same origin or with appropriate CORS headers.

---

## Running the examples locally

The `examples/` directory contains ready-to-run HTML files. They need a static server — opening them as `file://` URLs won't work.

```bash
# Clone and install
git clone https://github.com/dplabs/mdeck
cd mdeck
npm install

# Start the dev server
npm run dev
```

Then open any of these in your browser:

| URL | Description |
|---|---|
| http://localhost:5173/examples/index.html | Quick demo with a default deck |
| http://localhost:5173/examples/advanced.html | Custom CSS classes, markdown-it plugins, macros |
| http://localhost:5173/examples/controls.html | All keyboard, mouse, and touch controls |
| http://localhost:5173/examples/external.html | Load slides from an external `.md` file via `sourceUrl` |
| http://localhost:5173/examples/inline-source.html | Pass Markdown directly via the `source` option |
| http://localhost:5173/examples/remarkjs-compat.html | remark.js compatibility demo |

---

## Building from source

```bash
git clone https://github.com/dplabs/mdeck
cd mdeck
npm install
npm run dev      # start dev server at localhost:5173
npm run build    # produce dist/mdeck.js and dist/mdeck.umd.cjs
npm test         # run tests
```
