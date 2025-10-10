// Servidor Express minimalista enfocado en autenticación y CORS
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 9998;

// Configuración CORS para desarrollo - acepta cualquier origen
app.use(cors({
    origin: '*', // En desarrollo aceptamos cualquier origen
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept'],
    // No utilizamos credentials para evitar problemas con CORS
    credentials: false
}));

// Middleware para manejar CORS manualmente en caso de problemas
app.use((req, res, next) => {
    // Configuración manual para asegurar compatibilidad con todos los navegadores
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept');
    
    // Responder directamente a solicitudes preflight OPTIONS
    if (req.method === 'OPTIONS') {
        console.log('Recibida solicitud preflight OPTIONS, respondiendo OK');
        return res.status(200).end();
    }
    
    // Log de solicitudes
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Origin: ${req.headers.origin || 'N/A'}`);
    next();
});

// Middleware para procesar JSON
app.use(express.json());

// Ruta de salud básica
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        message: 'Servidor minimalista funcionando correctamente'
    });
});

// Ruta de endpoint directo de login
app.post('/direct-login', (req, res) => {
    const { email, password } = req.body;

    console.log(`Intento de login directo con: ${email}`);

    // Verificar credenciales hardcodeadas para pruebas
    if (email === 'admin@cosigein.com' && password === 'Cosigein25!') {
        // Generar un token simple para pruebas (en producción usar JWT)
        const token = 'test-token-' + Date.now();

        console.log(`Login exitoso para: ${email}`);

        return res.json({
            success: true,
            data: {
                token,
                user: {
                    id: 1,
                    email: 'admin@cosigein.com',
                    name: 'Administrador',
                    role: 'ADMIN'
                }
            }
        });
    } else {
        console.log(`Credenciales inválidas para: ${email}`);
        return res.status(401).json({
            success: false,
            message: 'Credenciales inválidas'
        });
    }
});

// Ruta API de login tradicional
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    console.log(`Intento de login API tradicional con: ${email}`);

    // Verificar credenciales hardcodeadas para pruebas
    if (email === 'admin@cosigein.com' && password === 'Cosigein25!') {
        // Generar un token simple para pruebas (en producción usar JWT)
        const token = 'test-token-' + Date.now();

        console.log(`Login exitoso para: ${email}`);

        return res.json({
            success: true,
            data: {
                token,
                user: {
                    id: 1,
                    email: 'admin@cosigein.com',
                    name: 'Administrador',
                    role: 'ADMIN'
                }
            }
        });
    } else {
        console.log(`Credenciales inválidas para: ${email}`);
        return res.status(401).json({
            success: false,
            message: 'Credenciales inválidas'
        });
    }
});

// Ruta principal
app.get('/', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>DobackSoft Backend Minimalista</title>
                <style>
                    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                    h1 { color: #333; }
                    ul { line-height: 1.6; }
                </style>
            </head>
            <body>
                <h1>DobackSoft Backend Minimalista</h1>
                <p>Servidor de autenticación simplificado funcionando correctamente</p>
                <p>Endpoints disponibles:</p>
                <ul>
                    <li><b>/health</b> - Comprobación de salud del servidor</li>
                    <li><b>/direct-login</b> - Endpoint directo para login (POST)</li>
                    <li><b>/api/auth/login</b> - Endpoint de API tradicional para login (POST)</li>
                </ul>
                <p>Credenciales de prueba:</p>
                <ul>
                    <li>Email: admin@cosigein.com</li>
                    <li>Password: Cosigein25!</li>
                </ul>
            </body>
        </html>
    `);
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`======================================================`);
    console.log(`  Servidor minimalista iniciado en puerto ${PORT}`);
    console.log(`  http://localhost:${PORT}`);
    console.log(`======================================================`);
    console.log("Configuración CORS:");
    console.log("- Origen permitido: * (todos los orígenes)");
    console.log("- Credenciales permitidas: false");
    console.log("\nCredenciales de prueba:");
    console.log("- Email: admin@cosigein.com");
    console.log("- Contraseña: Cosigein25!");
}); 