# Global snippets

Snippets que aplican a todo el sitio. Se pegan en **Site Settings → Custom Code** del Webflow Designer (NO en page-level ni template-level).

## Snippets disponibles

### `font-preload.html`

Preload de las fuentes custom Soehne Buch + Soehne Kraftig.

**Donde pegar**: Site Settings → Custom Code → **Head Code** (al PRINCIPIO de todo, antes de cualquier otro script).

**Importante**: Webflow inyecta el Custom Code DESPUES de su propio CSS. Aunque lo pegues primero en el textarea, fisicamente queda mas abajo en el HTML. Aun asi, sirve.

**Que hace**: inicia descarga de las dos fuentes WOFF2 en paralelo con el CSS, en vez de esperar a que el CSS las descubra y las pida.

**Metricas que mejora**: LCP, FCP.

**Validacion previa**:
- `/influencer-marketing-agency`: score 46 → 65 mobile, LCP 12.5s → 5.0s
- `/blog/travel-influencers-los-angeles`: score 52 → 77, LCP 9.3s → 3.2s

**Como verificar despues de publicar**:
1. DevTools → Network → recargar sin cache
2. Buscar `soehne-buch.woff2` y `soehne-kraftig.woff2`
3. Deberian aparecer en los primeros 200-500ms con `Initiator: Preload`
4. La consola NO debe mostrar warning "preload not used within a few seconds"

**Riesgo**: bajo. Si las URLs del CDN de Webflow llegaran a cambiar (improbable, el hash es inmutable), Lighthouse mostraria warning y habria que actualizar el snippet.

## Como mover futuros snippets globales aca

Criterio para "global": el snippet aplica a TODAS las paginas del sitio sin excepcion. Ej: tracking, analytics, fuentes, preconnect a CDN.

Si aplica solo a un tipo de pagina (blog posts, case studies), va en la carpeta correspondiente — no aca.
