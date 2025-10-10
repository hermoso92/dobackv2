import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Servicio para corregir límites de velocidad según normativa española
 */
export class SpeedLimitCorrectionService {
    // Límites oficiales españoles según normativa DGT
    private readonly SPAIN_SPEED_LIMITS = {
        URBAN: [20, 30, 50], // Zonas urbanas (20 km/h zonas residenciales, 30 km/h ciudad 30, 50 km/h vías urbanas)
        INTERURBAN: [70, 80, 90], // Carreteras convencionales (70 km/h adelantamiento, 80 km/h normal, 90 km/h máximo)
        HIGHWAY: [80, 100, 120] // Autopistas/autovías (80 km/h lluvia, 100 km/h normal, 120 km/h máximo)
    };

    private readonly TOLERANCE_KMH = 2; // Tolerancia para corrección automática

    /**
     * Corrige un límite de velocidad según los estándares españoles
     * @param rawLimit Límite original de OSM
     * @param roadType Tipo de vía (opcional, se deduce si no se proporciona)
     * @returns Límite corregido
     */
    correctSpeedLimit(rawLimit: number, roadType?: 'URBAN' | 'INTERURBAN' | 'HIGHWAY'): number {
        // Si no se especifica tipo de vía, deducir según el límite
        if (!roadType) {
            roadType = this.deduceRoadType(rawLimit);
        }

        const validLimits = this.SPAIN_SPEED_LIMITS[roadType];

        // Encontrar el límite oficial más cercano
        const correctedLimit = validLimits.reduce((closest, current) => {
            const currentDiff = Math.abs(current - rawLimit);
            const closestDiff = Math.abs(closest - rawLimit);
            return currentDiff < closestDiff ? current : closest;
        });

        // Log solo si hay corrección significativa
        if (Math.abs(correctedLimit - rawLimit) > this.TOLERANCE_KMH) {
            logger.info(
                `Límite corregido: ${rawLimit} km/h → ${correctedLimit} km/h (${roadType})`
            );
        }

        return correctedLimit;
    }

    /**
     * Deduce el tipo de vía según el límite de velocidad
     */
    private deduceRoadType(limit: number): 'URBAN' | 'INTERURBAN' | 'HIGHWAY' {
        if (limit <= 60) return 'URBAN';
        if (limit <= 100) return 'INTERURBAN';
        return 'HIGHWAY';
    }

    /**
     * Corrige todos los límites de velocidad en la base de datos
     */
    async correctAllSpeedLimits(): Promise<void> {
        try {
            logger.info('Iniciando corrección masiva de límites de velocidad para España');

            // Verificar si existe la tabla road_speed_limits
            const tableExists = await this.checkTableExists();
            if (!tableExists) {
                logger.warn(
                    'Tabla road_speed_limits no existe. Creando tabla de límites por defecto...'
                );
                await this.createDefaultSpeedLimitsTable();
                return;
            }

            // Obtener estadísticas antes de la corrección
            const beforeStats = await this.getSpeedLimitStats();
            logger.info('Estadísticas antes de la corrección:', beforeStats);

            // Aplicar correcciones usando SQL directo para mejor rendimiento
            await this.applyCorrectionSQL();

            // Obtener estadísticas después de la corrección
            const afterStats = await this.getSpeedLimitStats();
            logger.info('Estadísticas después de la corrección:', afterStats);

            logger.info('Corrección masiva completada exitosamente');
        } catch (error) {
            logger.error('Error en corrección masiva de límites:', error);
            throw error;
        }
    }

    /**
     * Verifica si existe la tabla road_speed_limits
     */
    private async checkTableExists(): Promise<boolean> {
        try {
            await prisma.$queryRaw`SELECT 1 FROM road_speed_limits LIMIT 1`;
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Crea tabla de límites por defecto para España
     */
    private async createDefaultSpeedLimitsTable(): Promise<void> {
        logger.info('Creando tabla de límites por defecto para España');

        // Crear tabla con límites por defecto para las principales ciudades españolas
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS road_speed_limits (
                id SERIAL PRIMARY KEY,
                geom GEOMETRY(LINESTRING, 4326),
                maxspeed INTEGER,
                road_type VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Insertar límites por defecto para España (polígono aproximado)
        await prisma.$executeRaw`
            INSERT INTO road_speed_limits (geom, maxspeed, road_type)
            VALUES 
                (ST_GeomFromText('LINESTRING(-9.3 43.8, 3.3 43.8, 3.3 36.0, -9.3 36.0, -9.3 43.8)', 4326), 50, 'URBAN'),
                (ST_GeomFromText('LINESTRING(-9.3 43.8, 3.3 43.8, 3.3 36.0, -9.3 36.0, -9.3 43.8)', 4326), 90, 'INTERURBAN'),
                (ST_GeomFromText('LINESTRING(-9.3 43.8, 3.3 43.8, 3.3 36.0, -9.3 36.0, -9.3 43.8)', 4326), 120, 'HIGHWAY')
        `;

        logger.info('Tabla de límites por defecto creada');
    }

    /**
     * Aplica correcciones usando SQL directo
     */
    private async applyCorrectionSQL(): Promise<void> {
        logger.info('Aplicando correcciones SQL...');

        // Corrección para límites urbanos (20, 30, 50 km/h)
        await prisma.$executeRaw`
            UPDATE road_speed_limits 
            SET maxspeed = CASE 
                WHEN maxspeed BETWEEN 18 AND 22 THEN 20
                WHEN maxspeed BETWEEN 28 AND 32 THEN 30
                WHEN maxspeed BETWEEN 48 AND 52 THEN 50
                ELSE maxspeed
            END
            WHERE maxspeed <= 60
        `;

        // Corrección para límites interurbanos (70, 80, 90 km/h)
        await prisma.$executeRaw`
            UPDATE road_speed_limits 
            SET maxspeed = CASE 
                WHEN maxspeed BETWEEN 68 AND 72 THEN 70
                WHEN maxspeed BETWEEN 78 AND 82 THEN 80
                WHEN maxspeed BETWEEN 88 AND 92 THEN 90
                ELSE maxspeed
            END
            WHERE maxspeed > 60 AND maxspeed <= 100
        `;

        // Corrección para límites de autopista (80, 100, 120 km/h)
        await prisma.$executeRaw`
            UPDATE road_speed_limits 
            SET maxspeed = CASE 
                WHEN maxspeed BETWEEN 78 AND 82 THEN 80
                WHEN maxspeed BETWEEN 98 AND 102 THEN 100
                WHEN maxspeed BETWEEN 118 AND 122 THEN 120
                ELSE maxspeed
            END
            WHERE maxspeed > 100
        `;

        logger.info('Correcciones SQL aplicadas');
    }

    /**
     * Obtiene estadísticas de límites de velocidad
     */
    private async getSpeedLimitStats(): Promise<Record<string, number>> {
        try {
            const result = await prisma.$queryRaw<Array<{ maxspeed: number; count: number }>>`
                SELECT maxspeed, COUNT(*) as count
                FROM road_speed_limits
                GROUP BY maxspeed
                ORDER BY maxspeed
            `;

            return result.reduce((acc, row) => {
                acc[`${row.maxspeed} km/h`] = Number(row.count);
                return acc;
            }, {} as Record<string, number>);
        } catch (error) {
            logger.warn('Error obteniendo estadísticas:', error);
            return {};
        }
    }

    /**
     * Valida si un límite de velocidad es válido para España
     */
    isValidSpanishSpeedLimit(limit: number): boolean {
        const allValidLimits = [
            ...this.SPAIN_SPEED_LIMITS.URBAN,
            ...this.SPAIN_SPEED_LIMITS.INTERURBAN,
            ...this.SPAIN_SPEED_LIMITS.HIGHWAY
        ];

        return allValidLimits.includes(limit);
    }

    /**
     * Obtiene el límite de velocidad corregido para una ubicación específica
     */
    async getCorrectedSpeedLimit(lat: number, lon: number): Promise<number | null> {
        try {
            // Buscar límite más cercano
            const result = await prisma.$queryRaw<Array<{ maxspeed: number }>>`
                SELECT maxspeed
                FROM road_speed_limits
                WHERE ST_DWithin(geom, ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography, 100)
                ORDER BY ST_Distance(geom, ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography)
                LIMIT 1
            `;

            if (result.length === 0) {
                return null;
            }

            const rawLimit = result[0].maxspeed;
            return this.correctSpeedLimit(rawLimit);
        } catch (error) {
            logger.error('Error obteniendo límite corregido:', error);
            return null;
        }
    }
}

export const speedLimitCorrectionService = new SpeedLimitCorrectionService();
