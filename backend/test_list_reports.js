const http = require('http');

// Simular una petición para listar reportes
const options = {
  hostname: 'localhost',
  port: 9998,
  path: '/api/reports/webfleet',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer dummy_token' // Token dummy para prueba
  }
};

console.log('🧪 Listando reportes Webfleet...');

const req = http.request(options, (res) => {
  console.log(`📡 Status: ${res.statusCode}`);
  console.log(`📋 Headers:`, res.headers);
  
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try {
      if (res.statusCode === 200) {
        const reports = JSON.parse(body);
        console.log('✅ Reportes encontrados:');
        console.log(JSON.stringify(reports, null, 2));
        
        if (reports.length > 0) {
          const latestReport = reports[0];
          console.log('📄 Reporte más reciente:', latestReport);
          console.log('🆔 ID para descarga:', latestReport.id);
        }
      } else {
        console.log('❌ Error:', body);
      }
    } catch (e) {
      console.log('📝 Respuesta no JSON:', body);
    }
  });
});

req.on('error', (e) => {
  console.error('🚨 Error de conexión:', e.message);
});

req.end(); 