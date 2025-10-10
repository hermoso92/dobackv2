// DTOs para el módulo de Administración & Seguridad
export interface UserDTO {
    id: string;
    orgId: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'MANAGER' | 'OPERATOR';
    status: 'active' | 'inactive' | 'suspended';
    lastLoginAt?: string;
    createdAt: string;
    updatedAt: string;
    permissions: Permission[];
    metadata: UserMetadata;
}

export interface Permission {
    id: string;
    name: string;
    resource: string;
    action: string;
    conditions?: Record<string, any>;
    granted: boolean;
}

export interface UserMetadata {
    timezone: string;
    language: string;
    preferences: Record<string, any>;
    loginAttempts: number;
    lastFailedLogin?: string;
    mfaEnabled: boolean;
    sessionTimeout: number; // minutes
}

export interface OrganizationDTO {
    id: string;
    name: string;
    type: 'enterprise' | 'business' | 'startup';
    status: 'active' | 'inactive' | 'suspended';
    plan: 'basic' | 'professional' | 'enterprise';
    features: FeatureFlag[];
    limits: OrganizationLimits;
    billing: BillingInfo;
    createdAt: string;
    updatedAt: string;
    metadata: OrganizationMetadata;
}

export interface FeatureFlag {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    value?: any;
    conditions?: Record<string, any>;
    expiresAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface OrganizationLimits {
    maxUsers: number;
    maxVehicles: number;
    maxSessions: number;
    maxStorage: number; // GB
    maxApiCalls: number; // per month
    maxReports: number; // per month
    maxIntegrations: number;
    retentionDays: number;
}

export interface BillingInfo {
    plan: string;
    status: 'active' | 'past_due' | 'canceled';
    currentPeriodStart: string;
    currentPeriodEnd: string;
    amount: number;
    currency: string;
    nextBillingDate?: string;
    paymentMethod?: string;
}

export interface OrganizationMetadata {
    industry: string;
    size: 'small' | 'medium' | 'large' | 'enterprise';
    region: string;
    timezone: string;
    compliance: string[];
    integrations: string[];
    customFields: Record<string, any>;
}

export interface ApiKeyDTO {
    id: string;
    orgId: string;
    name: string;
    key: string;
    description?: string;
    permissions: ApiKeyPermission[];
    rateLimit: RateLimit;
    status: 'active' | 'inactive' | 'revoked';
    lastUsedAt?: string;
    expiresAt?: string;
    createdAt: string;
    updatedAt: string;
    metadata: ApiKeyMetadata;
}

export interface ApiKeyPermission {
    resource: string;
    actions: string[];
    conditions?: Record<string, any>;
}

export interface RateLimit {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
    burstLimit: number;
}

export interface ApiKeyMetadata {
    ipWhitelist?: string[];
    userAgent?: string;
    referrer?: string;
    customHeaders?: Record<string, string>;
    tags: string[];
}

export interface SecuritySettings {
    passwordPolicy: PasswordPolicy;
    sessionSettings: SessionSettings;
    mfaSettings: MFASettings;
    rateLimiting: RateLimitingSettings;
    corsSettings: CORSSettings;
    cookieSettings: CookieSettings;
    auditSettings: AuditSettings;
}

export interface PasswordPolicy {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    maxAge: number; // days
    historyCount: number;
    lockoutAttempts: number;
    lockoutDuration: number; // minutes
}

export interface SessionSettings {
    timeout: number; // minutes
    maxConcurrentSessions: number;
    requireReauth: boolean;
    secureCookies: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    httpOnly: boolean;
}

export interface MFASettings {
    enabled: boolean;
    required: boolean;
    methods: ('totp' | 'sms' | 'email')[];
    backupCodes: boolean;
    gracePeriod: number; // days
}

export interface RateLimitingSettings {
    enabled: boolean;
    defaultLimits: RateLimit;
    customLimits: Record<string, RateLimit>;
    whitelist: string[];
    blacklist: string[];
}

export interface CORSSettings {
    enabled: boolean;
    origins: string[];
    methods: string[];
    headers: string[];
    credentials: boolean;
    maxAge: number;
}

export interface CookieSettings {
    secure: boolean;
    httpOnly: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    domain?: string;
    path: string;
    maxAge: number; // seconds
}

export interface AuditSettings {
    enabled: boolean;
    logLevel: 'minimal' | 'standard' | 'detailed';
    retentionDays: number;
    realTimeAlerts: boolean;
    sensitiveData: boolean;
}

export interface AuditLogDTO {
    id: string;
    orgId: string;
    userId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    details: Record<string, any>;
    ipAddress: string;
    userAgent: string;
    timestamp: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'success' | 'failure' | 'warning';
    metadata: AuditMetadata;
}

export interface AuditMetadata {
    sessionId?: string;
    requestId: string;
    duration: number; // milliseconds
    responseCode: number;
    errorMessage?: string;
    tags: string[];
}

export interface SecurityEventDTO {
    id: string;
    orgId: string;
    type: 'login_failure' | 'suspicious_activity' | 'data_breach' | 'unauthorized_access' | 'rate_limit_exceeded';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    source: string;
    ipAddress?: string;
    userAgent?: string;
    userId?: string;
    details: Record<string, any>;
    status: 'open' | 'investigating' | 'resolved' | 'false_positive';
    createdAt: string;
    updatedAt: string;
    resolvedAt?: string;
    resolvedBy?: string;
    metadata: SecurityEventMetadata;
}

export interface SecurityEventMetadata {
    riskScore: number; // 0-100
    falsePositiveProbability: number; // 0-100
    relatedEvents: string[];
    tags: string[];
    automation: {
        autoResolve: boolean;
        autoNotify: boolean;
        escalationRules: string[];
    };
}

export interface AdminFilters {
    role?: 'ADMIN' | 'MANAGER' | 'OPERATOR';
    status?: 'active' | 'inactive' | 'suspended';
    orgId?: string;
    from?: string;
    to?: string;
    search?: string;
}

export interface AdminStats {
    totalUsers: number;
    totalOrganizations: number;
    activeSessions: number;
    securityEvents: {
        total: number;
        critical: number;
        high: number;
        medium: number;
        low: number;
    };
    apiUsage: {
        totalRequests: number;
        averageResponseTime: number;
        errorRate: number;
        topEndpoints: Array<{
            endpoint: string;
            requests: number;
            avgResponseTime: number;
        }>;
    };
    systemHealth: {
        uptime: number;
        memoryUsage: number;
        cpuUsage: number;
        diskUsage: number;
        databaseConnections: number;
    };
    recentActivity: {
        newUsers: number;
        newOrganizations: number;
        securityEvents: number;
        apiCalls: number;
    };
}

export interface AdminSettings {
    system: SystemSettings;
    security: SecuritySettings;
    features: FeatureSettings;
    integrations: IntegrationSettings;
    notifications: NotificationSettings;
}

export interface SystemSettings {
    maintenanceMode: boolean;
    debugMode: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    maxFileSize: number; // MB
    maxRequestSize: number; // MB
    timeout: number; // seconds
    retryAttempts: number;
    cacheEnabled: boolean;
    cacheTTL: number; // seconds
}

export interface FeatureSettings {
    modules: {
        telemetry: boolean;
        stability: boolean;
        reports: boolean;
        uploads: boolean;
        ai: boolean;
        admin: boolean;
    };
    experimental: {
        newFeatures: boolean;
        betaFeatures: boolean;
        analytics: boolean;
    };
    limits: {
        maxSessionsPerUser: number;
        maxFilesPerUpload: number;
        maxReportSize: number; // MB
        maxChatMessages: number;
    };
}

export interface IntegrationSettings {
    radar: {
        enabled: boolean;
        apiKey?: string;
        webhookUrl?: string;
        rateLimit: number;
    };
    tomtom: {
        enabled: boolean;
        apiKey?: string;
        rateLimit: number;
    };
    email: {
        enabled: boolean;
        provider: string;
        settings: Record<string, any>;
    };
    sms: {
        enabled: boolean;
        provider: string;
        settings: Record<string, any>;
    };
}

export interface NotificationSettings {
    email: {
        enabled: boolean;
        templates: Record<string, any>;
        recipients: string[];
    };
    sms: {
        enabled: boolean;
        templates: Record<string, any>;
        recipients: string[];
    };
    webhook: {
        enabled: boolean;
        url?: string;
        events: string[];
    };
    inApp: {
        enabled: boolean;
        realTime: boolean;
        retention: number; // days
    };
}

// Respuestas de API
export interface AdminApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    meta?: {
        total?: number;
        limit?: number;
        offset?: number;
        permissions?: string[];
    };
}

// Tipos para eventos en tiempo real
export interface AdminRealtimeEvent {
    type: 'user_created' | 'user_updated' | 'security_event' | 'api_key_created' | 'feature_flag_updated';
    timestamp: string;
    data: {
        userId?: string;
        orgId?: string;
        eventId?: string;
        details?: any;
    };
}
