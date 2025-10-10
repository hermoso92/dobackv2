const fs = require('fs').promises;
const path = require('path');

const sourceDir = path.join(__dirname, '../data/cosigein/doback003/05032025');
const targetDir = path.join(__dirname, '../uploads/cosigein/doback003/05032025');

async function copyFiles() {
  try {
    // Crear directorios si no existen
    await fs.mkdir(targetDir, { recursive: true });

    // Copiar archivos
    const files = [
      '0005_ESTABILIDAD_DOBACK003_05-03-2025.txt',
      '0005_CAN_DOBACK003_05-03-2025.csv',
      '0005_GPS_DOBACK003_05-03-2025.csv'
    ];

    for (const file of files) {
      const sourcePath = path.join(sourceDir, file);
      const targetPath = path.join(targetDir, file);

      try {
        await fs.copyFile(sourcePath, targetPath);
        console.log(`Archivo copiado: ${file}`);
      } catch (error) {
        console.error(`Error al copiar ${file}:`, error.message);
      }
    }

    console.log('Archivos copiados exitosamente');
  } catch (error) {
    console.error('Error al configurar los datos:', error);
  }
}

copyFiles(); 