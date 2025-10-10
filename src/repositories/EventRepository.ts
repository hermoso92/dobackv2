import { db } from '../config/database';
import { Event, EventSeverity, EventStatus, EventType } from '../types/domain';
import { logger } from '../utils/logger';

export class EventRepository {
    async findById(id: string): Promise<Event | null> {
        try {
            const [rows] = await db.execute(
                'SELECT * FROM events WHERE id = ?',
                [id]
            );

            const events = rows as Event[];
            return events.length > 0 ? events[0] : null;
        } catch (error) {
            logger.error('Error finding event by id', { error, id });
            throw error;
        }
    }

    async findByStatus(status: EventStatus): Promise<Event[]> {
        try {
            const [rows] = await db.execute(
                'SELECT * FROM events WHERE status = ? ORDER BY timestamp DESC',
                [status]
            );
            return rows as Event[];
        } catch (error) {
            logger.error('Error finding events by status', { error, status });
            throw error;
        }
    }

    async findByType(type: EventType): Promise<Event[]> {
        try {
            const [rows] = await db.execute(
                'SELECT * FROM events WHERE type = ? ORDER BY timestamp DESC',
                [type]
            );
            return rows as Event[];
        } catch (error) {
            logger.error('Error finding events by type', { error, type });
            throw error;
        }
    }

    async findBySeverity(severity: EventSeverity): Promise<Event[]> {
        try {
            const [rows] = await db.execute(
                'SELECT * FROM events WHERE severity = ? ORDER BY timestamp DESC',
                [severity]
            );
            return rows as Event[];
        } catch (error) {
            logger.error('Error finding events by severity', { error, severity });
            throw error;
        }
    }

    async save(event: Event): Promise<void> {
        try {
            await db.execute(
                `INSERT INTO events (
                    id, type, severity, message, timestamp, status,
                    context, acknowledged, acknowledged_by, acknowledged_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    event.id,
                    event.type,
                    event.severity,
                    event.message,
                    event.timestamp,
                    event.status,
                    JSON.stringify(event.context),
                    event.acknowledged,
                    event.acknowledgedBy,
                    event.acknowledgedAt
                ]
            );
        } catch (error) {
            logger.error('Error saving event', { error, event });
            throw error;
        }
    }

    async update(event: Event): Promise<void> {
        try {
            await db.execute(
                `UPDATE events SET
                    type = ?,
                    severity = ?,
                    message = ?,
                    status = ?,
                    context = ?,
                    acknowledged = ?,
                    acknowledged_by = ?,
                    acknowledged_at = ?
                WHERE id = ?`,
                [
                    event.type,
                    event.severity,
                    event.message,
                    event.status,
                    JSON.stringify(event.context),
                    event.acknowledged,
                    event.acknowledgedBy,
                    event.acknowledgedAt,
                    event.id
                ]
            );
        } catch (error) {
            logger.error('Error updating event', { error, event });
            throw error;
        }
    }

    async delete(id: string): Promise<void> {
        try {
            await db.execute('DELETE FROM events WHERE id = ?', [id]);
        } catch (error) {
            logger.error('Error deleting event', { error, id });
            throw error;
        }
    }

    async findByVehicle(vehicleId: string, options: {
        startDate?: Date;
        endDate?: Date;
        type?: EventType;
        severity?: EventSeverity;
    } = {}): Promise<Event[]> {
        try {
            let query = 'SELECT * FROM events WHERE vehicle_id = ?';
            const params: any[] = [vehicleId];

            if (options.startDate) {
                query += ' AND timestamp >= ?';
                params.push(options.startDate);
            }

            if (options.endDate) {
                query += ' AND timestamp <= ?';
                params.push(options.endDate);
            }

            if (options.type) {
                query += ' AND type = ?';
                params.push(options.type);
            }

            if (options.severity) {
                query += ' AND severity = ?';
                params.push(options.severity);
            }

            query += ' ORDER BY timestamp DESC';

            const [rows] = await db.execute(query, params);
            return rows as Event[];
        } catch (error) {
            logger.error('Error finding events by vehicle', { error, vehicleId });
            throw error;
        }
    }

    async findBySession(sessionId: string): Promise<Event[]> {
        try {
            const [rows] = await db.execute(
                'SELECT * FROM events WHERE session_id = ? ORDER BY timestamp DESC',
                [sessionId]
            );
            return rows as Event[];
        } catch (error) {
            logger.error('Error finding events by session', { error, sessionId });
            throw error;
        }
    }
} 