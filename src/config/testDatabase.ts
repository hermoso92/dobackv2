import path from 'path';
import { Database, RunResult } from 'sqlite3';
import { logger } from '../utils/logger';

interface QueryResult {
    [key: string]: any;
}

export class TestDatabase {
    private db: Database;
    private static instance: TestDatabase;

    constructor() {
        const dbPath = path.join(__dirname, '../../test.db');
        this.db = new Database(dbPath);
        this.initialize();
    }

    private async initialize() {
        try {
            await this.createTables();
            logger.info('Test database connection established successfully');
        } catch (error) {
            logger.error('Error connecting to test database', { error });
            throw error;
        }
    }

    private createTables(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                // Crear tablas
                this.db.run(`
                    CREATE TABLE IF NOT EXISTS vehicles (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        model TEXT NOT NULL,
                        plate TEXT NOT NULL,
                        vin TEXT NOT NULL,
                        type TEXT NOT NULL,
                        status TEXT NOT NULL,
                        organizationId INTEGER NOT NULL,
                        configuration TEXT,
                        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);

                this.db.run(`
                    CREATE TABLE IF NOT EXISTS sessions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        vehicleId INTEGER NOT NULL,
                        operatorId INTEGER NOT NULL,
                        type TEXT NOT NULL,
                        startTime DATETIME NOT NULL,
                        endTime DATETIME,
                        duration INTEGER,
                        distance REAL,
                        averageSpeed REAL,
                        maxSpeed REAL,
                        eventCount INTEGER DEFAULT 0,
                        riskLevel TEXT,
                        weatherConditions TEXT,
                        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (vehicleId) REFERENCES vehicles(id)
                    )
                `);

                this.db.run(`
                    CREATE TABLE IF NOT EXISTS events (
                        id TEXT PRIMARY KEY,
                        type TEXT NOT NULL,
                        severity TEXT NOT NULL,
                        message TEXT NOT NULL,
                        status TEXT NOT NULL,
                        context TEXT,
                        acknowledged INTEGER DEFAULT 0,
                        acknowledgedAt DATETIME,
                        acknowledgedBy INTEGER,
                        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);

                this.db.run(`
                    CREATE TABLE IF NOT EXISTS audit_logs (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        userId INTEGER NOT NULL,
                        organizationId INTEGER NOT NULL,
                        actionType TEXT NOT NULL,
                        resourceType TEXT NOT NULL,
                        resourceId TEXT NOT NULL,
                        requestMethod TEXT NOT NULL,
                        requestPath TEXT NOT NULL,
                        requestBody TEXT,
                        statusCode INTEGER NOT NULL,
                        ipAddress TEXT NOT NULL,
                        userAgent TEXT NOT NULL,
                        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `, (err: Error | null) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        });
    }

    public static getInstance(): TestDatabase {
        if (!TestDatabase.instance) {
            TestDatabase.instance = new TestDatabase();
        }
        return TestDatabase.instance;
    }

    public async query<T extends QueryResult>(sql: string, params: any[] = []): Promise<T[]> {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err: Error | null, rows: T[]) => {
                if (err) {
                    logger.error('Error executing test query', { error: err, sql, params });
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    public async run(sql: string, params: any[] = []): Promise<RunResult> {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err: Error | null) {
                if (err) {
                    logger.error('Error executing test query', { error: err, sql, params });
                    reject(err);
                } else {
                    resolve(this);
                }
            });
        });
    }

    public async transaction<T>(callback: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.db.serialize(async () => {
                try {
                    await this.run('BEGIN TRANSACTION');
                    const result = await callback();
                    await this.run('COMMIT');
                    resolve(result);
                } catch (error) {
                    await this.run('ROLLBACK');
                    reject(error);
                }
            });
        });
    }

    public async end(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.close((err: Error | null) => {
                if (err) {
                    logger.error('Error closing test database connection', { error: err });
                    reject(err);
                } else {
                    logger.info('Test database connection closed successfully');
                    resolve();
                }
            });
        });
    }
} 