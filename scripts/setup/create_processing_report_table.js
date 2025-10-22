/**
 * Script para crear la tabla ProcessingReport en la base de datos
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function createProcessingReportTable() {
    try {
        console.log('📊 Creando tabla ProcessingReport...');

        // Crear tabla
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "ProcessingReport" (
              id            TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
              "userId"      TEXT NOT NULL,
              "organizationId" TEXT NOT NULL,
              "reportType"  TEXT NOT NULL,
              status        TEXT NOT NULL,
              "totalFiles"  INTEGER DEFAULT 0,
              "totalSessions" INTEGER DEFAULT 0,
              "totalOmitted" INTEGER DEFAULT 0,
              "startTime"   TIMESTAMP NOT NULL,
              "endTime"     TIMESTAMP,
              duration      INTEGER,
              "errorMessage" TEXT,
              "reportData"  JSONB,
              "createdAt"   TIMESTAMP DEFAULT NOW(),
              "updatedAt"   TIMESTAMP DEFAULT NOW(),
              CONSTRAINT "ProcessingReport_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"(id) ON DELETE CASCADE,
              CONSTRAINT "ProcessingReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
            )
        `);

        console.log('✅ Tabla creada');

        // Crear índices
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ProcessingReport_organizationId_idx" ON "ProcessingReport"("organizationId")`);
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ProcessingReport_userId_idx" ON "ProcessingReport"("userId")`);
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ProcessingReport_status_idx" ON "ProcessingReport"(status)`);
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ProcessingReport_createdAt_idx" ON "ProcessingReport"("createdAt")`);

        console.log('✅ Índices creados');

        // Verificar que la tabla existe
        const result = await prisma.$queryRaw`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_name = 'ProcessingReport'
        `;

        console.log('📋 Verificación:', result);

    } catch (error) {
        console.error('❌ Error creando tabla:', error.message);
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

createProcessingReportTable();

