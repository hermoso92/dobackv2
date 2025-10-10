const express = require('express');
const cors = require('cors');

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
  res.json({ message: 'Servidor de prueba funcionando correctamente' });
});

// Ruta /api para pruebas
app.get('/api', (req, res) => {
  res.json({ 
    message: 'API de prueba simple',
    endpoints: [
      '/api/vehicles',
      '/api/stability/vehicle/:vehicleId/sessions',
      '/api/stability/session/:sessionId',
      '/api/events',
      '/api/test'
    ]
  });
});

// Datos estáticos para pruebas
app.get('/api/vehicles', (req, res) => {
  const vehicles = [
    { id: 1, name: 'Vehículo de Prueba', type: 'Camión', status: 'ACTIVE' },
    { id: 2, name: 'DOBACK003', type: 'UME', status: 'ACTIVE' }
  ];
  res.json(vehicles);
});

// Generar datos sintéticos para las sesiones de estabilidad
app.get('/api/stability/vehicle/:vehicleId/sessions', (req, res) => {
  const { vehicleId } = req.params;
  console.log(`Fetching sessions for vehicle ${vehicleId}`);
  
  // Crear múltiples sesiones para permitir la selección
  const sessions = [
    {
      id: 1,
      vehicleId: parseInt(vehicleId),
      date: '2025-03-05T09:28:37.000Z',
      status: 'COMPLETED',
      duration: 45,
      dataPoints: 120,
      stabilityScore: 85,
      warningCount: 2,
      criticalCount: 0,
      data: JSON.stringify({
        location: 'Pruebas de estabilidad terreno montañoso',
        driver: 'Conductor UME',
        weather: 'Soleado',
        notes: 'Pruebas de estabilidad en condiciones reales'
      })
    },
    {
      id: 2,
      vehicleId: parseInt(vehicleId),
      date: '2025-03-10T14:15:22.000Z',
      status: 'COMPLETED',
      duration: 75,
      dataPoints: 180,
      stabilityScore: 72,
      warningCount: 3,
      criticalCount: 1,
      data: JSON.stringify({
        location: 'Circuito de pruebas',
        driver: 'Conductor de pruebas',
        weather: 'Nublado',
        notes: 'Pruebas de estabilidad en curvas pronunciadas'
      })
    },
    {
      id: 3,
      vehicleId: parseInt(vehicleId),
      date: '2025-03-15T11:30:45.000Z',
      status: 'COMPLETED',
      duration: 60,
      dataPoints: 150,
      stabilityScore: 90,
      warningCount: 1,
      criticalCount: 0,
      data: JSON.stringify({
        location: 'Carretera rural',
        driver: 'Conductor UME',
        weather: 'Lluvia ligera',
        notes: 'Pruebas de estabilidad en superficie mojada'
      })
    }
  ];
  
  console.log(`Returning ${sessions.length} sessions for vehicle ${vehicleId}`);
  console.log(`Response data type: ${typeof sessions}`);
  console.log(`Is Array: ${Array.isArray(sessions)}`);
  console.log(`First session ID: ${sessions[0].id}`);
  
  // Enviar directamente el array de sesiones
  res.json(sessions);
});

// Datos de una sesión específica con sus mediciones
app.get('/api/stability/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  console.log(`Fetching data for session ${sessionId}`);
  
  // Crear mediciones sintéticas
  const measurements = [];
  
  // Generar 100 puntos de datos para la gráfica
  for (let i = 0; i < 100; i++) {
    // Tiempo en segundos desde el inicio de la sesión
    const timeSeconds = i * 0.5;
    
    // Oscilación de baja frecuencia para simular terreno
    const terrainFactor = Math.sin(timeSeconds * 0.5) * 0.3;
    
    // Simulamos un giro gradual entre los puntos 20-40
    const turnFactor = (i > 20 && i < 40) 
      ? Math.sin((i - 20) * Math.PI / 20) * 0.8 
      : 0;
    
    // Crea una timestamp con incrementos de medio segundo
    const timestamp = new Date(new Date('2025-03-05T09:28:37.000Z').getTime() + (i * 500));
    
    // Datos del sensor para esta medición
    const sensorData = {
      lateral_acc: terrainFactor + turnFactor,
      roll: turnFactor * 10 + terrainFactor * 5,
      gyro_x: Math.random() * 0.2 - 0.1,
      gyro_y: Math.random() * 0.2 - 0.1 + turnFactor,
      gyro_z: Math.random() * 0.2 - 0.1,
      acceleration_x: Math.random() * 0.3 - 0.15,
      acceleration_y: Math.random() * 0.3 - 0.15 + terrainFactor,
      acceleration_z: -9.8 + Math.random() * 0.4 - 0.2,
      speed: 30 + Math.sin(timeSeconds * 0.1) * 5
    };
    
    // Datos de métricas para esta medición
    const metricsData = {
      risk_score: Math.min(1, Math.max(0, 0.3 + terrainFactor + turnFactor * 0.5)),
      warning_level: i > 35 && i < 38 ? 'WARNING' : i > 20 && i < 25 ? 'CAUTION' : 'NORMAL'
    };
    
    measurements.push({
      id: i + 1,
      timestamp: timestamp.toISOString(),
      vehicleId: parseInt(sessionId) % 10 || 1, // Usar módulo para asociar vehículo
      sessionId: parseInt(sessionId),
      data: JSON.stringify(sensorData),
      metrics: JSON.stringify(metricsData)
    });
  }
  
  // Generar algunos eventos para la sesión
  const events = [];
  
  // Evento de advertencia
  if (parseInt(sessionId) % 3 !== 0) { // Dos tercios de las sesiones tienen eventos de advertencia
    events.push({
      id: 1,
      timestamp: new Date(new Date('2025-03-05T09:30:15.000Z').getTime()).toISOString(),
      type: 'STABILITY_WARNING',
      severity: 'WARNING',
      message: 'Inclinación lateral excedió umbral',
      data: JSON.stringify({
        lateral_acc: 0.35,
        roll: 12.5,
        speed: 45
      })
    });
  }
  
  // Evento crítico (solo algunas sesiones)
  if (parseInt(sessionId) % 5 === 0) {
    events.push({
      id: 2,
      timestamp: new Date(new Date('2025-03-05T09:35:22.000Z').getTime()).toISOString(),
      type: 'STABILITY_CRITICAL',
      severity: 'CRITICAL',
      message: 'Riesgo de vuelco detectado',
      data: JSON.stringify({
        lateral_acc: 0.48,
        roll: 18.2,
        speed: 52
      })
    });
  }
  
  // Estructura de la respuesta completa
  const sessionData = {
    session: {
      id: parseInt(sessionId),
      vehicleId: parseInt(sessionId) % 10 || 1,
      date: '2025-03-05T09:28:37.000Z',
      status: 'COMPLETED',
      duration: 45,
      dataPoints: measurements.length,
      maxSpeed: 65,
      maxLateralAcc: 0.48,
      maxRoll: 18.2,
      warningEvents: events.filter(e => e.severity === 'WARNING').length,
      criticalEvents: events.filter(e => e.severity === 'CRITICAL').length
    },
    measurements: measurements,
    events: events
  };
  
  console.log(`Returning session data with ${measurements.length} measurements and ${events.length} events`);
  console.log(`Session ID: ${sessionData.session.id}, vehicle ID: ${sessionData.session.vehicleId}`);
  
  // Enviar los datos directamente sin envolverlos en otro objeto
  res.json(sessionData);
});

// Eventos relacionados con un vehículo
app.get('/api/events', (req, res) => {
  const { vehicleId } = req.query;
  
  if (!vehicleId) {
    return res.json([]);
  }
  
  // Crear algunos eventos sintéticos
  const events = [
    {
      id: 1,
      type: 'STABILITY_WARNING',
      severity: 'WARNING',
      message: 'Inclinación lateral excedió umbral',
      timestamp: '2025-03-05T09:30:15.000Z',
      status: 'ACTIVE',
      vehicleId: parseInt(vehicleId)
    },
    {
      id: 2,
      type: 'STABILITY_INFO',
      severity: 'INFO',
      message: 'Sesión de estabilidad iniciada',
      timestamp: '2025-03-05T09:28:37.000Z',
      status: 'ACTIVE',
      vehicleId: parseInt(vehicleId)
    }
  ];
  
  res.json(events);
});

// Endpoint para obtener sesiones de telemetría por vehículo
app.get('/api/telemetry/:vehicleId', (req, res) => {
  const { vehicleId } = req.params;
  console.log(`Fetching telemetry sessions for vehicle ${vehicleId}`);
  
  // Crear sesiones de telemetría para el vehículo seleccionado
  const sessions = [
    {
      id: 1,
      vehicleId: parseInt(vehicleId),
      date: '2025-03-15T10:28:37.000Z',
      duration: 45,
      distance: '32.5',
      maxSpeed: 95,
      avgSpeed: 42,
      dataPoints: 450,
      status: 'COMPLETED',
      summary: JSON.stringify({
        fuelConsumption: 8.3,
        idleTime: 12,
        harshAccelerations: 2,
        harshBraking: 1
      })
    },
    {
      id: 2,
      vehicleId: parseInt(vehicleId),
      date: '2025-03-12T14:15:22.000Z',
      duration: 78,
      distance: '65.8',
      maxSpeed: 110,
      avgSpeed: 48,
      dataPoints: 780,
      status: 'COMPLETED',
      summary: JSON.stringify({
        fuelConsumption: 14.6,
        idleTime: 18,
        harshAccelerations: 3,
        harshBraking: 4
      })
    }
  ];
  
  res.json(sessions);
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'Test endpoint working!' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API accessible at http://localhost:${PORT}/api`);
}); 