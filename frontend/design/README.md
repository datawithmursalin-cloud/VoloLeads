# Insight imagery

Four separate thumbnail assets, designed for the existing VoloLeads article grid. The source PNGs live in `../png/insights-*-minimal.png`; the site serves smaller WebP copies.

## HTML to PNG

`insight-artwork.html` is the editable source for the deal diagram and reporting dashboard. Render with `node scripts/render-insight-artwork.cjs` from `frontend`. It uses the installed Playwright package and headless Microsoft Edge. Output: `png/insights-deal-minimal.png` and `png/insights-kpi-minimal.png`, each 1200 × 800. Dashboard values are illustrative, matching examples already present in the site's reporting preview.

## Generated photography

Created with the built-in ImageGen tool, directed using the imagegen-frontend-web skill. Both assets are standalone 1536 × 1024 photographs, not composites of website sections. Syed and Ramisa's portraits were not edited.

### Property targeting

Saved as `png/insights-intelligence-minimal.png`.

Create one premium horizontal 3:2 photographic website thumbnail for VoloLeads, a US real-estate lead generation service. Subject: finding motivated property sellers through careful research. Close over-the-shoulder crop of a real analyst's hand holding a stylus over a large tablet at a dark navy desk; tablet shows a realistic aerial suburban street map with a few restrained orange property markers, one selected property subtly outlined. A small printed photo of an ordinary slightly weathered American single-family house sits alongside the tablet. Natural tactile paper, glass and desk materials, cool daylight and understated orange accent from a pen. Composition: tablet fills the lower left two-thirds at a gentle real camera angle, house detail and hand on right, focused and authentic commercial editorial photography. Palette locked to deep ink navy #0f172a, slate, muted natural colors, small warm orange #f97316 accents. Crisp subject detail, restrained contrast, polished but believable. This is only the image asset, not a web page mockup. NO text, NO headlines, NO logos, NO watermarks, NO floating UI, NO holograms, NO artificial 3D sculpture, NO sci-fi neon. No fake numerical results. Wide composition fills entire canvas, no border.

### Market research

Saved as `png/insights-market-minimal.png`.

Create one premium horizontal 3:2 photographic website thumbnail for VoloLeads, a US real-estate lead generation service, about understanding local property markets. Art-directed documentary still life, top-down overhead camera: a real printed neighborhood street map on a deep ink navy desk, a hand placing a small warm orange translucent rectangular marker over a block of homes, two small printed property photographs, a simple understated metal ruler and orange pencil. The physical street map is the hero and fills most of the canvas; photographs are naturally laid partly across its upper-right edge, not a scattered collage. Real American residential blocks with trees and detached houses represented on the map. Crisp paper texture, credible professional workspace, soft side daylight, rich dark edges with cool slate midtones, small warm orange #f97316 accents and desaturated natural photo colors. Calm premium editorial real-estate photography with strong readable shapes at thumbnail size. This is only a website image asset, no page UI. NO text, NO headlines, NO numbers, NO logos, NO watermarks, NO floating charts, NO holograms, NO sci-fi effects, NO artificial 3D objects. Keep intentional negative space, no clutter, full-bleed landscape image.

## Web copies

WebP copies use quality 90 and preserve dimensions. Generated with the Sharp installation bundled with this Next.js project. Recreate a copy with `sharp(inputPng).webp({ quality: 90 }).toFile(outputWebp)` from a Node script in `frontend`.

## Theme follow-up

The renderer now exports both day and night PNGs and matching WebPs. `insights-deal-minimal-light` and `insights-kpi-minimal-light` are the day versions. The homepage selects them using the same `html.dark` state as the rest of the site. Both variants keep identical dimensions and load eagerly to avoid a blank image on the first theme change.

Original visible HTML copy and the existing IDs, names, links, form actions, and data attributes were compared against HEAD on all 18 pages. See `content-preservation-check.json` for the results. The original hero, CTA wording, article copy, pricing, and section order are restored.

Theme colors use paired `--theme-*` and `--insight-*` variables. Day panels are white with navy text and slate inset cards. Night panels use slate surfaces with pale text. The insight badge has explicit foreground/background pairs in both modes.
