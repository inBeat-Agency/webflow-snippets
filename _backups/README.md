# Backups

Snapshots del estado de Webflow Custom Code **antes** de aplicar cambios significativos.

## Por que existe esta carpeta

Cuando modificamos Site Settings → Custom Code en Webflow, NO hay version control nativo en Webflow. Si rompemos algo, no podemos hacer `git revert` sobre el Designer.

Esta carpeta funciona como "save point" — cada vez que vamos a cambiar algo del Head Code o Footer Code global, guardamos el estado original antes.

## Convencion de nombres

```
YYYY-MM-DD_<descripcion-corta>.html
```

Ejemplo: `2026-05-15_head-code-pre-font-preload.html`

Cada archivo deberia tener un comentario inicial con:

- Fecha
- Scope (que parte de Webflow es)
- Motivo del backup (que cambio se hizo despues)
- Como restaurar si algo se rompe
- Problemas conocidos del backup (cosas que en su momento estaban mal pero se dejaron asi)

## Cuando guardar un backup

- Antes de modificar Site Settings → Custom Code (Head o Footer)
- Antes de cambios estructurales en Custom Code de cualquier Template del CMS
- Antes de migrar de inline a jsDelivr (o viceversa)
- Antes de borrar Custom Code existente

## Cuando NO guardar un backup

- Cambios menores como typos
- Cambios que ya estan versionados via git (los snippets en si)
- Tests de staging que despues se descartan

## Importante

**`_backups/` NO se sirve via jsDelivr en produccion.** El prefijo `_` y la documentacion lo indican, pero ademas conviene revisar periodicamente que ningun `<script src>` apunte aca por error.

Si alguna vez necesitas que un backup este accesible via URL (ej: para auditoria), es preferible crear un branch o release especifico en GitHub, no servirlo desde main.
