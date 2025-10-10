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

// Interfaz para el servicio de autenticación
export interface AuthService {
    login(
        email: string,
        password: string
    ): Promise<{
        token: string;
        refreshToken: string;
        user: {
            id: number;
            email: string;
            name: string;
            role: UserRole;
            organizationId: number;
        };
    }>;
    register(data: {
        email: string;
        password: string;
        name: string;
        organizationName: string;
    }): Promise<{
        token: string;
        refreshToken: string;
        user: {
            id: number;
            email: string;
            name: string;
            role: UserRole;
            organizationId: number;
        };
    }>;
    refreshToken(token: string): Promise<{
        token: string;
        refreshToken: string;
    }>;
    logout(token: string): Promise<void>;
    verifyToken(token: string): Promise<{
        id: number;
        email: string;
        name: string;
        role: UserRole;
        organizationId: number;
    }>;
}

// Interfaz para el servicio de usuarios
export interface UserService {
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

// Interfaz para el servicio de organizaciones
export interface OrganizationService {
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

// Interfaz para el servicio de vehículos
export interface VehicleService {
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

// Interfaz para el servicio de sesiones
export interface SessionService {
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

// Interfaz para el servicio de eventos
export interface EventService {
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

// Interfaz para el servicio de telemetría
export interface TelemetryService {
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

// Interfaz para el servicio de reglas
export interface RuleService {
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

// Interfaz para el servicio de alarmas
export interface AlarmService {
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

// Interfaz para el servicio de mantenimiento
export interface MaintenanceService {
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

// Interfaz para el servicio de auditoría
export interface AuditService {
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

// Interfaz para el servicio de notificaciones
export interface NotificationService {
    send(data: {
        type: 'email' | 'sms' | 'push';
        recipient: string;
        subject: string;
        message: string;
        data?: Record<string, any>;
    }): Promise<void>;
}

// Interfaz para el servicio de reportes
export interface ReportService {
    generate(data: {
        type: string;
        startDate: Date;
        endDate: Date;
        filters?: Record<string, any>;
        format?: 'csv' | 'excel' | 'pdf';
    }): Promise<{
        url: string;
        format: 'csv' | 'excel' | 'pdf';
    }>;
}

// Interfaz para el servicio de configuración
export interface ConfigService {
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

// Interfaz para el servicio de validación
export interface ValidationService {
    validate(
        data: any,
        rules: Record<string, any>
    ): Promise<{
        isValid: boolean;
        errors?: Record<string, string[]>;
    }>;
}

// Interfaz para el servicio de caché
export interface CacheService {
    get(key: string): Promise<any>;
    set(key: string, value: any, ttl?: number): Promise<void>;
    delete(key: string): Promise<void>;
    clear(pattern?: string): Promise<void>;
}

// Interfaz para el servicio de backup
export interface BackupService {
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

// Interfaz para el servicio de sincronización
export interface SyncService {
    sync(data: { type: 'push' | 'pull' | 'both'; options?: Record<string, any> }): Promise<void>;
}

// Interfaz para el servicio de actualización
export interface UpdateService {
    update(data: {
        type: 'system' | 'application' | 'database';
        version: string;
        options?: Record<string, any>;
    }): Promise<void>;
}

// Interfaz para el servicio de diagnóstico
export interface DiagnosticService {
    diagnose(data: {
        type: 'system' | 'application' | 'database' | 'network';
        options?: Record<string, any>;
    }): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        details: Record<string, any>;
    }>;
}

// Interfaz para el servicio de monitoreo
export interface MonitoringService {
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

// Interfaz para el servicio de alertas
export interface AlertService {
    create(data: {
        type: string;
        severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        message: string;
        data?: Record<string, any>;
    }): Promise<void>;
}

// Interfaz para el servicio de métricas
export interface MetricService {
    record(data: {
        name: string;
        value: number;
        tags?: Record<string, string>;
        timestamp?: Date;
    }): Promise<void>;
}

// Interfaz para el servicio de logs
export interface LogService {
    log(data: {
        level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
        message: string;
        data?: Record<string, any>;
        timestamp?: Date;
    }): Promise<void>;
}

// Interfaz para el servicio de traces
export interface TraceService {
    trace(data: { name: string; data?: Record<string, any>; timestamp?: Date }): Promise<void>;
}

// Interfaz para el servicio de spans
export interface SpanService {
    span(data: {
        name: string;
        parentId?: string;
        data?: Record<string, any>;
        timestamp?: Date;
    }): Promise<void>;
}

// Interfaz para el servicio de bags
export interface BagService {
    bag(data: { name: string; data: Record<string, any>; timestamp?: Date }): Promise<void>;
}

// Interfaz para el servicio de tags
export interface TagService {
    tag(data: { name: string; value: string; timestamp?: Date }): Promise<void>;
}

// Interfaz para el servicio de anotaciones
export interface AnnotationService {
    annotate(data: { name: string; value: string; timestamp?: Date }): Promise<void>;
}

// Interfaz para el servicio de eventos
export interface EventService {
    event(data: { name: string; data?: Record<string, any>; timestamp?: Date }): Promise<void>;
}

// Interfaz para el servicio de mensajes
export interface MessageService {
    publish(data: { topic: string; payload: any; options?: Record<string, any> }): Promise<void>;
    subscribe(data: { topic: string; options?: Record<string, any> }): Promise<void>;
}

// Interfaz para el servicio de consultas
export interface QueryService {
    query(data: { query: string; params?: any[]; options?: Record<string, any> }): Promise<any[]>;
}

// Interfaz para el servicio de ejecución
export interface ExecuteService {
    execute(data: { sql: string; params?: any[]; options?: Record<string, any> }): Promise<void>;
}

// Interfaz para el servicio de transacciones
export interface TransactionService {
    transaction(data: {
        queries: {
            sql: string;
            params?: any[];
        }[];
        options?: Record<string, any>;
    }): Promise<void>;
}

// Interfaz para el servicio de migraciones
export interface MigrationService {
    migrate(data: {
        name: string;
        up: string;
        down: string;
        options?: Record<string, any>;
    }): Promise<void>;
}

// Interfaz para el servicio de seeds
export interface SeedService {
    seed(data: { name: string; data: any[]; options?: Record<string, any> }): Promise<void>;
}

// Interfaz para el servicio de fixtures
export interface FixtureService {
    fixture(data: { name: string; data: any[]; options?: Record<string, any> }): Promise<void>;
}

// Interfaz para el servicio de factories
export interface FactoryService {
    factory(data: { name: string; count: number; options?: Record<string, any> }): Promise<any[]>;
}

// Interfaz para el servicio de seeders
export interface SeederService {
    seeder(data: { name: string; options?: Record<string, any> }): Promise<void>;
}

// Interfaz para el servicio de fakers
export interface FakerService {
    faker(data: { type: string; options?: Record<string, any> }): Promise<any>;
}

// Interfaz para el servicio de generadores
export interface GeneratorService {
    generator(data: { type: string; options?: Record<string, any> }): Promise<any>;
}

// Interfaz para el servicio de validadores
export interface ValidatorService {
    validator(data: { type: string; data: any; options?: Record<string, any> }): Promise<{
        isValid: boolean;
        errors?: Record<string, string[]>;
    }>;
}

// Interfaz para el servicio de transformadores
export interface TransformerService {
    transformer(data: { type: string; data: any; options?: Record<string, any> }): Promise<any>;
}

// Interfaz para el servicio de serializadores
export interface SerializerService {
    serializer(data: { type: string; data: any; options?: Record<string, any> }): Promise<any>;
}

// Interfaz para el servicio de deserializadores
export interface DeserializerService {
    deserializer(data: { type: string; data: any; options?: Record<string, any> }): Promise<any>;
}

// Interfaz para el servicio de normalizadores
export interface NormalizerService {
    normalizer(data: { type: string; data: any; options?: Record<string, any> }): Promise<any>;
}

// Interfaz para el servicio de denormalizadores
export interface DenormalizerService {
    denormalizer(data: { type: string; data: any; options?: Record<string, any> }): Promise<any>;
}

// Interfaz para el servicio de formateadores
export interface FormatterService {
    formatter(data: { type: string; data: any; options?: Record<string, any> }): Promise<any>;
}

// Interfaz para el servicio de parsers
export interface ParserService {
    parser(data: { type: string; data: any; options?: Record<string, any> }): Promise<any>;
}

// Interfaz para el servicio de encoders
export interface EncoderService {
    encoder(data: { type: string; data: any; options?: Record<string, any> }): Promise<any>;
}

// Interfaz para el servicio de decoders
export interface DecoderService {
    decoder(data: { type: string; data: any; options?: Record<string, any> }): Promise<any>;
}

// Interfaz para el servicio de compressors
export interface CompressorService {
    compressor(data: { type: string; data: any; options?: Record<string, any> }): Promise<any>;
}

// Interfaz para el servicio de decompressors
export interface DecompressorService {
    decompressor(data: { type: string; data: any; options?: Record<string, any> }): Promise<any>;
}

// Interfaz para el servicio de hashers
export interface HasherService {
    hasher(data: { type: string; data: any; options?: Record<string, any> }): Promise<string>;
}

// Interfaz para el servicio de verificadores
export interface VerifierService {
    verifier(data: { type: string; data: any; options?: Record<string, any> }): Promise<boolean>;
}

// Interfaz para el servicio de firmadores
export interface SignerService {
    signer(data: { type: string; data: any; options?: Record<string, any> }): Promise<string>;
}

// Interfaz para el servicio de verificadores de firma
export interface SignatureVerifierService {
    signatureVerifier(data: {
        type: string;
        data: any;
        options?: Record<string, any>;
    }): Promise<boolean>;
}

// Interfaz para el servicio de encriptadores
export interface EncryptorService {
    encryptor(data: { type: string; data: any; options?: Record<string, any> }): Promise<string>;
}

// Interfaz para el servicio de desencriptadores
export interface DecryptorService {
    decryptor(data: { type: string; data: any; options?: Record<string, any> }): Promise<any>;
}

// Interfaz para el servicio de tokenizadores
export interface TokenizerService {
    tokenizer(data: { type: string; data: any; options?: Record<string, any> }): Promise<string>;
}

// Interfaz para el servicio de detokenizadores
export interface DetokenizerService {
    detokenizer(data: { type: string; data: any; options?: Record<string, any> }): Promise<any>;
}

// Interfaz para el servicio de sanitizadores
export interface SanitizerService {
    sanitizer(data: { type: string; data: any; options?: Record<string, any> }): Promise<any>;
}

// Interfaz para el servicio de validadores de sanitización
export interface SanitizationValidatorService {
    sanitizationValidator(data: {
        type: string;
        data: any;
        options?: Record<string, any>;
    }): Promise<{
        isValid: boolean;
        errors?: Record<string, string[]>;
    }>;
}

// Interfaz para el servicio de normalizadores de sanitización
export interface SanitizationNormalizerService {
    sanitizationNormalizer(data: {
        type: string;
        data: any;
        options?: Record<string, any>;
    }): Promise<any>;
}

// Interfaz para el servicio de formateadores de sanitización
export interface SanitizationFormatterService {
    sanitizationFormatter(data: {
        type: string;
        data: any;
        options?: Record<string, any>;
    }): Promise<any>;
}

// Interfaz para el servicio de parsers de sanitización
export interface SanitizationParserService {
    sanitizationParser(data: {
        type: string;
        data: any;
        options?: Record<string, any>;
    }): Promise<any>;
}

// Interfaz para el servicio de encoders de sanitización
export interface SanitizationEncoderService {
    sanitizationEncoder(data: {
        type: string;
        data: any;
        options?: Record<string, any>;
    }): Promise<any>;
}

// Interfaz para el servicio de decoders de sanitización
export interface SanitizationDecoderService {
    sanitizationDecoder(data: {
        type: string;
        data: any;
        options?: Record<string, any>;
    }): Promise<any>;
}

// Interfaz para el servicio de compressors de sanitización
export interface SanitizationCompressorService {
    sanitizationCompressor(data: {
        type: string;
        data: any;
        options?: Record<string, any>;
    }): Promise<any>;
}

// Interfaz para el servicio de decompressors de sanitización
export interface SanitizationDecompressorService {
    sanitizationDecompressor(data: {
        type: string;
        data: any;
        options?: Record<string, any>;
    }): Promise<any>;
}

// Interfaz para el servicio de hashers de sanitización
export interface SanitizationHasherService {
    sanitizationHasher(data: {
        type: string;
        data: any;
        options?: Record<string, any>;
    }): Promise<string>;
}

// Interfaz para el servicio de verificadores de sanitización
export interface SanitizationVerifierService {
    sanitizationVerifier(data: {
        type: string;
        data: any;
        options?: Record<string, any>;
    }): Promise<boolean>;
}

// Interfaz para el servicio de firmadores de sanitización
export interface SanitizationSignerService {
    sanitizationSigner(data: {
        type: string;
        data: any;
        options?: Record<string, any>;
    }): Promise<string>;
}

// Interfaz para el servicio de verificadores de firma de sanitización
export interface SanitizationSignatureVerifierService {
    sanitizationSignatureVerifier(data: {
        type: string;
        data: any;
        options?: Record<string, any>;
    }): Promise<boolean>;
}

// Interfaz para el servicio de encriptadores de sanitización
export interface SanitizationEncryptorService {
    sanitizationEncryptor(data: {
        type: string;
        data: any;
        options?: Record<string, any>;
    }): Promise<string>;
}

// Interfaz para el servicio de desencriptadores de sanitización
export interface SanitizationDecryptorService {
    sanitizationDecryptor(data: {
        type: string;
        data: any;
        options?: Record<string, any>;
    }): Promise<any>;
}

// Interfaz para el servicio de tokenizadores de sanitización
export interface SanitizationTokenizerService {
    sanitizationTokenizer(data: {
        type: string;
        data: any;
        options?: Record<string, any>;
    }): Promise<string>;
}

// Interfaz para el servicio de detokenizadores de sanitización
export interface SanitizationDetokenizerService {
    sanitizationDetokenizer(data: {
        type: string;
        data: any;
        options?: Record<string, any>;
    }): Promise<any>;
}
