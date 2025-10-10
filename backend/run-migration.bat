@echo off
echo Configurando variables de entorno...
set PGPASSWORD=cosigein

echo Ejecutando migración...
psql -h localhost -U postgres -d dobacksoft -f scripts/simple-session-migration.sql

echo Regenerando cliente Prisma...
npx prisma generate

echo Compilando TypeScript...
npm run build

echo Migración completada!
pause 