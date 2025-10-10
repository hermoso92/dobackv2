import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';

export const createTestUser = async () => {
    const hashedPassword = await bcrypt.hash('test-password', 10);
    const user = await prisma.user.create({
        data: {
            email: `test-${Date.now()}@example.com`,
            name: 'Test User',
            password: hashedPassword,
            role: 'ADMIN',
            organizationId: 1
        }
    });
    return user;
};

export const generateTestToken = (user: any) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
            organizationId: user.organizationId
        },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
    );
};
