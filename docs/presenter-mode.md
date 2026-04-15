# Presenter Mode

## Opening presenter mode

Press **`P`** during a slideshow to open the presenter view in a new browser window. Both windows stay in sync — navigating in either one updates the other.

The presenter window shows:
- **Current slide** — the live slide being displayed to the audience
- **Next slide preview** — a preview of the upcoming slide
- **Speaker notes** — the notes written after `???` in the current slide
- **Timer** — elapsed presentation time

---

## Clone mode

Press **`C`** to open a synchronized clone of the slideshow in a new window. The clone mirrors the current slide in real time via `postMessage`. Use this for a projector or second screen while keeping presenter view on your laptop.

The target for the clone window defaults to `_blank`. Change it with the `cloneTarget` option:

```javascript
mdeck.createSlideshow({
  cloneTarget: 'projector-window',
});
```

---

## Timer controls

| Key | Action |
|---|---|
| `S` | Start / pause the timer |
| `T` | Reset the timer to 0:00 |

The timer is visible in the presenter window only.

---

## Writing speaker notes

Add speaker notes after `???` on its own line. Notes are hidden from the audience and only appear in presenter mode. They support full Markdown:

```markdown
# Performance

We improved throughput by 3×.

???

Mention the benchmark setup — 4-core VM, 1 GB RAM.

- Ask if anyone has used the old version
- **Pause for questions** before the next section
```

---

## Inheriting notes from layout slides

By default, speaker notes on layout or template slides are **not** shown in the presenter view of child slides. Enable inheritance with the `inheritPresenterNotes` option:

```javascript
mdeck.createSlideshow({
  inheritPresenterNotes: true,
});
```

With this option on, notes from a layout slide are prepended to the notes of every slide that uses it.
