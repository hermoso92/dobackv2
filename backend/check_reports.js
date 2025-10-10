const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkReports() {
  try {
    console.log('🔍 Buscando reportes en la base de datos...');
    
    const reports = await prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        requestedBy: {
          select: { id: true, email: true, name: true }
        }
      }
    });
    
    console.log(`📊 Total reportes encontrados: ${reports.length}`);
    
    reports.forEach((report, index) => {
      console.log(`\n📄 Reporte ${index + 1}:`);
      console.log(`   ID: ${report.id}`);
      console.log(`   Tipo: ${report.reportType}`);
      console.log(`   Archivo: ${report.filePath}`);
      console.log(`   Tamaño: ${report.sizeBytes} bytes`);
      console.log(`   Status: ${report.status}`);
      console.log(`   Creado: ${report.createdAt}`);
      console.log(`   Usuario: ${report.requestedBy?.email || 'N/A'}`);
    });
    
    if (reports.length > 0) {
      const latestReport = reports[0];
      console.log(`\n✅ ID del reporte más reciente para descarga: ${latestReport.id}`);
      
      // Verificar si el archivo existe
      const fs = require('fs');
      const filePath = latestReport.filePath;
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(`📁 Archivo existe: ${filePath} (${stats.size} bytes)`);
      } else {
        console.log(`❌ Archivo no encontrado: ${filePath}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkReports(); 