import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
});

export const registerSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    role: z.enum(['ADMIN', 'USER', 'OPERATOR']),
    organizationId: z.string().optional()
});

export const refreshTokenSchema = z.object({
    refresh_token: z.string().min(1, 'El refresh token es requerido')
});

export const forgotPasswordSchema = z.object({
    body: z.object({
        email: z.string().email('Email inválido')
    })
});

export const resetPasswordSchema = z.object({
    body: z.object({
        token: z.string().min(1, 'Token requerido'),
        password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
    })
});
