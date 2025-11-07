# Solución al Problema de OperationalKeys

## Problema Encontrado

Al intentar migrar los datos de `operational_state_segments` a `OperationalKey`, se encontró un error:

```
ERROR: no existe el tipo «operationalkeytype»
```

## Diagnóstico

El problema estaba en un trigger de PostgreSQL llamado `trigger_update_operational_key_type_name` que se ejecuta en cada INSERT/UPDATE de la tabla `OperationalKey`.

La función del trigger intentaba hacer un CAST a un tipo ENUM inexistente:

```sql
NEW."keyTypeName" = CASE NEW."keyType"
  WHEN 0 THEN 'TALLER'::OperationalKeyType  -- Este tipo ENUM no existía
  WHEN 1 THEN 'PARQUE'::OperationalKeyType
  ...
END;
```

## Solución Aplicada

Se reemplazó la función del trigger para que asigne los strings directamente sin el CAST:

```sql
CREATE OR REPLACE FUNCTION public.update_operational_key_type_name()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW."keyTypeName" = CASE NEW."keyType"
    WHEN 0 THEN 'TALLER'
    WHEN 1 THEN 'PARQUE'
    WHEN 2 THEN 'EMERGENCIA'
    WHEN 3 THEN 'INCENDIO'
    WHEN 5 THEN 'REGRESO'
    ELSE NULL
  END;
  RETURN NEW;
END;
$function$
```

## Resultado

✅ **Migración completada exitosamente**

- **Sesiones procesadas:** 152
- **Sesiones exitosas:** 152
- **Sesiones fallidas:** 0
- **Total claves creadas:** 301

### Distribución de Claves Operacionales

- **EMERGENCIA (clave 2):** 103 claves (34.2%) - Con rotativo activo
- **INCENDIO (clave 3):** 198 claves (65.8%) - Con rotativo inactivo

### Datos Asociados

- **Con keyTypeName generado:** 301 (100%)
- **Con coordenadas GPS:** 88 (29.2%)
- **Con duración calculada:** 301 (100%)
- **Con rotativo activo:** 103 claves
- **Con rotativo inactivo:** 198 claves

## Scripts Utilizados

1. **fix-trigger-function.js** - Corrigió la función del trigger problemático
2. **migrate-keys-orm.js** - Script final de migración usando Prisma ORM
3. **verify-migration-result.js** - Script de verificación de resultados

## Verificación

El campo `keyTypeName` ahora se genera automáticamente mediante el trigger cuando se inserta un `OperationalKey`:

- keyType: 0 → keyTypeName: "TALLER"
- keyType: 1 → keyTypeName: "PARQUE"
- keyType: 2 → keyTypeName: "EMERGENCIA"
- keyType: 3 → keyTypeName: "INCENDIO"
- keyType: 5 → keyTypeName: "REGRESO"

## Ubicación de Scripts

- **Scripts de migración:** `backend/migrate-keys-orm.js`
- **Script de corrección:** `backend/fix-trigger-function.js`
- **Script de verificación:** `backend/verify-migration-result.js`
- **Documentación:** `backend/SOLUCION_OPERATIONAL_KEYS.md`
- **Log de resultados:** `backend/migration-result.log`

## Próximos Pasos

El sistema ahora está listo para:
- Crear OperationalKeys automáticamente cuando se procesen nuevos archivos
- Los segmentos operacionales existentes ya han sido migrados a OperationalKeys
- El trigger funciona correctamente y asigna el keyTypeName automáticamente

