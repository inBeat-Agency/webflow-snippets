# Collection List Image Sizing — Fix de CLS sin snippet

Este patron es **una correccion de configuracion en Webflow Designer**, no un snippet JS. Se documenta aca porque resuelve un problema de performance recurrente en el sitio.

## El problema

Cuando se renderea un Collection List de Webflow con imagenes (ej: grid de cards de blog posts, listado de case studies, cards de team members), si la **Image** dentro de la Collection Item tiene `Width = auto` y `Height = auto` en los Settings, el HTML generado por Webflow queda asi:

```html
<img src="..." loading="lazy" alt="...">
```

**Sin atributos `width` ni `height`.** El browser reserva 0 px de altura para esa imagen hasta que el archivo termina de descargar. Cuando llega, "infla" el espacio y empuja todo el contenido hacia abajo. Resultado: **Cumulative Layout Shift (CLS) alto** y score de Performance bajo.

### Como detectar el problema

Audits de Lighthouse / PageSpeed Insights que disparan cuando este bug esta presente:

- **`unsized-images`**: lista de imagenes sin `width`/`height` declarados (usualmente con valores como `w=370 h=197` deducidos por el browser tarde).
- **`layout-shifts`**: con `metricSavings.CLS > 0.1` y selector apuntando a `.collection-list-*` o similar.

CLS objetivo de Google: **< 0.1** ("Good"). Cualquier valor > 0.25 es "Poor" y penaliza fuerte el score.

### URLs donde se detecto

| Template | URLs afectadas | CLS antes | CLS despues |
|---|---|---|---|
| Blog Author Category (`/blog-author/categories/*`) | 10 | 0.566 mobile | 0.010 |
| Blog Listing (`/blog`) + Paginacion (`/blog?f9bc4b2b_page=*`) | 5 | 0.304 mobile | 0.012 |

## La solucion

**No requiere snippet JS.** Se arregla directamente en Webflow Designer modificando los Settings de la imagen.

### Por que no se puede arreglar con CSS

`max-width: 100%` y `height: auto` en CSS NO bastan. El browser necesita los atributos HTML `width` y `height` (numeros enteros) para calcular el aspect ratio antes de descargar la imagen y reservar el espacio correcto en el layout.

### Pasos exactos en Webflow Designer

1. Abrir el Designer en el template afectado (ej: "Blog Author Category Template", "Blog Listing").
2. En el Navigator (panel izquierdo), expandir hasta encontrar el **Image** dentro del Collection Item.
3. Click en la imagen para seleccionarla.
4. Panel derecho → solapa **Settings** (primera, ícono de engranaje).
5. En la seccion **Element Settings**, cambiar:
   - `Width`: de `auto` a un **numero entero** (ej: `370`). NO usar `px`, `%`, ni `auto`.
   - `Height`: de `auto` a un **numero entero** que respete el aspect ratio del diseno (ej: `197` para una proporcion ~16:9).
6. Panel derecho → solapa **Style** (segunda, ícono de pincel).
7. Verificar que la CSS class tenga:
   - `max-width: 100%` (permite que escale en mobile)
   - `height: auto` (permite que el alto escale proporcionalmente sin romper el ratio)
8. **Publish** al dominio.
9. Esperar 1-2 minutos para propagacion de CDN.

### Como elegir los valores de width/height

Inspeccionar el render actual en Chrome DevTools:

1. Abrir la pagina con el listado en Chrome.
2. Click derecho sobre una imagen de card → **Inspect**.
3. Hover sobre el `<img>` en el panel de DOM — aparece un overlay con el tamano renderizado real (ej: `370 × 197`).
4. Usar esos numeros tal cual en Webflow Settings.

El aspect ratio resultante (`width / height`) es lo que el browser va a usar para reservar el espacio. Una vez fijado, las imagenes escalan responsive sin layout shift.

### Caveats

#### Cuidado con clases compartidas

En Webflow, varios elementos Image pueden compartir la misma CSS class (ej: `.div-block-61`). El cambio de `Width`/`Height` se hace en el **HTML attribute por instancia**, no en la clase CSS, asi que cada Image element afectado hay que tocarlo individualmente.

Sin embargo, si la clase se usa en otro template (ej: `.div-block-61` aparece tambien en el Blog Post Template), revisar visualmente que el cambio de dimensiones no rompa el layout en esos otros lugares antes de publicar.

#### NO usar este fix en imagenes que ya tienen el snippet `rich-text-performance.js`

Las imagenes dentro de `.w-richtext` (contenido CMS del blog post) son procesadas por el snippet `blog/rich-text-performance.js`, que les asigna `style.aspectRatio` dinamicamente desde `naturalWidth/naturalHeight`. Aplicar width/height fijos ahi puede pisar el comportamiento del snippet.

Este patron aplica solo a imagenes **fuera de rich text**, en Collection Lists, grids, sliders, o cualquier elemento Image directamente colocado en el Designer.

## Verificacion post-fix

Despues de publicar, ejecutar desde `inbeat-seo-monitor`:

```bash
npm run analyze -- <url-afectada>
```

Resultados esperados en `summary.json`:

- `audits.unsized-images.itemsCount` → reducido a 0-1 (solo elementos globales como banner del header)
- `audits.layout-shifts.metricSavings.CLS` → < 0.1
- `cwv.CLS.rating` → `good`
- `performanceScore` mobile → mejora de 15-30 puntos tipica
- `performanceScore` desktop → mejora de 20-30 puntos tipica

Variabilidad esperada: Lighthouse lab data oscila ±15 puntos entre corridas consecutivas. Si querés certeza, correr 3 veces y promediar.

## Templates donde se aplico (2026-05-18)

| Template | Path Webflow | URLs afectadas | Resultado |
|---|---|---|---|
| Blog Author Category | Designer → Pages → "Blog Author Category Template" | 10 URLs `/blog-author/categories/*` | CLS 0.566 → 0.010, score mobile +14 promedio |
| Blog Listing | Designer → Pages → "Blog" o "Blog Listing" | 5 URLs (`/blog` + 4 paginas paginacion) | CLS 0.304 → 0.012, score mobile +30 promedio |

## Templates donde el problema PUEDE estar pero no se aplico todavia

Identificados via crawl panoramico de Screaming Frog (`reports/baseline/pagespeed_all.csv`). Validar con `npm run analyze` antes de aplicar:

- **Case Study Template** (`/case-studies/*`, 16 URLs) — sospecha alta, problema documentado en [`case-study/README.md`](../../case-study/README.md). El fix de Collection List ayuda pero NO resuelve el problema principal de PNG pesados.
- **Location Template** (`/locations/*`, 28 URLs) — sospecha media, scores actuales 44-88. Algunas listings de servicios podrian tener Collection Lists.
- **Author Page** (`/author/*`, 9 URLs) — sospecha baja, ya tiene el snippet `rich-text-performance.js` y scores estan en 47-81.

## Problema relacionado NO resuelto por este fix

Despues de aplicar este patron, mobile LCP sigue alto (~5-12s, variable) en las paginas de listing porque el LCP de mobile esta dominado por **tracking scripts sin usar**:

```
unused-javascript metricSavings.LCP: ~2200ms
  - Google Tag Manager
  - Google Analytics 4
  - Google Ads
  - Facebook Pixel
  - Hotjar
```

Ese es un target separado, transversal a TODO el sitio. Soluciones posibles: server-side tagging, consent-gated loading, defer hasta primera interaccion. Es el proximo objetivo grande de performance del sitio (no aplica solo a listings).
