import { UserRole } from './auth';
import { VehicleStatus, VehicleType } from './enums';

// Interfaz para la respuesta de la API
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

// Interfaz para la respuesta paginada de la API
export interface ApiPaginatedResponse<T> {
    success: boolean;
    data: {
        items: T[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
    error?: string;
    message?: string;
}

// Interfaz para la respuesta de error de la API
export interface ApiErrorResponse {
    success: false;
    error: string;
    message?: string;
    details?: any;
}

// Interfaz para la respuesta de éxito de la API
export interface ApiSuccessResponse<T> {
    success: true;
    data: T;
    message?: string;
}

// Interfaz para la solicitud de autenticación
export interface AuthRequest {
    email: string;
    password: string;
}

// Interfaz para la respuesta de autenticación
export interface AuthResponse {
    token: string;
    refreshToken: string;
    user: {
        id: number;
        email: string;
        name: string;
        role: UserRole;
        organizationId: number;
    };
}

// Interfaz para la solicitud de registro
export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
    organizationName: string;
}

// Interfaz para la solicitud de actualización de perfil
export interface UpdateProfileRequest {
    name?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
}

// Interfaz para la solicitud de creación de organización
export interface CreateOrganizationRequest {
    name: string;
    description: string;
}

// Interfaz para la solicitud de actualización de organización
export interface UpdateOrganizationRequest {
    name?: string;
    description?: string;
}

// Interfaz para la solicitud de creación de vehículo
export interface CreateVehicleRequest {
    name: string;
    model: string;
    plateNumber: string;
    type: VehicleType;
    status: VehicleStatus;
}

// Interfaz para la solicitud de actualización de vehículo
export interface UpdateVehicleRequest {
    name?: string;
    model?: string;
    plateNumber?: string;
    type?: VehicleType;
    status?: VehicleStatus;
}

// Interfaz para la solicitud de creación de sesión
export interface CreateSessionRequest {
    vehicleId: number;
}

// Interfaz para la solicitud de actualización de sesión
export interface UpdateSessionRequest {
    status?: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    endTime?: Date;
}

// Interfaz para la solicitud de creación de evento
export interface CreateEventRequest {
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    vehicleId: number;
}

// Interfaz para la solicitud de creación de telemetría
export interface CreateTelemetryRequest {
    latitude: number;
    longitude: number;
    speed: number;
    acceleration: number;
    temperature: number;
    batteryLevel: number;
    sessionId: number;
    vehicleId: number;
}

// Interfaz para la solicitud de creación de regla
export interface CreateRuleRequest {
    name: string;
    description: string;
    metric: 'ltr' | 'speed' | 'acceleration' | 'temperature' | 'batteryLevel';
    threshold: number;
    condition: '>' | '<' | '>=' | '<=' | '==' | '!=';
    action: string;
    vehicleId?: number;
}

// Interfaz para la solicitud de actualización de regla
export interface UpdateRuleRequest {
    name?: string;
    description?: string;
    metric?: 'ltr' | 'speed' | 'acceleration' | 'temperature' | 'batteryLevel';
    threshold?: number;
    condition?: '>' | '<' | '>=' | '<=' | '==' | '!=';
    action?: string;
    isActive?: boolean;
}

// Interfaz para la solicitud de creación de alarma
export interface CreateAlarmRequest {
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    ruleId: number;
    vehicleId: number;
}

// Interfaz para la solicitud de actualización de alarma
export interface UpdateAlarmRequest {
    status?: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
}

// Interfaz para la solicitud de creación de mantenimiento
export interface CreateMaintenanceRequest {
    type: 'PREVENTIVE' | 'CORRECTIVE' | 'PREDICTIVE';
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    scheduledDate: Date;
    vehicleId: number;
    assignedTo?: number;
}

// Interfaz para la solicitud de actualización de mantenimiento
export interface UpdateMaintenanceRequest {
    status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    description?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    scheduledDate?: Date;
    completedDate?: Date;
    assignedTo?: number;
}

// Interfaz para la solicitud de creación de registro de auditoría
export interface CreateAuditLogRequest {
    action: string;
    entity: string;
    entityId: number;
    details?: any;
}

// Interfaz para la solicitud de búsqueda
export interface SearchRequest {
    query: string;
    filters?: Record<string, any>;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

// Interfaz para la solicitud de exportación
export interface ExportRequest {
    format: 'csv' | 'excel' | 'pdf';
    filters?: Record<string, any>;
    fields?: string[];
}

// Interfaz para la solicitud de importación
export interface ImportRequest {
    format: 'csv' | 'excel';
    file: File;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de notificación
export interface NotificationRequest {
    type: 'email' | 'sms' | 'push';
    recipient: string;
    subject: string;
    message: string;
    data?: Record<string, any>;
}

// Interfaz para la solicitud de reporte
export interface ReportRequest {
    type: string;
    startDate: Date;
    endDate: Date;
    filters?: Record<string, any>;
    format?: 'csv' | 'excel' | 'pdf';
}

// Interfaz para la solicitud de configuración
export interface ConfigRequest {
    key: string;
    value: any;
    description?: string;
}

// Interfaz para la solicitud de validación
export interface ValidationRequest {
    data: any;
    rules: Record<string, any>;
}

// Interfaz para la solicitud de caché
export interface CacheRequest {
    key: string;
    value?: any;
    ttl?: number;
}

// Interfaz para la solicitud de limpieza de caché
export interface CacheClearRequest {
    pattern?: string;
}

// Interfaz para la solicitud de backup
export interface BackupRequest {
    type: 'full' | 'incremental';
    destination: string;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de restauración
export interface RestoreRequest {
    source: string;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de sincronización
export interface SyncRequest {
    type: 'push' | 'pull' | 'both';
    options?: Record<string, any>;
}

// Interfaz para la solicitud de actualización
export interface UpdateRequest {
    type: 'system' | 'application' | 'database';
    version: string;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de diagnóstico
export interface DiagnosticRequest {
    type: 'system' | 'application' | 'database' | 'network';
    options?: Record<string, any>;
}

// Interfaz para la solicitud de monitoreo
export interface MonitoringRequest {
    type: 'performance' | 'health' | 'security' | 'usage';
    options?: Record<string, any>;
}

// Interfaz para la solicitud de alerta
export interface AlertRequest {
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    data?: Record<string, any>;
}

// Interfaz para la solicitud de métrica
export interface MetricRequest {
    name: string;
    value: number;
    tags?: Record<string, string>;
    timestamp?: Date;
}

// Interfaz para la solicitud de log
export interface LogRequest {
    level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
    message: string;
    data?: Record<string, any>;
    timestamp?: Date;
}

// Interfaz para la solicitud de trace
export interface TraceRequest {
    name: string;
    data?: Record<string, any>;
    timestamp?: Date;
}

// Interfaz para la solicitud de span
export interface SpanRequest {
    name: string;
    parentId?: string;
    data?: Record<string, any>;
    timestamp?: Date;
}

// Interfaz para la solicitud de bag
export interface BagRequest {
    name: string;
    data: Record<string, any>;
    timestamp?: Date;
}

// Interfaz para la solicitud de tag
export interface TagRequest {
    name: string;
    value: string;
    timestamp?: Date;
}

// Interfaz para la solicitud de anotación
export interface AnnotationRequest {
    name: string;
    value: string;
    timestamp?: Date;
}

// Interfaz para la solicitud de evento
export interface EventRequest {
    name: string;
    data?: Record<string, any>;
    timestamp?: Date;
}

// Interfaz para la solicitud de mensaje
export interface MessageRequest {
    topic: string;
    payload: any;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de suscripción
export interface SubscriptionRequest {
    topic: string;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de publicación
export interface PublishRequest {
    topic: string;
    payload: any;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de consulta
export interface QueryRequest {
    query: string;
    params?: any[];
    options?: Record<string, any>;
}

// Interfaz para la solicitud de ejecución
export interface ExecuteRequest {
    sql: string;
    params?: any[];
    options?: Record<string, any>;
}

// Interfaz para la solicitud de transacción
export interface TransactionRequest {
    queries: {
        sql: string;
        params?: any[];
    }[];
    options?: Record<string, any>;
}

// Interfaz para la solicitud de migración
export interface MigrationRequest {
    name: string;
    up: string;
    down: string;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de seed
export interface SeedRequest {
    name: string;
    data: any[];
    options?: Record<string, any>;
}

// Interfaz para la solicitud de fixture
export interface FixtureRequest {
    name: string;
    data: any[];
    options?: Record<string, any>;
}

// Interfaz para la solicitud de factory
export interface FactoryRequest {
    name: string;
    count: number;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de seeder
export interface SeederRequest {
    name: string;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de faker
export interface FakerRequest {
    type: string;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de generador
export interface GeneratorRequest {
    type: string;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de validador
export interface ValidatorRequest {
    type: string;
    data: any;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de transformador
export interface TransformerRequest {
    type: string;
    data: any;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de serializador
export interface SerializerRequest {
    type: string;
    data: any;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de deserializador
export interface DeserializerRequest {
    type: string;
    data: any;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de normalizador
export interface NormalizerRequest {
    type: string;
    data: any;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de denormalizador
export interface DenormalizerRequest {
    type: string;
    data: any;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de formateador
export interface FormatterRequest {
    type: string;
    data: any;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de parser
export interface ParserRequest {
    type: string;
    data: any;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de encoder
export interface EncoderRequest {
    type: string;
    data: any;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de decoder
export interface DecoderRequest {
    type: string;
    data: any;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de compressor
export interface CompressorRequest {
    type: string;
    data: any;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de decompressor
export interface DecompressorRequest {
    type: string;
    data: any;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de hasher
export interface HasherRequest {
    type: string;
    data: any;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de verificador
export interface VerifierRequest {
    type: string;
    data: any;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de firmador
export interface SignerRequest {
    type: string;
    data: any;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de verificador de firma
export interface SignatureVerifierRequest {
    type: string;
    data: any;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de encriptador
export interface EncryptorRequest {
    type: string;
    data: any;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de desencriptador
export interface DecryptorRequest {
    type: string;
    data: any;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de tokenizador
export interface TokenizerRequest {
    type: string;
    data: any;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de detokenizador
export interface DetokenizerRequest {
    type: string;
    data: any;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de sanitizador
export interface SanitizerRequest {
    type: string;
    data: any;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de validador de sanitización
export interface SanitizationValidatorRequest {
    type: string;
    data: any;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de normalizador de sanitización
export interface SanitizationNormalizerRequest {
    type: string;
    data: any;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de formateador de sanitización
export interface SanitizationFormatterRequest {
    type: string;
    data: any;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de parser de sanitización
export interface SanitizationParserRequest {
    type: string;
    data: any;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de encoder de sanitización
export interface SanitizationEncoderRequest {
    type: string;
    data: any;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de decoder de sanitización
export interface SanitizationDecoderRequest {
    type: string;
    data: any;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de compressor de sanitización
export interface SanitizationCompressorRequest {
    type: string;
    data: any;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de decompressor de sanitización
export interface SanitizationDecompressorRequest {
    type: string;
    data: any;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de hasher de sanitización
export interface SanitizationHasherRequest {
    type: string;
    data: any;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de verificador de sanitización
export interface SanitizationVerifierRequest {
    type: string;
    data: any;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de firmador de sanitización
export interface SanitizationSignerRequest {
    type: string;
    data: any;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de verificador de firma de sanitización
export interface SanitizationSignatureVerifierRequest {
    type: string;
    data: any;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de encriptador de sanitización
export interface SanitizationEncryptorRequest {
    type: string;
    data: any;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de desencriptador de sanitización
export interface SanitizationDecryptorRequest {
    type: string;
    data: any;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de tokenizador de sanitización
export interface SanitizationTokenizerRequest {
    type: string;
    data: any;
    options?: Record<string, any>;
}

// Interfaz para la solicitud de detokenizador de sanitización
export interface SanitizationDetokenizerRequest {
    type: string;
    data: any;
    options?: Record<string, any>;
}
