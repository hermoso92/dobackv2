import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface DecodedToken {
    userId: string;
    role: string;
    organizationId: string;
}

export async function validateToken(token: string): Promise<DecodedToken | null> {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
        return decoded;
    } catch (error) {
        logger.error('Error validating token', { error });
        return null;
    }
} 