# Controls

## Keyboard shortcuts

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

---

## Mouse

Mouse wheel navigation is enabled by default. Click navigation is opt-in.

| Action | Result |
|---|---|
| Scroll down | Next slide |
| Scroll up | Previous slide |
| Left-click _(opt-in)_ | Next slide |
| Right-click _(opt-in)_ | Previous slide |

**Enable click navigation:**

```javascript
mdeck.createSlideshow({
  navigation: { click: true },
});
```

**Disable scroll navigation:**

```javascript
mdeck.createSlideshow({
  navigation: { scroll: false },
});
```

---

## Touch

Touch navigation is enabled by default.

| Gesture | Result |
|---|---|
| Swipe left | Next slide |
| Swipe right | Previous slide |
| Tap right half of screen | Next slide |
| Tap left half of screen | Previous slide |

**Disable touch navigation:**

```javascript
mdeck.createSlideshow({
  navigation: { touch: false },
});
```
