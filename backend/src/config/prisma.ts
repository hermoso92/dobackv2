/**
 * 🔄 RE-EXPORT DE PRISMA
 * 
 * Este archivo re-exporta Prisma desde lib/prisma.ts
 * para mantener compatibilidad con imports existentes.
 */

// Re-exportar Prisma
export { disconnectPrisma, prisma } from '../lib/prisma';

// Re-exportar como default para compatibilidad
export { default } from '../lib/prisma';
