# Changelog

Todos los cambios significativos a este repo se documentan aca.

Formato basado en [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versionado [SemVer](https://semver.org/).

## [v1.0.1] — 2026-05-15

### Fixed

#### `blog/rich-text-performance.js` — imagenes estiradas vertical

`applyNaturalDimensions` seteaba los atributos HTML `width` y `height` con las dimensiones intrinsecas de cada imagen (ej: `width="2400" height="1600"`). En blog posts donde el HTML inicial traia `width="100%"` como atributo, la condicion `if (!img.getAttribute('width'))` evitaba pisar width, pero `height` SI se seteaba como px fijos. Resultado: el browser interpretaba `height` como altura literal y las imagenes quedaban estiradas vertical, ignorando el `height: auto` del CSS.

Fix: reemplazar los atributos `width`/`height` por `style.aspectRatio = naturalWidth / naturalHeight`. Reserva el espacio para CLS sin pisar el sizing nativo de Webflow (`.w-richtext img { width: 100%; height: auto }`).

### Migration

Actualizar la linea del `<script src>` en los templates de Webflow (Blog Post Template y Author Template):

```html
<!-- antes -->
<script src="https://cdn.jsdelivr.net/gh/inBeat-Agency/webflow-snippets@v1.0.0/blog/rich-text-performance.js" defer></script>

<!-- despues -->
<script src="https://cdn.jsdelivr.net/gh/inBeat-Agency/webflow-snippets@v1.0.1/blog/rich-text-performance.js" defer></script>
```

Republicar el site. jsDelivr puede tardar unos minutos en propagar el nuevo tag.

[v1.0.1]: https://github.com/inBeat-Agency/webflow-snippets/releases/tag/v1.0.1

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
