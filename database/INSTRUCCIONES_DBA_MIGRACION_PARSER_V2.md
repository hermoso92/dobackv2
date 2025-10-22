# 📋 INSTRUCCIONES DBA - MIGRACIÓN PARSER V2

**Sistema:** DobackSoft StabilSafe  
**Versión:** 2.0  
**Fecha:** 2025-10-22  
**Prioridad:** 🔴 CRÍTICA  
**Tiempo estimado:** 10 minutos  

---

## 🎯 OBJETIVO

Añadir control de versiones para distinguir sesiones procesadas con:
- **Parser v1** (sin corrección escala 100x) ← Sesiones antiguas
- **Parser v2** (con corrección escala 100x) ← Sesiones nuevas

---

## 📊 CONTEXTO

Se ha corregido un error crítico en el parser de estabilidad que afectaba la escala de aceleraciones (factor 100x). Para mantener trazabilidad y permitir migración gradual, se requiere añadir un campo `parser_version` a la tabla `Session`.

---

## ⚙️ PRE-REQUISITOS

- [x] Acceso a base de datos PostgreSQL `stabilsafe_dev`
- [x] Permisos de ALTER TABLE y CREATE INDEX
- [x] Backup de la base de datos (recomendado)

---

## 🔧 INSTRUCCIONES DE EJECUCIÓN

### Opción 1: Desde línea de comandos (psql)

```bash
# 1. Conectar a la base de datos
psql -U [tu_usuario] -d stabilsafe_dev

# 2. Ejecutar el script de migración
\i C:/Users/Cosigein SL/Desktop/DobackSoft/database/add-parser-version.sql

# 3. Verificar resultado (debe mostrar tabla de versiones)
```

### Opción 2: Desde GUI (pgAdmin, DBeaver, etc.)

1. Conectar a base de datos `stabilsafe_dev`
2. Abrir archivo: `C:\Users\Cosigein SL\Desktop\DobackSoft\database\add-parser-version.sql`
3. Ejecutar el script completo (F5 o botón "Execute")
4. Verificar output en panel de mensajes

### Opción 3: Desde terminal de Windows (PowerShell)

```powershell
# Navegar al directorio del proyecto
cd "C:\Users\Cosigein SL\Desktop\DobackSoft"

# Ejecutar migración (ajustar usuario según corresponda)
$env:PGPASSWORD="[tu_contraseña]"
psql -U [tu_usuario] -d stabilsafe_dev -f database/add-parser-version.sql
```

---

## ✅ VERIFICACIÓN POST-MIGRACIÓN

### Test 1: Verificar que columna fue añadida

```sql
SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'Session' 
  AND column_name = 'parser_version';
```

**Resultado esperado:**
```
column_name    | data_type | column_default
---------------|-----------|----------------
parser_version | integer   | 1
```

### Test 2: Verificar distribución de versiones

```sql
SELECT 
    parser_version,
    COUNT(*) as total_sessions,
    MIN("startTime")::date as primera_sesion,
    MAX("startTime")::date as ultima_sesion
FROM "Session"
GROUP BY parser_version
ORDER BY parser_version;
```

**Resultado esperado:**
```
parser_version | total_sessions | primera_sesion | ultima_sesion
---------------|----------------|----------------|---------------
1              | [N]            | [fecha]        | [fecha]
```

Todas las sesiones existentes deben estar marcadas como versión 1.

### Test 3: Verificar índice creado

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'Session'
  AND indexname = 'idx_session_parser_version';
```

**Resultado esperado:**
```
indexname                  | indexdef
---------------------------|------------------------------------------
idx_session_parser_version | CREATE INDEX ... ON "Session"(parser_version)
```

---

## 📊 RESULTADO ESPERADO

Al finalizar la migración:

✅ Campo `parser_version` añadido a tabla `Session`  
✅ Todas las sesiones existentes marcadas como `parser_version = 1`  
✅ Índice `idx_session_parser_version` creado  
✅ Valor por defecto `1` configurado para nuevos registros  

**NOTA:** A partir de este momento, el backend creará nuevas sesiones con `parser_version = 2` automáticamente cuando use el parser corregido.

---

## 🚨 TROUBLESHOOTING

### Error: "permission denied for table Session"

**Causa:** Usuario sin permisos de ALTER TABLE  
**Solución:** Ejecutar con usuario con privilegios (ej: postgres)

```sql
GRANT ALL ON TABLE "Session" TO [tu_usuario];
```

### Error: "column parser_version already exists"

**Causa:** Migración ya fue ejecutada  
**Solución:** Verificar que valor por defecto sea correcto:

```sql
ALTER TABLE "Session" 
ALTER COLUMN "parser_version" SET DEFAULT 1;
```

### Error: "relation Session does not exist"

**Causa:** Base de datos incorrecta o tabla no existe  
**Solución:** Verificar que estás conectado a `stabilsafe_dev`:

```sql
SELECT current_database();
```

---

## 🔄 ROLLBACK (Si es necesario)

Si necesitas revertir los cambios:

```sql
BEGIN;

-- Eliminar índice
DROP INDEX IF EXISTS idx_session_parser_version;

-- Eliminar columna
ALTER TABLE "Session" DROP COLUMN IF EXISTS parser_version;

COMMIT;
```

---

## 📞 SOPORTE

**En caso de dudas o problemas:**

1. Revisar logs de PostgreSQL: `pg_log/postgresql-[fecha].log`
2. Verificar que no hay transacciones bloqueadas:
   ```sql
   SELECT * FROM pg_stat_activity WHERE datname = 'stabilsafe_dev';
   ```
3. Contactar a equipo de desarrollo

---

## 📝 CHECKLIST DE EJECUCIÓN

- [ ] Backup de base de datos realizado
- [ ] Script `add-parser-version.sql` localizado
- [ ] Conexión a `stabilsafe_dev` verificada
- [ ] Permisos de usuario confirmados
- [ ] Script ejecutado sin errores
- [ ] Test 1 completado ✓
- [ ] Test 2 completado ✓
- [ ] Test 3 completado ✓
- [ ] Resultado documentado
- [ ] Equipo de desarrollo notificado

---

## 🎯 PRÓXIMOS PASOS (Después de la migración)

1. **Backend automático:** El parser v2 se usará automáticamente en nuevas sesiones
2. **Verificación:** Ejecutar `node scripts/analisis/verify-scale-fix.js` después de procesar nuevas sesiones
3. **Reprocesamiento (opcional):** Identificar y reprocesar sesiones críticas si es necesario

---

## 📄 CONTENIDO DEL SCRIPT

El script `add-parser-version.sql` realiza:

1. ✅ Añade columna `parser_version INTEGER DEFAULT 1`
2. ✅ Marca sesiones existentes como versión 1
3. ✅ Crea índice para queries eficientes
4. ✅ Añade comentario descriptivo
5. ✅ Genera reporte de distribución

**Transacción:** Todo se ejecuta en una transacción (BEGIN/COMMIT), por lo que si hay error, nada se aplica.

---

## 🎓 INFORMACIÓN ADICIONAL

### ¿Por qué es necesario esto?

Se corrigió un error de escala 100x en el parser de aceleraciones. Las sesiones antiguas tienen datos en escala incorrecta, las nuevas tendrán datos correctos. Este campo permite distinguirlas.

### ¿Afecta a la aplicación?

No. El campo es informativo y no afecta el funcionamiento normal del sistema. Permite queries como:

```sql
-- Ver solo sesiones con datos corregidos
SELECT * FROM "Session" WHERE parser_version = 2;

-- Ver sesiones que requieren reprocesamiento
SELECT * FROM "Session" WHERE parser_version = 1 AND "startTime" >= '2025-09-01';
```

### ¿Cuánto espacio adicional requiere?

Mínimo. Un campo INTEGER por registro (~4 bytes/sesión). Para 10,000 sesiones ≈ 40 KB.

---

**Documento preparado por:** Sistema de Migración DobackSoft  
**Revisado por:** Equipo de Desarrollo  
**Versión:** 1.0  
**Estado:** ✅ LISTO PARA EJECUCIÓN

