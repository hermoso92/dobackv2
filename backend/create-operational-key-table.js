const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Creando tabla OperationalKey...\n');
    
    try {
        await prisma.$connect();
        
        // Crear la tabla OperationalKey
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS "OperationalKey" (
                "id" TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
                "sessionId" TEXT NOT NULL,
                "keyType" INTEGER NOT NULL,
                "startTime" TIMESTAMPTZ(6) NOT NULL,
                "endTime" TIMESTAMPTZ(6),
                "duration" INTEGER,
                "startLat" DOUBLE PRECISION,
                "startLon" DOUBLE PRECISION,
                "endLat" DOUBLE PRECISION,
                "endLon" DOUBLE PRECISION,
                "rotativoState" BOOLEAN,
                "geofenceId" TEXT,
                "details" JSONB,
                "createdAt" TIMESTAMPTZ(6) DEFAULT NOW(),
                "updatedAt" TIMESTAMPTZ(6) DEFAULT NOW(),
                "geofenceName" TEXT,
                "keyTypeName" VARCHAR(20),
                CONSTRAINT "fk_operational_key_session" 
                    FOREIGN KEY ("sessionId") 
                    REFERENCES "Session"("id") 
                    ON DELETE CASCADE
            )
        `;
        
        console.log('✅ Tabla OperationalKey creada exitosamente\n');
        
        // Crear índices
        await prisma.$executeRaw`
            CREATE INDEX IF NOT EXISTS "idx_operational_key_session" 
            ON "OperationalKey"("sessionId", "keyType")
        `;
        
        await prisma.$executeRaw`
            CREATE INDEX IF NOT EXISTS "idx_operational_key_session_type" 
            ON "OperationalKey"("sessionId", "keyType")
        `;
        
        await prisma.$executeRaw`
            CREATE INDEX IF NOT EXISTS "idx_operational_key_time" 
            ON "OperationalKey"("startTime" DESC)
        `;
        
        await prisma.$executeRaw`
            CREATE INDEX IF NOT EXISTS "idx_operational_key_type" 
            ON "OperationalKey"("keyType", "startTime" DESC)
        `;
        
        await prisma.$executeRaw`
            CREATE INDEX IF NOT EXISTS "idx_operational_key_type_name" 
            ON "OperationalKey"("keyTypeName")
        `;
        
        console.log('✅ Índices creados exitosamente\n');
        console.log('🎉 Tabla OperationalKey lista para usar\n');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

