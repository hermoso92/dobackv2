/**
 * 🔄 RE-EXPORT DEL SINGLETON DE PRISMA
 * 
 * Este archivo re-exporta el singleton de Prisma desde lib/prisma.ts
 * para mantener compatibilidad con imports existentes.
 * 
 * IMPORTANTE: NO crear nuevas instancias de PrismaClient aquí.
 * Usar SIEMPRE el singleton de lib/prisma.ts
 */

// Re-exportar el singleton de Prisma
export { prisma } from '../lib/prisma';

// Re-exportar como default para compatibilidad
export { default } from '../lib/prisma';
