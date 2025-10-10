# 📋 PLAN COMPLETO DE IMPLEMENTACIÓN
## DobackSoft - Dashboard Funcional 100%

**Fecha:** 10 de octubre de 2025  
**Objetivo:** Modificar aplicación existente para que funcione 100% con análisis realizado

---

## 🎯 OBJETIVO PRINCIPAL

El cliente quiere que funcionen las **3 pestañas del dashboard:**
1. ⏱️ Estados y Tiempos
2. 📍 Puntos Negros  
3. 🚗 Velocidad

Para eso, toda la aplicación (backend, frontend, BD, APIs externas) debe estar integrada correctamente.

---

## 📊 ESTADO ACTUAL

### ✅ LO QUE ESTÁ HECHO:
1. **Análisis exhaustivo completo** (100%)
   - 87 sesiones detectadas
   - Todos los patrones descubiertos
   - Documentación completa

2. **Servicios backend creados** (100%)
   - `kpiCalculator.ts` → KPIs completos
   - `keyCalculator.ts` → Claves 0,1,2,3,5
   - `eventDetector.ts` → Eventos de estabilidad
   - `speedAnalyzer.ts` → Análisis de velocidad
   - `emergencyDetector.ts` → Detección de emergencias

3. **Parser corregido** (100%)
   - `process-multi-session-correct.js`
   - Detecta 87 sesiones vs 20 anteriores
   - Extrae timestamps reales

4. **APIs existentes:**
   - `/api/hotspots/critical-points` ✅
   - `/api/speed/violations` ✅
   - `/api/v1/kpis/summary` ✅
   - `radarService.ts` ✅
   - `GeofenceService.ts` ✅

### ❌ LO QUE FALTA:
1. **Backend:**
   - Compilación TypeScript con errores
   - Endpoints NO usan los nuevos servicios
   - Geocercas de parques NO están en BD

2. **Frontend:**
   - Dashboard NO muestra datos de nuevos servicios
   - Filtros NO se aplican correctamente
   - Índice de Estabilidad NO se visualiza

3. **Integración:**
   - Radar.com NO integrado con keyCalculator
   - TomTom NO integrado con speedAnalyzer
   - Reportes NO usan nuevos KPIs

---

## 🚀 PLAN DE IMPLEMENTACIÓN (12 PASOS)

### **FASE 1: BACKEND (Pasos 1-5)**

#### **PASO 1: Resolver Compilación TypeScript** ⏱️ 15 min
**Archivo:** `backend/tsconfig.json`
- ✅ Ya excluye `/tests`
- ⚠️ Verificar errores en archivos antiguos
- 🎯 Objetivo: `npm run build` sin errores

**Comandos:**
```bash
cd backend
npm run build
```

---

#### **PASO 2: Modificar /api/v1/kpis/states** ⏱️ 30 min
**Archivo:** `backend/src/routes/kpis.ts`

**Problema actual:**
```typescript
// LÍNEA 100-113: Estados hardcodeados en 0
const states = {
    states: [
        { key: 0, name: 'Taller', duration_seconds: 0, ... },
        { key: 1, name: 'Operativo en Parque', duration_seconds: 0, ... },
        // ...
    ]
};
```

**Solución:**
```typescript
// Usar keyCalculator para obtener datos REALES
import { keyCalculator } from '../services/keyCalculator';

router.get('/states', authenticate, async (req: Request, res: Response) => {
    try {
        const organizationId = (req as any).user?.organizationId;
        const from = req.query.from as string;
        const to = req.query.to as string;
        const vehicleIds = req.query['vehicleIds[]'] as string[] | undefined;

        // Obtener sesiones
        const sessionsWhere: any = { organizationId };
        if (from && to) {
            sessionsWhere.startTime = { gte: new Date(from), lte: new Date(to) };
        }
        if (vehicleIds) {
            sessionsWhere.vehicleId = { in: vehicleIds };
        }

        const sessions = await prisma.session.findMany({ where: sessionsWhere });
        const sessionIds = sessions.map(s => s.id);

        // Calcular tiempos por clave (REAL)
        const tiemposPorClave = await keyCalculator.calcularTiemposPorClave(sessionIds);

        res.json({
            success: true,
            data: {
                states: [
                    { key: 0, name: 'Taller', duration_seconds: tiemposPorClave.clave0_segundos, ... },
                    { key: 1, name: 'Operativo en Parque', duration_seconds: tiemposPorClave.clave1_segundos, ... },
                    { key: 2, name: 'Salida en Emergencia', duration_seconds: tiemposPorClave.clave2_segundos, ... },
                    { key: 3, name: 'En Siniestro', duration_seconds: tiemposPorClave.clave3_segundos, ... },
                    { key: 5, name: 'Regreso al Parque', duration_seconds: tiemposPorClave.clave5_segundos, ... }
                ],
                total_time_seconds: tiemposPorClave.total_segundos,
                total_time_formatted: tiemposPorClave.total_formateado,
                ...
            }
        });
    } catch (error: any) {
        logger.error('Error obteniendo estados:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
```

**Verificación:**
```bash
curl "http://localhost:9998/api/v1/kpis/states?organizationId=xxx"
```

---

#### **PASO 3: Modificar /api/hotspots/critical-points** ⏱️ 45 min
**Archivo:** `backend/src/routes/hotspots.ts`

**Problema actual:**
- Usa `stabilityEvent` directo de BD
- NO usa `eventDetector` con índice SI

**Solución:**
```typescript
// LÍNEA 112: Reemplazar todo el endpoint
import { eventDetector } from '../services/eventDetector';

router.get('/critical-points', async (req, res) => {
    try {
        const organizationId = req.query.organizationId as string;
        const vehicleIds = req.query.vehicleIds ? (req.query.vehicleIds as string).split(',') : undefined;
        const startDate = req.query.startDate as string;
        const endDate = req.query.endDate as string;
        const severityFilter = req.query.severity as string || 'all';
        const minFrequency = parseInt(req.query.minFrequency as string) || 1;
        const clusterRadius = parseFloat(req.query.clusterRadius as string) || 20;

        // Obtener sesiones filtradas
        const sessionsWhere: any = { organizationId };
        if (startDate && endDate) {
            sessionsWhere.startTime = { gte: new Date(startDate), lte: new Date(endDate) };
        }
        if (vehicleIds) {
            sessionsWhere.vehicleId = { in: vehicleIds };
        }

        const sessions = await prisma.session.findMany({ where: sessionsWhere });
        const sessionIds = sessions.map(s => s.id);

        // Usar eventDetector para obtener eventos con SI
        const eventosDetectados = await eventDetector.detectarEventosMasivo(sessionIds);

        // Convertir a formato con lat/lon
        const eventos = [];
        for (const tipo in eventosDetectados.por_tipo) {
            const eventosList = eventosDetectados.por_tipo[tipo];
            for (const evento of eventosList) {
                // Buscar StabilityMeasurement para obtener lat/lon
                const measurement = await prisma.stabilityMeasurement.findFirst({
                    where: {
                        sessionId: evento.sessionId,
                        timestamp: evento.timestamp
                    }
                });

                if (measurement) {
                    eventos.push({
                        id: `${evento.sessionId}_${evento.timestamp.getTime()}`,
                        lat: measurement.lat,
                        lng: measurement.lon,
                        timestamp: evento.timestamp,
                        vehicleId: evento.vehicleId,
                        eventType: tipo,
                        severity: evento.severidad, // GRAVE, MODERADA, LEVE
                        si: evento.si,
                        rotativo: evento.rotativo,
                        location: `${measurement.lat.toFixed(4)}, ${measurement.lon.toFixed(4)}`
                    });
                }
            }
        }

        // Aplicar filtro de severidad
        const filteredEvents = severityFilter === 'all'
            ? eventos
            : eventos.filter(e => e.severity.toLowerCase() === severityFilter);

        // Realizar clustering (reutilizar función existente)
        const clusters = clusterEvents(filteredEvents, clusterRadius);

        // Filtrar por frecuencia mínima
        const filteredClusters = clusters.filter(cluster => cluster.frequency >= minFrequency);

        // Ordenar por frecuencia y severidad
        filteredClusters.sort((a, b) => {
            const severityWeight = { GRAVE: 3, MODERADA: 2, LEVE: 1 };
            const aWeight = a.frequency * (severityWeight[a.dominantSeverity] || 1);
            const bWeight = b.frequency * (severityWeight[b.dominantSeverity] || 1);
            return bWeight - aWeight;
        });

        res.json({
            success: true,
            data: {
                clusters: filteredClusters,
                totalEvents: eventos.length,
                totalClusters: filteredClusters.length,
                filters: { severity: severityFilter, minFrequency, clusterRadius }
            }
        });
    } catch (error) {
        logger.error('Error obteniendo puntos críticos:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
```

**Verificación:**
```bash
curl "http://localhost:9998/api/hotspots/critical-points?organizationId=xxx&severity=all"
```

---

#### **PASO 4: Modificar /api/speed/violations** ⏱️ 45 min
**Archivo:** `backend/src/routes/speedAnalysis.ts`

**Problema actual:**
- Calcula límites manualmente
- NO usa `speedAnalyzer`
- NO integra TomTom

**Solución:**
```typescript
// LÍNEA 105: Reemplazar todo el endpoint
import { speedAnalyzer } from '../services/speedAnalyzer';

router.get('/violations', async (req, res) => {
    try {
        const organizationId = req.query.organizationId as string;
        const filters: SpeedFilters = {
            rotativoFilter: req.query.rotativoOn as any || 'all',
            violationFilter: req.query.violationType as any || 'all',
            vehicleIds: req.query.vehicleIds ? (req.query.vehicleIds as string).split(',') : undefined,
            startDate: req.query.startDate as string,
            endDate: req.query.endDate as string,
            minSpeed: parseInt(req.query.minSpeed as string) || 0
        };

        // Obtener sesiones filtradas
        const sessionsWhere: any = { organizationId };
        if (filters.startDate && filters.endDate) {
            sessionsWhere.startTime = { gte: new Date(filters.startDate), lte: new Date(filters.endDate) };
        }
        if (filters.vehicleIds) {
            sessionsWhere.vehicleId = { in: filters.vehicleIds };
        }

        const sessions = await prisma.session.findMany({ where: sessionsWhere });
        const sessionIds = sessions.map(s => s.id);

        // Usar speedAnalyzer para obtener análisis completo
        const analisisVelocidad = await speedAnalyzer.analizarVelocidades(sessionIds);

        // Convertir excesos a formato SpeedViolation
        const violations: SpeedViolation[] = [];
        
        for (const exceso of analisisVelocidad.excesos) {
            // Buscar GPSMeasurement para obtener lat/lon
            const gpsMeasurement = await prisma.gpsMeasurement.findFirst({
                where: {
                    sessionId: exceso.sessionId,
                    speed: { gte: exceso.velocidad - 1, lte: exceso.velocidad + 1 }
                },
                orderBy: { timestamp: 'asc' },
                take: 1
            });

            if (gpsMeasurement) {
                violations.push({
                    id: `${exceso.sessionId}_${gpsMeasurement.timestamp.getTime()}`,
                    vehicleId: exceso.vehicleId,
                    vehicleName: exceso.vehicleName || exceso.vehicleId,
                    timestamp: gpsMeasurement.timestamp.toISOString(),
                    lat: gpsMeasurement.latitude,
                    lng: gpsMeasurement.longitude,
                    speed: exceso.velocidad,
                    speedLimit: exceso.limite,
                    violationType: exceso.tipo === 'grave' ? 'grave' : 'leve',
                    rotativoOn: exceso.rotativo,
                    inPark: exceso.tipo_via === 'parque',
                    roadType: exceso.tipo_via === 'autopista' ? 'highway' : 
                              exceso.tipo_via === 'interurbana' ? 'interurban' : 'urban',
                    excess: exceso.exceso
                });
            }
        }

        // Aplicar filtros adicionales
        let filteredViolations = violations;
        
        if (filters.rotativoFilter !== 'all') {
            filteredViolations = filteredViolations.filter(v => 
                filters.rotativoFilter === 'on' ? v.rotativoOn : !v.rotativoOn
            );
        }

        if (filters.violationFilter !== 'all') {
            filteredViolations = filteredViolations.filter(v => 
                v.violationType === filters.violationFilter
            );
        }

        // Calcular estadísticas
        const stats = {
            total: filteredViolations.length,
            graves: filteredViolations.filter(v => v.violationType === 'grave').length,
            leves: filteredViolations.filter(v => v.violationType === 'leve').length,
            withRotativo: filteredViolations.filter(v => v.rotativoOn).length,
            withoutRotativo: filteredViolations.filter(v => !v.rotativoOn).length,
            avgSpeedExcess: analisisVelocidad.exceso_promedio
        };

        res.json({
            success: true,
            data: {
                violations: filteredViolations,
                stats,
                filters,
                summary: {
                    velocidad_maxima: analisisVelocidad.velocidad_maxima,
                    velocidad_promedio: analisisVelocidad.velocidad_promedio,
                    excesos_totales: analisisVelocidad.excesos_totales,
                    excesos_graves: analisisVelocidad.excesos_graves
                }
            }
        });
    } catch (error) {
        logger.error('Error obteniendo violaciones de velocidad:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
```

**Verificación:**
```bash
curl "http://localhost:9998/api/speed/violations?organizationId=xxx"
```

---

#### **PASO 5: Crear Geocercas de Parques** ⏱️ 30 min

**Archivo:** Crear `backend/scripts/crear-geocercas-parques.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

const PARQUES_BOMBEROS = [
    {
        name: 'Parque Alcobendas',
        identifier: 'PARK_ALCOBENDAS',
        geometry: {
            type: 'Polygon',
            coordinates: [[
                [-3.6329, 40.5409],
                [-3.6309, 40.5409],
                [-3.6309, 40.5429],
                [-3.6329, 40.5429],
                [-3.6329, 40.5409]
            ]]
        }
    },
    {
        name: 'Parque Las Rozas',
        identifier: 'PARK_ROZAS',
        geometry: {
            type: 'Polygon',
            coordinates: [[
                [-3.8748, 40.4909],
                [-3.8728, 40.4909],
                [-3.8728, 40.4929],
                [-3.8748, 40.4929],
                [-3.8748, 40.4909]
            ]]
        }
    }
];

async function crearGeocercasParques() {
    logger.info('🏢 Creando geocercas de parques de bomberos...');

    const organizationId = 'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26'; // ID real de la org

    for (const parque of PARQUES_BOMBEROS) {
        try {
            // Verificar si ya existe
            const existing = await prisma.park.findFirst({
                where: {
                    identifier: parque.identifier,
                    organizationId
                }
            });

            if (existing) {
                logger.info(`✅ Parque ya existe: ${parque.name}`);
                continue;
            }

            // Crear parque
            const park = await prisma.park.create({
                data: {
                    name: parque.name,
                    identifier: parque.identifier,
                    geometry: parque.geometry,
                    geometry_postgis: JSON.stringify(parque.geometry),
                    organizationId
                }
            });

            logger.info(`✅ Parque creado: ${park.name} (${park.id})`);
        } catch (error) {
            logger.error(`❌ Error creando parque ${parque.name}:`, error);
        }
    }

    logger.info('🎉 Geocercas de parques creadas correctamente');
}

crearGeocercasParques()
    .then(() => process.exit(0))
    .catch((error) => {
        logger.error('Error fatal:', error);
        process.exit(1);
    });
```

**Ejecutar:**
```bash
cd backend
npx ts-node scripts/crear-geocercas-parques.ts
```

---

### **FASE 2: FRONTEND (Pasos 6-9)**

#### **PASO 6: Modificar Pestaña Estados y Tiempos** ⏱️ 45 min
**Archivo:** `frontend/src/components/kpi/NewExecutiveKPIDashboard.tsx`

**Problema actual:**
- LÍNEA 533: Usa `getStateDuration(1)` que devuelve datos incorrectos
- NO muestra claves 2, 3, 5 correctamente
- NO muestra índice de estabilidad

**Solución:**
```typescript
// LÍNEA 505-640: Modificar renderEstadosTiempos()
const renderEstadosTiempos = () => {
    // Calcular velocidad promedio
    const avgSpeed = activity?.km_total && activity?.driving_hours && activity.driving_hours > 0.1
        ? Math.round(activity.km_total / activity.driving_hours)
        : 0;

    return (
        <div className="h-full w-full bg-white p-6" id="estados-tiempos-content">
            {/* Grid de KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Primera fila - Métricas principales */}
                <KPICard
                    title="Horas de Conducción"
                    value={activity?.driving_hours_formatted || '00:00:00'}
                    icon={<ClockIcon className="h-6 w-6" />}
                    colorClass="text-blue-600"
                    subtitle="Tiempo total de conducción"
                />
                <KPICard
                    title="Kilómetros Recorridos"
                    value={`${activity?.km_total || 0} km`}
                    icon={<TruckIcon className="h-6 w-6" />}
                    colorClass="text-green-600"
                    subtitle="Distancia total recorrida"
                />
                <KPICard
                    title="Índice de Estabilidad"
                    value={`${((stability?.indice_promedio || 0) * 100).toFixed(1)}%`}
                    icon={<ChartBarIcon className="h-6 w-6" />}
                    colorClass={
                        (stability?.indice_promedio || 0) >= 0.90 ? "text-green-600" :
                        (stability?.indice_promedio || 0) >= 0.88 ? "text-yellow-600" :
                        "text-red-600"
                    }
                    subtitle={`Calidad: ${stability?.calificacion || 'N/A'} ${stability?.estrellas || ''}`}
                />
                <KPICard
                    title="% Rotativo"
                    value={`${activity?.rotativo_on_percentage || 0}%`}
                    icon={<PowerIcon className="h-6 w-6" />}
                    colorClass="text-orange-600"
                    subtitle="Tiempo con rotativo encendido"
                />

                {/* Segunda fila - Claves operativas */}
                <KPICard
                    title="Clave 0 - Taller"
                    value={getStateDuration(0)}
                    icon={<ExclamationTriangleIcon className="h-6 w-6" />}
                    colorClass="text-red-600"
                    subtitle="Tiempo en mantenimiento"
                />
                <KPICard
                    title="Clave 1 - Operativo Parque"
                    value={getStateDuration(1)}
                    icon={<MapIcon className="h-6 w-6" />}
                    colorClass="text-slate-600"
                    subtitle="Tiempo en parque operativo"
                />
                <KPICard
                    title="Clave 2 - Salida Emergencia"
                    value={getStateDuration(2)}
                    icon={<ExclamationTriangleIcon className="h-6 w-6" />}
                    colorClass="text-red-600"
                    subtitle="Salida con rotativo ON"
                />
                <KPICard
                    title="Clave 3 - En Siniestro"
                    value={getStateDuration(3)}
                    icon={<ClockIcon className="h-6 w-6" />}
                    colorClass="text-orange-600"
                    subtitle="Parado >5min en emergencia"
                />

                {/* Tercera fila - Clave 5 e Incidencias */}
                <KPICard
                    title="Clave 5 - Regreso"
                    value={getStateDuration(5)}
                    icon={<ClockIcon className="h-6 w-6" />}
                    colorClass="text-blue-600"
                    subtitle="Regreso al parque sin rotativo"
                />
                <KPICard
                    title="Total Incidencias"
                    value={stability?.total_incidents || 0}
                    icon={<ExclamationTriangleIcon className="h-6 w-6" />}
                    colorClass="text-red-600"
                    subtitle="Total de incidencias registradas"
                />
                <KPICard
                    title="Incidencias Graves"
                    value={stability?.critical || 0}
                    icon={<ExclamationTriangleIcon className="h-6 w-6" />}
                    colorClass="text-red-600"
                    subtitle="Severidad alta"
                />
                <KPICard
                    title="Incidencias Moderadas"
                    value={stability?.moderate || 0}
                    icon={<ExclamationTriangleIcon className="h-6 w-6" />}
                    colorClass="text-orange-600"
                    subtitle="Severidad media"
                />
            </div>

            {/* Tabla de detalle por tipo de evento */}
            <div className="mt-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Detalle de Eventos por Tipo</h3>
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tipo de Evento</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Cantidad</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Severidad</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {stability?.por_tipo && Object.entries(stability.por_tipo).map(([tipo, cantidad]) => (
                            <tr key={tipo}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{tipo}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{cantidad}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                        cantidad > 10 ? 'bg-red-100 text-red-800' :
                                        cantidad > 5 ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-green-100 text-green-800'
                                    }`}>
                                        {cantidad > 10 ? 'Alta' : cantidad > 5 ? 'Media' : 'Baja'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
```

---

#### **PASO 7: Modificar Pestaña Puntos Negros** ⏱️ 30 min
**Archivo:** `frontend/src/components/stability/BlackSpotsTab.tsx`

**Problema actual:**
- Muestra eventos antiguos sin índice SI
- NO aplica filtros correctamente

**Solución:** (Verificar que use el endpoint modificado `/api/hotspots/critical-points`)

```typescript
// Verificar que el componente llame al endpoint correcto con filtros
useEffect(() => {
    const fetchHotspots = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                organizationId: user.organizationId,
                severity: filters.severity || 'all',
                minFrequency: filters.minFrequency?.toString() || '1',
                clusterRadius: filters.clusterRadius?.toString() || '20',
                rotativoOn: filters.rotativo || 'all'
            });

            if (filters.dateFrom) params.append('startDate', filters.dateFrom);
            if (filters.dateTo) params.append('endDate', filters.dateTo);
            if (filters.vehicleIds) params.append('vehicleIds', filters.vehicleIds.join(','));

            const response = await fetch(`/api/hotspots/critical-points?${params}`);
            const data = await response.json();

            if (data.success) {
                setHotspots(data.data.clusters);
            }
        } catch (error) {
            logger.error('Error fetching hotspots:', error);
        } finally {
            setLoading(false);
        }
    };

    fetchHotspots();
}, [filters, user.organizationId]);
```

---

#### **PASO 8: Modificar Pestaña Velocidad** ⏱️ 30 min
**Archivo:** `frontend/src/components/speed/SpeedAnalysisTab.tsx`

**Problema actual:**
- NO usa límites DGT correctos
- NO diferencia rotativo ON/OFF

**Solución:** (Verificar que use el endpoint modificado `/api/speed/violations`)

```typescript
// Similar al paso 7, verificar que llame al endpoint correcto
useEffect(() => {
    const fetchSpeedViolations = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                organizationId: user.organizationId,
                rotativoOn: filters.rotativo || 'all',
                violationType: filters.violationType || 'all',
                minSpeed: filters.minSpeed?.toString() || '0'
            });

            if (filters.dateFrom) params.append('startDate', filters.dateFrom);
            if (filters.dateTo) params.append('endDate', filters.dateTo);
            if (filters.vehicleIds) params.append('vehicleIds', filters.vehicleIds.join(','));

            const response = await fetch(`/api/speed/violations?${params}`);
            const data = await response.json();

            if (data.success) {
                setViolations(data.data.violations);
                setStats(data.data.stats);
            }
        } catch (error) {
            logger.error('Error fetching speed violations:', error);
        } finally {
            setLoading(false);
        }
    };

    fetchSpeedViolations();
}, [filters, user.organizationId]);
```

---

#### **PASO 9: Actualizar Sistema de Reportes** ⏱️ 30 min
**Archivo:** `frontend/src/components/reports/DashboardReportsTab.tsx`

**Problema actual:**
- NO incluye índice de estabilidad
- NO incluye eventos por tipo
- NO usa nuevos KPIs

**Solución:**
```typescript
// LÍNEA 70-80: Añadir template de reporte con nuevos KPIs
{
    id: 'estados-tiempos-completo',
    name: 'Estados y Tiempos Completo',
    description: 'Reporte con claves 0,1,2,3,5, índice SI y eventos por tipo',
    type: 'estados_tiempos',
    icon: <ClockIcon className="h-5 w-5" />,
    parameters: [
        { name: 'date_range', label: 'Rango de fechas', type: 'date_range', required: true },
        { name: 'vehicle_ids', label: 'Vehículos', type: 'multi_select', required: false },
        { name: 'include_si', label: 'Incluir Índice de Estabilidad', type: 'boolean', default: true },
        { name: 'include_events_detail', label: 'Incluir detalle de eventos', type: 'boolean', default: true }
    ]
}
```

---

### **FASE 3: VALIDACIÓN (Pasos 10-12)**

#### **PASO 10: Validar Filtros End-to-End** ⏱️ 30 min

**Pruebas:**
1. Cambiar fecha en filtros globales → Verificar que KPIs se actualicen
2. Seleccionar vehículo → Verificar que solo muestre ese vehículo
3. Cambiar a otra pestaña → Verificar que mantenga filtros

**Comando:**
```bash
# Abrir navegador en http://localhost:5174
# Navegar a Dashboard
# Cambiar filtros y verificar que se aplican
```

---

#### **PASO 11: Añadir Visualización Índice SI** ⏱️ 20 min
**Archivo:** `frontend/src/components/kpi/NewExecutiveKPIDashboard.tsx`

**Solución:**
```typescript
// LÍNEA 515-525: Añadir KPICard para Índice SI
<KPICard
    title="Índice de Estabilidad (SI)"
    value={`${((stability?.indice_promedio || 0) * 100).toFixed(1)}%`}
    icon={<ChartBarIcon className="h-6 w-6" />}
    colorClass={
        (stability?.indice_promedio || 0) >= 0.90 ? "text-green-600" :
        (stability?.indice_promedio || 0) >= 0.88 ? "text-yellow-600" :
        "text-red-600"
    }
    subtitle={`${stability?.calificacion || 'N/A'} ${stability?.estrellas || ''}`}
    description="Calidad de conducción: ⭐⭐⭐ Excelente ≥90%, ⭐⭐ Buena ≥88%, ⭐ Aceptable ≥85%"
/>
```

---

#### **PASO 12: Testing End-to-End** ⏱️ 45 min

**Flujo completo:**
1. **Login** → Verificar autenticación
2. **Dashboard** → Verificar que carga
3. **Filtros globales** → Cambiar fecha, vehículo
4. **Pestaña Estados y Tiempos:**
   - Verificar claves 0,1,2,3,5 con valores reales
   - Verificar índice SI
   - Verificar tabla de eventos por tipo
5. **Pestaña Puntos Negros:**
   - Verificar clustering
   - Verificar que muestra eventos con SI
   - Verificar filtros
6. **Pestaña Velocidad:**
   - Verificar excesos con límites DGT
   - Verificar diferencia rotativo ON/OFF
   - Verificar mapa
7. **Exportación PDF:**
   - Exportar cada pestaña
   - Verificar que incluye nuevos KPIs

**Comandos:**
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Abrir navegador
start http://localhost:5174

# Realizar pruebas manuales
```

---

## 📊 CHECKLIST FINAL

### **Backend:**
- [ ] Compilación TypeScript sin errores
- [ ] `/api/v1/kpis/states` usa `keyCalculator`
- [ ] `/api/hotspots/critical-points` usa `eventDetector`
- [ ] `/api/speed/violations` usa `speedAnalyzer`
- [ ] Geocercas de parques creadas en BD
- [ ] Endpoints responden correctamente

### **Frontend:**
- [ ] Dashboard carga sin errores
- [ ] Pestaña Estados y Tiempos muestra claves correctas
- [ ] Índice de Estabilidad visible
- [ ] Tabla de eventos por tipo funciona
- [ ] Pestaña Puntos Negros muestra clustering correcto
- [ ] Pestaña Velocidad muestra límites DGT
- [ ] Filtros globales se aplican correctamente

### **Integración:**
- [ ] Filtros → Backend → Frontend funciona end-to-end
- [ ] Radar.com integrado con keyCalculator
- [ ] Reportes incluyen nuevos KPIs
- [ ] Exportación PDF funciona

### **Testing:**
- [ ] Login funciona
- [ ] Todas las pestañas cargan
- [ ] Filtros se aplican correctamente
- [ ] Datos son realistas (no valores imposibles)
- [ ] Exportación PDF completa

---

## 🎯 RESULTADO ESPERADO

**Dashboard 100% funcional con:**
- ✅ **Estados y Tiempos:** Claves 0,1,2,3,5 reales + Índice SI + Eventos por tipo
- ✅ **Puntos Negros:** Clustering con eventos detectados por `eventDetector`
- ✅ **Velocidad:** Excesos con límites DGT + Diferenciación rotativo
- ✅ **Filtros:** Aplicados correctamente en toda la aplicación
- ✅ **Reportes:** Con todos los KPIs nuevos
- ✅ **Geocercas:** Parques detectados automáticamente

---

## ⏱️ TIEMPO ESTIMADO TOTAL

| Fase | Pasos | Tiempo |
|------|-------|--------|
| **FASE 1: Backend** | 1-5 | 2h 45min |
| **FASE 2: Frontend** | 6-9 | 2h 15min |
| **FASE 3: Validación** | 10-12 | 1h 35min |
| **TOTAL** | 12 pasos | **6h 35min** |

---

## 🚀 ORDEN DE EJECUCIÓN

**Seguir EXACTAMENTE este orden:**
1. PASO 1 → PASO 2 → PASO 3 → PASO 4 → PASO 5
2. PASO 6 → PASO 7 → PASO 8 → PASO 9
3. PASO 10 → PASO 11 → PASO 12

**NO saltar pasos. Cada paso depende del anterior.**

---

**Este plan cubre el 100% de la aplicación para que funcione completamente.**

