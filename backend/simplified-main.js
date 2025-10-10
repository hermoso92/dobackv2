// Servidor principal simplificado
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

// Inicializar Prisma
const prisma = new PrismaClient();

// Crear aplicación Express
const app = express();

// Middleware básico
app.use(express.json());
app.use(cors({
  origin: '*', // Permitir todas las fuentes para desarrollo
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Session-Id']
}));

// Middleware de diagnóstico
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Solicitud: ${req.method} ${req.url}`);
  next();
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] Respuesta: ${res.statusCode}`);
  });
});

// Ruta principal mejorada
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>DobackSoft Backend - Simplificado</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #333; }
          ul { line-height: 1.6; }
          a { color: #0066cc; }
          pre { background: #f5f5f5; padding: 10px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1>DobackSoft Backend - Versión Simplificada</h1>
        <p>El servidor está funcionando correctamente.</p>
        <p>Endpoints disponibles:</p>
        <ul>
          <li><a href="/health">/health</a> - Estado del servidor</li>
          <li><a href="/api/health">/api/health</a> - Estado detallado</li>
          <li><a href="/auth/test">/auth/test</a> - Prueba de autenticación</li>
        </ul>
      </body>
    </html>
  `);
});

// Endpoint de salud simple
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Endpoint de salud con base de datos
app.get('/api/health', async (req, res) => {
  try {
    // Verificar conexión a la base de datos
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Error en health check:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error en la verificación de salud',
      timestamp: new Date().toISOString()
    });
  }
});

// Rutas de autenticación
app.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  // Verificación simple
  if (username === 'admin' && password === 'password') {
    res.json({
      success: true,
      token: 'sample-token-123',
      user: { id: 1, username: 'admin', role: 'admin' }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Credenciales inválidas'
    });
  }
});

// Ruta de prueba de autenticación
app.get('/auth/test', (req, res) => {
  res.json({
    message: 'Endpoint de autenticación funcionando',
    timestamp: new Date().toISOString()
  });
});

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Ocurrió un error'
  });
});

// Puerto
const PORT = 4000;

// Función principal
async function startServer() {
  try {
    // Conectar a la base de datos
    await prisma.$connect();
    console.log('Conexión a la base de datos establecida');
    
    // Iniciar servidor
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`============================================`);
      console.log(`Servidor simplificado iniciado en http://localhost:${PORT}`);
      console.log(`============================================`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Manejo de señales de terminación
process.on('SIGTERM', async () => {
  console.log('SIGTERM recibido. Cerrando conexiones...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT recibido. Cerrando conexiones...');
  await prisma.$disconnect();
  process.exit(0);
});

// Iniciar el servidor
startServer(); 