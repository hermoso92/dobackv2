/**
 * ⚠️ DEPRECATED: Este controlador es antiguo
 * 
 * @deprecated Usar /api/upload-unified/unified en su lugar
 * 
 * PROBLEMAS:
 * - No detecta sesiones múltiples (1-62 por archivo)
 * - No valida calidad de datos
 * - No interpola GPS
 * - No guarda métricas de calidad
 * 
 * SISTEMA NUEVO:
 * - POST /api/upload-unified/unified
 * - UnifiedFileProcessor.ts
 * - RobustGPSParser, RobustStabilityParser, RobustRotativoParser
 * 
 * Mantener solo por compatibilidad temporal
 */

import { Router } from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { prisma } from '../config/prisma';
import { authenticate } from '../middleware/auth';
import { kpiCacheService } from '../services/KPICacheService';
import { unifiedFileProcessorV2 } from '../services/upload/UnifiedFileProcessorV2';
import { logger } from '../utils/logger';

const router = Router();

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
// Función para obtener o crear vehículo en la base de datos
async function getOrCreateVehicle(vehicleId: string, organizationId: string): Promise<string> {
  try {
    // Buscar vehículo existente
    let vehicle = await prisma.vehicle.findFirst({
      where: {
        identifier: vehicleId,
        organizationId: organizationId
      }
    });

    // Si no existe, crearlo
    if (!vehicle) {
      vehicle = await prisma.vehicle.create({
        data: {
          identifier: vehicleId,
          name: vehicleId,
          model: 'Fire Truck',
          licensePlate: `PLATE-${vehicleId}`,
          organizationId: organizationId,
          type: 'TRUCK',
          status: 'ACTIVE'
        }
      });
      logger.info(`✨ Vehículo creado: ${vehicleId}`);
    }

    await prisma.$disconnect();
    return vehicle.id;
  } catch (error) {
    logger.error('Error en getOrCreateVehicle:', error);
    throw error;
  }
}

// Función para guardar sesión en la base de datos (simplificada)
async function saveSession(sessionData: any, vehicleId: string, userId: string, organizationId: string): Promise<{ id: string; created: boolean }> {
  try {
    // Buscar o crear usuario del sistema
    let systemUser = await prisma.user.findFirst({
      where: {
        organizationId: organizationId,
        role: 'ADMIN'
      }
    });

    // Si no hay usuario admin, buscar cualquier usuario de la organización
    if (!systemUser) {
      systemUser = await prisma.user.findFirst({
        where: { organizationId: organizationId }
      });
    }

    const validUserId = systemUser?.id || userId;

    // Verificar si la sesión ya existe (para evitar duplicados)
    const existingSession = await prisma.session.findFirst({
      where: {
        vehicleId: vehicleId,
        startTime: sessionData.startTime,
        sessionNumber: sessionData.sessionNumber || 1,
        source: 'AUTOMATIC_UPLOAD'
      }
    });

    // Si la sesión ya existe, retornarla sin crear duplicado
    if (existingSession) {
      logger.info(`⚠️ Sesión ya existe, omitiendo: ${existingSession.id}`);
      return { id: existingSession.id, created: false };
    }

    // Crear sesión básica solo si no existe
    const session = await prisma.session.create({
      data: {
        vehicleId: vehicleId,
        organizationId: organizationId,
        startTime: sessionData.startTime,
        endTime: sessionData.endTime || new Date(),
        status: 'COMPLETED',
        userId: validUserId,
        sequence: sessionData.sessionNumber || 1,
        sessionNumber: sessionData.sessionNumber || 1,
        source: 'AUTOMATIC_UPLOAD'
      }
    });

    // Guardar mediciones según el tipo
    if (sessionData.tipo === 'gps' && sessionData.measurements) {
      await prisma.gpsMeasurement.createMany({
        data: sessionData.measurements.map((m: any) => ({
          sessionId: session.id,
          timestamp: m.timestamp,
          latitude: m.latitude || 0,
          longitude: m.longitude || 0,
          altitude: m.altitude || 0,
          speed: m.speed || 0,
          satellites: m.satellites || 0,
          quality: m.quality || 'NO_FIX'
        })),
        skipDuplicates: true
      });
    }

    if (sessionData.tipo === 'rotativo' && sessionData.measurements) {
      await prisma.rotativoMeasurement.createMany({
        data: sessionData.measurements.map((m: any) => ({
          sessionId: session.id,
          timestamp: m.timestamp,
          state: m.state || 'OFF'
        })),
        skipDuplicates: true
      });
    }

    // ❌ REMOVIDO: await prisma.$disconnect(); - No desconectar aquí (usa singleton)
    logger.info(`💾 Sesión guardada: ${session.id} (${sessionData.measurements?.length || 0} mediciones)`);
    return { id: session.id, created: true };
  } catch (error) {
    logger.error('Error en saveSession:', error);
    throw error;
  }
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
    const cmadridPath = path.join(__dirname, '../../data/datosDoback/CMadrid');

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

/**
 * GET /api/upload/files
 * Listar archivos subidos
 */
router.get('/files', async (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, '../../uploads');

    if (!fs.existsSync(uploadsDir)) {
      return res.json({
        success: true,
        data: { files: [] }
      });
    }

    const files = fs.readdirSync(uploadsDir).map(filename => ({
      name: filename,
      size: fs.statSync(path.join(uploadsDir, filename)).size,
      uploadedAt: fs.statSync(path.join(uploadsDir, filename)).mtime
    }));

    res.json({
      success: true,
      data: { files }
    });
  } catch (error) {
    logger.error('Error listando archivos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al listar archivos',
      details: (error as Error).message
    });
  }
});

/**
 * GET /api/upload/recent-sessions
 * Obtener sesiones recientes
 */
router.get('/recent-sessions', async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        vehicle: {
          select: {
            name: true,
            identifier: true
          }
        }
      }
    });

    await prisma.$disconnect();

    res.json({
      success: true,
      data: {
        sessions: sessions.map((s: any) => ({
          id: s.id,
          vehicleName: s.vehicle?.name || s.vehicle?.identifier || 'Desconocido',
          startTime: s.startTime,
          endTime: s.endTime,
          createdAt: s.createdAt
        }))
      }
    });
  } catch (error) {
    logger.error('Error obteniendo sesiones recientes:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener sesiones',
      details: (error as Error).message
    });
  }
});

/**
 * POST /api/upload/process-all-cmadrid
 * Procesar automáticamente todos los archivos de CMadrid
 * ✅ ACTUALIZADO: Usa UnifiedFileProcessor para correlación correcta
 * ✅ Ahora correlaciona ESTABILIDAD + GPS + ROTATIVO del mismo día
 */
router.post('/process-all-cmadrid', authenticate, async (req, res) => {
  try {
    // ✅ Incrementar timeout para procesamiento largo
    req.setTimeout(600000); // 10 minutos
    res.setTimeout(600000);

    logger.info('🚀 Iniciando procesamiento automático UNIFICADO de CMadrid...');

    // ✅ NUEVO: Leer configuración del request (si viene del frontend)
    const uploadConfig = req.body.config;
    if (uploadConfig) {
      logger.info('⚙️ Usando configuración personalizada del frontend', uploadConfig);
      // TODO: Aplicar configuración a UnifiedFileProcessorV2
    }

    // ✅ Asegurar que Prisma esté conectado (crítico para procesamiento masivo)
    try {
      await prisma.$connect();
      logger.info('✅ Prisma conectado correctamente');
    } catch (err) {
      logger.warn('⚠️ Prisma ya estaba conectado');
    }

    // UUIDs fijos del usuario/organización SYSTEM (creados en seed)
    const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001';
    const SYSTEM_ORG_ID = '00000000-0000-0000-0000-000000000002';

    const userId = (req as any).user?.id || SYSTEM_USER_ID;
    const organizationId = (req as any).user?.organizationId || SYSTEM_ORG_ID;
    // cambio aquí
    if (!(req as any).user?.organizationId) {
      logger.warn('⚠️ organizationId no presente en usuario autenticado, usando SYSTEM_ORG_ID por fallback', { SYSTEM_ORG_ID });
    }

    // ✅ RUTA CORRECTA: backend/data/datosDoback/CMadrid (carpeta oficial)
    const cmadridPath = path.join(__dirname, '../../data/datosDoback/CMadrid');

    if (!fs.existsSync(cmadridPath)) {
      return res.status(404).json({
        success: false,
        error: 'Directorio CMadrid no encontrado'
      });
    }

    const vehicleResults: Map<string, any> = new Map();
    let totalArchivosLeidos = 0;
    let totalSesionesCreadas = 0;

    // Leer directorios de vehículos
    const vehicleDirs = fs.readdirSync(cmadridPath).filter(item =>
      fs.statSync(path.join(cmadridPath, item)).isDirectory() && item.toLowerCase().startsWith('doback')
    );

    logger.info(`📁 Encontrados ${vehicleDirs.length} vehículos en CMadrid`);

    for (const vehicleDir of vehicleDirs) {
      try {
        const vehiclePath = path.join(cmadridPath, vehicleDir);
        const vehicleId = vehicleDir.toUpperCase();

        logger.info(`🚗 Procesando vehículo: ${vehicleId}`);

        // Agrupar archivos por fecha para este vehículo
        const archivosPorFecha: Map<string, any> = new Map();

        // Leer archivos de cada tipo (case-insensitive)
        const typeVariants = {
          estabilidad: ['estabilidad', 'ESTABILIDAD', 'Estabilidad'],
          gps: ['gps', 'GPS', 'Gps'],
          rotativo: ['rotativo', 'ROTATIVO', 'Rotativo']
        };

        for (const [type, variants] of Object.entries(typeVariants)) {
          let typePath: string | null = null;

          // Buscar cuál variante existe
          for (const variant of variants) {
            const testPath = path.join(vehiclePath, variant);
            if (fs.existsSync(testPath)) {
              typePath = testPath;
              break;
            }
          }

          if (typePath) {
            const files = fs.readdirSync(typePath).filter(f => f.endsWith('.txt'));

            for (const file of files) {
              // Extraer fecha del nombre del archivo
              const matchFecha = file.match(/_(\d{8})\.txt$/);
              if (!matchFecha) continue;

              const fechaStr = matchFecha[1]; // YYYYMMDD

              // ✅ CORRECCIÓN: Mantener formato YYYYMMDD (sin guiones)
              // UnifiedFileProcessorV2 espera este formato
              const fecha = fechaStr;

              if (!archivosPorFecha.has(fecha)) {
                archivosPorFecha.set(fecha, {
                  fecha,
                  archivos: {}
                });
              }

              const grupo = archivosPorFecha.get(fecha);
              const filePath = path.join(typePath, file);

              grupo.archivos[type] = {
                nombre: file,
                buffer: fs.readFileSync(filePath)
              };

              totalArchivosLeidos++;
            }
          }
        }

        logger.info(`📦 Encontrados ${archivosPorFecha.size} días con datos para ${vehicleId}`);

        // Inicializar stats del vehículo
        vehicleResults.set(vehicleId, {
          vehicle: vehicleId,
          savedSessions: 0,
          skippedSessions: 0,
          filesProcessed: 0,
          sessionDetails: [], // ✅ Detalles por sesión (ÚNICO dato enviado)
          errors: []
        });

        const vehicleStats = vehicleResults.get(vehicleId);

        // Procesar cada día usando UnifiedFileProcessor
        for (const [fecha, grupo] of archivosPorFecha.entries()) {
          logger.info(`📅 Procesando fecha: ${fecha}`);

          // ✅ DEBUG: Ver qué archivos están en el grupo
          logger.info(`   🔍 DEBUG Grupo: EST=${!!grupo.archivos.estabilidad}, GPS=${!!grupo.archivos.gps}, ROT=${!!grupo.archivos.rotativo}`);
          if (grupo.archivos.estabilidad) logger.info(`   → ESTABILIDAD: ${grupo.archivos.estabilidad.nombre}`);
          if (grupo.archivos.gps) logger.info(`   → GPS: ${grupo.archivos.gps.nombre}`);
          if (grupo.archivos.rotativo) logger.info(`   → ROTATIVO: ${grupo.archivos.rotativo.nombre}`);

          try {
            // Preparar archivos para UnifiedFileProcessor
            const archivosArray: Array<{ nombre: string; buffer: Buffer }> = [];

            if (grupo.archivos.estabilidad) {
              archivosArray.push({
                nombre: grupo.archivos.estabilidad.nombre,
                buffer: grupo.archivos.estabilidad.buffer
              });
            }

            if (grupo.archivos.gps) {
              archivosArray.push({
                nombre: grupo.archivos.gps.nombre,
                buffer: grupo.archivos.gps.buffer
              });
            }

            if (grupo.archivos.rotativo) {
              archivosArray.push({
                nombre: grupo.archivos.rotativo.nombre,
                buffer: grupo.archivos.rotativo.buffer
              });
            }

            // ✅ Procesar con UnifiedFileProcessorV2 (correlación correcta con reglas estructuradas)
            const resultado = await unifiedFileProcessorV2.procesarArchivos(
              archivosArray,
              organizationId,
              userId,
              uploadConfig // ✅ NUEVO: Pasar configuración personalizada
            );

            // Contar sesiones
            totalSesionesCreadas += resultado.sesionesCreadas;
            vehicleStats.savedSessions += resultado.sesionesCreadas;
            vehicleStats.filesProcessed += archivosArray.length;
            vehicleStats.sessionDetails = vehicleStats.sessionDetails || [];

            // ✅ Agregar detalles de sesiones con nombres de archivos (SIMPLIFICADO)
            if (resultado.sessionDetails && resultado.sessionDetails.length > 0) {
              vehicleStats.sessionDetails.push(...resultado.sessionDetails);
            }

            // ✅ NO agregamos archivos individuales (demasiado pesado para JSON)
            // Solo mantenemos sessionDetails que es lo que el frontend necesita

            logger.info(`✅ ${fecha}: ${resultado.sesionesCreadas} sesiones creadas (correlacionadas)`);

          } catch (error: any) {
            logger.error(`❌ Error procesando fecha ${fecha}:`, error);
            vehicleStats.errors.push(`Error en fecha ${fecha}: ${error.message}`);
          }
        }
      } catch (vehicleError: any) {
        logger.error(`❌ Error procesando vehículo ${vehicleDir}:`, vehicleError);
        if (!vehicleResults.has(vehicleDir)) {
          vehicleResults.set(vehicleDir, {
            vehicleId: vehicleDir.toUpperCase(),
            filesProcessed: 0,
            sessionsCreated: 0,
            errors: [`Error general del vehículo: ${vehicleError.message}`],
            sessionDetails: []
          });
        }
      }
    }

    const resultsArray = Array.from(vehicleResults.values());

    // ✅ NUEVO: Recopilar todos los sessionIds para post-procesamiento
    const allSessionIds: string[] = [];
    for (const vehicleResult of resultsArray) {
      if (vehicleResult.sessionDetails) {
        for (const sessionDetail of vehicleResult.sessionDetails) {
          if (sessionDetail.sessionId) {
            allSessionIds.push(sessionDetail.sessionId);
          }
        }
      }
    }

    // ✅ NUEVO: Ejecutar post-procesamiento automático (generar eventos y segmentos)
    if (allSessionIds.length > 0) {
      logger.info(`🔄 Iniciando post-procesamiento para ${allSessionIds.length} sesiones...`);

      try {
        const { UploadPostProcessor } = await import('../services/upload/UploadPostProcessor');
        const postProcessResult = await UploadPostProcessor.process(allSessionIds);

        logger.info('✅ Post-procesamiento completado', {
          eventsGenerated: postProcessResult.eventsGenerated,
          segmentsGenerated: postProcessResult.segmentsGenerated,
          duration: postProcessResult.duration
        });

        // ✅ Agregar eventos a sessionDetails de cada vehículo
        if (postProcessResult.sessionDetails) {
          const eventsBySession = new Map(
            postProcessResult.sessionDetails.map(s => [s.sessionId, s])
          );

          logger.info(`📋 Post-procesamiento completó con detalles de eventos`, {
            totalSessions: postProcessResult.sessionDetails.length,
            totalEvents: postProcessResult.eventsGenerated,
            firstSessionExample: postProcessResult.sessionDetails[0]
          });

          for (const vehicleResult of resultsArray) {
            if (vehicleResult.sessionDetails) {
              vehicleResult.sessionDetails = vehicleResult.sessionDetails.map((session: any) => {
                const eventData = eventsBySession.get(session.sessionId);
                return {
                  ...session,
                  eventsGenerated: eventData?.eventsGenerated || 0,
                  segmentsGenerated: eventData?.segmentsGenerated || 0,
                  events: eventData?.events || []
                };
              });
            }
          }

          logger.info(`📊 Eventos agregados a sessionDetails`, {
            vehiclesWithData: resultsArray.filter(v => v.sessionDetails?.some((s: any) => s.eventsGenerated > 0)).length
          });
        }
      } catch (error: any) {
        logger.error('❌ Error en post-procesamiento:', error);
        // Continuar sin fallar
      }
    }

    // Invalidar cache de KPIs
    if (totalSesionesCreadas > 0) {
      kpiCacheService.invalidate(organizationId);
      logger.info('✅ Cache de KPIs invalidado');
    }

    logger.info(`✅ Procesamiento completado: ${totalArchivosLeidos} archivos, ${totalSesionesCreadas} sesiones creadas`);

    // ✅ Preparar respuesta final con eventos (ya agregados por el post-procesamiento)
    const responseData = {
      success: true,
      data: {
        message: 'Procesamiento automático completado con correlación unificada y eventos detallados',
        totalFiles: totalArchivosLeidos,
        totalSaved: totalSesionesCreadas,
        totalSkipped: 0,
        vehiclesProcessed: vehicleDirs.length,
        results: resultsArray, // ✅ Ya incluye eventos y segmentos del post-procesamiento
        processingMethod: 'UnifiedFileProcessor V2 + PostProcessor (eventos automáticos)'
      }
    };

    // Log para debugging
    const responseSize = JSON.stringify(responseData).length;
    const totalSessionDetails = resultsArray.reduce((sum, v) => sum + (v.sessionDetails?.length || 0), 0);
    logger.info(`📤 Enviando respuesta: ${Math.round(responseSize / 1024)} KB, ${totalSessionDetails} detalles de sesiones`);

    res.json(responseData);

  } catch (error) {
    logger.error('❌ Error en procesamiento automático:', error);
    res.status(500).json({
      success: false,
      error: 'Error en procesamiento automático',
      details: (error as Error).message
    });
  }
});

/**
 * 🔄 ENDPOINT: Regenerar eventos de todas las sesiones existentes
 * Útil después de actualizar la lógica de detección de eventos
 */
router.post('/regenerate-all-events', async (req: Request, res: Response) => {
  try {
    logger.info('🔄 Iniciando regeneración completa de eventos...');

    // 1. Eliminar todos los eventos existentes
    const deleteResult = await prisma.$executeRaw`DELETE FROM stability_events`;
    logger.info(`🗑️ Eventos eliminados: ${deleteResult}`);

    // 2. Obtener todas las sesiones
    const sessions = await prisma.session.findMany({
      select: { id: true },
      orderBy: { startTime: 'desc' }
    });

    logger.info(`📋 Regenerando eventos para ${sessions.length} sesiones...`);

    // 3. Regenerar eventos con el post-processor
    const { UploadPostProcessor } = await import('../services/upload/UploadPostProcessor');
    const sessionIds = sessions.map(s => s.id);

    const result = await UploadPostProcessor.process(sessionIds);

    logger.info('✅ Regeneración completada', {
      totalSessions: sessions.length,
      eventsGenerated: result.eventsGenerated,
      segmentsGenerated: result.segmentsGenerated,
      duration: result.duration,
      errors: result.errors.length
    });

    res.json({
      success: true,
      data: {
        totalSessions: sessions.length,
        eventsGenerated: result.eventsGenerated,
        segmentsGenerated: result.segmentsGenerated,
        duration: result.duration,
        errors: result.errors
      }
    });

  } catch (error: any) {
    logger.error('❌ Error regenerando eventos:', error);
    res.status(500).json({
      success: false,
      error: 'Error regenerando eventos',
      details: error.message
    });
  }
});

export default router;