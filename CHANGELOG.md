# Changelog

Todos los cambios significativos a este repo se documentan aca.

Formato basado en [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versionado [SemVer](https://semver.org/).

## [Unreleased]

### Added

#### `docs/webflow-patterns/collection-list-image-sizing.md`

Documentacion de patron NO-snippet: como resolver CLS en Collection Lists con imagenes `width="auto"` / `height="auto"`. Aplicado en Blog Author Category (10 URLs) y Blog Listing (5 URLs) el 2026-05-18.

Resultados validados:
- Blog Author Category — CLS 0.566 → 0.010 mobile, score +14 promedio
- Blog Listing + paginacion — CLS 0.304 → 0.012 mobile, score +30 promedio

No requiere release de tag — es documentacion de configuracion en Webflow Designer, no codigo servido por jsDelivr.

## [v1.0.3] — 2026-05-26

### Fixed

#### `blog/rich-text-performance.js` — thumbnails Vimeo pixelados y videos verticales aplastados

Dos bugs encontrados despues de publicar v1.0.2 al verificar el facade de Vimeo en `/blog/marketing-agency-metrics-guide`:

**Bug 1: thumbnails Vimeo pixelados.** `fetchVimeoThumb` pedia el oEmbed sin especificar `width`, lo que hacia que Vimeo devolviera la version mas chica del thumbnail disponible (`..._200x150` ~200px de ancho). Renderizado en un wrapper de 700+px en desktop, el thumbnail se veia con upscale de 3.5x — pixelado y borroso.

Fix: agregar `&width=1280` al request oEmbed. Vimeo responde con `..._1280` (~1280px), nitido en desktop con DPR=2.

**Bug 2: videos verticales aplastados.** `getProviderInfo` retornaba `ratio: '16/9'` fijo para todos los Vimeos. Pero un porcentaje significativo de embeds modernos son verticales (formato Reels/Stories/Shorts, 9:16). El wrapper 16/9 + `object-fit: cover` recortaba arriba y abajo, deformando el encuadre. Ejemplos en el sitio: hooks UGC del post `marketing-agency-metrics-guide` que son 240x426 (9:16).

Fix: cambiar `ratio` a `null` en `getProviderInfo` para Vimeo. La nueva funcion `fetchVimeoMetadata` (rename de `fetchVimeoThumb`) ahora extrae tambien `width`/`height` del response del oEmbed y devuelve el ratio real del video. El wrapper arranca con `16/9` placeholder y se ajusta cuando llega el oEmbed (~200ms). Mini-CLS aceptado por la mejora visual mayor.

Tambien: cambiar `object-fit: cover` a `contain` en el thumbnail. Cuando el ratio del wrapper coincide con el del thumbnail (caso normal post-oEmbed), ambos dan el mismo resultado. Durante el periodo placeholder (~200ms con ratio 16/9 antes que llegue el real), `contain` evita recortar agresivamente verticales mientras se ajusta el wrapper.

### Migration

Actualizar la linea del `<script src>` en los templates de Webflow (Blog Post Template, Author Template):

```html
<!-- antes -->
<script src="https://cdn.jsdelivr.net/gh/inBeat-Agency/webflow-snippets@v1.0.2/blog/rich-text-performance.js" defer></script>

<!-- despues -->
<script src="https://cdn.jsdelivr.net/gh/inBeat-Agency/webflow-snippets@v1.0.3/blog/rich-text-performance.js" defer></script>
```

Republicar el site. jsDelivr puede tardar unos minutos en propagar el nuevo tag.

### Internals

- Rename: `fetchVimeoThumb(src, cb)` → `fetchVimeoMetadata(src, cb)`. Callback ahora recibe `{ thumbUrl, ratio }` en vez de solo el URL del thumbnail.

[v1.0.3]: https://github.com/inBeat-Agency/webflow-snippets/releases/tag/v1.0.3

## [v1.0.2] — 2026-05-26

### Fixed

#### `blog/rich-text-performance.js` — embeds estirados con altura monstruosa

`applyOtherIframeFacades` calculaba el aspect-ratio del wrapper haciendo `parseInt(iframe.getAttribute('width'), 10)`. Cuando un iframe traia `width="100%"` (caso comun en embeds de Google Drive, Slides, Canva, Notion, etc), `parseInt("100%", 10)` retornaba `100` — un valor relativo interpretado como ancho de ratio. El snippet armaba entonces `aspect-ratio: 100/480` para un iframe Google Drive con `width="100%" height="480"`, lo que producia un facade de **704 × 3379 px** en desktop / **371 × 1780 px** en mobile.

Visualmente: un muro gris vacio ocupando casi 2 viewports verticales en medio del blog post. Reproducido en `/blog/marketing-agency-metrics-guide`.

Fix:
1. Validar que `width` y `height` sean numericos puros con regex `/^\d+$/` antes de usarlos como ratio. Si no lo son, cae al fallback `16/9`.
2. Agregar `drive.google.com` y `docs.google.com` a `getProviderInfo` con ratio fijo `16/9` para evitar la rama del calculo derivado.

Casos cubiertos por el fix:
- `width="100%"` → cae a `16/9` (antes: `100/<h>` roto)
- `width="auto"` → cae a `16/9` (antes: `NaN/NaN` → roto)
- `width="200px"` → cae a `16/9` (antes: `200/<h>` → "200/" es valido pero el `px` engana, ahora se rechaza explicitamente)
- `width="560" height="315"` → `560/315` (sigue funcionando, YouTube clasico)
- Iframes de Google Drive/Docs → `16/9` fijo via `getProviderInfo`

### Migration

Actualizar la linea del `<script src>` en los templates de Webflow (Blog Post Template y Author Template):

```html
<!-- antes -->
<script src="https://cdn.jsdelivr.net/gh/inBeat-Agency/webflow-snippets@v1.0.1/blog/rich-text-performance.js" defer></script>

<!-- despues -->
<script src="https://cdn.jsdelivr.net/gh/inBeat-Agency/webflow-snippets@v1.0.2/blog/rich-text-performance.js" defer></script>
```

Republicar el site. jsDelivr puede tardar unos minutos en propagar el nuevo tag.

### Notes

Esto NO resuelve la limitacion conocida de iframes hardcoded en rich text (ver README v1.0.0 "Limitacion conocida"). El snippet sigue reemplazando iframes despues del HTML parse, lo que significa que las descargas iniciales de player scripts (YouTube, Vimeo, etc) ya empezaron antes de que el facade se aplique. Para resolver eso se necesita un snippet inline en `<head>` con MutationObserver — pendiente para v1.1.0+.

[v1.0.2]: https://github.com/inBeat-Agency/webflow-snippets/releases/tag/v1.0.2

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
