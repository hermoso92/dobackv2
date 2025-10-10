import { logger } from '../utils/logger';
import { db } from './database';

async function migrate() {
    try {
        logger.info('Starting database migration...');

        // Crear tabla de organizaciones
        await db.execute(`
            CREATE TABLE IF NOT EXISTS organizations (
                id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                type ENUM('emergency', 'logistics', 'transport', 'public') NOT NULL,
                status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
                settings JSON NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Crear tabla de vehículos
        await db.execute(`
            CREATE TABLE IF NOT EXISTS vehicles (
                id VARCHAR(36) PRIMARY KEY,
                organization_id VARCHAR(36) NOT NULL,
                name VARCHAR(100) NOT NULL,
                type VARCHAR(50) NOT NULL,
                model VARCHAR(100) NOT NULL,
                plate VARCHAR(20) NOT NULL,
                vin VARCHAR(17) NOT NULL,
                year INT NOT NULL,
                status ENUM('active', 'maintenance', 'inactive') NOT NULL DEFAULT 'active',
                configuration JSON NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
            )
        `);

        // Crear tabla de sesiones
        await db.execute(`
            CREATE TABLE IF NOT EXISTS sessions (
                id VARCHAR(36) PRIMARY KEY,
                vehicle_id VARCHAR(36) NOT NULL,
                type ENUM('training', 'emergency', 'routine', 'test') NOT NULL,
                start_time TIMESTAMP NOT NULL,
                end_time TIMESTAMP,
                duration INT,
                distance DECIMAL(10,2),
                average_speed DECIMAL(5,2),
                max_speed DECIMAL(5,2),
                event_count INT DEFAULT 0,
                risk_level ENUM('low', 'medium', 'high', 'critical') NOT NULL,
                weather_conditions JSON,
                operator_id VARCHAR(36),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
            )
        `);

        // Crear tabla de mediciones de estabilidad
        await db.execute(`
            CREATE TABLE IF NOT EXISTS stability_measurements (
                id VARCHAR(36) PRIMARY KEY,
                session_id VARCHAR(36) NOT NULL,
                timestamp TIMESTAMP NOT NULL,
                roll DECIMAL(6,2) NOT NULL,
                pitch DECIMAL(6,2) NOT NULL,
                yaw DECIMAL(6,2) NOT NULL,
                lateral_acc DECIMAL(6,2) NOT NULL,
                vertical_acc DECIMAL(6,2) NOT NULL,
                longitudinal_acc DECIMAL(6,2) NOT NULL,
                load_distribution JSON NOT NULL,
                location JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
            )
        `);

        // Crear tabla de eventos
        await db.execute(`
            CREATE TABLE IF NOT EXISTS events (
                id VARCHAR(36) PRIMARY KEY,
                session_id VARCHAR(36) NOT NULL,
                type ENUM('stability', 'telemetry', 'system', 'alert') NOT NULL,
                severity ENUM('info', 'warning', 'error', 'critical') NOT NULL,
                message TEXT NOT NULL,
                timestamp TIMESTAMP NOT NULL,
                status ENUM('active', 'acknowledged', 'resolved') NOT NULL DEFAULT 'active',
                context JSON,
                acknowledged BOOLEAN DEFAULT FALSE,
                acknowledged_by VARCHAR(36),
                acknowledged_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
            )
        `);

        // Crear tabla de usuarios
        await db.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(36) PRIMARY KEY,
                organization_id VARCHAR(36) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                role VARCHAR(50) NOT NULL,
                status ENUM('active', 'inactive', 'pending') NOT NULL DEFAULT 'pending',
                last_login TIMESTAMP,
                preferences JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
            )
        `);

        // Crear tabla de mantenimiento
        await db.execute(`
            CREATE TABLE IF NOT EXISTS maintenance (
                id VARCHAR(36) PRIMARY KEY,
                vehicle_id VARCHAR(36) NOT NULL,
                type VARCHAR(50) NOT NULL,
                description TEXT NOT NULL,
                scheduled_date TIMESTAMP NOT NULL,
                completed_date TIMESTAMP,
                status ENUM('pending', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
                cost DECIMAL(10,2),
                notes TEXT,
                technician VARCHAR(100),
                parts JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
            )
        `);

        // Crear tabla de tokens de refresco
        await db.execute(`
            CREATE TABLE IF NOT EXISTS refresh_tokens (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                token VARCHAR(255) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Crear tabla de verificación de email
        await db.execute(`
            CREATE TABLE IF NOT EXISTS email_verification_tokens (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                token VARCHAR(255) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Crear tabla de tokens de reset de contraseña
        await db.execute(`
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                token VARCHAR(255) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Crear índices
        await db.execute(`
            CREATE INDEX idx_vehicles_organization ON vehicles(organization_id);
            CREATE INDEX idx_sessions_vehicle ON sessions(vehicle_id);
            CREATE INDEX idx_measurements_session ON stability_measurements(session_id);
            CREATE INDEX idx_events_session ON events(session_id);
            CREATE INDEX idx_users_organization ON users(organization_id);
            CREATE INDEX idx_maintenance_vehicle ON maintenance(vehicle_id);
            CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
            CREATE INDEX idx_verification_tokens_user ON email_verification_tokens(user_id);
            CREATE INDEX idx_reset_tokens_user ON password_reset_tokens(user_id);
        `);

        logger.info('Database migration completed successfully');
    } catch (error) {
        logger.error('Error during database migration', { error });
        process.exit(1);
    } finally {
        await db.end();
    }
}

// Ejecutar migración
migrate(); 