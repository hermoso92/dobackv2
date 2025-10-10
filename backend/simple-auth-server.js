// Servidor express simple para probar la autenticación
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 7778; // Puerto distinto para no interferir con el servidor principal

// Middleware para permitir CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para procesar JSON
app.use(express.json());

// Usuario de prueba predefinido
const testUser = {
    id: 1,
    email: 'admin@cosigein.com',
    // Hash correcto de 'Cosigein25!'
    password: '$2b$10$.fN1Rl0ghPWYF/YuZ./yuO22LBeZknCXzxuNycyDvAO2FKZaVCPN.',
    name: 'Administrador',
    role: 'ADMIN'
};

// Middleware para log de solicitudes
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Body:', JSON.stringify(req.body, null, 2));
    }
    next();
});

// Endpoint de prueba simple
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

// Endpoint de login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log(`Intento de login con email: ${email}`);
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y contraseña son requeridos'
            });
        }
        
        // BYPASS: Aceptar cualquier combinación de credenciales para propósito de pruebas
        console.log('Login exitoso - BYPASS activado para pruebas');
        
        // Generar token simple (en producción usar JWT)
        const token = 'test-token-' + Date.now();
        
        // Enviar respuesta exitosa
        return res.json({
            success: true,
            data: {
                token,
                user: {
                    id: testUser.id,
                    email: testUser.email,
                    name: testUser.name,
                    role: testUser.role
                }
            }
        });
    } catch (error) {
        console.error('Error en el endpoint de login:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor de prueba ejecutándose en http://localhost:${PORT}`);
    console.log('Credenciales de prueba:');
    console.log('- Email: admin@cosigein.com');
    console.log('- Contraseña: Cosigein25!');
}); 