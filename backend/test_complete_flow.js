const http = require('http');

// Función para hacer petición HTTP
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function testCompleteFlow() {
  try {
    console.log('🧪 === PRUEBA FLUJO COMPLETO ===');

    // 1. Generar reporte
    console.log('\n1️⃣ Generando reporte...');
    
    const generateOptions = {
      hostname: 'localhost',
      port: 9998,
      path: '/api/reports/webfleet',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test_token'
      }
    };

    const payload = JSON.stringify({
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
      vehicleIds: [],
      reportType: 'detailed',
      title: 'Test Report',
      includeCriticalEvents: true,
      includeConsumptionAnalysis: true,
      fuelReferenceBase: 7.5
    });

    const generateResponse = await makeRequest(generateOptions, payload);
    
    console.log('Status:', generateResponse.statusCode);
    console.log('Response:', generateResponse.body.substring(0, 500));

    if (generateResponse.statusCode !== 200) {
      console.log('❌ Error generando reporte');
      return;
    }

    // 2. Extraer reportId
    let reportData;
    try {
      reportData = JSON.parse(generateResponse.body);
    } catch (e) {
      console.log('❌ Error parseando respuesta JSON');
      return;
    }

    if (!reportData.success || !reportData.data?.reportId) {
      console.log('❌ Respuesta sin reportId válido');
      return;
    }

    const reportId = reportData.data.reportId;
    console.log('✅ Reporte generado. ID:', reportId);

    // 3. Descargar reporte
    console.log('\n2️⃣ Descargando reporte...');
    
    const downloadOptions = {
      hostname: 'localhost',
      port: 9998,
      path: `/api/reports/webfleet/download/${reportId}`,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test_token'
      }
    };

    const downloadResponse = await makeRequest(downloadOptions);
    
    console.log('Status descarga:', downloadResponse.statusCode);
    console.log('Headers:', JSON.stringify(downloadResponse.headers, null, 2));
    
    if (downloadResponse.statusCode === 200) {
      const pdfData = Buffer.from(downloadResponse.body, 'binary');
      console.log('📊 Tamaño PDF:', pdfData.length, 'bytes');
      
      // Verificar cabecera PDF
      const header = pdfData.slice(0, 10).toString();
      if (header.startsWith('%PDF')) {
        console.log('✅ PDF válido descargado');
        
        // Guardar para verificar
        const fs = require('fs');
        fs.writeFileSync('test_flow_complete.pdf', pdfData);
        console.log('💾 PDF guardado como test_flow_complete.pdf');
      } else {
        console.log('❌ No es un PDF válido');
        console.log('Cabecera:', header);
      }
    } else {
      console.log('❌ Error en descarga:', downloadResponse.body);
    }

  } catch (error) {
    console.error('🚨 Error en flujo:', error.message);
  }
}

testCompleteFlow(); 