# Author snippets

Snippets que aplican al template del **Author** del CMS.

## Snippets a usar aca

Por ahora, el Author Template usa el MISMO snippet que el Blog Post Template porque comparten estructura (rich text + posts del autor).

**Donde pegar**: Designer → Pages → **Author Template** → Settings → Custom Code → **Before `</body>` tag**:

```html
<script src="https://cdn.jsdelivr.net/gh/inBeat-Agency/webflow-snippets@v1.0.0/blog/rich-text-performance.js" defer></script>
```

Notar que el `src` apunta a `/blog/rich-text-performance.js` aunque sea el Author Template. **Esto es intencional**: el snippet detecta automaticamente `.w-richtext` sin importar en que template este.

Si en el futuro Author necesita logica distinta (ej: no procesar embeds porque no usa), creariamos un snippet propio en `author/`. Por ahora, reusar el de blog.

## Validacion para Author

Author pages que estaban en el TOP 15 de paginas con savings de imagen:

| Pagina | Score actual mobile |
|---|---|
| `/author/sehar-fatima` | 46 |
| `/author/ioana-cozma` | 74 |
| `/author/tamara-jovanovic` | sin medir aun |

Despues de aplicar el snippet, re-medir con `npm run analyze -- <url>`.

## Cuando NO usar este snippet en Author

Si los Author pages NO tienen embeds de redes sociales y SOLO tienen bio + listado de posts, el snippet aporta:
- Lazy load en thumbnails de los posts listados (si estan en repeater fuera de rich text → NO aplica)
- Mejora marginal

En ese caso, el snippet no daña pero es codigo cargado para poca ganancia. Decision discrecional.
