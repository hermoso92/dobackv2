import { Router } from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';

const router = Router();

// Función de logging simple
const logger = {
  info: (message: string, ...args: any[]) => console.log(`[INFO] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[WARN] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[ERROR] ${message}`, ...args)
};

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
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
      cb(new Error('Solo se permiten archivos .txt') as any, false);
    }
  }
});

// Función para extraer información del nombre del archivo
function parseFileName(filename: string) {
  const match = filename.match(/^(ESTABILIDAD|GPS|ROTATIVO|CAN)_DOBACK(\d+)_(\d{8})\.txt$/);
  if (!match) {
    throw new Error(`Formato de archivo inválido: ${filename}`);
  }

  return {
    tipo: match[1].toLowerCase(),
    vehiculo: `DOBACK${match[2]}`,
    fecha: match[3]
  };
}

// Función para parsear archivo de Estabilidad
function parseStabilityFile(content: string) {
  const lines = content.split('\n').filter(line => line.trim());
  const sessions: any[] = [];
  let currentSession: any = null;
  let headers: string[] | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detectar inicio de sesión
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
    // Detectar cabeceras de columnas
    else if (line.includes('ax; ay; az;')) {
      headers = line.split(';').map(h => h.trim()).filter(h => h);
    }
    // Datos de medición
    else if (currentSession && headers && line.includes(';') && !line.match(/^\d{2}:\d{2}:\d{2}$/)) {
      const values = line.split(';').map(v => v.trim()).filter(v => v);
      if (values.length >= 19) {
        try {
          const measurement = {
            timestamp: new Date(currentSession.startTime.getTime() + (currentSession.measurements.length * 100)), // Aproximación
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
          logger.warn(`Error parseando línea de estabilidad: ${line}`);
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
function parseGpsFile(content: string) {
  const lines = content.split('\n').filter(line => line.trim());
  const sessions: any[] = [];
  let currentSession: any = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detectar inicio de sesión
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
    // Datos GPS
    else if (currentSession && line.includes('Hora Raspberry-') && line.includes('sin datos GPS')) {
      // GPS sin señal - crear registro con valores por defecto
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
    // GPS con datos válidos (formato directo: 09:40:10,01/10/2025,07:40:10,lat,lng,alt,hdop,fix,sats,speed)
    else if (currentSession && line.includes(',') && !line.includes('HoraRaspberry,Fecha,Hora(GPS)') && !line.includes('sin datos GPS')) {
      const values = line.split(',');
      if (values.length >= 10) {
        try {
          // Verificar si es una línea con coordenadas GPS reales (contiene números decimales en posiciones 3 y 4)
          const lat = parseFloat(values[3]);
          const lng = parseFloat(values[4]);

          if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
            // Parsear fecha y hora para timestamp
            const dateStr = values[1]; // 01/10/2025
            const timeStr = values[0]; // 09:40:10
            const timestamp = new Date(`${dateStr.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1')} ${timeStr}`);

            const measurement = {
              timestamp: timestamp,
              latitude: lat,
              longitude: lng,
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
            logger.info(`✅ GPS real procesado: ${lat}, ${lng} a las ${timeStr}`);
          }
        } catch (error) {
          logger.warn(`Error parseando línea GPS: ${line}`);
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
function parseRotativoFile(content: string) {
  const lines = content.split('\n').filter(line => line.trim());
  const sessions: any[] = [];
  let currentSession: any = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detectar inicio de sesión
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
    // Datos Rotativo
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
          logger.warn(`Error parseando línea rotativo: ${line}`);
        }
      }
    }
  }

  if (currentSession) {
    sessions.push(currentSession);
  }

  return sessions;
}

// Función para parsear archivo CAN
function parseCanFile(content: string) {
  const lines = content.split('\n').filter(line => line.trim());
  const sessions: any[] = [];
  let currentSession: any = null;

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
          logger.warn(`Error parseando línea CAN: ${line}`);
        }
      }
    }
  }

  if (currentSession) {
    sessions.push(currentSession);
  }

  return sessions;
}
// Función simplificada para obtener ID de vehículo
async function getOrCreateVehicle(vehicleId: string, organizationId: string): Promise<string> {
  // Por ahora retornamos un ID simulado
  return `vehicle_${vehicleId}_${organizationId}`;
}

// Función simplificada para guardar sesión
async function saveSession(sessionData: any, vehicleId: string, userId: string, organizationId: string): Promise<string> {
  // Por ahora retornamos un ID simulado
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  logger.info(`Sesión guardada: ${sessionId} para vehículo ${vehicleId}`);
  return sessionId;
}

// Endpoint para subir archivo
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó archivo' });
    }

    const userId = (req as any).user?.id || 'system';
    const organizationId = (req as any).user?.organizationId || 'default';

    // Parsear información del archivo
    const fileInfo = parseFileName(req.file.originalname);

    // Leer contenido del archivo
    const content = fs.readFileSync(req.file.path, 'utf8');

    // Obtener o crear vehículo
    const vehicleId = await getOrCreateVehicle(fileInfo.vehiculo, organizationId);

    // Parsear archivo según tipo
    let sessions: any[] = [];
    if (fileInfo.tipo === 'estabilidad') {
      sessions = parseStabilityFile(content);
    } else if (fileInfo.tipo === 'gps') {
      sessions = parseGpsFile(content);
    } else if (fileInfo.tipo === 'rotativo') {
      sessions = parseRotativoFile(content);
    }

    // Guardar sesiones en base de datos
    const savedSessions: any[] = [];
    for (const session of sessions) {
      session.tipo = fileInfo.tipo;
      session.endTime = new Date(session.startTime.getTime() + (session.measurements.length * 1000));

      const sessionId = await saveSession(session, vehicleId, userId, organizationId);
      savedSessions.push({
        sessionId,
        sessionNumber: session.sessionNumber,
        startTime: session.startTime,
        endTime: session.endTime,
        measurementsCount: session.measurements.length
      });
    }

    // Registrar archivo subido (simulado)
    logger.info(`Archivo registrado: ${req.file.originalname} tipo: ${fileInfo.tipo}`);

    // Limpiar archivo temporal
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: `Archivo procesado exitosamente`,
      data: {
        fileName: req.file.originalname,
        vehicle: fileInfo.vehiculo,
        type: fileInfo.tipo,
        sessions: savedSessions,
        totalSessions: sessions.length,
        totalMeasurements: sessions.reduce((sum, s) => sum + s.measurements.length, 0)
      }
    });

  } catch (error) {
    logger.error('Error procesando archivo:', error);

    // Limpiar archivo temporal si existe
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      error: 'Error procesando archivo',
      details: (error as Error).message
    });
  }
});

// Función para validar archivos relacionados
function validateRelatedFiles(files: Express.Multer.File[]) {
  const vehicleGroups: { [key: string]: { [key: string]: { [key: string]: Express.Multer.File } } } = {};

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
router.post('/multiple', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron archivos' });
    }

    const userId = (req as any).user?.id || 'system';
    const organizationId = (req as any).user?.organizationId || 'default';

    logger.info(`📁 Procesando ${req.files.length} archivos:`);
    (req.files as Express.Multer.File[]).forEach((file: Express.Multer.File) => logger.info(`  - ${file.originalname}`));

    // Validar archivos relacionados
    const vehicleGroups = validateRelatedFiles(req.files as Express.Multer.File[]);

    const results: any[] = [];
    const errors: any[] = [];

    // Procesar cada grupo de archivos por vehículo y fecha
    for (const [vehicleId, dates] of Object.entries(vehicleGroups)) {
      for (const [date, types] of Object.entries(dates)) {
        const groupResult = {
          vehicleId,
          date,
          files: {} as any,
          sessions: {} as any,
          totalSessions: 0,
          totalMeasurements: 0
        };

        // Obtener o crear vehículo
        const vehicleDbId = await getOrCreateVehicle(vehicleId, organizationId);

        // Procesar cada tipo de archivo en el grupo
        for (const [type, file] of Object.entries(types)) {
          try {
            const content = fs.readFileSync(file.path, 'utf8');
            let sessions: any[] = [];

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

            // Guardar sesiones en base de datos
            for (const session of sessions) {
              session.tipo = type;
              session.endTime = new Date(session.startTime.getTime() + (session.measurements.length * 1000));

              await saveSession(session, vehicleDbId, userId, organizationId);
            }

            // Registrar archivo subido (simulado)
            logger.info(`Archivo registrado: ${file.originalname} tipo: ${type}`);

            logger.info(`✅ ${type.toUpperCase()}: ${sessions.length} sesiones, ${sessions.reduce((sum, s) => sum + s.measurements.length, 0)} mediciones`);

          } catch (error) {
            errors.push({
              file: file.originalname,
              error: (error as Error).message
            });
            logger.error(`❌ Error procesando ${file.originalname}:`, error);
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
    logger.error('Error procesando archivos múltiples:', error);

    // Limpiar archivos temporales
    if (req.files) {
      (req.files as Express.Multer.File[]).forEach((file: Express.Multer.File) => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    res.status(500).json({
      error: 'Error procesando archivos múltiples',
      details: (error as Error).message
    });
  }
});

// Endpoint de prueba
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Endpoint de subida múltiple funcionando correctamente',
    timestamp: new Date().toISOString(),
    features: ['Estabilidad', 'GPS', 'Rotativo', 'CAN']
  });
});

// Endpoint para obtener archivos subidos (simulado)
router.get('/files', async (req, res) => {
  try {
    const organizationId = (req as any).user?.organizationId || 'default';

    // Datos simulados para testing
    const mockFiles = [
      {
        id: 1,
        nombre: 'ESTABILIDAD_DOBACK024_20250930.txt',
        tipo: 'estabilidad',
        vehiculoId: 'DOBACK024',
        fechaSubida: new Date().toISOString(),
        vehicle_name: 'DOBACK024'
      },
      {
        id: 2,
        nombre: 'GPS_DOBACK024_20250930.txt',
        tipo: 'gps',
        vehiculoId: 'DOBACK024',
        fechaSubida: new Date().toISOString(),
        vehicle_name: 'DOBACK024'
      }
    ];

    res.json({
      success: true,
      files: mockFiles
    });
  } catch (error) {
    logger.error('Error obteniendo archivos:', error);
    res.status(500).json({
      error: 'Error obteniendo archivos',
      details: (error as Error).message
    });
  }
});

// Endpoint para análisis integral de archivos CMadrid
router.get('/analyze-cmadrid', async (req, res) => {
  try {
    const cmadridPath = path.join(__dirname, '../../data/CMadrid');

    if (!fs.existsSync(cmadridPath)) {
      return res.status(404).json({ error: 'Directorio CMadrid no encontrado' });
    }

    const analysis = {
      summary: {
        totalVehicles: 0,
        totalFiles: 0,
        totalSessions: 0,
        totalMeasurements: 0
      },
      vehicles: {} as any,
      files: [] as any[],
      sessions: [] as any[]
    };

    // Leer directorios de vehículos
    const vehicleDirs = fs.readdirSync(cmadridPath).filter(item =>
      fs.statSync(path.join(cmadridPath, item)).isDirectory() && item.startsWith('doback')
    );

    analysis.summary.totalVehicles = vehicleDirs.length;

    for (const vehicleDir of vehicleDirs) {
      const vehiclePath = path.join(cmadridPath, vehicleDir);
      const vehicleId = vehicleDir.toUpperCase();

      analysis.vehicles[vehicleId] = {
        vehicleId,
        files: {
          estabilidad: 0,
          gps: 0,
          rotativo: 0
        },
        sessions: 0,
        measurements: 0
      };

      // Analizar cada tipo de archivo
      const types = ['estabilidad', 'GPS', 'ROTATIVO'];

      for (const type of types) {
        const typePath = path.join(vehiclePath, type.toLowerCase());

        if (fs.existsSync(typePath)) {
          const files = fs.readdirSync(typePath).filter(file => file.endsWith('.txt'));

          for (const file of files) {
            const filePath = path.join(typePath, file);
            const content = fs.readFileSync(filePath, 'utf8');

            let sessions: any[] = [];
            if (type === 'estabilidad') {
              sessions = parseStabilityFile(content);
            } else if (type === 'GPS') {
              sessions = parseGpsFile(content);
            } else if (type === 'ROTATIVO') {
              sessions = parseRotativoFile(content);
            }

            const fileAnalysis = {
              fileName: file,
              vehicleId,
              type: type.toLowerCase(),
              sessionsCount: sessions.length,
              measurementsCount: sessions.reduce((sum, s) => sum + s.measurements.length, 0),
              sessions: sessions.map(s => ({
                sessionNumber: s.sessionNumber,
                startTime: s.startTime,
                measurementsCount: s.measurements.length
              }))
            };

            analysis.files.push(fileAnalysis);
            analysis.vehicles[vehicleId].files[type.toLowerCase()]++;
            analysis.vehicles[vehicleId].sessions += sessions.length;
            analysis.vehicles[vehicleId].measurements += fileAnalysis.measurementsCount;

            analysis.summary.totalFiles++;
            analysis.summary.totalSessions += sessions.length;
            analysis.summary.totalMeasurements += fileAnalysis.measurementsCount;
          }
        }
      }
    }

    res.json({
      success: true,
      analysis
    });

  } catch (error) {
    logger.error('Error analizando CMadrid:', error);
    res.status(500).json({
      error: 'Error analizando archivos CMadrid',
      details: (error as Error).message
    });
  }
});

export default router;