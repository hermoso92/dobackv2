import { UserRole as PrismaUserRole } from '@prisma/client';
import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

// Tipos de roles de usuario
export type UserRole = PrismaUserRole;

// Interfaz para el payload del token JWT
export interface TokenPayload extends JwtPayload {
    id: string;
    email: string;
    role: UserRole;
    organizationId: string | null;
}

// Interfaz para el payload del token de refresco
export interface RefreshTokenPayload extends JwtPayload {
    userId: number;
    tokenId: string;
}

// Interfaz para el payload del token de restablecimiento de contraseña
export interface PasswordResetTokenPayload extends JwtPayload {
    userId: number;
    email: string;
}

// Interfaz para el payload del token de verificación de email
export interface EmailVerificationTokenPayload extends JwtPayload {
    userId: number;
    email: string;
}

// Interfaz para los datos del usuario
export interface UserData {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    organizationId: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

// Interfaz para la respuesta de autenticación
export interface AuthResponse {
    success: boolean;
    data?: {
        user: UserWithoutPassword;
        access_token: string;
        refresh_token: string;
    };
    error?: string;
}

// Interfaz para la solicitud de inicio de sesión
export interface LoginRequest {
    email: string;
    password: string;
}

// Interfaz para la solicitud de registro
export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
    organizationId: number;
}

// Interfaz para la solicitud de restablecimiento de contraseña
export interface PasswordResetRequest {
    token: string;
    newPassword: string;
}

// Interfaz para la solicitud de cambio de contraseña
export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

// Interfaz para la solicitud de verificación de email
export interface EmailVerificationRequest {
    token: string;
}

// Interfaz para la solicitud de refresco de token
export interface RefreshTokenRequest {
    refreshToken: string;
}

// Interfaz para la solicitud de cierre de sesión
export interface LogoutRequest {
    token: string;
}

// Interfaz para la solicitud de verificación de token
export interface VerifyTokenRequest {
    token: string;
}

// Interfaz para la respuesta de verificación de token
export interface VerifyTokenResponse {
    success: boolean;
    valid: boolean;
    error?: string;
}

// Interfaz para la respuesta de verificación de email
export interface EmailVerificationResponse {
    isVerified: boolean;
    message: string;
}

// Interfaz para la respuesta de restablecimiento de contraseña
export interface PasswordResetResponse {
    success: boolean;
    message: string;
}

// Interfaz para la respuesta de cambio de contraseña
export interface ChangePasswordResponse {
    success: boolean;
    message: string;
}

// Interfaz para la respuesta de cierre de sesión
export interface LogoutResponse {
    success: boolean;
    message: string;
    error?: string;
}

// Interfaz para la respuesta de refresco de token
export interface RefreshTokenResponse {
    success: boolean;
    data?: {
        token: string;
    };
    error?: string;
}

// Interfaz para la respuesta de error de autenticación
export interface AuthErrorResponse {
    status: 'error';
    message: string;
    code?: string;
}

// Interfaz para la respuesta de éxito de autenticación
export interface AuthSuccessResponse {
    status: 'success';
    data: any;
    message?: string;
}

// Interfaz para el payload personalizado del JWT
export interface CustomJwtPayload {
    userId: number;
    email: string;
    role: UserRole;
}

// Interfaz para la solicitud autenticada
export interface AuthRequest extends Request {
    user?: TokenPayload;
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    organizationId?: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface AuthToken {
    user: UserData;
    token: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

// Tipo para usuario sin contraseña
export interface UserWithoutPassword {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    organizationId: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

// Interfaz para la respuesta de obtener usuario actual
export interface GetCurrentUserResponse {
    success: boolean;
    data?: UserWithoutPassword;
    error?: string;
}

// Extender la interfaz Request de Express
declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}
