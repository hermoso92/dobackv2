// Tipos comunes
export interface BaseEntity {
    id: number;
    createdAt: Date;
    updatedAt: Date;
}

// Tipos para Vehículos
export interface Vehicle extends BaseEntity {
    name: string;
    model: string;
    plateNumber: string;
    type?: string;
    status: string;
    vin?: string;
    year?: number;
    manufacturer?: string;
    lastMaintenance?: Date;
    nextMaintenance?: Date;
}

// Tipos para Telemetría
export interface TelemetryData extends BaseEntity {
    vehicleId: number;
    timestamp: number;
    speed: number;
    rpm: number;
    fuel: number;
    temperature: number;
    battery: number;
    acceleration_x: number;
    acceleration_y: number;
    acceleration_z: number;
    gyro_x: number;
    gyro_y: number;
    gyro_z: number;
    latitude?: number;
    longitude?: number;
    altitude?: number;
    heading?: number;
    groundSpeed?: number;
}

// Tipos para Eventos
export interface Event extends BaseEntity {
    vehicleId: number;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    startTime: Date;
    endTime?: Date;
    location?: string;
    assignedTo?: number;
    notes?: string;
}

// Tipos para Documentos
export interface Document extends BaseEntity {
    title: string;
    type: 'manual' | 'report' | 'certificate' | 'other';
    description: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    uploadedBy: number;
    vehicleId?: number;
    tags?: string[];
    status: 'active' | 'archived' | 'deleted';
}

// Tipos para Notificaciones
export interface Notification extends BaseEntity {
    userId: number;
    type: 'alert' | 'warning' | 'info' | 'success';
    title: string;
    message: string;
    read: boolean;
    link?: string;
    priority: 'low' | 'medium' | 'high';
    expiresAt?: Date;
}

// Tipos para Estabilidad
export interface StabilityData extends BaseEntity {
    vehicleId: number;
    timestamp: number;
    roll: number;
    pitch: number;
    yaw: number;
    lateralAcceleration: number;
    longitudinalAcceleration: number;
    verticalAcceleration: number;
    speed: number;
    status: 'stable' | 'warning' | 'critical';
    threshold: number;
    location?: {
        latitude: number;
        longitude: number;
    };
}

// Tipos para Carga de Datos
export interface DataUpload extends BaseEntity {
    userId: number;
    vehicleId?: number;
    fileName: string;
    fileType: string;
    fileSize: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    error?: string;
    metadata?: Record<string, any>;
}

// Tipos para Equipo
export interface TeamMember extends BaseEntity {
    userId: number;
    name: string;
    email: string;
    role: string;
    department: string;
    status: 'active' | 'inactive' | 'away';
    avatar?: string;
    phone?: string;
    skills?: string[];
    assignedVehicles?: number[];
}

// Tipos para Análisis de IA
export interface AIAnalysis extends BaseEntity {
    vehicleId: number;
    type: 'stability' | 'performance' | 'maintenance' | 'safety';
    status: 'pending' | 'processing' | 'completed' | 'failed';
    result: Record<string, any>;
    confidence: number;
    recommendations: string[];
    metadata?: Record<string, any>;
}

// Tipos para Reportes
export interface Report extends BaseEntity {
    title: string;
    type: 'daily' | 'weekly' | 'monthly' | 'custom';
    startDate: Date;
    endDate: Date;
    generatedBy: number;
    status: 'draft' | 'published' | 'archived';
    data: Record<string, any>;
    format: 'pdf' | 'excel' | 'csv';
    recipients?: number[];
}

// Tipos para Configuración
export interface Settings extends BaseEntity {
    userId: number;
    theme: 'light' | 'dark' | 'system';
    language: string;
    notifications: {
        email: boolean;
        push: boolean;
        sms: boolean;
    };
    preferences: Record<string, any>;
}

// Tipos para Perfil de Usuario
export interface UserProfile extends BaseEntity {
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    role: string;
    department?: string;
    avatar?: string;
    preferences?: Record<string, any>;
}

// Tipos para Alertas
export interface Alert extends BaseEntity {
    vehicleId: number;
    type: 'stability' | 'performance' | 'maintenance' | 'safety';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    status: 'active' | 'acknowledged' | 'resolved';
    acknowledgedBy?: number;
    resolvedAt?: Date;
    metadata?: Record<string, any>;
}

// Tipos para Base de Conocimiento
export interface KnowledgeArticle extends BaseEntity {
    title: string;
    content: string;
    category: string;
    tags: string[];
    author: number;
    status: 'draft' | 'published' | 'archived';
    views: number;
    helpful: number;
    notHelpful: number;
}

// Tipos para Análisis
export interface Analytics extends BaseEntity {
    type: 'vehicle' | 'fleet' | 'user' | 'system';
    metrics: Record<string, number>;
    dimensions: Record<string, any>;
    timeRange: {
        start: Date;
        end: Date;
    };
    filters?: Record<string, any>;
} 