import { UserRole } from './auth';
import {
    Alarm,
    AuditLog,
    Event,
    MaintenanceRequest,
    Organization,
    Rule,
    Session,
    Telemetry,
    User,
    Vehicle
} from './database';

// Interfaz para el repositorio de usuarios
export interface UserRepository {
    create(data: {
        email: string;
        password: string;
        name: string;
        role: UserRole;
        organizationId: number;
    }): Promise<User>;
    update(
        id: number,
        data: {
            email?: string;
            name?: string;
            role?: UserRole;
        }
    ): Promise<User>;
    delete(id: number): Promise<void>;
    findById(id: number): Promise<User>;
    findByEmail(email: string): Promise<User>;
    findAll(options: {
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        filters?: Record<string, any>;
    }): Promise<{
        items: User[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}

// Interfaz para el repositorio de organizaciones
export interface OrganizationRepository {
    create(data: { name: string; description: string }): Promise<Organization>;
    update(
        id: number,
        data: {
            name?: string;
            description?: string;
        }
    ): Promise<Organization>;
    delete(id: number): Promise<void>;
    findById(id: number): Promise<Organization>;
    findAll(options: {
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        filters?: Record<string, any>;
    }): Promise<{
        items: Organization[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}

// Interfaz para el repositorio de vehículos
export interface VehicleRepository {
    create(data: {
        name: string;
        model: string;
        plateNumber: string;
        status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
        organizationId: number;
    }): Promise<Vehicle>;
    update(
        id: number,
        data: {
            name?: string;
            model?: string;
            plateNumber?: string;
            status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
        }
    ): Promise<Vehicle>;
    delete(id: number): Promise<void>;
    findById(id: number): Promise<Vehicle>;
    findAll(options: {
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        filters?: Record<string, any>;
    }): Promise<{
        items: Vehicle[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}

// Interfaz para el repositorio de sesiones
export interface SessionRepository {
    create(data: { vehicleId: number }): Promise<Session>;
    update(
        id: number,
        data: {
            status?: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
            endTime?: Date;
        }
    ): Promise<Session>;
    delete(id: number): Promise<void>;
    findById(id: number): Promise<Session>;
    findAll(options: {
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        filters?: Record<string, any>;
    }): Promise<{
        items: Session[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}

// Interfaz para el repositorio de eventos
export interface EventRepository {
    create(data: {
        type: string;
        severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        description: string;
        vehicleId: number;
        organizationId: number;
    }): Promise<Event>;
    update(
        id: number,
        data: {
            type?: string;
            severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
            description?: string;
        }
    ): Promise<Event>;
    delete(id: number): Promise<void>;
    findById(id: number): Promise<Event>;
    findAll(options: {
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        filters?: Record<string, any>;
    }): Promise<{
        items: Event[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}

// Interfaz para el repositorio de telemetría
export interface TelemetryRepository {
    create(data: {
        latitude: number;
        longitude: number;
        speed: number;
        acceleration: number;
        temperature: number;
        batteryLevel: number;
        sessionId: number;
        vehicleId: number;
    }): Promise<Telemetry>;
    update(
        id: number,
        data: {
            latitude?: number;
            longitude?: number;
            speed?: number;
            acceleration?: number;
            temperature?: number;
            batteryLevel?: number;
        }
    ): Promise<Telemetry>;
    delete(id: number): Promise<void>;
    findById(id: number): Promise<Telemetry>;
    findAll(options: {
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        filters?: Record<string, any>;
    }): Promise<{
        items: Telemetry[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}

// Interfaz para el repositorio de reglas
export interface RuleRepository {
    create(data: {
        name: string;
        description: string;
        metric: 'ltr' | 'speed' | 'acceleration' | 'temperature' | 'batteryLevel';
        threshold: number;
        condition: '>' | '<' | '>=' | '<=' | '==' | '!=';
        action: string;
        organizationId: number;
        vehicleId?: number;
    }): Promise<Rule>;
    update(
        id: number,
        data: {
            name?: string;
            description?: string;
            metric?: 'ltr' | 'speed' | 'acceleration' | 'temperature' | 'batteryLevel';
            threshold?: number;
            condition?: '>' | '<' | '>=' | '<=' | '==' | '!=';
            action?: string;
            isActive?: boolean;
        }
    ): Promise<Rule>;
    delete(id: number): Promise<void>;
    findById(id: number): Promise<Rule>;
    findAll(options: {
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        filters?: Record<string, any>;
    }): Promise<{
        items: Rule[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}

// Interfaz para el repositorio de alarmas
export interface AlarmRepository {
    create(data: {
        type: string;
        severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        description: string;
        ruleId: number;
        vehicleId: number;
        organizationId: number;
    }): Promise<Alarm>;
    update(
        id: number,
        data: {
            status?: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
        }
    ): Promise<Alarm>;
    delete(id: number): Promise<void>;
    findById(id: number): Promise<Alarm>;
    findAll(options: {
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        filters?: Record<string, any>;
    }): Promise<{
        items: Alarm[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}

// Interfaz para el repositorio de mantenimiento
export interface MaintenanceRepository {
    create(data: {
        type: 'PREVENTIVE' | 'CORRECTIVE' | 'PREDICTIVE';
        description: string;
        priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        scheduledDate: Date;
        vehicleId: number;
        organizationId: number;
        assignedTo?: number;
    }): Promise<MaintenanceRequest>;
    update(
        id: number,
        data: {
            status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
            description?: string;
            priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
            scheduledDate?: Date;
            completedDate?: Date;
            assignedTo?: number;
        }
    ): Promise<MaintenanceRequest>;
    delete(id: number): Promise<void>;
    findById(id: number): Promise<MaintenanceRequest>;
    findAll(options: {
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        filters?: Record<string, any>;
    }): Promise<{
        items: MaintenanceRequest[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}

// Interfaz para el repositorio de auditoría
export interface AuditRepository {
    create(data: {
        action: string;
        entity: string;
        entityId: number;
        userId: number;
        organizationId: number;
        details?: any;
    }): Promise<AuditLog>;
    findById(id: number): Promise<AuditLog>;
    findAll(options: {
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        filters?: Record<string, any>;
    }): Promise<{
        items: AuditLog[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}

// Interfaz para el repositorio de configuración
export interface ConfigRepository {
    get(key: string): Promise<any>;
    set(key: string, value: any, description?: string): Promise<void>;
    delete(key: string): Promise<void>;
    findAll(options: {
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        filters?: Record<string, any>;
    }): Promise<{
        items: Array<{
            key: string;
            value: any;
            description?: string;
        }>;
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}

// Interfaz para el repositorio de caché
export interface CacheRepository {
    get(key: string): Promise<any>;
    set(key: string, value: any, ttl?: number): Promise<void>;
    delete(key: string): Promise<void>;
    clear(pattern?: string): Promise<void>;
}

// Interfaz para el repositorio de backup
export interface BackupRepository {
    create(data: {
        type: 'full' | 'incremental';
        destination: string;
        options?: Record<string, any>;
    }): Promise<{
        id: string;
        url: string;
    }>;
    restore(data: { source: string; options?: Record<string, any> }): Promise<void>;
}

// Interfaz para el repositorio de sincronización
export interface SyncRepository {
    sync(data: { type: 'push' | 'pull' | 'both'; options?: Record<string, any> }): Promise<void>;
}

// Interfaz para el repositorio de actualización
export interface UpdateRepository {
    update(data: {
        type: 'system' | 'application' | 'database';
        version: string;
        options?: Record<string, any>;
    }): Promise<void>;
}

// Interfaz para el repositorio de diagnóstico
export interface DiagnosticRepository {
    diagnose(data: {
        type: 'system' | 'application' | 'database' | 'network';
        options?: Record<string, any>;
    }): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        details: Record<string, any>;
    }>;
}

// Interfaz para el repositorio de monitoreo
export interface MonitoringRepository {
    monitor(data: {
        type: 'performance' | 'health' | 'security' | 'usage';
        options?: Record<string, any>;
    }): Promise<{
        metrics: Record<string, number>;
        alerts: Array<{
            type: string;
            severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
            message: string;
            data?: Record<string, any>;
        }>;
    }>;
}

// Interfaz para el repositorio de alertas
export interface AlertRepository {
    create(data: {
        type: string;
        severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        message: string;
        data?: Record<string, any>;
    }): Promise<void>;
}

// Interfaz para el repositorio de métricas
export interface MetricRepository {
    record(data: {
        name: string;
        value: number;
        tags?: Record<string, string>;
        timestamp?: Date;
    }): Promise<void>;
}

// Interfaz para el repositorio de logs
export interface LogRepository {
    log(data: {
        level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
        message: string;
        data?: Record<string, any>;
        timestamp?: Date;
    }): Promise<void>;
}

// Interfaz para el repositorio de traces
export interface TraceRepository {
    trace(data: { name: string; data?: Record<string, any>; timestamp?: Date }): Promise<void>;
}

// Interfaz para el repositorio de spans
export interface SpanRepository {
    span(data: {
        name: string;
        parentId?: string;
        data?: Record<string, any>;
        timestamp?: Date;
    }): Promise<void>;
}

// Interfaz para el repositorio de bags
export interface BagRepository {
    bag(data: { name: string; data: Record<string, any>; timestamp?: Date }): Promise<void>;
}

// Interfaz para el repositorio de tags
export interface TagRepository {
    tag(data: { name: string; value: string; timestamp?: Date }): Promise<void>;
}

// Interfaz para el repositorio de anotaciones
export interface AnnotationRepository {
    annotate(data: { name: string; value: string; timestamp?: Date }): Promise<void>;
}

// Interfaz para el repositorio de eventos
export interface EventRepository {
    event(data: { name: string; data?: Record<string, any>; timestamp?: Date }): Promise<void>;
}

// Interfaz para el repositorio de mensajes
export interface MessageRepository {
    publish(data: { topic: string; payload: any; options?: Record<string, any> }): Promise<void>;
    subscribe(data: { topic: string; options?: Record<string, any> }): Promise<void>;
}

// Interfaz para el repositorio de consultas
export interface QueryRepository {
    query(data: { query: string; params?: any[]; options?: Record<string, any> }): Promise<any[]>;
}

// Interfaz para el repositorio de ejecución
export interface ExecuteRepository {
    execute(data: { sql: string; params?: any[]; options?: Record<string, any> }): Promise<void>;
}

// Interfaz para el repositorio de transacciones
export interface TransactionRepository {
    transaction(data: {
        queries: {
            sql: string;
            params?: any[];
        }[];
        options?: Record<string, any>;
    }): Promise<void>;
}

// Interfaz para el repositorio de migraciones
export interface MigrationRepository {
    migrate(data: {
        name: string;
        up: string;
        down: string;
        options?: Record<string, any>;
    }): Promise<void>;
}

// Interfaz para el repositorio de seeds
export interface SeedRepository {
    seed(data: { name: string; data: any[]; options?: Record<string, any> }): Promise<void>;
}

// Interfaz para el repositorio de fixtures
export interface FixtureRepository {
    fixture(data: { name: string; data: any[]; options?: Record<string, any> }): Promise<void>;
}

// Interfaz para el repositorio de factories
export interface FactoryRepository {
    factory(data: { name: string; count: number; options?: Record<string, any> }): Promise<any[]>;
}

// Interfaz para el repositorio de seeders
export interface SeederRepository {
    seeder(data: { name: string; options?: Record<string, any> }): Promise<void>;
}

// Interfaz para el repositorio de fakers
export interface FakerRepository {
    faker(data: { type: string; options?: Record<string, any> }): Promise<any>;
}

// Interfaz para el repositorio de generadores
export interface GeneratorRepository {
    generator(data: { type: string; options?: Record<string, any> }): Promise<any>;
}

// Interfaz para el repositorio de validadores
export interface ValidatorRepository {
    validator(data: { type: string; data: any; options?: Record<string, any> }): Promise<{
        isValid: boolean;
        errors?: Record<string, string[]>;
    }>;
}

// Interfaz para el repositorio de transformadores
export interface TransformerRepository {
    transformer(data: { type: string; data: any; options?: Record<string, any> }): Promise<any>;
}

// Interfaz para el repositorio de serializadores
export interface SerializerRepository {
    serializer(data: { type: string; data: any; options?: Record<string, any> }): Promise<any>;
}

// Interfaz para el repositorio de deserializadores
export interface DeserializerRepository {
    deserializer(data: { type: string; data: any; options?: Record<string, any> }): Promise<any>;
}

// Interfaz para el repositorio de normalizadores
export interface NormalizerRepository {
    normalizer(data: { type: string; data: any; options?: Record<string, any> }): Promise<any>;
}

// Interfaz para el repositorio de denormalizadores
export interface DenormalizerRepository {
    denormalizer(data: { type: string; data: any; options?: Record<string, any> }): Promise<any>;
}

// Interfaz para el repositorio de formateadores
export interface FormatterRepository {
    formatter(data: { type: string; data: any; options?: Record<string, any> }): Promise<any>;
}

// Interfaz para el repositorio de parsers
export interface ParserRepository {
    parser(data: { type: string; data: any; options?: Record<string, any> }): Promise<any>;
}

// Interfaz para el repositorio de encoders
export interface EncoderRepository {
    encoder(data: { type: string; data: any; options?: Record<string, any> }): Promise<any>;
}

// Interfaz para el repositorio de decoders
export interface DecoderRepository {
    decoder(data: { type: string; data: any; options?: Record<string, any> }): Promise<any>;
}

// Interfaz para el repositorio de compressors
export interface CompressorRepository {
    compressor(data: { type: string; data: any; options?: Record<string, any> }): Promise<any>;
}

// Interfaz para el repositorio de decompressors
export interface DecompressorRepository {
    decompressor(data: { type: string; data: any; options?: Record<string, any> }): Promise<any>;
}

// Interfaz para el repositorio de hashers
export interface HasherRepository {
    hasher(data: { type: string; data: any; options?: Record<string, any> }): Promise<string>;
}

// Interfaz para el repositorio de verificadores
export interface VerifierRepository {
    verifier(data: { type: string; data: any; options?: Record<string, any> }): Promise<boolean>;
}

// Interfaz para el repositorio de firmadores
export interface SignerRepository {
    signer(data: { type: string; data: any; options?: Record<string, any> }): Promise<string>;
}

// Interfaz para el repositorio de verificadores de firma
export interface SignatureVerifierRepository {
    signatureVerifier(data: {
        type: string;
        data: any;
        options?: Record<string, any>;
    }): Promise<boolean>;
}

// Interfaz para el repositorio de encriptadores
export interface EncryptorRepository {
    encryptor(data: { type: string; data: any; options?: Record<string, any> }): Promise<string>;
}

// Interfaz para el repositorio de desencriptadores
export interface DecryptorRepository {
    decryptor(data: { type: string; data: any; options?: Record<string, any> }): Promise<any>;
}

// Interfaz para el repositorio de tokenizadores
export interface TokenizerRepository {
    tokenizer(data: { type: string; data: any; options?: Record<string, any> }): Promise<string>;
}

// Interfaz para el repositorio de detokenizadores
export interface DetokenizerRepository {
    detokenizer(data: { type: string; data: any; options?: Record<string, any> }): Promise<any>;
}

// Interfaz para el repositorio de sanitizadores
export interface SanitizerRepository {
    sanitizer(data: { type: string; data: any; options?: Record<string, any> }): Promise<any>;
}

// Interfaz para el repositorio de validadores de sanitización
export interface SanitizationValidatorRepository {
    sanitizationValidator(data: {
        type: string;
        data: any;
        options?: Record<string, any>;
    }): Promise<{
        isValid: boolean;
        errors?: Record<string, string[]>;
    }>;
}

// Interfaz para el repositorio de normalizadores de sanitización
export interface SanitizationNormalizerRepository {
    sanitizationNormalizer(data: {
        type: string;
        data: any;
        options?: Record<string, any>;
    }): Promise<any>;
}

// Interfaz para el repositorio de formateadores de sanitización
export interface SanitizationFormatterRepository {
    sanitizationFormatter(data: {
        type: string;
        data: any;
        options?: Record<string, any>;
    }): Promise<any>;
}

// Interfaz para el repositorio de parsers de sanitización
export interface SanitizationParserRepository {
    sanitizationParser(data: {
        type: string;
        data: any;
        options?: Record<string, any>;
    }): Promise<any>;
}

// Interfaz para el repositorio de encoders de sanitización
export interface SanitizationEncoderRepository {
    sanitizationEncoder(data: {
        type: string;
        data: any;
        options?: Record<string, any>;
    }): Promise<any>;
}

// Interfaz para el repositorio de decoders de sanitización
export interface SanitizationDecoderRepository {
    sanitizationDecoder(data: {
        type: string;
        data: any;
        options?: Record<string, any>;
    }): Promise<any>;
}

// Interfaz para el repositorio de compressors de sanitización
export interface SanitizationCompressorRepository {
    sanitizationCompressor(data: {
        type: string;
        data: any;
        options?: Record<string, any>;
    }): Promise<any>;
}

// Interfaz para el repositorio de decompressors de sanitización
export interface SanitizationDecompressorRepository {
    sanitizationDecompressor(data: {
        type: string;
        data: any;
        options?: Record<string, any>;
    }): Promise<any>;
}

// Interfaz para el repositorio de hashers de sanitización
export interface SanitizationHasherRepository {
    sanitizationHasher(data: {
        type: string;
        data: any;
        options?: Record<string, any>;
    }): Promise<string>;
}

// Interfaz para el repositorio de verificadores de sanitización
export interface SanitizationVerifierRepository {
    sanitizationVerifier(data: {
        type: string;
        data: any;
        options?: Record<string, any>;
    }): Promise<boolean>;
}

// Interfaz para el repositorio de firmadores de sanitización
export interface SanitizationSignerRepository {
    sanitizationSigner(data: {
        type: string;
        data: any;
        options?: Record<string, any>;
    }): Promise<string>;
}

// Interfaz para el repositorio de verificadores de firma de sanitización
export interface SanitizationSignatureVerifierRepository {
    sanitizationSignatureVerifier(data: {
        type: string;
        data: any;
        options?: Record<string, any>;
    }): Promise<boolean>;
}

// Interfaz para el repositorio de encriptadores de sanitización
export interface SanitizationEncryptorRepository {
    sanitizationEncryptor(data: {
        type: string;
        data: any;
        options?: Record<string, any>;
    }): Promise<string>;
}

// Interfaz para el repositorio de desencriptadores de sanitización
export interface SanitizationDecryptorRepository {
    sanitizationDecryptor(data: {
        type: string;
        data: any;
        options?: Record<string, any>;
    }): Promise<any>;
}

// Interfaz para el repositorio de tokenizadores de sanitización
export interface SanitizationTokenizerRepository {
    sanitizationTokenizer(data: {
        type: string;
        data: any;
        options?: Record<string, any>;
    }): Promise<string>;
}

// Interfaz para el repositorio de detokenizadores de sanitización
export interface SanitizationDetokenizerRepository {
    sanitizationDetokenizer(data: {
        type: string;
        data: any;
        options?: Record<string, any>;
    }): Promise<any>;
}
