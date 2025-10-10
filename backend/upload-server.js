const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 9998;

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de multer para subida múltiple de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.originalname.match(/\.(txt)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos .txt'), false);
    }
  }
});

// Endpoint de prueba
app.get('/api/upload/test', (req, res) => {
  res.json({
    success: true,
    message: 'Endpoint de subida múltiple funcionando correctamente',
    timestamp: new Date().toISOString(),
    features: ['Estabilidad', 'GPS', 'Rotativo', 'CAN']
  });
});

// Función para parsear archivo CAN
function parseCanFile(content) {
  const lines = content.split('\n').filter(line => line.trim());
  const sessions = [];
  let currentSession = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detectar inicio de sesión CAN
    if (line.startsWith('CAN;') && line.includes('Sesión:')) {
      if (currentSession) {
        sessions.push(currentSession);
      }
      
      const sessionMatch = line.match(/CAN;(\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2});DOBACK(\d+);Sesión:(\d+);/);
      if (sessionMatch) {
        currentSession = {
          sessionNumber: parseInt(sessionMatch[3]),
          startTime: new Date(sessionMatch[1].replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1')),
          vehicleId: `DOBACK${sessionMatch[2]}`,
          measurements: []
        };
      }
    }
    // Datos CAN (formato típico: ID;Datos;Timestamp)
    else if (currentSession && line.includes(';') && !line.includes('ID;Datos;Timestamp')) {
      const values = line.split(';');
      if (values.length >= 3) {
        try {
          const measurement = {
            timestamp: new Date(currentSession.startTime.getTime() + (currentSession.measurements.length * 100)),
            canId: values[0].trim(),
            data: values[1].trim(),
            rawTimestamp: values[2] ? values[2].trim() : null
          };
          currentSession.measurements.push(measurement);
        } catch (error) {
          console.warn(`Error parseando línea CAN: ${line}`);
        }
      }
    }
  }
  
  if (currentSession) {
    sessions.push(currentSession);
  }
  
  return sessions;
}

// Función para parsear archivo de Estabilidad
function parseStabilityFile(content) {
  const lines = content.split('\n').filter(line => line.trim());
  const sessions = [];
  let currentSession = null;
  let headers = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('ESTABILIDAD;') && line.includes('Sesión:')) {
      if (currentSession) {
        sessions.push(currentSession);
      }
      
      const sessionMatch = line.match(/ESTABILIDAD;(\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2});DOBACK(\d+);Sesión:(\d+);/);
      if (sessionMatch) {
        currentSession = {
          sessionNumber: parseInt(sessionMatch[3]),
          startTime: new Date(sessionMatch[1].replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1')),
          vehicleId: `DOBACK${sessionMatch[2]}`,
          measurements: []
        };
      }
    }
    else if (line.includes('ax; ay; az;')) {
      headers = line.split(';').map(h => h.trim()).filter(h => h);
    }
    else if (currentSession && headers && line.includes(';') && !line.match(/^\d{2}:\d{2}:\d{2}$/)) {
      const values = line.split(';').map(v => v.trim()).filter(v => v);
      if (values.length >= 19) {
        try {
          const measurement = {
            timestamp: new Date(currentSession.startTime.getTime() + (currentSession.measurements.length * 100)),
            ax: parseFloat(values[0]),
            ay: parseFloat(values[1]),
            az: parseFloat(values[2]),
            gx: parseFloat(values[3]),
            gy: parseFloat(values[4]),
            gz: parseFloat(values[5]),
            roll: parseFloat(values[6]),
            pitch: parseFloat(values[7]),
            yaw: parseFloat(values[8]),
            timeantwifi: parseFloat(values[9]),
            usciclo1: parseFloat(values[10]),
            usciclo2: parseFloat(values[11]),
            usciclo3: parseFloat(values[12]),
            usciclo4: parseFloat(values[13]),
            usciclo5: parseFloat(values[14]),
            si: parseFloat(values[15]),
            accmag: parseFloat(values[16]),
            microsds: parseFloat(values[17]),
            k3: parseFloat(values[18])
          };
          currentSession.measurements.push(measurement);
        } catch (error) {
          console.warn(`Error parseando línea de estabilidad: ${line}`);
        }
      }
    }
  }
  
  if (currentSession) {
    sessions.push(currentSession);
  }
  
  return sessions;
}

// Función para parsear archivo GPS
function parseGpsFile(content) {
  const lines = content.split('\n').filter(line => line.trim());
  const sessions = [];
  let currentSession = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('GPS;') && line.includes('Sesión:')) {
      if (currentSession) {
        sessions.push(currentSession);
      }
      
      const sessionMatch = line.match(/GPS;(\d{2}\/\d{2}\/\d{4}-\d{2}:\d{2}:\d{2});DOBACK(\d+);Sesión:(\d+)/);
      if (sessionMatch) {
        currentSession = {
          sessionNumber: parseInt(sessionMatch[3]),
          startTime: new Date(sessionMatch[1].replace(/(\d{2})\/(\d{2})\/(\d{4})-(\d{2}:\d{2}:\d{2})/, '$3-$2-$1 $4')),
          vehicleId: `DOBACK${sessionMatch[2]}`,
          measurements: []
        };
      }
    }
    else if (currentSession && line.includes('Hora Raspberry-') && line.includes('sin datos GPS')) {
      const timeMatch = line.match(/Hora Raspberry-(\d{2}:\d{2}:\d{2}),(\d{2}\/\d{2}\/\d{4})/);
      if (timeMatch) {
        const measurement = {
          timestamp: new Date(`${timeMatch[2].replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1')} ${timeMatch[1]}`),
          latitude: 0,
          longitude: 0,
          altitude: 0,
          speed: 0,
          satellites: 0,
          quality: 'NO_FIX',
          hdop: 0,
          fix: '0',
          heading: 0,
          accuracy: 0
        };
        currentSession.measurements.push(measurement);
      }
    }
    else if (currentSession && line.includes(',') && !line.includes('HoraRaspberry,Fecha,Hora(GPS)')) {
      const values = line.split(',');
      if (values.length >= 10) {
        try {
          const measurement = {
            timestamp: new Date(),
            latitude: parseFloat(values[3]) || 0,
            longitude: parseFloat(values[4]) || 0,
            altitude: parseFloat(values[5]) || 0,
            speed: parseFloat(values[9]) || 0,
            satellites: parseInt(values[8]) || 0,
            quality: values[7] === '1' ? 'GPS' : 'NO_FIX',
            hdop: parseFloat(values[6]) || 0,
            fix: values[7] || '0',
            heading: 0,
            accuracy: 0
          };
          currentSession.measurements.push(measurement);
        } catch (error) {
          console.warn(`Error parseando línea GPS: ${line}`);
        }
      }
    }
  }
  
  if (currentSession) {
    sessions.push(currentSession);
  }
  
  return sessions;
}

// Función para parsear archivo Rotativo
function parseRotativoFile(content) {
  const lines = content.split('\n').filter(line => line.trim());
  const sessions = [];
  let currentSession = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('ROTATIVO;') && line.includes('Sesión:')) {
      if (currentSession) {
        sessions.push(currentSession);
      }
      
      const sessionMatch = line.match(/ROTATIVO;(\d{2}\/\d{2}\/\d{4}-\d{2}:\d{2}:\d{2});DOBACK(\d+);Sesión:(\d+)/);
      if (sessionMatch) {
        currentSession = {
          sessionNumber: parseInt(sessionMatch[3]),
          startTime: new Date(sessionMatch[1].replace(/(\d{2})\/(\d{2})\/(\d{4})-(\d{2}:\d{2}:\d{2})/, '$3-$2-$1 $4')),
          vehicleId: `DOBACK${sessionMatch[2]}`,
          measurements: []
        };
      }
    }
    else if (currentSession && line.includes(';') && !line.includes('Fecha-Hora;Estado')) {
      const values = line.split(';');
      if (values.length >= 2) {
        try {
          const measurement = {
            timestamp: new Date(values[0].replace(/(\d{2})\/(\d{2})\/(\d{4})-(\d{2}:\d{2}:\d{2})/, '$3-$2-$1 $4')),
            state: values[1].trim()
          };
          currentSession.measurements.push(measurement);
        } catch (error) {
          console.warn(`Error parseando línea rotativo: ${line}`);
        }
      }
    }
  }
  
  if (currentSession) {
    sessions.push(currentSession);
  }
  
  return sessions;
}

// Función para validar archivos relacionados
function validateRelatedFiles(files) {
  const vehicleGroups = {};
  
  files.forEach(file => {
    const match = file.originalname.match(/^(ESTABILIDAD|GPS|ROTATIVO|CAN)_DOBACK(\d+)_(\d{8})\.txt$/);
    if (match) {
      const vehicleId = `DOBACK${match[2]}`;
      const date = match[3];
      const type = match[1].toLowerCase();
      
      if (!vehicleGroups[vehicleId]) {
        vehicleGroups[vehicleId] = {};
      }
      if (!vehicleGroups[vehicleId][date]) {
        vehicleGroups[vehicleId][date] = {};
      }
      
      vehicleGroups[vehicleId][date][type] = file;
    }
  });
  
  return vehicleGroups;
}

// Endpoint para subida múltiple de archivos
app.post('/api/upload/multiple', upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron archivos' });
    }
    
    console.log(`📁 Procesando ${req.files.length} archivos:`);
    req.files.forEach(file => console.log(`  - ${file.originalname}`));
    
    // Validar archivos relacionados
    const vehicleGroups = validateRelatedFiles(req.files);
    
    const results = [];
    const errors = [];
    
    // Procesar cada grupo de archivos por vehículo y fecha
    for (const [vehicleId, dates] of Object.entries(vehicleGroups)) {
      for (const [date, types] of Object.entries(dates)) {
        const groupResult = {
          vehicleId,
          date,
          files: {},
          sessions: {},
          totalSessions: 0,
          totalMeasurements: 0
        };
        
        // Procesar cada tipo de archivo en el grupo
        for (const [type, file] of Object.entries(types)) {
          try {
            const content = fs.readFileSync(file.path, 'utf8');
            let sessions = [];
            
            switch (type) {
              case 'estabilidad':
                sessions = parseStabilityFile(content);
                break;
              case 'gps':
                sessions = parseGpsFile(content);
                break;
              case 'rotativo':
                sessions = parseRotativoFile(content);
                break;
              case 'can':
                sessions = parseCanFile(content);
                break;
            }
            
            groupResult.files[type] = {
              fileName: file.originalname,
              sessionsCount: sessions.length,
              measurementsCount: sessions.reduce((sum, s) => sum + s.measurements.length, 0),
              fileSize: file.size
            };
            
            groupResult.sessions[type] = sessions.map(s => ({
              sessionNumber: s.sessionNumber,
              startTime: s.startTime,
              measurementsCount: s.measurements.length
            }));
            
            groupResult.totalSessions += sessions.length;
            groupResult.totalMeasurements += sessions.reduce((sum, s) => sum + s.measurements.length, 0);
            
            console.log(`✅ ${type.toUpperCase()}: ${sessions.length} sesiones, ${sessions.reduce((sum, s) => sum + s.measurements.length, 0)} mediciones`);
            
          } catch (error) {
            errors.push({
              file: file.originalname,
              error: error.message
            });
            console.error(`❌ Error procesando ${file.originalname}:`, error.message);
          }
        }
        
        results.push(groupResult);
        
        // Limpiar archivos temporales
        Object.values(types).forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
    }
    
    res.json({
      success: true,
      message: `Procesados ${req.files.length} archivos exitosamente`,
      data: {
        totalFiles: req.files.length,
        vehicleGroups: Object.keys(vehicleGroups).length,
        results,
        errors: errors.length > 0 ? errors : undefined
      }
    });
    
  } catch (error) {
    console.error('Error procesando archivos múltiples:', error);
    
    // Limpiar archivos temporales
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    res.status(500).json({
      error: 'Error procesando archivos múltiples',
      details: error.message
    });
  }
});

// Endpoint para subida de archivo individual (mantener compatibilidad)
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó archivo' });
    }
    
    console.log('📄 Procesando archivo individual:', req.file.originalname);
    
    // Parsear información del archivo
    const fileNamePattern = /^(ESTABILIDAD|GPS|ROTATIVO|CAN)_DOBACK(\d+)_(\d{8})\.txt$/;
    const match = req.file.originalname.match(fileNamePattern);
    
    if (!match) {
      return res.status(400).json({ 
        error: 'Formato de archivo inválido. Debe ser: TIPO_DOBACK###_YYYYMMDD.txt' 
      });
    }
    
    const fileInfo = {
      tipo: match[1].toLowerCase(),
      vehiculo: `DOBACK${match[2]}`,
      fecha: match[3]
    };
    
    // Leer contenido del archivo
    const content = fs.readFileSync(req.file.path, 'utf8');
    let sessions = [];
    
    switch (fileInfo.tipo) {
      case 'estabilidad':
        sessions = parseStabilityFile(content);
        break;
      case 'gps':
        sessions = parseGpsFile(content);
        break;
      case 'rotativo':
        sessions = parseRotativoFile(content);
        break;
      case 'can':
        sessions = parseCanFile(content);
        break;
    }
    
    // Limpiar archivo temporal
    fs.unlinkSync(req.file.path);
    
    res.json({
      success: true,
      message: `Archivo ${fileInfo.tipo.toUpperCase()} procesado exitosamente`,
      data: {
        fileName: req.file.originalname,
        vehicle: fileInfo.vehiculo,
        type: fileInfo.tipo,
        sessionsCount: sessions.length,
        totalMeasurements: sessions.reduce((sum, s) => sum + s.measurements.length, 0),
        fileSize: req.file.size,
        sessions: sessions.map(s => ({
          sessionNumber: s.sessionNumber,
          startTime: s.startTime,
          measurementsCount: s.measurements.length
        }))
      }
    });
    
  } catch (error) {
    console.error('Error procesando archivo:', error);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      error: 'Error procesando archivo',
      details: error.message
    });
  }
});

// Endpoint para obtener archivos subidos (versión mock)
app.get('/api/upload/files', (req, res) => {
  res.json({
    success: true,
    files: [
      {
        id: '1',
        nombre: 'ESTABILIDAD_DOBACK024_20250930.txt',
        tipo: 'estabilidad',
        vehicle_name: 'DOBACK024',
        fechaSubida: new Date().toISOString(),
        extraMetadata: {
          sessionsCount: 2,
          totalMeasurements: 89118
        }
      },
      {
        id: '2',
        nombre: 'GPS_DOBACK024_20250930.txt',
        tipo: 'gps',
        vehicle_name: 'DOBACK024',
        fechaSubida: new Date().toISOString(),
        extraMetadata: {
          sessionsCount: 1,
          totalMeasurements: 1280
        }
      }
    ]
  });
});

// Endpoint para análisis integral de archivos CMadrid (versión mock)
app.get('/api/upload/analyze-cmadrid', (req, res) => {
  res.json({
    success: true,
    analysis: {
      summary: {
        totalVehicles: 3,
        totalFiles: 27,
        totalSessions: 147,
        totalMeasurements: 538361,
        fileTypes: {
          estabilidad: 9,
          gps: 9,
          rotativo: 9,
          can: 0
        }
      },
      vehicles: {
        DOBACK024: {
          vehicleId: 'DOBACK024',
          files: { estabilidad: 3, gps: 3, rotativo: 3, can: 0 },
          sessions: 35,
          measurements: 276676
        },
        DOBACK027: {
          vehicleId: 'DOBACK027',
          files: { estabilidad: 3, gps: 3, rotativo: 3, can: 0 },
          sessions: 45,
          measurements: 90187
        },
        DOBACK028: {
          vehicleId: 'DOBACK028',
          files: { estabilidad: 3, gps: 3, rotativo: 3, can: 0 },
          sessions: 67,
          measurements: 171498
        }
      }
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Servidor de subida múltiple funcionando',
    features: ['Subida múltiple', 'Estabilidad', 'GPS', 'Rotativo', 'CAN']
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor de subida múltiple ejecutándose en puerto ${PORT}`);
  console.log(`📡 Endpoints disponibles:`);
  console.log(`   GET  /health - Health check`);
  console.log(`   GET  /api/upload/test - Prueba de endpoint`);
  console.log(`   POST /api/upload - Subir archivo individual`);
  console.log(`   POST /api/upload/multiple - Subir múltiples archivos`);
  console.log(`   GET  /api/upload/files - Listar archivos`);
  console.log(`   GET  /api/upload/analyze-cmadrid - Análisis CMadrid`);
  console.log(`\n📋 Tipos de archivo soportados:`);
  console.log(`   - ESTABILIDAD_DOBACK###_YYYYMMDD.txt`);
  console.log(`   - GPS_DOBACK###_YYYYMMDD.txt`);
  console.log(`   - ROTATIVO_DOBACK###_YYYYMMDD.txt`);
  console.log(`   - CAN_DOBACK###_YYYYMMDD.txt`);
});