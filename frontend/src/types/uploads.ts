// DTOs para el módulo de Subidas Automáticas
export interface UploadBatchDTO {
    id: string;
    orgId: string;
    createdAt: string;
    status: 'scanning' | 'processing' | 'completed' | 'failed' | 'cancelled';
    source: 'ftp' | 'local' | 'manual';
    config: UploadConfig;
    summary: UploadSummary;
    files: UploadFileDTO[];
    errors: UploadErrorDTO[];
    metadata: UploadMetadata;
}

export interface UploadConfig {
    source: 'ftp' | 'local' | 'manual';
    ftpConfig?: {
        host: string;
        port: number;
        username: string;
        password: string;
        directory: string;
        passive: boolean;
    };
    localConfig?: {
        directory: string;
        watchMode: boolean;
    };
    filePatterns: FilePattern[];
    processingOptions: ProcessingOptions;
}

export interface FilePattern {
    id: string;
    name: string;
    pattern: string; // Regex pattern
    provider: string;
    vehicleIdExtractor: string; // Regex group name
    timestampExtractor: string; // Regex group name
    fileType: 'telemetry' | 'stability' | 'events' | 'unknown';
    priority: number;
    enabled: boolean;
}

export interface ProcessingOptions {
    autoCreateVehicles: boolean;
    skipDuplicates: boolean;
    validateData: boolean;
    normalizeData: boolean;
    linkToSessions: boolean;
    maxFileSize: number; // MB
    allowedExtensions: string[];
    timezone: string;
}

export interface UploadSummary {
    totalFiles: number;
    processedFiles: number;
    successfulFiles: number;
    failedFiles: number;
    skippedFiles: number;
    totalSize: number; // bytes
    processingTime: number; // seconds
    newVehicles: number;
    newSessions: number;
    updatedSessions: number;
}

export interface UploadFileDTO {
    id: string;
    batchId: string;
    filename: string;
    originalPath: string;
    size: number;
    hash: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
    detectedInfo?: DetectedFileInfo;
    processingResult?: ProcessingResult;
    error?: string;
    createdAt: string;
    processedAt?: string;
}

export interface DetectedFileInfo {
    provider: string;
    vehicleId?: string;
    timestamp?: string;
    fileType: 'telemetry' | 'stability' | 'events' | 'unknown';
    confidence: number; // 0-100
    extractedData: Record<string, any>;
}

export interface ProcessingResult {
    vehicleId: string;
    sessionId?: string;
    pointsCount: number;
    eventsCount: number;
    duration: number;
    dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
    warnings: string[];
    metadata: Record<string, any>;
}

export interface UploadErrorDTO {
    id: string;
    batchId: string;
    fileId?: string;
    type: 'validation' | 'parsing' | 'database' | 'network' | 'permission' | 'unknown';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    resolved: boolean;
    resolution?: string;
}

export interface UploadMetadata {
    scanDuration: number;
    processingDuration: number;
    totalDuration: number;
    systemInfo: {
        nodeVersion: string;
        platform: string;
        memoryUsage: number;
        diskSpace: number;
    };
    configVersion: string;
    lastScanAt?: string;
    nextScanAt?: string;
}

export interface UploadFilters {
    status?: 'scanning' | 'processing' | 'completed' | 'failed' | 'cancelled';
    source?: 'ftp' | 'local' | 'manual';
    from?: string;
    to?: string;
    vehicleId?: string;
    provider?: string;
    hasErrors?: boolean;
}

export interface UploadBatchParams {
    status?: 'scanning' | 'processing' | 'completed' | 'failed' | 'cancelled';
    source?: 'ftp' | 'local' | 'manual';
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'createdAt' | 'status' | 'totalFiles';
    sortOrder?: 'asc' | 'desc';
}

export interface UploadStats {
    totalBatches: number;
    totalFiles: number;
    totalSize: number;
    successRate: number;
    averageProcessingTime: number;
    byStatus: Record<string, number>;
    bySource: Record<string, number>;
    byProvider: Record<string, number>;
    recentActivity: {
        batches: number;
        files: number;
        errors: number;
    };
    topErrors: {
        type: string;
        count: number;
        lastOccurrence: string;
    }[];
}

export interface VehicleCreationAssistant {
    suggestedVehicle: {
        id: string;
        name: string;
        type: string;
        provider: string;
        metadata: Record<string, any>;
    };
    confidence: number;
    reasoning: string[];
    alternatives: {
        id: string;
        name: string;
        confidence: number;
    }[];
}

export interface UploadProgress {
    batchId: string;
    currentFile: string;
    progress: number; // 0-100
    stage: 'scanning' | 'detecting' | 'processing' | 'validating' | 'saving';
    estimatedTimeRemaining?: number;
    filesProcessed: number;
    totalFiles: number;
}

// Respuestas de API
export interface UploadApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    meta?: {
        total?: number;
        limit?: number;
        offset?: number;
    };
}

// Tipos para configuración
export interface UploadSettings {
    ftp: {
        enabled: boolean;
        scanInterval: number; // minutes
        maxConcurrentConnections: number;
        timeout: number; // seconds
        retryAttempts: number;
    };
    local: {
        enabled: boolean;
        watchDirectories: string[];
        scanInterval: number; // minutes
        maxFileAge: number; // hours
    };
    processing: {
        maxConcurrentFiles: number;
        chunkSize: number; // MB
        memoryLimit: number; // MB
        tempDirectory: string;
    };
    notifications: {
        onBatchComplete: boolean;
        onErrors: boolean;
        onNewVehicles: boolean;
        emailRecipients: string[];
    };
}

// Tipos para eventos en tiempo real
export interface UploadRealtimeEvent {
    batchId: string;
    type: 'batch_started' | 'file_processed' | 'batch_completed' | 'error_occurred';
    timestamp: string;
    data: {
        progress?: number;
        currentFile?: string;
        error?: UploadErrorDTO;
        summary?: UploadSummary;
    };
}
