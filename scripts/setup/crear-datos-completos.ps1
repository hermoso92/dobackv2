# 📊 SCRIPT DE DATOS COMPLETOS DOBACKSOFT
# Este script crea TODOS los datos reales para producción

Write-Host "=========================================" -ForegroundColor Green
Write-Host "  📊 DATOS COMPLETOS DOBACKSOFT" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

# Configuración de base de datos
$env:PGPASSWORD = "cosigein"

Write-Host "`n🏢 CREANDO ORGANIZACIÓN..." -ForegroundColor Cyan

$orgSQL = @"
-- Crear organización principal
INSERT INTO "Organization" (id, name, "apiKey", "createdAt", "updatedAt")
VALUES (
    'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26',
    'Bomberos Madrid',
    'bomberos-madrid-api-key-2024',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;
"@

try {
    psql -h localhost -p 5432 -U postgres -d dobacksoft -c $orgSQL
    Write-Host "✅ Organización creada" -ForegroundColor Green
}
catch {
    Write-Host "❌ Error creando organización: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n👥 CREANDO USUARIOS..." -ForegroundColor Cyan

$usersSQL = @"
-- Crear usuarios principales
INSERT INTO "User" (id, "organizationId", email, name, "passwordHash", role, status, "createdAt", "updatedAt")
VALUES 
(
    'd82eea50-5681-49c1-afab-1d4623696aa9',
    'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26',
    'admin@cosigein.com',
    'Administrador',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'ADMIN',
    'ACTIVE',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;
"@

try {
    psql -h localhost -p 5432 -U postgres -d dobacksoft -c $usersSQL
    Write-Host "✅ Usuarios creados" -ForegroundColor Green
}
catch {
    Write-Host "❌ Error creando usuarios: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🏞️ CREANDO PARQUES..." -ForegroundColor Cyan

$parksSQL = @"
-- Crear parques de bomberos
INSERT INTO "Park" (id, name, identifier, geometry, "organizationId", "createdAt", "updatedAt")
VALUES 
(
    'park-las-rozas-001',
    'Parque de Bomberos Las Rozas',
    'ROZAS',
    '{"type": "Polygon", "coordinates": [[[-3.8747, 40.4929], [-3.8747, 40.4939], [-3.8737, 40.4939], [-3.8737, 40.4929], [-3.8747, 40.4929]]]}',
    'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26',
    NOW(),
    NOW()
),
(
    'park-alcobendas-002',
    'Parque de Bomberos Alcobendas',
    'ALCOBENDAS',
    '{"type": "Polygon", "coordinates": [[[-3.6414, 40.5474], [-3.6414, 40.5484], [-3.6404, 40.5484], [-3.6404, 40.5474], [-3.6414, 40.5474]]]}',
    'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;
"@

try {
    psql -h localhost -p 5432 -U postgres -d dobacksoft -c $parksSQL
    Write-Host "✅ Parques creados" -ForegroundColor Green
}
catch {
    Write-Host "❌ Error creando parques: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🚗 CREANDO VEHÍCULOS..." -ForegroundColor Cyan

$vehiclesSQL = @"
-- Crear vehículos de bomberos
INSERT INTO "Vehicle" (id, name, model, "licensePlate", brand, "organizationId", identifier, type, status, "parkId", active, "createdAt", "updatedAt")
VALUES 
(
    'vehicle-escala-001',
    'Escalera 1',
    'Mercedes-Benz Atego',
    '1234-ABC',
    'Mercedes-Benz',
    'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26',
    'ESCALA001',
    'ESCALA',
    'ACTIVE',
    'park-las-rozas-001',
    true,
    NOW(),
    NOW()
),
(
    'vehicle-brp-001',
    'BRP 1',
    'Bombardier Can-Am',
    '5678-DEF',
    'Bombardier',
    'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26',
    'BRP001',
    'BRP',
    'ACTIVE',
    'park-alcobendas-002',
    true,
    NOW(),
    NOW()
),
(
    'vehicle-forestal-001',
    'Forestal 1',
    'Iveco Daily',
    '9012-GHI',
    'Iveco',
    'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26',
    'FORESTAL001',
    'FORESTAL',
    'ACTIVE',
    'park-las-rozas-001',
    true,
    NOW(),
    NOW()
),
(
    'vehicle-escala-002',
    'Escalera 2',
    'Mercedes-Benz Sprinter',
    '3456-JKL',
    'Mercedes-Benz',
    'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26',
    'ESCALA002',
    'ESCALA',
    'ACTIVE',
    'park-alcobendas-002',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;
"@

try {
    psql -h localhost -p 5432 -U postgres -d dobacksoft -c $vehiclesSQL
    Write-Host "✅ Vehículos creados" -ForegroundColor Green
}
catch {
    Write-Host "❌ Error creando vehículos: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🗺️ CREANDO GEOFENCES..." -ForegroundColor Cyan

$geofencesSQL = @"
-- Crear geofences de Madrid
INSERT INTO "Geofence" (id, "externalId", name, description, tag, type, mode, enabled, live, geometry, "organizationId", "createdAt", "updatedAt")
VALUES 
(
    'geofence-centro-madrid',
    'CENTRO_MADRID_001',
    'Centro de Madrid',
    'Zona centro de Madrid',
    'CENTRO',
    'POLYGON',
    'CAR',
    true,
    true,
    '{"type": "Polygon", "coordinates": [[[-3.7038, 40.4168], [-3.7038, 40.4168], [-3.7038, 40.4168], [-3.7038, 40.4168]]]}',
    'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26',
    NOW(),
    NOW()
),
(
    'geofence-parque-retiro',
    'RETIRO_001',
    'Parque del Retiro',
    'Parque del Retiro de Madrid',
    'RETIRO',
    'POLYGON',
    'CAR',
    true,
    true,
    '{"type": "Polygon", "coordinates": [[[-3.6850, 40.4150], [-3.6850, 40.4150], [-3.6850, 40.4150], [-3.6850, 40.4150]]]}',
    'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26',
    NOW(),
    NOW()
),
(
    'geofence-aeropuerto',
    'AEROPUERTO_001',
    'Aeropuerto Barajas',
    'Aeropuerto Adolfo Suárez Madrid-Barajas',
    'AEROPUERTO',
    'POLYGON',
    'CAR',
    true,
    true,
    '{"type": "Polygon", "coordinates": [[[-3.5626, 40.4719], [-3.5626, 40.4719], [-3.5626, 40.4719], [-3.5626, 40.4719]]]}',
    'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;
"@

try {
    psql -h localhost -p 5432 -U postgres -d dobacksoft -c $geofencesSQL
    Write-Host "✅ Geofences creadas" -ForegroundColor Green
}
catch {
    Write-Host "❌ Error creando geofences: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n📊 VERIFICANDO DATOS CREADOS..." -ForegroundColor Cyan

$verifySQL = @"
-- Verificar datos creados
SELECT 'Organizaciones' as tabla, COUNT(*) as total FROM "Organization"
UNION ALL
SELECT 'Usuarios', COUNT(*) FROM "User"
UNION ALL
SELECT 'Parques', COUNT(*) FROM "Park"
UNION ALL
SELECT 'Vehículos', COUNT(*) FROM "Vehicle"
UNION ALL
SELECT 'Geofences', COUNT(*) FROM "Geofence";
"@

try {
    psql -h localhost -p 5432 -U postgres -d dobacksoft -c $verifySQL
    Write-Host "✅ Verificación completada" -ForegroundColor Green
}
catch {
    Write-Host "❌ Error en verificación: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 DATOS COMPLETOS CREADOS EXITOSAMENTE!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green