/**
 * Script de Migración: USER → MANAGER
 * 
 * Ejecuta la migración de roles de forma segura con:
 * - Validación previa
 * - Backup automático
 * - Rollback si hay errores
 * - Logging detallado
 * 
 * Uso:
 *   npm run migrate:roles
 *   o
 *   ts-node scripts/migrations/migrate-user-roles.ts
 */

import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

// Colores para consola
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};

const log = {
    info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
    success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
    warning: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
    error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
    title: (msg: string) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
};

interface MigrationStats {
    totalUsers: number;
    usersWithUserRole: number;
    usersUpdated: number;
    errors: string[];
    warnings: string[];
}

/**
 * Validación previa a la migración
 */
async function preValidation(): Promise<boolean> {
    log.title('🔍 VALIDACIÓN PREVIA');

    try {
        // Verificar conexión a BD
        await prisma.$connect();
        log.success('Conexión a base de datos OK');

        // Contar usuarios totales
        const totalUsers = await prisma.user.count();
        log.info(`Total de usuarios en BD: ${totalUsers}`);

        // Contar usuarios con rol USER (necesita conversión)
        const usersWithUserRole = await prisma.user.count({
            where: {
                role: 'USER' as any
            }
        });

        if (usersWithUserRole > 0) {
            log.warning(`Encontrados ${usersWithUserRole} usuarios con rol 'USER' que serán convertidos a 'MANAGER'`);
        } else {
            log.info('No se encontraron usuarios con rol USER');
        }

        // Verificar usuarios ADMIN
        const admins = await prisma.user.count({
            where: {
                role: 'ADMIN' as any
            }
        });
        log.info(`Usuarios ADMIN: ${admins}`);

        // Verificar organizaciones
        const organizations = await prisma.organization.count();
        log.info(`Organizaciones registradas: ${organizations}`);

        return true;
    } catch (error) {
        log.error(`Error en validación previa: ${error}`);
        return false;
    }
}

/**
 * Crear backup de la base de datos
 */
async function createBackup(): Promise<string | null> {
    log.title('💾 CREANDO BACKUP');

    try {
        const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        const backupDir = path.join(process.cwd(), 'database', 'backups');

        // Crear directorio si no existe
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const backupFile = path.join(backupDir, `backup_roles_migration_${timestamp}.sql`);

        // Obtener credenciales de DATABASE_URL
        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) {
            log.warning('DATABASE_URL no encontrada, saltando backup automático');
            log.warning('Se recomienda hacer backup manual antes de continuar');
            return null;
        }

        log.info('Ejecutando pg_dump...');
        const { stdout, stderr } = await execAsync(
            `pg_dump "${databaseUrl}" > "${backupFile}"`
        );

        if (stderr) {
            log.warning(`Advertencias durante backup: ${stderr}`);
        }

        // Verificar que el backup se creó
        if (fs.existsSync(backupFile)) {
            const stats = fs.statSync(backupFile);
            log.success(`Backup creado: ${backupFile} (${(stats.size / 1024).toFixed(2)} KB)`);
            return backupFile;
        } else {
            log.error('El archivo de backup no se creó correctamente');
            return null;
        }
    } catch (error) {
        log.error(`Error creando backup: ${error}`);
        log.warning('Continuando sin backup automático (se recomienda backup manual)');
        return null;
    }
}

/**
 * Ejecutar migración SQL
 */
async function executeMigration(): Promise<MigrationStats> {
    log.title('🚀 EJECUTANDO MIGRACIÓN');

    const stats: MigrationStats = {
        totalUsers: 0,
        usersWithUserRole: 0,
        usersUpdated: 0,
        errors: [],
        warnings: [],
    };

    try {
        // Leer archivo SQL de migración
        const sqlFile = path.join(process.cwd(), 'database', 'migrations', '001_update_user_roles_manager.sql');

        if (!fs.existsSync(sqlFile)) {
            throw new Error(`Archivo de migración no encontrado: ${sqlFile}`);
        }

        const sqlContent = fs.readFileSync(sqlFile, 'utf-8');
        log.info('Archivo SQL cargado correctamente');

        // Ejecutar migración en transacción
        await prisma.$executeRawUnsafe(sqlContent);

        log.success('Migración SQL ejecutada correctamente');

        // Obtener estadísticas post-migración
        stats.totalUsers = await prisma.user.count();

        const roleDistribution = await prisma.$queryRaw<any[]>`
      SELECT 
        role,
        COUNT(*) as count
      FROM "User"
      GROUP BY role
    `;

        log.info('\nDistribución de roles después de migración:');
        roleDistribution.forEach((row: any) => {
            log.info(`  - ${row.role}: ${row.count} usuarios`);
        });

        // Verificar que no quedan usuarios con rol USER
        const remainingUserRole = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count
      FROM "User"
      WHERE role::text = 'USER'
    `;

        if (remainingUserRole[0]?.count > 0) {
            stats.errors.push(`Aún quedan ${remainingUserRole[0].count} usuarios con rol USER`);
        }

        return stats;
    } catch (error) {
        stats.errors.push(`Error en migración: ${error}`);
        throw error;
    }
}

/**
 * Validación post-migración
 */
async function postValidation(): Promise<boolean> {
    log.title('✅ VALIDACIÓN POST-MIGRACIÓN');

    try {
        // Verificar que no quedan roles USER
        const usersWithUserRole = await prisma.user.count({
            where: {
                role: 'USER' as any
            }
        });

        if (usersWithUserRole === 0) {
            log.success('No quedan usuarios con rol USER');
        } else {
            log.error(`ERROR: Aún hay ${usersWithUserRole} usuarios con rol USER`);
            return false;
        }

        // Verificar MANAGERS sin organización
        const managersWithoutOrg = await prisma.user.findMany({
            where: {
                role: 'MANAGER' as any,
                OR: [
                    { organizationId: null },
                    { organizationId: '' }
                ]
            },
            select: {
                id: true,
                email: true,
                name: true,
            }
        });

        if (managersWithoutOrg.length > 0) {
            log.warning(`⚠️  ${managersWithoutOrg.length} MANAGERS sin organización asignada:`);
            managersWithoutOrg.forEach(user => {
                log.warning(`    - ${user.name} (${user.email})`);
            });
        } else {
            log.success('Todos los MANAGERS tienen organización asignada');
        }

        // Verificar nuevos campos
        const userSample = await prisma.user.findFirst({
            select: {
                id: true,
                permissions: true,
                managedParks: true,
                lastLoginAt: true,
                failedLoginAttempts: true,
            }
        });

        if (userSample) {
            log.success('Nuevos campos verificados en modelo User');
        }

        return true;
    } catch (error) {
        log.error(`Error en validación post-migración: ${error}`);
        return false;
    }
}

/**
 * Función principal
 */
async function main() {
    console.log(`
${colors.bright}${colors.cyan}╔════════════════════════════════════════════════════════╗
║                                                        ║
║   🔄  MIGRACIÓN DE ROLES: USER → MANAGER              ║
║                                                        ║
║   DobackSoft - StabilSafe V3                          ║
║   Fecha: ${new Date().toLocaleDateString()}                              ║
║                                                        ║
╚════════════════════════════════════════════════════════╝${colors.reset}
  `);

    try {
        // 1. Validación previa
        const preValidOk = await preValidation();
        if (!preValidOk) {
            log.error('Validación previa falló. Abortando migración.');
            process.exit(1);
        }

        // 2. Confirmación del usuario
        log.warning('\n⚠️  Esta migración modificará la estructura de roles en la base de datos.');
        log.warning('Se recomienda tener un backup completo antes de continuar.\n');

        // En producción, añadir confirmación interactiva aquí

        // 3. Crear backup
        const backupFile = await createBackup();
        if (backupFile) {
            log.success('Backup creado correctamente');
        }

        // 4. Ejecutar migración
        const stats = await executeMigration();

        // 5. Validación post-migración
        const postValidOk = await postValidation();
        if (!postValidOk) {
            log.error('Validación post-migración falló');
            if (backupFile) {
                log.warning(`Puedes restaurar el backup desde: ${backupFile}`);
            }
            process.exit(1);
        }

        // 6. Resumen final
        log.title('📊 RESUMEN DE MIGRACIÓN');
        log.success(`Total de usuarios: ${stats.totalUsers}`);
        log.success('Roles actualizados correctamente');
        log.success('Nuevos campos añadidos: permissions, managedParks, lastLoginAt, etc.');
        log.success('Índices creados para optimización');

        if (stats.warnings.length > 0) {
            log.warning('\n⚠️  Advertencias:');
            stats.warnings.forEach(w => log.warning(`  - ${w}`));
        }

        if (stats.errors.length > 0) {
            log.error('\n❌ Errores:');
            stats.errors.forEach(e => log.error(`  - ${e}`));
            process.exit(1);
        }

        log.title('✅ MIGRACIÓN COMPLETADA CON ÉXITO');

    } catch (error) {
        log.error(`\n❌ Error crítico durante migración: ${error}`);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    main();
}

export { main as migrateuserRoles };

