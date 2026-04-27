# DB Migrations (repoGPS)

Este proyecto usa `database/init_*.sql` para bootstrap inicial, pero para ambientes existentes (como producción) se deben usar migraciones incrementales idempotentes.

## Migration disponible

- `database/migrations/20260426_fix_tareas_schema_drift.sql`
  - Corrige drift de esquema detectado en producción para `db_expedientes`.
  - Añade columnas faltantes en `tareas_asignadas` y `etapas_proceso`.
  - Hace backfill seguro de datos.
  - Crea FK/índices necesarios para rendimiento y consistencia.

## Cómo ejecutar en servidor

Desde `~/repoGPS`:

```bash
docker exec -i db_expedientes psql -U postgres -d db_expedientes < database/migrations/20260426_fix_tareas_schema_drift.sql
```

## Verificación rápida

```bash
curl -i "http://localhost:8045/api/tareas/mis-tareas?usuario_id=1&area_id=1&rol_id=3"
```

Debe devolver `200 OK` y JSON (lista vacía o con tareas).

## Recomendación operativa

- Ejecutar cada migración **una vez por ambiente**.
- Mantener nuevas correcciones de esquema en `database/migrations/` (no sólo en `init_*.sql`).
- Evitar dependencias en auto-migraciones desde runtime del servicio para cambios críticos.
