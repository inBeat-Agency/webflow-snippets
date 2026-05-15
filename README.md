# webflow-snippets

Snippets de performance y optimizacion para el sitio Webflow de inBeat Agency.

Hosteados via [jsDelivr](https://www.jsdelivr.com/) para servir con un solo `<script>` tag desde el Designer de Webflow.

## Como funciona

Cada snippet se pega en Webflow como **una sola linea** apuntando a jsDelivr:

```html
<script src="https://cdn.jsdelivr.net/gh/inBeat-Agency/webflow-snippets@v1.0.0/blog/rich-text-performance.js" defer></script>
```

jsDelivr resuelve el archivo desde este repo, lo sirve con cache agresivo en CDN global (~50ms latencia), y todo el codigo queda versionado en git.

**Por que no pegar el codigo entero en Webflow**:

- Cambios requieren editar todos los templates afectados manualmente
- Sin versionado real, no se puede revertir
- Sin code review
- El Designer de Webflow tiene limite de caracteres por Custom Code

**Por que jsDelivr y no GitHub Pages o npm**:

- jsDelivr funciona directo con repos publicos de GitHub, sin build step
- Soporta versionado por tag (`@v1.0.0`) o branch (`@main`) o commit (`@abc1234`)
- CDN global con SLA mucho mejor que GitHub Pages
- Gratis para proyectos open source

## Estructura

```
.
├── global/              snippets que aplican a todo el sitio (Site Settings)
├── blog/                snippets del Blog Post Template
├── author/              snippets del Author Template
├── case-study/          snippets del Case Study Template
└── _backups/            snapshots del estado pre-cambio en Webflow (no servidos por jsDelivr)
```

Cada carpeta tiene su propio `README.md` con:
- Que problema resuelve cada snippet
- Donde se pega en Webflow exactamente
- Que metricas mejora
- Cuando NO usar el snippet

## Versionado

Usamos [semver](https://semver.org/) con tags `vX.Y.Z`:

- **MAJOR**: breaking changes en como se usa un snippet (ej: cambio de selectores requeridos)
- **MINOR**: features nuevos compatibles hacia atras
- **PATCH**: bug fixes y mejoras internas

**Importante**: en Webflow siempre referenciar un tag fijo (`@v1.0.0`), nunca `@latest` ni `@main`. Si un cambio rompe algo, queremos enterarnos en QA, no en produccion.

## Releases actuales

Ver [CHANGELOG.md](./CHANGELOG.md) para el historial completo.

| Tag | Fecha | Cambios principales |
|---|---|---|
| v1.0.0 | 2026-05-15 | Migracion inicial de inbeat-seo-monitor a este repo |

## Como contribuir

1. Crear branch desde `main`
2. Modificar el snippet correspondiente en `<categoria>/<snippet>.js`
3. Actualizar el README de la categoria si cambian las instrucciones
4. Probar localmente cargando el JS via `file://` en Webflow Designer preview
5. PR con descripcion del cambio y metricas esperadas
6. Despues del merge, crear tag y release en GitHub
7. Actualizar las referencias en Webflow al nuevo tag

## Como medir el impacto

Cada cambio en produccion deberia validarse con [inbeat-seo-monitor](https://github.com/<tu-org>/inbeat-seo-monitor):

```bash
npm run analyze -- <url-de-la-pagina>
```

Comparar `summary.json` antes/despues del cambio para cuantificar mejora.

## License

MIT — ver [LICENSE](./LICENSE).
