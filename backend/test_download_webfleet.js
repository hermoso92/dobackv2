const http = require('http');
const fs = require('fs');

// Simular una petición de descarga directa
const options = {
  hostname: 'localhost',
  port: 9998,
  path: '/api/reports/webfleet/download/webfleet-style-report-1752765827620.pdf',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer dummy_token' // Token dummy para prueba
  }
};

console.log('🧪 Probando descarga directa del PDF...');
console.log('📄 Archivo objetivo: webfleet-style-report-1752765827620.pdf');

const req = http.request(options, (res) => {
  console.log(`📡 Status: ${res.statusCode}`);
  console.log(`📋 Headers:`, res.headers);
  
  if (res.statusCode === 200) {
    let data = Buffer.alloc(0);
    
    res.on('data', (chunk) => {
      data = Buffer.concat([data, chunk]);
    });
    
    res.on('end', () => {
      console.log(`📊 Tamaño recibido: ${data.length} bytes`);
      console.log(`🔍 Primeros 10 bytes: ${data.slice(0, 10).toString()}`);
      
      // Verificar si es un PDF válido
      if (data.slice(0, 4).toString() === '%PDF') {
        console.log('✅ PDF válido recibido');
        fs.writeFileSync('test_downloaded.pdf', data);
        console.log('💾 PDF guardado como test_downloaded.pdf');
      } else {
        console.log('❌ No es un PDF válido');
        console.log('📝 Contenido:', data.toString().substring(0, 200));
      }
    });
  } else {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log('❌ Error en descarga:', body);
    });
  }
});

req.on('error', (e) => {
  console.error('🚨 Error de conexión:', e.message);
});

req.end(); 