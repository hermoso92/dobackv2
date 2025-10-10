import { DecodedToken } from './auth';

export function hasRole(decoded: DecodedToken, requiredRole: string): boolean {
    return decoded.role === requiredRole;
} 