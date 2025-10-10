const express = require('express');
const cors = require('cors');

// Crear aplicación Express
const app = express();

// Middleware básico
app.use(cors());
app.use(express.json());

// Middleware de diagnóstico
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] Solicitud recibida: ${req.method} ${req.url}`);
    next();
});

// Ruta raíz
app.get('/', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>Servidor de Prueba</title>
                <style>
                    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                    h1 { color: #333; }
                    ul { line-height: 1.6; }
                    a { color: #0066cc; }
                </style>
            </head>
            <body>
                <h1>Servidor Express de Prueba</h1>
                <p>Endpoints disponibles:</p>
                <ul>
                    <li><a href="/health">/health</a> - Endpoint básico de salud</li>
                    <li><a href="/api-health">/api-health</a> - Endpoint completo de salud</li>
                    <li><a href="/json">/json</a> - Respuesta JSON simple</li>
                    <li><a href="/html">/html</a> - Respuesta HTML simple</li>
                    <li><a href="/text">/text</a> - Respuesta de texto simple</li>
                </ul>
            </body>
        </html>
    `);
});

// Endpoint de salud básico
app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// Endpoint de salud completo (similar al original api/health)
app.get('/api-health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        details: {
            database: 'connected',
            memory: process.memoryUsage(),
            uptime: process.uptime()
        }
    });
});

// Respuesta JSON simple
app.get('/json', (req, res) => {
    res.json({
        message: 'Esta es una respuesta JSON simple',
        success: true,
        timestamp: new Date().toISOString()
    });
});

// Respuesta HTML simple
app.get('/html', (req, res) => {
    res.send('<html><body><h1>Respuesta HTML</h1><p>Esto es HTML simple</p></body></html>');
});

// Respuesta de texto simple
app.get('/text', (req, res) => {
    res.type('text/plain').send('Esto es una respuesta de texto simple');
});

// Puerto
const PORT = 3050;

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor directo ejecutándose en http://localhost:${PORT}`);
    console.log('Prueba estos endpoints:');
    console.log('- http://localhost:3050/');
    console.log('- http://localhost:3050/health');
    console.log('- http://localhost:3050/api-health');
    console.log('- http://localhost:3050/json');
    console.log('- http://localhost:3050/html');
    console.log('- http://localhost:3050/text');
}); 