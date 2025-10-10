const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

// Inicializar Prisma Client
const prisma = new PrismaClient();

const app = express();
const PORT = 9998;

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Ruta raíz para pruebas
app.get('/', (req, res) => {
  res.json({ message: 'Servidor de prueba Prisma funcionando correctamente' });
});

// Ruta para login directo - Simulación
app.post('/direct-login', (req, res) => {
  const { email, password } = req.body;
  console.log('Intento de login con:', email);

  // En entorno de prueba, aceptamos cualquier credencial
  // En producción, aquí se verificaría contra la base de datos
  res.json({
    success: true,
    user: {
      id: 1,
      name: 'Usuario de Prueba',
      email: email || 'admin@cosigein.com',
      role: 'ADMIN'
    },
    token: 'token-simulado-123456789',
    organization: {
      id: 1,
      name: 'Cosigein S.L.',
      type: 'BOMBEROS'
    }
  });
});

// Ruta para verificar token
app.post('/verify-token', (req, res) => {
  // En desarrollo, siempre devolvemos éxito
  res.json({
    success: true,
    user: {
      id: 1,
      name: 'Usuario de Prueba',
      email: 'admin@cosigein.com',
      role: 'ADMIN'
    },
    organization: {
      id: 1,
      name: 'Cosigein S.L.',
      type: 'BOMBEROS'
    }
  });
});

// Ruta /api para pruebas
app.get('/api', (req, res) => {
  res.json({ 
    message: 'API de DobackSoft-V2 con datos reales',
    endpoints: [
      '/api/vehicles',
      '/api/stability/vehicle/:vehicleId/sessions',
      '/api/stability/session/:sessionId',
      '/api/events',
      '/api/test',
      '/direct-login'
    ]
  });
});

// Rutas API - Utilizando Prisma para obtener datos reales de la base de datos
app.get('/api/vehicles', async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany();
    console.log('GET /api/vehicles - Found', vehicles.length, 'vehicles');
    console.log('Vehicles data structure:', JSON.stringify(vehicles[0]).substring(0, 100));
    res.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Obtener sesiones de estabilidad de un vehículo
app.get('/api/stability/vehicle/:vehicleId/sessions', async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const sessions = await prisma.stabilitySession.findMany({
      where: { vehicleId: parseInt(vehicleId) },
      orderBy: { date: 'desc' }
    });
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching stability sessions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Obtener datos de una sesión específica
app.get('/api/stability/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Obtener la sesión
    const session = await prisma.stabilitySession.findUnique({
      where: { id: parseInt(sessionId) }
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Obtener mediciones de esta sesión
    const measurements = await prisma.measurement.findMany({
      where: { 
        vehicleId: session.vehicleId,
        sessionId: sessionId.toString()
      },
      orderBy: { timestamp: 'asc' }
    });
    
    // Convertir los campos data de las mediciones a objetos JSON
    const processedMeasurements = measurements.map(m => {
      try {
        // Si data es un string, parsearlo a JSON
        const dataObj = typeof m.data === 'string' ? JSON.parse(m.data) : m.data;
        return {
          ...m,
          data: dataObj
        };
      } catch (error) {
        console.error(`Error parsing data for measurement ${m.id}:`, error);
        return m; // Devolver la medición sin cambios si hay error al parsear
      }
    });
    
    console.log(`Session ${sessionId} - Found ${measurements.length} measurements`);
    if (measurements.length > 0) {
      console.log('First measurement processed:', 
        typeof processedMeasurements[0].data === 'object' ? 'Object (correctly parsed)' : 'String (not parsed)');
      
      // Mostrar una muestra de los datos procesados
      console.log('Sample data from first measurement:', 
        JSON.stringify(processedMeasurements[0].data).substring(0, 100));
    }
    
    const response = {
      session,
      measurements: processedMeasurements
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching session data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Obtener eventos de un vehículo
app.get('/api/events', async (req, res) => {
  try {
    const { vehicleId } = req.query;
    let events = [];
    
    if (vehicleId) {
      events = await prisma.event.findMany({
        where: { vehicleId: parseInt(vehicleId) },
        orderBy: { timestamp: 'desc' }
      });
    } else {
      events = await prisma.event.findMany({
        orderBy: { timestamp: 'desc' },
        take: 20
      });
    }
    
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'Test endpoint working!' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API accessible at http://localhost:${PORT}/api`);
  console.log(`Using real data from SQLite database via Prisma`);
}); 