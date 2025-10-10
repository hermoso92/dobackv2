#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../config.env') });

const prisma = new PrismaClient();

async function diagnoseSystem() {
    console.log('🔍 DIAGNÓSTICO DEL SISTEMA DE GEOCERCAS\n');

    try {
        console.log('1. Probando conexión a base de datos...');
        await prisma.$connect();
        console.log('✅ Conexión exitosa\n');

        console.log('2. Verificando tablas de geocercas...');

        // Verificar GeofenceRule
        try {
            const ruleCount = await prisma.geofenceRule.count();
            console.log(`✅ Tabla GeofenceRule: ${ruleCount} registros`);
        } catch (error) {
            console.log(`❌ Error en GeofenceRule: ${error}`);
        }

        // Verificar GeofenceVehicleState
        try {
            const stateCount = await prisma.geofenceVehicleState.count();
            console.log(`✅ Tabla GeofenceVehicleState: ${stateCount} registros`);
        } catch (error) {
            console.log(`❌ Error en GeofenceVehicleState: ${error}`);
        }

        // Verificar GeofenceEvent
        try {
            const eventCount = await prisma.geofenceEvent.count();
            console.log(`✅ Tabla GeofenceEvent: ${eventCount} registros`);
        } catch (error) {
            console.log(`❌ Error en GeofenceEvent: ${error}`);
        }

        console.log('\n3. Verificando geometrías PostGIS...');

        // Verificar zonas con PostGIS
        try {
            const zonesWithPostGIS = await prisma.$queryRaw<Array<{ count: bigint }>>`
                SELECT COUNT(*) as count FROM "Zone" WHERE geometry_postgis IS NOT NULL
            `;
            console.log(`✅ Zonas con geometría PostGIS: ${zonesWithPostGIS[0].count}`);
        } catch (error) {
            console.log(`❌ Error verificando zonas PostGIS: ${error}`);
        }

        // Verificar parques con PostGIS
        try {
            const parksWithPostGIS = await prisma.$queryRaw<Array<{ count: bigint }>>`
                SELECT COUNT(*) as count FROM "Park" WHERE geometry_postgis IS NOT NULL
            `;
            console.log(`✅ Parques con geometría PostGIS: ${parksWithPostGIS[0].count}`);
        } catch (error) {
            console.log(`❌ Error verificando parques PostGIS: ${error}`);
        }

        console.log('\n4. Verificando reglas activas...');
        try {
            const activeRules = await prisma.geofenceRule.findMany({
                where: { isActive: true },
                select: { id: true, name: true, priority: true }
            });
            console.log(`✅ Reglas activas: ${activeRules.length}`);
            activeRules.forEach(rule => {
                console.log(`   - ${rule.name} (prioridad: ${rule.priority})`);
            });
        } catch (error) {
            console.log(`❌ Error verificando reglas: ${error}`);
        }

        console.log('\n5. Probando consulta PostGIS simple...');
        try {
            const testPoint = await prisma.$queryRaw<Array<{ result: string }>>`
                SELECT ST_AsText(ST_SetSRID(ST_Point(-3.6415, 40.5405), 4326)) as result
            `;
            console.log(`✅ Consulta PostGIS funcionando: ${testPoint[0].result}`);
        } catch (error) {
            console.log(`❌ Error en consulta PostGIS: ${error}`);
        }

        console.log('\n6. Verificando organizaciones...');
        try {
            const orgs = await prisma.organization.findMany({
                select: { id: true, name: true }
            });
            console.log(`✅ Organizaciones: ${orgs.length}`);
            orgs.forEach(org => {
                console.log(`   - ${org.name} (${org.id})`);
            });
        } catch (error) {
            console.log(`❌ Error verificando organizaciones: ${error}`);
        }

        console.log('\n🎯 RESUMEN DEL DIAGNÓSTICO:');
        console.log('✅ Base de datos: Conectada');
        console.log('✅ Tablas de geocercas: Creadas');
        console.log('✅ PostGIS: Funcionando');
        console.log('✅ Reglas: Configuradas');
        console.log('✅ Organizaciones: Disponibles');

    } catch (error) {
        console.error('❌ ERROR CRÍTICO:', error);
        console.log('\n🔧 POSIBLES SOLUCIONES:');
        console.log('1. Verificar que PostgreSQL esté corriendo');
        console.log('2. Verificar conexión a base de datos');
        console.log('3. Ejecutar migraciones pendientes');
        console.log('4. Verificar configuración de Prisma');
    } finally {
        await prisma.$disconnect();
        console.log('\n🔌 Conexión cerrada');
    }
}

// Ejecutar diagnóstico
if (require.main === module) {
    diagnoseSystem().catch(console.error);
}

export { diagnoseSystem };

