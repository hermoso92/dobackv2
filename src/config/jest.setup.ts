// Mock environment variables
process.env.SMTP_HOST = 'smtp.test.com';
process.env.SMTP_PORT = '587';
process.env.SMTP_SECURE = 'false';
process.env.SMTP_USER = 'test@test.com';
process.env.SMTP_PASS = 'test-password';
process.env.SMTP_FROM = 'test@test.com';
process.env.SMTP_TO = 'admin@test.com';

// Mock database
const mockDb = {
    query: jest.fn().mockResolvedValue([]),
    execute: jest.fn().mockResolvedValue({ affectedRows: 1 }),
    transaction: jest.fn().mockImplementation(async (callback) => {
        try {
            const result = await callback();
            return result;
        } catch (error) {
            throw error;
        }
    }),
    release: jest.fn(),
    end: jest.fn()
};

jest.mock('./database', () => ({
    db: mockDb,
    connect: jest.fn().mockResolvedValue(mockDb),
    disconnect: jest.fn().mockResolvedValue(undefined),
    executeQuery: jest.fn().mockImplementation(async (query, params) => {
        try {
            return await mockDb.query(query, params);
        } catch (error) {
            throw error;
        }
    })
}));

// Mock logger
jest.mock('../utils/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
    }
}));

// Mock nodemailer
const mockTransporter = {
    sendMail: jest.fn().mockImplementation((mailOptions) => {
        if (!mailOptions.to || !mailOptions.subject || !mailOptions.html) {
            return Promise.reject(new Error('Invalid mail options'));
        }
        return Promise.resolve({ messageId: 'test-message-id' });
    })
};

jest.mock('nodemailer', () => ({
    createTransport: jest.fn().mockReturnValue(mockTransporter)
}));

// Mock process.exit
const originalExit = process.exit;
process.exit = jest.fn((code?: number) => {
    console.log(`Mock process.exit called with code ${code}`);
}) as never; 