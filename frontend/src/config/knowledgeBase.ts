export interface KnowledgeBaseItem {
    id: string;
    title: string;
    category: string;
    content: string;
    tags: string[];
    lastUpdated: string;
}

export const KNOWLEDGE_BASE_DATA: KnowledgeBaseItem[] = [
    {
        id: 'KB001',
        title: 'Factores que afectan la estabilidad del vehículo',
        category: 'Estabilidad',
        content: `La estabilidad de un vehículo de bomberos está influenciada por varios factores clave:

1. Centro de gravedad
- Altura del vehículo
- Distribución de la carga
- Peso del equipo

2. Condiciones de la carretera
- Pendiente
- Superficie
- Curvas

3. Velocidad y maniobras
- Aceleración
- Frenado
- Giro

4. Factores externos
- Viento
- Visibilidad
- Condiciones climáticas`,
        tags: ['estabilidad', 'seguridad', 'factores'],
        lastUpdated: '2024-03-15'
    },
    {
        id: 'KB002',
        title: 'Procedimientos de seguridad en emergencias',
        category: 'Procedimientos',
        content: `Protocolos de seguridad para operaciones de emergencia:

1. Evaluación inicial
- Análisis de riesgos
- Identificación de peligros
- Planificación de la intervención

2. Equipamiento
- Verificación de equipos
- Mantenimiento preventivo
- Protocolos de uso

3. Coordinación
- Comunicación con el centro
- Coordinación con otros servicios
- Gestión de recursos

4. Seguimiento
- Monitoreo de condiciones
- Actualización de situación
- Registro de incidentes`,
        tags: ['procedimientos', 'emergencias', 'seguridad'],
        lastUpdated: '2024-03-14'
    },
    {
        id: 'KB003',
        title: 'Mantenimiento preventivo de sensores',
        category: 'Mantenimiento',
        content: `Guía de mantenimiento para sensores de estabilidad:

1. Calibración
- Frecuencia recomendada
- Procedimiento de calibración
- Verificación de precisión

2. Limpieza
- Productos recomendados
- Frecuencia de limpieza
- Precauciones

3. Verificación
- Pruebas funcionales
- Registro de resultados
- Acciones correctivas

4. Documentación
- Registro de mantenimiento
- Historial de calibraciones
- Incidencias reportadas`,
        tags: ['mantenimiento', 'sensores', 'calibración'],
        lastUpdated: '2024-03-13'
    },
    {
        id: 'KB004',
        title: 'Interpretación de datos de telemetría',
        category: 'Telemetría',
        content: `Guía para interpretar datos de telemetría:

1. Parámetros clave
- Aceleración lateral
- Ángulo de inclinación
- Velocidad
- Fuerza G

2. Umbrales de alerta
- Niveles de advertencia
- Umbrales críticos
- Acciones recomendadas

3. Análisis de tendencias
- Patrones de comportamiento
- Correlaciones
- Predicción de riesgos

4. Toma de decisiones
- Evaluación de datos
- Protocolos de actuación
- Registro de incidentes`,
        tags: ['telemetría', 'datos', 'análisis'],
        lastUpdated: '2024-03-12'
    },
    {
        id: 'KB005',
        title: 'Protocolos de respuesta a alertas',
        category: 'Protocolos',
        content: `Procedimientos de respuesta a alertas del sistema:

1. Niveles de alerta
- Verde: Situación normal
- Amarillo: Precaución
- Rojo: Acción inmediata

2. Respuesta por nivel
- Acciones específicas
- Tiempos de respuesta
- Escalamiento

3. Documentación
- Registro de alertas
- Acciones tomadas
- Seguimiento

4. Mejora continua
- Análisis de incidentes
- Actualización de protocolos
- Formación del personal`,
        tags: ['alertas', 'protocolos', 'respuesta'],
        lastUpdated: '2024-03-11'
    }
]; 