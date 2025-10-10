const fs = require('fs');
const path = require('path');

// Función para parsear archivo de Estabilidad
function parseStabilityFile(content, fileName) {
  const lines = content.split('\n').filter(line => line.trim());
  const sessions = [];
  let currentSession = null;
  let headers = null;
  
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
          startTime: sessionMatch[1],
          vehicleId: `DOBACK${sessionMatch[2]}`,
          fileName: fileName,
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
function parseGpsFile(content, fileName) {
  const lines = content.split('\n').filter(line => line.trim());
  const sessions = [];
  let currentSession = null;
  
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
          startTime: sessionMatch[1],
          vehicleId: `DOBACK${sessionMatch[2]}`,
          fileName: fileName,
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
          timestamp: `${timeMatch[2]} ${timeMatch[1]}`,
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
    // GPS con datos válidos (si los hay)
    else if (currentSession && line.includes(',') && !line.includes('HoraRaspberry,Fecha,Hora(GPS)')) {
      const values = line.split(',');
      if (values.length >= 10) {
        try {
          const measurement = {
            timestamp: line.split(',')[0],
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
function parseRotativoFile(content, fileName) {
  const lines = content.split('\n').filter(line => line.trim());
  const sessions = [];
  let currentSession = null;
  
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
          startTime: sessionMatch[1],
          vehicleId: `DOBACK${sessionMatch[2]}`,
          fileName: fileName,
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
            timestamp: values[0].trim(),
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

// Función principal de análisis
function analyzeCMadridFiles() {
  const cmadridPath = path.join(__dirname, 'data/CMadrid');
  
  if (!fs.existsSync(cmadridPath)) {
    console.error('Directorio CMadrid no encontrado');
    return;
  }
  
  const analysis = {
    summary: {
      totalVehicles: 0,
      totalFiles: 0,
      totalSessions: 0,
      totalMeasurements: 0,
      analysisDate: new Date().toISOString()
    },
    vehicles: {},
    files: [],
    sessions: [],
    metrics: {
      stability: {
        totalSessions: 0,
        totalMeasurements: 0,
        avgMeasurementsPerSession: 0,
        variables: ['ax', 'ay', 'az', 'gx', 'gy', 'gz', 'roll', 'pitch', 'yaw', 'timeantwifi', 'usciclo1', 'usciclo2', 'usciclo3', 'usciclo4', 'usciclo5', 'si', 'accmag', 'microsds', 'k3']
      },
      gps: {
        totalSessions: 0,
        totalMeasurements: 0,
        avgMeasurementsPerSession: 0,
        noFixCount: 0,
        noFixPercentage: 0,
        variables: ['timestamp', 'latitude', 'longitude', 'altitude', 'speed', 'satellites', 'quality', 'hdop', 'fix', 'heading', 'accuracy']
      },
      rotativo: {
        totalSessions: 0,
        totalMeasurements: 0,
        avgMeasurementsPerSession: 0,
        onCount: 0,
        offCount: 0,
        onPercentage: 0,
        variables: ['timestamp', 'state']
      }
    }
  };
  
  console.log('🔍 Iniciando análisis integral de archivos CMadrid...');
  
  // Leer directorios de vehículos
  const vehicleDirs = fs.readdirSync(cmadridPath).filter(item => 
    fs.statSync(path.join(cmadridPath, item)).isDirectory() && item.startsWith('doback')
  );
  
  analysis.summary.totalVehicles = vehicleDirs.length;
  console.log(`📊 Vehículos encontrados: ${vehicleDirs.length}`);
  
  for (const vehicleDir of vehicleDirs) {
    const vehiclePath = path.join(cmadridPath, vehicleDir);
    const vehicleId = vehicleDir.toUpperCase();
    
    console.log(`\n🚗 Analizando vehículo: ${vehicleId}`);
    
    analysis.vehicles[vehicleId] = {
      vehicleId,
      files: {
        estabilidad: 0,
        gps: 0,
        rotativo: 0
      },
      sessions: 0,
      measurements: 0,
      sessionsByType: {
        estabilidad: 0,
        gps: 0,
        rotativo: 0
      }
    };
    
    // Analizar cada tipo de archivo
    const types = ['estabilidad', 'GPS', 'ROTATIVO'];
    
    for (const type of types) {
      const typePath = path.join(vehiclePath, type.toLowerCase());
      
      if (fs.existsSync(typePath)) {
        const files = fs.readdirSync(typePath).filter(file => file.endsWith('.txt'));
        console.log(`  📁 ${type}: ${files.length} archivos`);
        
        for (const file of files) {
          const filePath = path.join(typePath, file);
          const content = fs.readFileSync(filePath, 'utf8');
          
          let sessions = [];
          if (type === 'estabilidad') {
            sessions = parseStabilityFile(content, file);
          } else if (type === 'GPS') {
            sessions = parseGpsFile(content, file);
          } else if (type === 'ROTATIVO') {
            sessions = parseRotativoFile(content, file);
          }
          
          const fileAnalysis = {
            fileName: file,
            vehicleId,
            type: type.toLowerCase(),
            sessionsCount: sessions.length,
            measurementsCount: sessions.reduce((sum, s) => sum + s.measurements.length, 0),
            fileSize: fs.statSync(filePath).size,
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
          analysis.vehicles[vehicleId].sessionsByType[type.toLowerCase()] += sessions.length;
          
          analysis.summary.totalFiles++;
          analysis.summary.totalSessions += sessions.length;
          analysis.summary.totalMeasurements += fileAnalysis.measurementsCount;
          
          // Actualizar métricas por tipo
          if (type === 'estabilidad') {
            analysis.metrics.stability.totalSessions += sessions.length;
            analysis.metrics.stability.totalMeasurements += fileAnalysis.measurementsCount;
          } else if (type === 'GPS') {
            analysis.metrics.gps.totalSessions += sessions.length;
            analysis.metrics.gps.totalMeasurements += fileAnalysis.measurementsCount;
            // Contar registros sin fix
            const noFixCount = sessions.reduce((sum, s) => 
              sum + s.measurements.filter(m => m.quality === 'NO_FIX').length, 0);
            analysis.metrics.gps.noFixCount += noFixCount;
          } else if (type === 'ROTATIVO') {
            analysis.metrics.rotativo.totalSessions += sessions.length;
            analysis.metrics.rotativo.totalMeasurements += fileAnalysis.measurementsCount;
            // Contar estados ON/OFF
            const onCount = sessions.reduce((sum, s) => 
              sum + s.measurements.filter(m => m.state === '1').length, 0);
            const offCount = sessions.reduce((sum, s) => 
              sum + s.measurements.filter(m => m.state === '0').length, 0);
            analysis.metrics.rotativo.onCount += onCount;
            analysis.metrics.rotativo.offCount += offCount;
          }
          
          console.log(`    📄 ${file}: ${sessions.length} sesiones, ${fileAnalysis.measurementsCount} mediciones`);
        }
      }
    }
  }
  
  // Calcular promedios y porcentajes
  if (analysis.metrics.stability.totalSessions > 0) {
    analysis.metrics.stability.avgMeasurementsPerSession = 
      Math.round(analysis.metrics.stability.totalMeasurements / analysis.metrics.stability.totalSessions);
  }
  
  if (analysis.metrics.gps.totalSessions > 0) {
    analysis.metrics.gps.avgMeasurementsPerSession = 
      Math.round(analysis.metrics.gps.totalMeasurements / analysis.metrics.gps.totalSessions);
    analysis.metrics.gps.noFixPercentage = 
      Math.round((analysis.metrics.gps.noFixCount / analysis.metrics.gps.totalMeasurements) * 100);
  }
  
  if (analysis.metrics.rotativo.totalSessions > 0) {
    analysis.metrics.rotativo.avgMeasurementsPerSession = 
      Math.round(analysis.metrics.rotativo.totalMeasurements / analysis.metrics.rotativo.totalSessions);
    analysis.metrics.rotativo.onPercentage = 
      Math.round((analysis.metrics.rotativo.onCount / analysis.metrics.rotativo.totalMeasurements) * 100);
  }
  
  // Guardar análisis completo
  const outputPath = path.join(__dirname, 'analisis_integral_cmadrid.json');
  fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
  
  // Generar reporte en texto
  const reportPath = path.join(__dirname, 'analisis_integral_cmadrid.txt');
  let report = `ANÁLISIS INTEGRAL ARCHIVOS CMADRID
=====================================
Fecha de análisis: ${new Date().toLocaleString('es-ES')}

RESUMEN GENERAL
--------------
Total vehículos: ${analysis.summary.totalVehicles}
Total archivos: ${analysis.summary.totalFiles}
Total sesiones: ${analysis.summary.totalSessions}
Total mediciones: ${analysis.summary.totalMeasurements.toLocaleString()}

MÉTRICAS POR TIPO DE ARCHIVO
----------------------------

ESTABILIDAD:
- Sesiones: ${analysis.metrics.stability.totalSessions}
- Mediciones: ${analysis.metrics.stability.totalMeasurements.toLocaleString()}
- Promedio mediciones/sesión: ${analysis.metrics.stability.avgMeasurementsPerSession}
- Variables: ${analysis.metrics.stability.variables.join(', ')}

GPS:
- Sesiones: ${analysis.metrics.gps.totalSessions}
- Mediciones: ${analysis.metrics.gps.totalMeasurements.toLocaleString()}
- Promedio mediciones/sesión: ${analysis.metrics.gps.avgMeasurementsPerSession}
- Registros sin fix: ${analysis.metrics.gps.noFixCount.toLocaleString()} (${analysis.metrics.gps.noFixPercentage}%)
- Variables: ${analysis.metrics.gps.variables.join(', ')}

ROTATIVO:
- Sesiones: ${analysis.metrics.rotativo.totalSessions}
- Mediciones: ${analysis.metrics.rotativo.totalMeasurements.toLocaleString()}
- Promedio mediciones/sesión: ${analysis.metrics.rotativo.avgMeasurementsPerSession}
- Estado ON: ${analysis.metrics.rotativo.onCount.toLocaleString()} (${analysis.metrics.rotativo.onPercentage}%)
- Estado OFF: ${analysis.metrics.rotativo.offCount.toLocaleString()}
- Variables: ${analysis.metrics.rotativo.variables.join(', ')}

DETALLE POR VEHÍCULO
-------------------
`;

  for (const [vehicleId, vehicle] of Object.entries(analysis.vehicles)) {
    report += `${vehicleId}:
  Archivos: Estabilidad=${vehicle.files.estabilidad}, GPS=${vehicle.files.gps}, Rotativo=${vehicle.files.rotativo}
  Sesiones: ${vehicle.sessions} (Estabilidad=${vehicle.sessionsByType.estabilidad}, GPS=${vehicle.sessionsByType.gps}, Rotativo=${vehicle.sessionsByType.rotativo})
  Mediciones: ${vehicle.measurements.toLocaleString()}

`;
  }

  report += `
DETALLE POR ARCHIVO
------------------
`;

  for (const file of analysis.files) {
    report += `${file.fileName} (${file.vehicleId}):
  Tipo: ${file.type.toUpperCase()}
  Sesiones: ${file.sessionsCount}
  Mediciones: ${file.measurementsCount.toLocaleString()}
  Tamaño: ${(file.fileSize / 1024).toFixed(2)} KB
  Detalle sesiones:
`;
    for (const session of file.sessions) {
      report += `    - Sesión ${session.sessionNumber}: ${session.startTime} (${session.measurementsCount} mediciones)
`;
    }
    report += `
`;
  }

  fs.writeFileSync(reportPath, report);
  
  console.log('\n✅ Análisis completado exitosamente');
  console.log(`📄 Reporte JSON guardado en: ${outputPath}`);
  console.log(`📄 Reporte texto guardado en: ${reportPath}`);
  
  // Mostrar resumen en consola
  console.log('\n📊 RESUMEN DEL ANÁLISIS:');
  console.log(`Vehículos: ${analysis.summary.totalVehicles}`);
  console.log(`Archivos: ${analysis.summary.totalFiles}`);
  console.log(`Sesiones: ${analysis.summary.totalSessions}`);
  console.log(`Mediciones: ${analysis.summary.totalMeasurements.toLocaleString()}`);
  console.log(`\nEstabilidad: ${analysis.metrics.stability.totalSessions} sesiones, ${analysis.metrics.stability.totalMeasurements.toLocaleString()} mediciones`);
  console.log(`GPS: ${analysis.metrics.gps.totalSessions} sesiones, ${analysis.metrics.gps.totalMeasurements.toLocaleString()} mediciones (${analysis.metrics.gps.noFixPercentage}% sin fix)`);
  console.log(`Rotativo: ${analysis.metrics.rotativo.totalSessions} sesiones, ${analysis.metrics.rotativo.totalMeasurements.toLocaleString()} mediciones (${analysis.metrics.rotativo.onPercentage}% ON)`);
  
  return analysis;
}

// Ejecutar análisis si se llama directamente
if (require.main === module) {
  analyzeCMadridFiles();
}

module.exports = { analyzeCMadridFiles, parseStabilityFile, parseGpsFile, parseRotativoFile };
