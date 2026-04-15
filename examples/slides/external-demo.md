class: center, middle

# External Markdown

### Loaded at runtime via `sourceUrl`

---

# How it works

Pass a `sourceUrl` to `createSlideshow()` instead of inlining a `<textarea>`:

```javascript
mdeck.createSlideshow({
  sourceUrl: 'slides/external-demo.md'
});
```

mdeck fetches the file, parses it, and mounts the slideshow — no page reload needed.

---

# Why use an external file?

- Keep slide **content** separate from the HTML shell
- Edit Markdown in your favourite editor without touching HTML
- Reuse the same shell for multiple decks — just change `sourceUrl`
- Version-control slides independently from presentation config

---

# Hot-reload friendly

During development, pair this with a live-reload server:

```bash
npx serve examples/
```

Edit `external-demo.md`, refresh the browser — your slides update instantly.

---

# Any URL works

```javascript
// Local file (same origin)
mdeck.createSlideshow({ sourceUrl: 'slides/my-talk.md' });

// Absolute URL (mind CORS)
mdeck.createSlideshow({
  sourceUrl: 'https://raw.githubusercontent.com/you/repo/main/deck.md'
});
```

???

When fetching cross-origin content, the server must send appropriate
`Access-Control-Allow-Origin` headers.

---
class: center, middle

# That's it!

This entire deck lives in a plain `.md` file.
