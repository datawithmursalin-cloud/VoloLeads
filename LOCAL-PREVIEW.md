# Local preview

Branch: `Next-Chairs-Minimalistic`

From the `frontend` directory:

```powershell
npm run build
npm start -- --hostname 127.0.0.1 --port 3100
```

Open http://127.0.0.1:3100 in your browser. Keep the terminal running during the demo.

For editing with live updates, stop the preview with Ctrl+C and run:

```powershell
npm run dev -- --hostname 127.0.0.1 --port 3100
```

The visual preview runs locally. Contact submissions, billing, and subscriber verification still depend on the existing backend configuration.

This pass updates typography and insight visuals while preserving the original website copy, section order, hero CTA, plan data, and interaction hooks. Two thumbnails are HTML-rendered diagrams with matching light and dark exports, and two are generated photographs. Editable artwork and prompts are in `frontend/design`. Existing backgrounds and the Syed and Ramisa portraits are retained. Reviews and partner tools are browsable without continuous animation.
