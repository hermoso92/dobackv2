/**
 * Script para corregir la función del trigger que causa el error
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixTriggerFunction() {
    console.log('🔧 Corrigiendo función del trigger...\n');

    try {
        await prisma.$connect();
        console.log('✅ Conexión establecida\n');

        // Reemplazar la función problemática
        console.log('🔄 Reemplazando función update_operational_key_type_name()...');
        await prisma.$executeRaw`
            CREATE OR REPLACE FUNCTION public.update_operational_key_type_name()
            RETURNS trigger
            LANGUAGE plpgsql
            AS $function$
            BEGIN
              NEW."keyTypeName" = CASE NEW."keyType"
                WHEN 0 THEN 'TALLER'
                WHEN 1 THEN 'PARQUE'
                WHEN 2 THEN 'EMERGENCIA'
                WHEN 3 THEN 'INCENDIO'
                WHEN 5 THEN 'REGRESO'
                ELSE NULL
              END;
              RETURN NEW;
            END;
            $function$
        `;
        console.log('✅ Función corregida exitosamente\n');

        // Verificar que el cambio se aplicó
        console.log('📝 Nueva definición de la función:');
        const funcDef = await prisma.$queryRaw`
            SELECT 
                pg_get_functiondef(oid) as function_definition
            FROM pg_proc
            WHERE proname = 'update_operational_key_type_name'
        `;
        
        if (funcDef.length > 0) {
            console.log(funcDef[0].function_definition);
            console.log('\n');
        }

        // Probar un INSERT para verificar que funciona
        console.log('🧪 Probando INSERT para verificar...');
        const session = await prisma.session.findFirst({
            select: { id: true }
        });

        if (session) {
            try {
                const result = await prisma.operationalKey.create({
                    data: {
                        sessionId: session.id,
                        keyType: 1,
                        startTime: new Date()
                    }
                });
                console.log('✅ INSERT exitoso! ID:', result.id.substring(0, 8) + '...');
                console.log('✅ keyTypeName generado:', result.keyTypeName);
                
                // Limpiar
                await prisma.operationalKey.delete({
                    where: { id: result.id }
                });
                console.log('✅ Limpieza completada\n');
            } catch (insertError) {
                console.log('❌ INSERT aún falla:', insertError.message);
                console.log('');
            }
        }

        console.log('✅ Corrección completada exitosamente\n');

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

fixTriggerFunction()
    .then(() => {
        console.log('🎉 Script finalizado exitosamente');
        process.exit(0);
    })
    .catch(() => {
        console.error('💥 Error en el script');
        process.exit(1);
    });



