const http = require('http');
const fs = require('fs');

// Usar el reportId más reciente de la base de datos
const reportId = 'a3a0c946-8ca6-4e5a-9e01-4a60ad45a2b5';

const options = {
  hostname: 'localhost',
  port: 9998,
  path: `/api/reports/webfleet/download/${reportId}`,
  method: 'GET',
  headers: {
    'Authorization': 'Bearer test_token' // Token dummy
  }
};

console.log('🧪 Probando descarga con reportId correcto...');
console.log('📄 ReportId:', reportId);
console.log('🌐 URL:', `http://localhost:9998${options.path}`);

const req = http.request(options, (res) => {
  console.log(`📡 Status: ${res.statusCode}`);
  console.log(`📋 Headers:`, JSON.stringify(res.headers, null, 2));
  
  if (res.statusCode === 200) {
    let data = Buffer.alloc(0);
    
    res.on('data', (chunk) => {
      data = Buffer.concat([data, chunk]);
      console.log(`📥 Recibido chunk: ${chunk.length} bytes`);
    });
    
    res.on('end', () => {
      console.log(`📊 Tamaño total recibido: ${data.length} bytes`);
      
      // Verificar si es un PDF válido
      const header = data.slice(0, 10).toString();
      console.log(`🔍 Cabecera: "${header}"`);
      
      if (header.startsWith('%PDF')) {
        console.log('✅ PDF válido recibido');
        fs.writeFileSync('test_downloaded_correct.pdf', data);
        console.log('💾 PDF guardado como test_downloaded_correct.pdf');
        
        // Verificar que se puede leer
        try {
          const stats = fs.statSync('test_downloaded_correct.pdf');
          console.log(`📁 Archivo guardado: ${stats.size} bytes`);
        } catch (e) {
          console.log('❌ Error verificando archivo:', e.message);
        }
      } else {
        console.log('❌ No es un PDF válido');
        console.log('📝 Contenido (primeros 200 chars):', data.toString().substring(0, 200));
      }
    });
  } else {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log('❌ Error en descarga:');
      console.log('Status:', res.statusCode);
      console.log('Body:', body);
    });
  }
});

req.on('error', (e) => {
  console.error('🚨 Error de conexión:', e.message);
});

req.setTimeout(10000, () => {
  console.log('⏰ Timeout - cancelando petición');
  req.destroy();
});

console.log('📤 Enviando petición...');
req.end(); 