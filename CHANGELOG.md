# Changelog

Todos los cambios significativos a este repo se documentan aca.

Formato basado en [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versionado [SemVer](https://semver.org/).

## [v1.0.0] — 2026-05-15

### Added

#### `blog/rich-text-performance.js`

Optimizaciones de performance para contenido CMS Rich Text. Aplicable a Blog Post Template y Author Template (cualquier CMS con campo `.w-richtext`).

Mejoras respecto a la version anterior (`webflow-snippets/blog/rich-text-performance.html` en inbeat-seo-monitor):

- **fetchpriority="low"** en imagenes below-the-fold del rich text. Desprioriza descargas para que el browser priorice el LCP element
- **width/height auto** desde `naturalWidth/naturalHeight` cuando la imagen carga. Mitiga el audit `unsized-images` para navegacion interna (no resuelve CLS inicial, ver caveat en el codigo)
- **Adaptado para `defer`**: ya no usa `DOMContentLoaded` como entry point obligatorio. Funciona con `<script defer>` desde el CDN
- **IIFE wrapper**: codigo aislado, no polluta el scope global

Mantiene del original:

- Facade pattern para YouTube, Vimeo, LinkedIn, Loom, Frame.io, Wistia, Spotify
- Facade pattern para TikTok (intercepta blockquote antes que embed.js corra)
- Facade pattern para Instagram (intercepta + neutraliza embed.js)
- Lazy load + decoding async en imagenes del rich text

Resultados validados pre-migracion (en `inbeat-seo-monitor`):
- `/blog/nyc-tiktok-statistics`: score 0 → 79 mobile
- `/blog/top-physician-influencers`: CLS 8.40 → 0.00
- `/blog/pet-influencers-new-york`: score 21 → 68

#### `global/font-preload.html`

Preload de las fuentes custom Soehne Buch + Soehne Kraftig. Pegar en Site Settings → Custom Code → Head Code.

Resultados validados:
- `/influencer-marketing-agency`: score 46 → 65 mobile, LCP 12.5s → 5.0s
- `/blog/travel-influencers-los-angeles`: score 52 → 77, LCP 9.3s → 3.2s
- `/`: score 59 → 65 mobile

### Notes

- Repo creado a partir de `inbeat-seo-monitor/webflow-snippets/`. La copia local original sera eliminada despues de validar que jsDelivr sirve correctamente
- `_backups/` contiene snapshots del estado de Webflow antes de cambios significativos. NO se sirve via jsDelivr; es solo para auditoria

[v1.0.0]: https://github.com/inBeat-Agency/webflow-snippets/releases/tag/v1.0.0
