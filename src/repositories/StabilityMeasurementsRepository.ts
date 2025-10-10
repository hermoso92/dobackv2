import { Database } from '../config/database';
import { StabilityMeasurements } from '../types/domain';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

interface DBStabilityMeasurement {
    id: string;
    timestamp: string;
    session_id: string;
    vehicle_id: string;
    roll: number;
    pitch: number;
    yaw: number;
    lateral_acc: number;
    vertical_acc: number;
    longitudinal_acc: number;
    load_fl: number;
    load_fr: number;
    load_rl: number;
    load_rr: number;
    track_width: number;
    cg_height: number;
}

export class StabilityMeasurementsRepository {
    constructor(private readonly db: Database) { }

    /**
     * Procesa un archivo de mediciones
     */
    public async processFile(file: Express.Multer.File): Promise<StabilityMeasurements[]> {
        try {
            const content = file.buffer.toString();
            const lines = content.split('\n');

            // Saltar encabezado
            const measurements = lines.slice(1).map(line => {
                const [
                    id,
                    timestamp,
                    sessionId,
                    vehicleId,
                    lateralAcc,
                    longitudinalAcc,
                    verticalAcc,
                    roll,
                    pitch,
                    yaw,
                    loadFL,
                    loadFR,
                    loadRL,
                    loadRR,
                    trackWidth,
                    cgHeight
                ] = line.split(',');

                return {
                    id,
                    timestamp: new Date(timestamp),
                    sessionId,
                    vehicleId,
                    roll: parseFloat(roll),
                    pitch: parseFloat(pitch),
                    yaw: parseFloat(yaw),
                    lateralAcc: parseFloat(lateralAcc),
                    verticalAcc: parseFloat(verticalAcc),
                    longitudinalAcc: parseFloat(longitudinalAcc),
                    loadDistribution: {
                        frontLeft: parseFloat(loadFL),
                        frontRight: parseFloat(loadFR),
                        rearLeft: parseFloat(loadRL),
                        rearRight: parseFloat(loadRR)
                    },
                    trackWidth: parseFloat(trackWidth),
                    cgHeight: parseFloat(cgHeight)
                };
            });

            return measurements;
        } catch (error) {
            logger.error('Error processing stability measurements file', { error });
            throw ApiError.internal('Error processing file');
        }
    }

    /**
     * Guarda un lote de mediciones
     */
    public async saveBatch(measurements: StabilityMeasurements[]): Promise<boolean> {
        try {
            const query = `
                INSERT INTO stability_measurements (
                    id,
                    timestamp,
                    session_id,
                    vehicle_id,
                    roll,
                    pitch,
                    yaw,
                    lateral_acc,
                    vertical_acc,
                    longitudinal_acc,
                    load_fl,
                    load_fr,
                    load_rl,
                    load_rr,
                    track_width,
                    cg_height
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const values = measurements.map(m => [
                m.id,
                m.timestamp,
                m.sessionId,
                m.vehicleId,
                m.roll,
                m.pitch,
                m.yaw,
                m.lateralAcc,
                m.verticalAcc,
                m.longitudinalAcc,
                m.loadDistribution.frontLeft,
                m.loadDistribution.frontRight,
                m.loadDistribution.rearLeft,
                m.loadDistribution.rearRight,
                m.trackWidth,
                m.cgHeight
            ]);

            await this.db.transaction(async () => {
                for (const value of values) {
                    await this.db.query(query, value);
                }
            });

            return true;
        } catch (error) {
            logger.error('Error saving stability measurements batch', { error });
            throw ApiError.internal('Error saving measurements');
        }
    }

    /**
     * Busca mediciones por ID de sesión
     */
    public async findBySession(sessionId: string): Promise<StabilityMeasurements[]> {
        try {
            const query = `
                SELECT * FROM stability_measurements
                WHERE session_id = ?
                ORDER BY timestamp ASC
            `;

            const results = await this.db.query<DBStabilityMeasurement[]>(query, [sessionId]);

            return results.map((row: DBStabilityMeasurement) => ({
                id: row.id,
                timestamp: new Date(row.timestamp),
                sessionId: row.session_id,
                vehicleId: row.vehicle_id,
                roll: row.roll,
                pitch: row.pitch,
                yaw: row.yaw,
                lateralAcc: row.lateral_acc,
                verticalAcc: row.vertical_acc,
                longitudinalAcc: row.longitudinal_acc,
                loadDistribution: {
                    frontLeft: row.load_fl,
                    frontRight: row.load_fr,
                    rearLeft: row.load_rl,
                    rearRight: row.load_rr
                },
                trackWidth: row.track_width,
                cgHeight: row.cg_height
            }));
        } catch (error) {
            logger.error('Error finding stability measurements by session', { error });
            throw ApiError.internal('Error retrieving measurements');
        }
    }

    /**
     * Elimina mediciones por ID de sesión
     */
    public async deleteBySession(sessionId: string): Promise<boolean> {
        try {
            const query = `
                DELETE FROM stability_measurements
                WHERE session_id = ?
            `;

            await this.db.query(query, [sessionId]);
            return true;
        } catch (error) {
            logger.error('Error deleting stability measurements by session', { error });
            throw ApiError.internal('Error deleting measurements');
        }
    }
} 