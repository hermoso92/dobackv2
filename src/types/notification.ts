export interface NotificationData {
    title: string;
    message: string;
    type: 'stability' | 'session' | 'system';
    data: Record<string, any>;
} 