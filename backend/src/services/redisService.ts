/**
 * Servicio Redis para caché distribuido
 * Optimización de rendimiento para Bomberos Madrid
 */

// Nota: En producción se instalaría redis con: npm install redis @types/redis
// Por ahora simulamos la funcionalidad Redis con Map en memoria

interface RedisConfig {
    host: string;
    port: number;
    password?: string;
    db: number;
    retryDelayOnFailover: number;
    maxRetriesPerRequest: number;
}

class RedisService {
    private client: Map<string, any> = new Map();
    private config: RedisConfig;
    private connected: boolean = false;

    constructor() {
        this.config = {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            db: parseInt(process.env.REDIS_DB || '0'),
            retryDelayOnFailover: 100,
            maxRetriesPerRequest: 3
        };

        this.connect();
    }

    /**
     * Conecta al servidor Redis
     */
    private async connect(): Promise<void> {
        try {
            // En producción aquí se conectaría al Redis real
            // const redis = require('redis');
            // this.client = redis.createClient(this.config);

            console.log('✅ Redis service initialized (simulation mode)');
            this.connected = true;
        } catch (error) {
            console.error('❌ Error connecting to Redis:', error);
            this.connected = false;
        }
    }

    /**
     * Establece un valor en Redis con TTL
     */
    async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
        try {
            if (!this.connected) {
                throw new Error('Redis not connected');
            }

            const serializedValue = JSON.stringify({
                data: value,
                timestamp: Date.now(),
                ttl: ttlSeconds ? Date.now() + (ttlSeconds * 1000) : null
            });

            this.client.set(key, serializedValue);

            // Simular TTL con setTimeout (en Redis real esto se maneja automáticamente)
            if (ttlSeconds) {
                setTimeout(() => {
                    this.client.delete(key);
                }, ttlSeconds * 1000);
            }

            return true;
        } catch (error) {
            console.error('Error setting Redis key:', error);
            return false;
        }
    }

    /**
     * Obtiene un valor de Redis
     */
    async get(key: string): Promise<any | null> {
        try {
            if (!this.connected) {
                throw new Error('Redis not connected');
            }

            const value = this.client.get(key);
            if (!value) {
                return null;
            }

            const parsed = JSON.parse(value);

            // Verificar TTL
            if (parsed.ttl && Date.now() > parsed.ttl) {
                this.client.delete(key);
                return null;
            }

            return parsed.data;
        } catch (error) {
            console.error('Error getting Redis key:', error);
            return null;
        }
    }

    /**
     * Elimina una clave de Redis
     */
    async del(key: string): Promise<boolean> {
        try {
            if (!this.connected) {
                throw new Error('Redis not connected');
            }

            return this.client.delete(key);
        } catch (error) {
            console.error('Error deleting Redis key:', error);
            return false;
        }
    }

    /**
     * Establece múltiples valores en una sola operación
     */
    async mset(keyValuePairs: Record<string, any>): Promise<boolean> {
        try {
            if (!this.connected) {
                throw new Error('Redis not connected');
            }

            for (const [key, value] of Object.entries(keyValuePairs)) {
                await this.set(key, value);
            }

            return true;
        } catch (error) {
            console.error('Error in Redis mset:', error);
            return false;
        }
    }

    /**
     * Obtiene múltiples valores en una sola operación
     */
    async mget(keys: string[]): Promise<(any | null)[]> {
        try {
            if (!this.connected) {
                throw new Error('Redis not connected');
            }

            const values = await Promise.all(
                keys.map(key => this.get(key))
            );

            return values;
        } catch (error) {
            console.error('Error in Redis mget:', error);
            return keys.map(() => null);
        }
    }

    /**
     * Incrementa un valor numérico
     */
    async incr(key: string): Promise<number> {
        try {
            if (!this.connected) {
                throw new Error('Redis not connected');
            }

            const current = await this.get(key);
            const newValue = (current || 0) + 1;
            await this.set(key, newValue);

            return newValue;
        } catch (error) {
            console.error('Error in Redis incr:', error);
            return 0;
        }
    }

    /**
     * Establece un valor con TTL en segundos
     */
    async setex(key: string, ttlSeconds: number, value: any): Promise<boolean> {
        return this.set(key, value, ttlSeconds);
    }

    /**
     * Obtiene el TTL restante de una clave
     */
    async ttl(key: string): Promise<number> {
        try {
            if (!this.connected) {
                throw new Error('Redis not connected');
            }

            const value = this.client.get(key);
            if (!value) {
                return -2; // Key doesn't exist
            }

            const parsed = JSON.parse(value);
            if (!parsed.ttl) {
                return -1; // Key exists but has no TTL
            }

            const remaining = Math.ceil((parsed.ttl - Date.now()) / 1000);
            return remaining > 0 ? remaining : -2;
        } catch (error) {
            console.error('Error getting TTL:', error);
            return -1;
        }
    }

    /**
     * Busca claves que coincidan con un patrón
     */
    async keys(pattern: string): Promise<string[]> {
        try {
            if (!this.connected) {
                throw new Error('Redis not connected');
            }

            const regex = new RegExp(pattern.replace(/\*/g, '.*'));
            return Array.from(this.client.keys()).filter(key => regex.test(key));
        } catch (error) {
            console.error('Error getting keys:', error);
            return [];
        }
    }

    /**
     * Elimina claves que coincidan con un patrón
     */
    async delPattern(pattern: string): Promise<number> {
        try {
            if (!this.connected) {
                throw new Error('Redis not connected');
            }

            const keys = await this.keys(pattern);
            let deleted = 0;

            for (const key of keys) {
                if (await this.del(key)) {
                    deleted++;
                }
            }

            return deleted;
        } catch (error) {
            console.error('Error deleting pattern:', error);
            return 0;
        }
    }

    /**
     * Obtiene información del servidor Redis
     */
    async info(): Promise<any> {
        return {
            connected: this.connected,
            config: this.config,
            memoryUsage: this.client.size,
            uptime: process.uptime(),
            version: '6.2.6 (simulation)'
        };
    }

    /**
     * Verifica si Redis está conectado
     */
    isConnected(): boolean {
        return this.connected;
    }

    /**
     * Cierra la conexión a Redis
     */
    async quit(): Promise<void> {
        try {
            this.client.clear();
            this.connected = false;
            console.log('Redis connection closed');
        } catch (error) {
            console.error('Error closing Redis connection:', error);
        }
    }

    /**
     * Limpia todas las claves (¡CUIDADO!)
     */
    async flushall(): Promise<boolean> {
        try {
            if (!this.connected) {
                throw new Error('Redis not connected');
            }

            this.client.clear();
            return true;
        } catch (error) {
            console.error('Error flushing Redis:', error);
            return false;
        }
    }
}

// Instancia singleton del servicio Redis
export const redisService = new RedisService();

// Configuraciones específicas para diferentes tipos de datos
export const REDIS_CONFIG = {
    // Caché de corta duración para datos en tiempo real
    REALTIME_TTL: 30, // 30 segundos

    // Caché de duración media para datos frecuentes
    FREQUENT_TTL: 300, // 5 minutos

    // Caché de larga duración para datos estáticos
    STATIC_TTL: 1800, // 30 minutos

    // Caché de muy larga duración para configuraciones
    CONFIG_TTL: 3600, // 1 hora

    // Prefijos para organizar claves
    PREFIXES: {
        VEHICLES: 'vehicles:',
        STABILITY: 'stability:',
        EMERGENCY: 'emergency:',
        USER_SESSION: 'session:',
        API_CACHE: 'api:',
        STATS: 'stats:'
    }
};

export default redisService;
