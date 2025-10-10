import { createTransport } from 'nodemailer';

jest.mock('nodemailer');

export const mockTransporter = {
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' })
};

(createTransport as jest.Mock).mockReturnValue(mockTransporter);

export const clearMailMocks = () => {
    mockTransporter.sendMail.mockClear();
    (createTransport as jest.Mock).mockClear();
}; 