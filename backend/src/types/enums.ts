export enum UserRole {
    ADMIN = 'ADMIN',
    USER = 'USER',
    OPERATOR = 'OPERATOR',
    VIEWER = 'VIEWER'
}

export enum SessionType {
    ROUTINE = 'ROUTINE',
    MAINTENANCE = 'MAINTENANCE',
    EMERGENCY = 'EMERGENCY',
    TEST = 'TEST',
    TRAINING = 'TRAINING'
}

export enum EventSeverity {
    INFO = 'INFO',
    WARNING = 'WARNING',
    CRITICAL = 'CRITICAL'
}

export enum EventType {
    STABILITY = 'STABILITY',
    CAN = 'CAN',
    GPS = 'GPS',
    COMBINED = 'COMBINED',
    SYSTEM = 'SYSTEM',
    MAINTENANCE = 'MAINTENANCE'
}

export enum AuditActionType {
    FILE_UPLOAD = 'FILE_UPLOAD',
    FILE_DELETE = 'FILE_DELETE',
    USER_LOGIN = 'USER_LOGIN',
    USER_LOGOUT = 'USER_LOGOUT',
    USER_CREATE = 'USER_CREATE',
    USER_UPDATE = 'USER_UPDATE',
    USER_DELETE = 'USER_DELETE',
    ACCESS_DENIED = 'ACCESS_DENIED',
    SYSTEM_ERROR = 'SYSTEM_ERROR'
}

export enum VehicleType {
    TRUCK = 'TRUCK',
    VAN = 'VAN',
    CAR = 'CAR',
    BUS = 'BUS',
    MOTORCYCLE = 'MOTORCYCLE',
    OTHER = 'OTHER'
}

export enum VehicleStatus {
    ACTIVE = 'ACTIVE',
    MAINTENANCE = 'MAINTENANCE',
    INACTIVE = 'INACTIVE',
    REPAIR = 'REPAIR'
}

export enum SessionStatus {
    ACTIVE = 'ACTIVE',
    PAUSED = 'PAUSED',
    COMPLETED = 'COMPLETED',
    ERROR = 'ERROR',
    CANCELLED = 'CANCELLED'
}

export enum EventStatus {
    ACTIVE = 'ACTIVE',
    ACKNOWLEDGED = 'ACKNOWLEDGED',
    RESOLVED = 'RESOLVED',
    EXPIRED = 'EXPIRED'
}

export enum EventConditionType {
    STABILITY = 'STABILITY',
    CAN = 'CAN',
    GPS = 'GPS',
    COMBINED = 'COMBINED'
}

export enum EventConditionOperator {
    EQUALS = 'EQUALS',
    NOT_EQUALS = 'NOT_EQUALS',
    GREATER_THAN = 'GREATER_THAN',
    LESS_THAN = 'LESS_THAN',
    GREATER_EQUALS = 'GREATER_EQUALS',
    LESS_EQUALS = 'LESS_EQUALS',
    BETWEEN = 'BETWEEN',
    IN_RANGE = 'IN_RANGE'
}

export enum EventLogicOperator {
    AND = 'AND',
    OR = 'OR'
}

export enum NotificationType {
    EVENT = 'EVENT',
    SYSTEM = 'SYSTEM',
    MAINTENANCE = 'MAINTENANCE',
    ALERT = 'ALERT'
}

export enum NotificationStatus {
    PENDING = 'PENDING',
    SENT = 'SENT',
    DELIVERED = 'DELIVERED',
    READ = 'READ',
    FAILED = 'FAILED'
}

export enum NotificationChannel {
    EMAIL = 'EMAIL',
    PUSH = 'PUSH',
    IN_APP = 'IN_APP',
    SMS = 'SMS'
}

export enum ReportType {
    STABILITY = 'STABILITY',
    CAN_GPS = 'CAN_GPS',
    AI = 'AI',
    EVENT = 'EVENT',
    COMPARATIVE = 'COMPARATIVE',
    TRENDS = 'TRENDS',
    MAINTENANCE = 'MAINTENANCE'
}

export enum ReportFormat {
    PDF = 'PDF',
    EXCEL = 'EXCEL',
    CSV = 'CSV',
    JSON = 'JSON'
}

export enum ReportSchedule {
    DAILY = 'DAILY',
    WEEKLY = 'WEEKLY',
    MONTHLY = 'MONTHLY',
    CUSTOM = 'CUSTOM'
}

export enum MaintenanceType {
    PREVENTIVE = 'PREVENTIVE',
    CORRECTIVE = 'CORRECTIVE',
    PREDICTIVE = 'PREDICTIVE'
}

export enum MaintenanceStatus {
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED'
}

export enum MaintenancePriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL'
}

export enum CalibrationStatus {
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED'
}

export enum DataValidationStatus {
    VALID = 'VALID',
    INVALID = 'INVALID',
    WARNING = 'WARNING'
}

export enum NotificationPriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL'
}

export enum AuditAction {
    CREATE = 'CREATE',
    READ = 'READ',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
    LOGIN = 'LOGIN',
    LOGOUT = 'LOGOUT',
    EXPORT = 'EXPORT',
    IMPORT = 'IMPORT'
}

export enum AuditStatus {
    SUCCESS = 'SUCCESS',
    FAILURE = 'FAILURE',
    WARNING = 'WARNING'
}

export enum FileType {
    CSV = 'CSV',
    JSON = 'JSON',
    PDF = 'PDF',
    EXCEL = 'EXCEL'
}

export enum RiskLevel {
    CRITICAL = 'CRITICAL',
    HIGH = 'HIGH',
    MEDIUM = 'MEDIUM',
    LOW = 'LOW',
    NONE = 'NONE'
}

export enum PermissionLevel {
    READ = 'READ',
    WRITE = 'WRITE',
    ADMIN = 'ADMIN',
    NONE = 'NONE'
}

export enum ValidationErrorType {
    REQUIRED = 'REQUIRED',
    INVALID_FORMAT = 'INVALID_FORMAT',
    OUT_OF_RANGE = 'OUT_OF_RANGE',
    DUPLICATE = 'DUPLICATE',
    NOT_FOUND = 'NOT_FOUND',
    UNAUTHORIZED = 'UNAUTHORIZED',
    FORBIDDEN = 'FORBIDDEN'
}

export enum DataSource {
    SENSOR = 'SENSOR',
    MANUAL = 'MANUAL',
    CALCULATED = 'CALCULATED',
    IMPORTED = 'IMPORTED'
}

export enum DataUnit {
    METERS = 'METERS',
    KILOMETERS = 'KILOMETERS',
    SECONDS = 'SECONDS',
    MINUTES = 'MINUTES',
    HOURS = 'HOURS',
    DEGREES = 'DEGREES',
    RADIANS = 'RADIANS',
    METERS_PER_SECOND = 'METERS_PER_SECOND',
    KILOMETERS_PER_HOUR = 'KILOMETERS_PER_HOUR',
    METERS_PER_SECOND_SQUARED = 'METERS_PER_SECOND_SQUARED',
    GRAVITY = 'GRAVITY',
    PERCENTAGE = 'PERCENTAGE',
    RATIO = 'RATIO'
}

export enum DataFormat {
    JSON = 'JSON',
    CSV = 'CSV',
    XML = 'XML',
    BINARY = 'BINARY'
}

export enum DataStatus {
    VALID = 'VALID',
    INVALID = 'INVALID',
    PENDING = 'PENDING',
    PROCESSED = 'PROCESSED',
    ARCHIVED = 'ARCHIVED'
}

export enum ApiErrorCode {
    BAD_REQUEST = 'BAD_REQUEST',
    UNAUTHORIZED = 'UNAUTHORIZED',
    FORBIDDEN = 'FORBIDDEN',
    NOT_FOUND = 'NOT_FOUND',
    CONFLICT = 'CONFLICT',
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE'
}

export enum LogLevel {
    ERROR = 'ERROR',
    WARN = 'WARN',
    INFO = 'INFO',
    DEBUG = 'DEBUG',
    TRACE = 'TRACE'
}

export enum CacheStrategy {
    NONE = 'NONE',
    MEMORY = 'MEMORY',
    REDIS = 'REDIS',
    HYBRID = 'HYBRID'
}

export enum QueuePriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL'
}

export enum TaskStatus {
    PENDING = 'PENDING',
    RUNNING = 'RUNNING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    CANCELLED = 'CANCELLED'
}

export enum MetricType {
    COUNTER = 'COUNTER',
    GAUGE = 'GAUGE',
    HISTOGRAM = 'HISTOGRAM',
    SUMMARY = 'SUMMARY'
}

export enum AlertType {
    THRESHOLD = 'THRESHOLD',
    ANOMALY = 'ANOMALY',
    TREND = 'TREND',
    PATTERN = 'PATTERN'
}

export enum AlertStatus {
    ACTIVE = 'ACTIVE',
    RESOLVED = 'RESOLVED',
    IGNORED = 'IGNORED',
    EXPIRED = 'EXPIRED'
}

export enum BackupType {
    FULL = 'FULL',
    INCREMENTAL = 'INCREMENTAL',
    DIFFERENTIAL = 'DIFFERENTIAL'
}

export enum BackupStatus {
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED'
}

export enum SyncStatus {
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    CONFLICT = 'CONFLICT'
}

export enum SyncDirection {
    UP = 'UP',
    DOWN = 'DOWN',
    BIDIRECTIONAL = 'BIDIRECTIONAL'
}

export enum SyncStrategy {
    FULL = 'FULL',
    INCREMENTAL = 'INCREMENTAL',
    DIFFERENTIAL = 'DIFFERENTIAL'
}

export enum UpdateType {
    SECURITY = 'SECURITY',
    FEATURE = 'FEATURE',
    BUGFIX = 'BUGFIX',
    MAINTENANCE = 'MAINTENANCE'
}

export enum UpdateStatus {
    AVAILABLE = 'AVAILABLE',
    DOWNLOADING = 'DOWNLOADING',
    INSTALLING = 'INSTALLING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED'
}

export enum UpdatePriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL'
}

export enum DiagnosticType {
    SYSTEM = 'SYSTEM',
    NETWORK = 'NETWORK',
    DATABASE = 'DATABASE',
    APPLICATION = 'APPLICATION'
}

export enum DiagnosticStatus {
    HEALTHY = 'HEALTHY',
    WARNING = 'WARNING',
    ERROR = 'ERROR',
    CRITICAL = 'CRITICAL'
}

export enum MonitoringType {
    SYSTEM = 'SYSTEM',
    NETWORK = 'NETWORK',
    DATABASE = 'DATABASE',
    APPLICATION = 'APPLICATION'
}

export enum MonitoringStatus {
    ACTIVE = 'ACTIVE',
    PAUSED = 'PAUSED',
    STOPPED = 'STOPPED',
    ERROR = 'ERROR'
}

export enum MetricStatus {
    NORMAL = 'NORMAL',
    WARNING = 'WARNING',
    CRITICAL = 'CRITICAL',
    UNKNOWN = 'UNKNOWN'
}

export enum LogType {
    ERROR = 'ERROR',
    WARNING = 'WARNING',
    INFO = 'INFO',
    DEBUG = 'DEBUG',
    AUDIT = 'AUDIT'
}

export enum TraceType {
    REQUEST = 'REQUEST',
    DATABASE = 'DATABASE',
    CACHE = 'CACHE',
    QUEUE = 'QUEUE'
}

export enum SpanType {
    HTTP = 'HTTP',
    DATABASE = 'DATABASE',
    CACHE = 'CACHE',
    QUEUE = 'QUEUE'
}

export enum BagType {
    REQUEST = 'REQUEST',
    RESPONSE = 'RESPONSE',
    ERROR = 'ERROR',
    DEBUG = 'DEBUG'
}

export enum TagType {
    SYSTEM = 'SYSTEM',
    USER = 'USER',
    AUTO = 'AUTO',
    CUSTOM = 'CUSTOM'
}

export enum AnnotationType {
    MARKER = 'MARKER',
    COMMENT = 'COMMENT',
    LINK = 'LINK',
    CUSTOM = 'CUSTOM'
}

export enum MessageType {
    INFO = 'INFO',
    WARNING = 'WARNING',
    ERROR = 'ERROR',
    SUCCESS = 'SUCCESS'
}

export enum SubscriptionType {
    EMAIL = 'EMAIL',
    SMS = 'SMS',
    PUSH = 'PUSH',
    WEBHOOK = 'WEBHOOK'
}

export enum PublishType {
    DIRECT = 'DIRECT',
    FANOUT = 'FANOUT',
    TOPIC = 'TOPIC',
    QUEUE = 'QUEUE'
}

export enum QueryType {
    SELECT = 'SELECT',
    INSERT = 'INSERT',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE'
}

export enum ExecuteType {
    SYNC = 'SYNC',
    ASYNC = 'ASYNC',
    BATCH = 'BATCH',
    STREAM = 'STREAM'
}

export enum TransactionType {
    READ = 'READ',
    WRITE = 'WRITE',
    READ_WRITE = 'READ_WRITE'
}

export enum TransactionStatus {
    PENDING = 'PENDING',
    COMMITTED = 'COMMITTED',
    ROLLED_BACK = 'ROLLED_BACK',
    FAILED = 'FAILED'
}

export enum MigrationType {
    UP = 'UP',
    DOWN = 'DOWN',
    REFRESH = 'REFRESH',
    RESET = 'RESET'
}

export enum MigrationStatus {
    PENDING = 'PENDING',
    RUNNING = 'RUNNING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED'
}

export enum SeedType {
    TEST = 'TEST',
    DEMO = 'DEMO',
    PRODUCTION = 'PRODUCTION'
}

export enum SeedStatus {
    PENDING = 'PENDING',
    RUNNING = 'RUNNING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED'
}

export enum FixtureType {
    TEST = 'TEST',
    DEMO = 'DEMO',
    PRODUCTION = 'PRODUCTION'
}

export enum FixtureStatus {
    PENDING = 'PENDING',
    RUNNING = 'RUNNING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED'
}

export enum FactoryType {
    TEST = 'TEST',
    DEMO = 'DEMO',
    PRODUCTION = 'PRODUCTION'
}

export enum FactoryStatus {
    PENDING = 'PENDING',
    RUNNING = 'RUNNING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED'
}

export enum SeederType {
    TEST = 'TEST',
    DEMO = 'DEMO',
    PRODUCTION = 'PRODUCTION'
}

export enum SeederStatus {
    PENDING = 'PENDING',
    RUNNING = 'RUNNING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED'
}

export enum FakerType {
    TEST = 'TEST',
    DEMO = 'DEMO',
    PRODUCTION = 'PRODUCTION'
}

export enum FakerStatus {
    PENDING = 'PENDING',
    RUNNING = 'RUNNING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED'
}

export enum GeneratorType {
    TEST = 'TEST',
    DEMO = 'DEMO',
    PRODUCTION = 'PRODUCTION'
}

export enum GeneratorStatus {
    PENDING = 'PENDING',
    RUNNING = 'RUNNING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED'
}

export enum ValidatorType {
    SCHEMA = 'SCHEMA',
    RULE = 'RULE',
    CUSTOM = 'CUSTOM'
}

export enum ValidatorStatus {
    VALID = 'VALID',
    INVALID = 'INVALID',
    ERROR = 'ERROR'
}

export enum TransformerType {
    FORMAT = 'FORMAT',
    STRUCTURE = 'STRUCTURE',
    CUSTOM = 'CUSTOM'
}

export enum TransformerStatus {
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    ERROR = 'ERROR'
}

export enum SerializerType {
    JSON = 'JSON',
    XML = 'XML',
    BINARY = 'BINARY'
}

export enum SerializerStatus {
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    ERROR = 'ERROR'
}

export enum DeserializerType {
    JSON = 'JSON',
    XML = 'XML',
    BINARY = 'BINARY'
}

export enum DeserializerStatus {
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    ERROR = 'ERROR'
}

export enum NormalizerType {
    DATA = 'DATA',
    SCHEMA = 'SCHEMA',
    CUSTOM = 'CUSTOM'
}

export enum NormalizerStatus {
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    ERROR = 'ERROR'
}

export enum DenormalizerType {
    DATA = 'DATA',
    SCHEMA = 'SCHEMA',
    CUSTOM = 'CUSTOM'
}

export enum DenormalizerStatus {
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    ERROR = 'ERROR'
}

export enum FormatterType {
    TEXT = 'TEXT',
    DATE = 'DATE',
    NUMBER = 'NUMBER'
}

export enum FormatterStatus {
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    ERROR = 'ERROR'
}

export enum ParserType {
    TEXT = 'TEXT',
    DATE = 'DATE',
    NUMBER = 'NUMBER'
}

export enum ParserStatus {
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    ERROR = 'ERROR'
}

export enum EncoderType {
    BASE64 = 'BASE64',
    HEX = 'HEX',
    BINARY = 'BINARY'
}

export enum EncoderStatus {
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    ERROR = 'ERROR'
}

export enum DecoderType {
    BASE64 = 'BASE64',
    HEX = 'HEX',
    BINARY = 'BINARY'
}

export enum DecoderStatus {
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    ERROR = 'ERROR'
}

export enum CompressorType {
    GZIP = 'GZIP',
    ZIP = 'ZIP',
    CUSTOM = 'CUSTOM'
}

export enum CompressorStatus {
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    ERROR = 'ERROR'
}

export enum DecompressorType {
    GZIP = 'GZIP',
    ZIP = 'ZIP',
    CUSTOM = 'CUSTOM'
}

export enum DecompressorStatus {
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    ERROR = 'ERROR'
}

export enum HasherType {
    MD5 = 'MD5',
    SHA1 = 'SHA1',
    SHA256 = 'SHA256'
}

export enum HasherStatus {
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    ERROR = 'ERROR'
}

export enum VerifierType {
    HASH = 'HASH',
    SIGNATURE = 'SIGNATURE',
    CUSTOM = 'CUSTOM'
}

export enum VerifierStatus {
    VALID = 'VALID',
    INVALID = 'INVALID',
    ERROR = 'ERROR'
}

export enum SignerType {
    RSA = 'RSA',
    DSA = 'DSA',
    ECDSA = 'ECDSA'
}

export enum SignerStatus {
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    ERROR = 'ERROR'
}

export enum SignatureVerifierType {
    RSA = 'RSA',
    DSA = 'DSA',
    ECDSA = 'ECDSA'
}

export enum SignatureVerifierStatus {
    VALID = 'VALID',
    INVALID = 'INVALID',
    ERROR = 'ERROR'
}

export enum EncryptorType {
    AES = 'AES',
    RSA = 'RSA',
    CUSTOM = 'CUSTOM'
}

export enum EncryptorStatus {
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    ERROR = 'ERROR'
}

export enum DecryptorType {
    AES = 'AES',
    RSA = 'RSA',
    CUSTOM = 'CUSTOM'
}

export enum DecryptorStatus {
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    ERROR = 'ERROR'
}

export enum TokenizerType {
    JWT = 'JWT',
    OAUTH = 'OAUTH',
    CUSTOM = 'CUSTOM'
}

export enum TokenizerStatus {
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    ERROR = 'ERROR'
}

export enum DetokenizerType {
    JWT = 'JWT',
    OAUTH = 'OAUTH',
    CUSTOM = 'CUSTOM'
}

export enum DetokenizerStatus {
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    ERROR = 'ERROR'
}

export enum SanitizerType {
    HTML = 'HTML',
    SQL = 'SQL',
    CUSTOM = 'CUSTOM'
}

export enum SanitizerStatus {
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    ERROR = 'ERROR'
}

export enum SanitizationValidatorType {
    HTML = 'HTML',
    SQL = 'SQL',
    CUSTOM = 'CUSTOM'
}

export enum SanitizationValidatorStatus {
    VALID = 'VALID',
    INVALID = 'INVALID',
    ERROR = 'ERROR'
}

export enum SanitizationNormalizerType {
    HTML = 'HTML',
    SQL = 'SQL',
    CUSTOM = 'CUSTOM'
}

export enum SanitizationNormalizerStatus {
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    ERROR = 'ERROR'
}

export enum SanitizationFormatterType {
    HTML = 'HTML',
    SQL = 'SQL',
    CUSTOM = 'CUSTOM'
}

export enum SanitizationFormatterStatus {
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    ERROR = 'ERROR'
}

export enum SanitizationParserType {
    HTML = 'HTML',
    SQL = 'SQL',
    CUSTOM = 'CUSTOM'
}

export enum SanitizationParserStatus {
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    ERROR = 'ERROR'
}

export enum SanitizationEncoderType {
    HTML = 'HTML',
    SQL = 'SQL',
    CUSTOM = 'CUSTOM'
}

export enum SanitizationEncoderStatus {
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    ERROR = 'ERROR'
}

export enum SanitizationDecoderType {
    HTML = 'HTML',
    SQL = 'SQL',
    CUSTOM = 'CUSTOM'
}

export enum SanitizationDecoderStatus {
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    ERROR = 'ERROR'
}

export enum SanitizationCompressorType {
    HTML = 'HTML',
    SQL = 'SQL',
    CUSTOM = 'CUSTOM'
}

export enum SanitizationCompressorStatus {
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    ERROR = 'ERROR'
}

export enum SanitizationDecompressorType {
    HTML = 'HTML',
    SQL = 'SQL',
    CUSTOM = 'CUSTOM'
}

export enum SanitizationDecompressorStatus {
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    ERROR = 'ERROR'
}

export enum SanitizationHasherType {
    HTML = 'HTML',
    SQL = 'SQL',
    CUSTOM = 'CUSTOM'
}

export enum SanitizationHasherStatus {
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    ERROR = 'ERROR'
}

export enum SanitizationVerifierType {
    HTML = 'HTML',
    SQL = 'SQL',
    CUSTOM = 'CUSTOM'
}

export enum SanitizationVerifierStatus {
    VALID = 'VALID',
    INVALID = 'INVALID',
    ERROR = 'ERROR'
}

export enum SanitizationSignerType {
    HTML = 'HTML',
    SQL = 'SQL',
    CUSTOM = 'CUSTOM'
}

export enum SanitizationSignerStatus {
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    ERROR = 'ERROR'
}

export enum SanitizationSignatureVerifierType {
    HTML = 'HTML',
    SQL = 'SQL',
    CUSTOM = 'CUSTOM'
}

export enum SanitizationSignatureVerifierStatus {
    VALID = 'VALID',
    INVALID = 'INVALID',
    ERROR = 'ERROR'
}
