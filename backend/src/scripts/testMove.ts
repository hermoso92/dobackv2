import * as fs from 'fs';
import * as path from 'path';

async function testMoveFile() {
    const sourceDir = path.join(__dirname, '..', '..', 'data', 'review');
    const targetDir = path.join(__dirname, '..', '..', 'data', 'processed');
    const fileName = '0005_ESTABILIDAD_DOBACK003_05-03-2025.txt';
    const sourcePath = path.join(sourceDir, fileName);
    const targetPath = path.join(targetDir, fileName);

    console.log('=== Test de Movimiento de Archivo ===');
    console.log('Source:', sourcePath);
    console.log('Target:', targetPath);

    try {
        // 1. Verificar que el archivo fuente existe
        if (!fs.existsSync(sourcePath)) {
            console.error('❌ El archivo fuente no existe');
            return;
        }
        console.log('✅ Archivo fuente encontrado');

        // 2. Verificar que el directorio destino existe
        if (!fs.existsSync(targetDir)) {
            console.log('Creando directorio destino...');
            fs.mkdirSync(targetDir, { recursive: true });
        }
        console.log('✅ Directorio destino verificado');

        // 3. Verificar permisos de lectura en el archivo fuente
        try {
            fs.accessSync(sourcePath, fs.constants.R_OK);
            console.log('✅ Permisos de lectura OK');
        } catch (e) {
            console.error('❌ No hay permisos de lectura en el archivo fuente');
            return;
        }

        // 4. Verificar permisos de escritura en el directorio destino
        try {
            fs.accessSync(targetDir, fs.constants.W_OK);
            console.log('✅ Permisos de escritura OK');
        } catch (e) {
            console.error('❌ No hay permisos de escritura en el directorio destino');
            return;
        }

        // 5. Intentar mover el archivo
        console.log('Intentando mover archivo...');
        await fs.promises.rename(sourcePath, targetPath);
        console.log('✅ Archivo movido exitosamente');
    } catch (error) {
        console.error('❌ Error durante el movimiento:', error);
    }
}

// Ejecutar el test
testMoveFile().catch(console.error);
