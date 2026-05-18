# Case Study snippets

Snippets que aplican al template del **Case Study** del CMS.

## Estado actual

**No hay snippets activos aca todavia.**

### Por que no aplicamos `rich-text-performance.js` en Case Study

El template Case Study tiene un CSS Grid de **CMS Image fields**, no un campo Rich Text. El snippet `rich-text-performance.js` apunta a `.w-richtext` y no encontraria nada que procesar. Pegarlo aca seria un no-op.

### Que esta mal HOY en case studies (revisado 2026-05-18)

**El problema NO es el peso de las imagenes**, contrario a lo que esta documentacion afirmaba antes.

Validado con `npm run analyze -- https://inbeat.agency/case-studies/greenpark-sports` el 2026-05-18 (tarde):

| Metrica | Valor mobile | Estado |
|---|---|---|
| Score | 57 (variable 31-77 entre corridas) | Mejorable |
| **TBT** | **2060ms** | 🔥 Critico (objetivo <200ms) |
| LCP | 3099ms | Mejorable |
| CLS | 0.000 | ✅ Bueno |
| Audit `modern-image-formats` | no presente | ✅ Imagenes NO son problema |
| Audit `uses-responsive-images` | no presente | ✅ Imagenes NO son problema |

**El problema real es Total Blocking Time de 2 segundos** causado por tracking scripts (GTM, GA4, Google Ads, FB Pixel, Hotjar) que bloquean el thread principal. Mismo problema transversal que afecta a TODO el sitio inbeat.agency.

### Diagnostico anterior (incorrecto) — para referencia historica

Esta documentacion afirmaba previamente que el problema eran "imagenes PNG de hasta 1 MB en CSS Grid del CMS". Los datos del 2026-05-18 NO respaldan esa hipotesis:

- Lighthouse / PSI no reporta savings significativos por `modern-image-formats` ni `uses-responsive-images`
- El audit `uses-optimized-images` tampoco aparece en el reporte
- Las imagenes que aparecen en el HTML del case study tienen pesos razonables y formato adecuado

La nota de `inbeat-seo-monitor/docs/images-to-optimize-2026-05-15.md` puede estar desactualizada o haberse basado en una corrida anterior con audits distintos. Si el problema de imagenes pesadas vuelve a aparecer en un futuro `npm run analyze`, reabrir la investigacion.

## Que hacer hoy en case studies

**No hay accion especifica para case studies.** Su problema (TBT por tracking scripts) se resuelve atacando el problema transversal de tracking scripts en el sitio completo, no con un snippet dedicado.

Cuando se ataque tracking scripts (proximo target grande del sitio), case studies van a mejorar junto con todo lo demas.

## Que NO hacer

- **No agregar `rich-text-performance.js`** — no aplica, el template no tiene rich text
- **No optimizar imagenes individualmente** — no hay evidencia de que el peso de imagenes sea un problema
- **No aplicar el patron de Collection List image sizing** — los case studies tienen CLS = 0.000 (perfecto). Ese fix no aporta nada aca

## Cuando reconsiderar

Hay que volver a analizar el template Case Study si:

- Se agregan nuevos campos pesados al CMS (Rich Text editorial, video player, gallery slider)
- El audit `modern-image-formats` o `uses-responsive-images` reaparece en `npm run analyze`
- El score promedio del template baja significativamente respecto al baseline actual (~53 mobile)

## Referencias

- Diagnostico actual (2026-05-18): `inbeat-seo-monitor/analyses/inbeat.agency/case_studies_greenpark_sports/`
- Baseline panoramico: `inbeat-seo-monitor/reports/baseline/pagespeed_all.csv`
- Engram topic key del proximo target: `blog-performance/next-attack` (tracking scripts)
