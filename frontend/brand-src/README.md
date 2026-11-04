# Brand image sources

Editable sources for generated brand images. `vololeads-logo.svg` is a copy of the supplied logo (`png/logo/vololeads-logo.svg`); never edit it.

| Source | Output |
|---|---|
| `og-image.html` | `png/logo/og-image.png` (1200×630, Open Graph / link previews) |
| `apple-touch-icon.html` | `png/logo/apple-touch-icon.png` (180×180, white tile for iOS) |

Re-render on macOS (run inside `brand-src/`):

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless=new --hide-scrollbars --force-device-scale-factor=1 --window-size=1200,630 --virtual-time-budget=4000 --screenshot="$PWD/../png/logo/og-image.png" "file://$PWD/og-image.html"
"$CHROME" --headless=new --hide-scrollbars --force-device-scale-factor=1 --window-size=180,180 --virtual-time-budget=2000 --screenshot="$PWD/../png/logo/apple-touch-icon.png" "file://$PWD/apple-touch-icon.html"
```

Favicon sizes (`favicon-32.png`, `icon-192.png`, `icon-512.png`) are resized from `png/logo/logo-orange-master.png` (the PNG of the same logo) with `sips`. The header and footer use `png/logo/vololeads-logo.svg` directly.
