# Brand image sources

Editable sources for generated brand images. The site logo is the original `png/logo.webp` (orange 3D bolt), used unchanged in the header and footer. `logo-bolt.png` here (and in `proof/`) is that logo cropped tightly around the bolt; regenerate it from `png/logo.webp` rather than editing it.

| Source | Output |
|---|---|
| `og-image.html` | `png/logo/og-image.png` (1200×630, Open Graph / link previews) |
| `proof/one-caller-one-month.html` | `png/proof/one-caller-one-month.png` + `.webp` |
| `proof/four-month-consistency.html` | `png/proof/four-month-consistency.png` + `.webp` |

Proof images use real KPI figures: never change the numbers.

Re-render on macOS (run inside `brand-src/`):

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless=new --hide-scrollbars --force-device-scale-factor=1 --window-size=1200,630 --virtual-time-budget=4000 --screenshot="$PWD/../png/logo/og-image.png" "file://$PWD/og-image.html"
"$CHROME" --headless=new --hide-scrollbars --force-device-scale-factor=2 --window-size=1200,675 --virtual-time-budget=4000 --screenshot="$PWD/../png/proof/one-caller-one-month.png" "file://$PWD/proof/one-caller-one-month.html"
```

The favicon is the original `png/logo.webp` (set in `app/layout.js`). Proof WebPs are the PNGs resized to 720×405 and encoded with `cwebp -q 86`.
