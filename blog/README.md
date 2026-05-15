# Blog snippets

Snippets que aplican al template del **Blog Post** del CMS. Se pegan en el Custom Code de ese template especifico (NO a nivel sitio).

## Snippets disponibles

### `rich-text-performance.js`

**Donde pegar**: Designer → Pages → **Blog Post Template** → Settings → Custom Code → **Before `</body>` tag**.

**Linea a pegar** (1 sola linea):

```html
<script src="https://cdn.jsdelivr.net/gh/inBeat-Agency/webflow-snippets@v1.0.0/blog/rich-text-performance.js" defer></script>
```

**Importante**: usar tag fijo (`@v1.0.0`), NO `@latest` ni `@main`. Cuando salga una version nueva, actualizar manualmente despues de testear en staging.

### Que hace

1. **Lazy load** en imagenes del rich text (`loading="lazy"`, `decoding="async"`)
2. **fetchpriority="low"** en imagenes below-the-fold para desprioriza el download
3. **width/height auto** desde `naturalWidth/naturalHeight` post-load
4. **Facade pattern** para embeds pesados:
   - YouTube (~500KB de JS reemplazado por placeholder)
   - Vimeo, Loom, Frame.io, LinkedIn, Wistia, Spotify (preserva todos los atributos del iframe)
   - TikTok (intercepta blockquote.tiktok-embed antes que embed.js lo procese)
   - Instagram (intercepta blockquote.instagram-media + neutraliza embed.js)

### Metricas que mejora

- **LCP**: reduccion via lazy load + fetchpriority
- **TBT**: reduccion drastica al eliminar JS de embed.js de TikTok/Instagram
- **CLS**: el facade de Instagram elimina el reflow que causa CLS catastrofico (validado: 8.40 → 0.00 en `top-physician-influencers`)
- **Total Bytes**: los embeds de redes sociales solo se cargan al click del usuario

### Precondiciones IMPORTANTES

Si el Blog Post Template tiene Embeds con scripts globales de TikTok o Instagram:

```html
<script async src="https://www.tiktok.com/embed.js"></script>
<script async src="//www.instagram.com/embed.js"></script>
```

**HAY QUE REMOVERLOS** antes de activar este snippet. El facade reemplaza la funcionalidad. Si embed.js descarga primero (~618KB de TikTok, ~33KB de Instagram), el snippet no puede deshacer el daño — los KB ya se transfirieron.

### Validacion previa

Resultados medidos antes de la migracion a jsDelivr:

| Pagina | Score antes | Score despues | LCP antes | LCP despues |
|---|---|---|---|---|
| `/blog/nyc-tiktok-statistics` | 0 | 79 | 16.8s | 2.3s |
| `/blog/top-physician-influencers` | 34 | 69 | 15.0s | 3.3s |
| `/blog/pet-influencers-new-york` | 21 | 68 | 14.3s | 4.1s |
| `/blog/influencer-marketing-for-beauty-brands` | 5 | 71 | 8.5s | 3.5s |

### Como verificar despues de publicar

1. **DevTools Console**: no debe haber errores ni warnings de este snippet
2. **Embeds visuales**: YouTube/Vimeo/TikTok/Instagram aparecen como placeholder con boton play hasta que el usuario hace click
3. **Network tab**: confirmar que `embed.js` de TikTok/Instagram NO se descarga (a menos que el usuario haga click en el placeholder)
4. **Lighthouse mobile**:
   ```bash
   npm run analyze -- <url-del-post>
   ```
   Comparar `summary.json` antes/despues

### Cuando NO usar este snippet

- Si el blog NO tiene embeds y NO tiene imagenes pesadas en rich text — el snippet no daña pero es overhead inutil
- Si el rich text del blog usa otra clase que NO es `.w-richtext` (poco probable en Webflow, pero verificar)

### Fallback si jsDelivr cae

En el caso muy improbable de que jsDelivr este down, hay version inline en `rich-text-performance.html` de este mismo folder. Esa version contiene todo el JS dentro de un `<script>` y se pega directo en Webflow Custom Code, sin dependencia externa.

## Version inline (`rich-text-performance.html`)

Mismo codigo que el `.js`, envuelto en `<script>` tags. Para usar:

1. Copiar TODO el contenido de `rich-text-performance.html`
2. Pegar en Designer → Blog Post Template → Custom Code → Before `</body>` tag
3. Save + Publish

Cuando se actualice una version nueva del snippet, hay que re-copiar manualmente. Por eso recomendamos jsDelivr para flujo normal.
