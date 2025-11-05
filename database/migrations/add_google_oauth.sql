-- 🔐 Migración: Añadir soporte para Google OAuth 2.0
-- Fecha: 2025-11-05
-- Descripción: Añade campo googleId a la tabla User para vincular cuentas de Google

-- 1. Añadir columna googleId (nullable y única)
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "googleId" VARCHAR(255);

-- 2. Crear índice único para googleId
CREATE UNIQUE INDEX IF NOT EXISTS "User_googleId_key" ON "User"("googleId");

-- 3. Permitir password NULL para usuarios OAuth (opcional)
-- Los usuarios de Google OAuth no necesitan password
ALTER TABLE "User"
ALTER COLUMN "password" DROP NOT NULL;

-- 4. Añadir comentarios para documentación
COMMENT ON COLUMN "User"."googleId" IS 'ID único de Google OAuth 2.0 (profile.id)';

-- 5. Verificar cambios
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'User'
AND column_name IN ('googleId', 'password');

-- Resultado esperado:
-- googleId   | varchar(255) | YES | NULL
-- password   | varchar(255) | YES | NULL

