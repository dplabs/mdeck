# Markdown Syntax

## Slide separators

Slides are separated by `---` on its own line:

```markdown
# Slide 1

Content here.

---

# Slide 2

More content.
```

---

## Incremental slides

Use `--` to reveal content step by step within a slide. Each `--` creates a new slide that inherits everything above it:

```markdown
# Build-up slide

- First point

--

- Second point (appears on next press)

--

- Third point
```

---

## Slide properties

Set per-slide properties as key-value pairs at the very top of a slide, before any other content:

```markdown
class: center, middle
name: my-slide
background-image: url(hero.jpg)
background-color: #1a1a2e
background-size: cover
background-position: center

# Centered slide with a hero image
```

| Property | Description |
|---|---|
| `class` | CSS classes applied to the slide element |
| `name` | Named anchor for linking and template references |
| `background-image` | CSS `background-image` value |
| `background-color` | CSS `background-color` value |
| `background-size` | CSS `background-size` value (e.g. `cover`, `contain`) |
| `background-position` | CSS `background-position` value |
| `template` | Name of the slide to use as a template |
| `layout` | `true` — make this slide a layout template (hidden from the deck) |
| `exclude` | `true` — exclude slide from the deck entirely |
| `count` | `false` — exclude slide from the slide count |

---

## Templates

A slide with `layout: true` is used as a layout template — its content is prepended to every subsequent slide that doesn't explicitly set a different template. Layout slides are hidden from the deck.

```markdown
name: base
layout: true

.header[My Talk]

---

# Slide A

Uses the base layout automatically.

---

template: base

# Slide B

Also uses the base layout, explicitly.
```

To stop inheriting the current layout, set `layout: false` on a slide.

---

## Content classes

Wrap inline or block content with a CSS class using `.className[content]`. The content is rendered as Markdown.

**Inline (span):**

```markdown
Here is a .red[red word] in a sentence.
```

**Block (div) — multiline content:**

```markdown
.pull-left[
## Left column

Some text here.
]

.pull-right[
## Right column

Other text here.
]
```

**Multiple classes:**

```markdown
.center.italic[Centered and italic]
```

Common utility classes (you can define your own in CSS):

```markdown
.center[Centered content]
.pull-left[Left-aligned float]
.pull-right[Right-aligned float]
.red[Red text]
.footnote[Bottom footnote]
```

---

## Speaker notes

Add speaker notes after `???` on its own line. Notes are only visible in presenter mode and support Markdown:

```markdown
# My slide

Visible content for the audience.

???

**Private notes** — only visible in presenter mode.

- Remember to pause here
- Ask the audience a question
```

---

## Macros

Macros are reusable slide directives. Register them on the `mdeck.macros` object before calling `createSlideshow()`:

```javascript
mdeck.macros.badge = function(text) {
  return `<span class="badge">${text}</span>`;
};

mdeck.macros.image = function(src, alt) {
  return `<img src="${src}" alt="${alt || ''}">`;
};
```

**Inline macro call** — `!name(arg1, arg2)`:

```markdown
!badge(New)

# My slide with a badge
```

**Object macro call** — `![:name arg1, arg2](obj)`. The second form passes `obj` as `this` inside the macro function:

```markdown
![:image /hero.jpg, Hero image](link)
```

Inside the macro, `this` is the object (`link` above, parsed as a string).

---

## ATX headings without space

For remark compatibility, headings without a space after `#` are supported:

```markdown
#Heading

##Sub-heading
```

These are treated the same as `# Heading` and `## Sub-heading`.

---

## Syntax-highlighted code blocks

Fenced code blocks are highlighted via [highlight.js](https://highlightjs.org/):

````markdown
```javascript
const greeting = 'Hello, world!';
console.log(greeting);
```
````

### Line highlighting

Enable with `highlightLines: true`. Prefix a line with `*` to highlight it:

````markdown
```javascript
function add(a, b) {
* return a + b;   // this line is highlighted
}
```
````

### Span highlighting

Enable with `highlightSpans: true`. Wrap a portion of a line with `*` (or a custom regex via `highlightSpans: /pattern/`) to highlight just that span:

````markdown
```javascript
const x = *42*;
```
````
