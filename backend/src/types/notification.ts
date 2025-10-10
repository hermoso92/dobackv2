export interface EmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
}

export interface NotificationTemplate {
    subject: string;
    text: string;
    html: string;
}

export interface NotificationOptions {
    email?: EmailOptions;
    sms?: {
        to: string;
        message: string;
    };
    push?: {
        userId: string;
        title: string;
        body: string;
        data?: Record<string, string>;
    };
}

export interface NotificationService {
    // Email notifications
    sendVerificationEmail(email: string, token: string): Promise<void>;
    sendPasswordResetEmail(email: string, token: string): Promise<void>;
    sendPasswordChangeNotification(email: string): Promise<void>;

    // Generic notifications
    sendNotification(options: NotificationOptions): Promise<void>;

    // Alert notifications
    sendCriticalAlert(message: string, details?: Record<string, any>): Promise<void>;
    sendWarningAlert(message: string, details?: Record<string, any>): Promise<void>;

    // Template management
    getTemplate(templateName: string): Promise<NotificationTemplate>;
    renderTemplate(templateName: string, data: Record<string, any>): Promise<string>;
}
