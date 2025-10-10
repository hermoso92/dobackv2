import { Event, EventSeverity, EventStatus, EventType } from '../types/domain';

declare global {
    namespace jest {
        interface Matchers<R> {
            toBeValidEvent(): R;
            toHaveValidTimestamp(): R;
            toHaveValidId(): R;
        }
    }
}

export interface MockEvent extends Event {
    id: string;
    type: EventType;
    severity: EventSeverity;
    message: string;
    timestamp: Date;
    status: EventStatus;
    context: Record<string, any>;
    acknowledged: boolean;
    acknowledgedBy: string | null;
    acknowledgedAt: Date | null;
}

export interface MockFile {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
    size: number;
    fieldname: string;
    encoding: string;
}

export interface MockResponse {
    status: jest.Mock;
    json: jest.Mock;
    send: jest.Mock;
}

export interface MockRequest {
    body: any;
    params: any;
    query: any;
    headers: any;
    file?: MockFile;
    files?: MockFile[];
    user?: {
        id: string;
        role: string;
        organizationId: string;
    };
}

export interface MockNext {
    (error?: Error): void;
}

export interface MockDatabase {
    execute: jest.Mock;
    getConnection: jest.Mock;
    end: jest.Mock;
}

export interface MockLogger {
    info: jest.Mock;
    error: jest.Mock;
    warn: jest.Mock;
    debug: jest.Mock;
}

export interface MockNotificationService {
    sendEmail: jest.Mock;
    sendSMS: jest.Mock;
    sendPushNotification: jest.Mock;
    sendCriticalAlert: jest.Mock;
    sendWarning: jest.Mock;
}

export interface MockEventService {
    createEvent: jest.Mock;
    updateEventStatus: jest.Mock;
    getActiveEvents: jest.Mock;
    getEventsByType: jest.Mock;
    handleEvent: jest.Mock;
    handleEvents: jest.Mock;
}

export interface MockStabilityProcessor {
    processMeasurements: jest.Mock;
}

export interface MockStabilityAnalysisService {
    analyzeStabilityData: jest.Mock;
}

export interface MockVehicleRepository {
    findById: jest.Mock;
    findAll: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    findByOrganization: jest.Mock;
    updateStatus: jest.Mock;
}

export interface MockEventRepository {
    findById: jest.Mock;
    findByStatus: jest.Mock;
    findByType: jest.Mock;
    findBySeverity: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    findByVehicle: jest.Mock;
    findBySession: jest.Mock;
}

export interface MockStabilityMeasurementsRepository {
    save: jest.Mock;
    saveBatch: jest.Mock;
    findByVehicle: jest.Mock;
    findBySession: jest.Mock;
    processFile: jest.Mock;
}

export const createMockResponse = (): MockResponse => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis()
});

export const createMockRequest = (data: Partial<MockRequest> = {}): MockRequest => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    ...data
});

export const createMockNext = (): MockNext => jest.fn();

export const createMockDatabase = (): MockDatabase => ({
    execute: jest.fn(),
    getConnection: jest.fn(),
    end: jest.fn()
});

export const createMockLogger = (): MockLogger => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
});

export const createMockNotificationService = (): MockNotificationService => ({
    sendEmail: jest.fn(),
    sendSMS: jest.fn(),
    sendPushNotification: jest.fn(),
    sendCriticalAlert: jest.fn(),
    sendWarning: jest.fn()
});

export const createMockEventService = (): MockEventService => ({
    createEvent: jest.fn(),
    updateEventStatus: jest.fn(),
    getActiveEvents: jest.fn(),
    getEventsByType: jest.fn(),
    handleEvent: jest.fn(),
    handleEvents: jest.fn()
});

export const createMockStabilityProcessor = (): MockStabilityProcessor => ({
    processMeasurements: jest.fn()
});

export const createMockStabilityAnalysisService = (): MockStabilityAnalysisService => ({
    analyzeStabilityData: jest.fn()
});

export const createMockVehicleRepository = (): MockVehicleRepository => ({
    findById: jest.fn(),
    findAll: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findByOrganization: jest.fn(),
    updateStatus: jest.fn()
});

export const createMockEventRepository = (): MockEventRepository => ({
    findById: jest.fn(),
    findByStatus: jest.fn(),
    findByType: jest.fn(),
    findBySeverity: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findByVehicle: jest.fn(),
    findBySession: jest.fn()
});

export const createMockStabilityMeasurementsRepository = (): MockStabilityMeasurementsRepository => ({
    save: jest.fn(),
    saveBatch: jest.fn(),
    findByVehicle: jest.fn(),
    findBySession: jest.fn(),
    processFile: jest.fn()
}); 