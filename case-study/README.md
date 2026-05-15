# Case Study snippets

Snippets que aplican al template del **Case Study** del CMS.

## Estado actual

**No hay snippets activos aca todavia.**

### Por que no aplicamos `rich-text-performance.js` en Case Study

El problema de performance en case studies (`/case-studies/nordstrom`, `/case-studies/soylent`, etc.) **NO esta en el rich text**. Esta en un CSS Grid de **CMS Image fields** que sirve imagenes PNG de hasta 1 MB.

Validado con Playwright (ver `inbeat-seo-monitor/docs/images-to-optimize-2026-05-15.md`):
- Las imagenes problematicas estan en `.w-dyn-item.w-dyn-repeater-item`, NO en `.w-richtext`
- El snippet `rich-text-performance.js` no las toca por design

Pegar el snippet aca daria falsa sensacion de "ya lo arregle". Por eso preferimos no hacerlo.

### Que SI hay que hacer en Case Study

Decision pendiente del equipo. Opciones disponibles:

1. **Re-subir las imagenes pesadas como AVIF/WebP** (trabajo manual, 4-6 hs total para los 16 case studies)
2. **Refactorear el template** para que las imagenes vayan por CMS Image field (que genera srcset automatico) en vez de grid manual — proyecto mas grande
3. **Aceptar el peso actual** y enfocar performance en otros tipos de pagina

Cuando se decida una direccion y se cree un snippet especifico para Case Study (ej: layout fix de aspect-ratio del grid, lazy load del grid, etc.), va a vivir aca.

## Mientras tanto

Si en el futuro Case Study Template gana un campo Rich Text editorial (ej: descripcion larga del proyecto), AHI si se puede reutilizar el snippet de blog:

```html
<script src="https://cdn.jsdelivr.net/gh/inBeat-Agency/webflow-snippets@v1.0.0/blog/rich-text-performance.js" defer></script>
```

Pero solo cuando ese campo exista y tenga embeds/imagenes que justifiquen el overhead.
