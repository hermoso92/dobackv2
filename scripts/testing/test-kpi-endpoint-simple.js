// Test simple del endpoint de KPIs
const http = require('http');

const options = {
    hostname: 'localhost',
    port: 9998,
    path: '/api/kpis/summary',
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
};

console.log('\n🔍 Consultando endpoint: http://localhost:9998/api/kpis/summary\n');

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log(`Status: ${res.statusCode}\n`);
        
        try {
            const json = JSON.parse(data);
            console.log('📊 RESPUESTA DEL BACKEND:\n');
            console.log(JSON.stringify(json, null, 2));
        } catch (error) {
            console.log('Raw response:', data);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Error:', error.message);
    console.log('\n⚠️  El backend NO está corriendo en puerto 9998');
    console.log('   Ejecuta: .\\iniciar.ps1\n');
});

req.end();

