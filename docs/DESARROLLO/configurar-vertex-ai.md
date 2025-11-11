# 🤖 Configuración de Google Vertex AI Premium - DobackSoft

## 📋 Resumen

Google Vertex AI Premium proporciona:
- ✅ **Modelos Gemini 1.5 Pro** - IA de última generación
- ✅ **Análisis predictivo** - Mantenimientos, fallos, optimizaciones
- ✅ **Procesamiento de lenguaje natural** - Reportes automáticos
- ✅ **Visión por computadora** - Análisis de imágenes de vehículos
- ✅ **Integración nativa con Google Cloud**

---

## 🚀 Configuración Rápida (5 minutos)

### Paso 1: Añadir API Key al Backend

Editar el archivo `backend/.env` y añadir:

```env
# ============================================================
# GOOGLE VERTEX AI PREMIUM - Inteligencia Artificial
# ============================================================
GOOGLE_VERTEX_API_KEY=AQ.Ab8RN6LLA2nneA7-lzaJIK07l7eooDNu2RJaPKCTu3L6oZ9m_A
GOOGLE_VERTEX_PROJECT_ID=dobacksoft-vertex
GOOGLE_VERTEX_LOCATION=europe-west1
GOOGLE_VERTEX_MODEL=gemini-1.5-pro

# Configuración adicional (opcional)
VERTEX_AI_ENABLED=true
VERTEX_AI_TIMEOUT=30000
VERTEX_AI_MAX_TOKENS=8192
VERTEX_AI_TEMPERATURE=0.7
```

**Notas importantes:**
- ✅ La API key ya está configurada: `AQ.Ab8RN6LLA2nneA7-lzaJIK07l7eooDNu2RJaPKCTu3L6oZ9m_A`
- ✅ Ubicación `europe-west1` (Frankfurt) - cumple con GDPR
- ✅ Modelo `gemini-1.5-pro` - balance óptimo precio/rendimiento

---

### Paso 2: Verificar Project ID de Google Cloud

Tu API key necesita estar asociada a un proyecto de Google Cloud:

1. **Ir a Google Cloud Console**:
   ```
   https://console.cloud.google.com/
   ```

2. **Verificar Project ID**:
   - En la parte superior, verás el nombre del proyecto
   - El Project ID aparece junto al nombre
   - Anotar el Project ID exacto

3. **Actualizar `.env`**:
   ```env
   GOOGLE_VERTEX_PROJECT_ID=tu-project-id-real
   ```

---

### Paso 3: Habilitar Vertex AI en Google Cloud

Si aún no está habilitado:

1. **Ir a APIs & Services**:
   ```
   https://console.cloud.google.com/apis/library
   ```

2. **Buscar y habilitar**:
   - ✅ Vertex AI API
   - ✅ Generative Language API
   - ✅ AI Platform API (legacy)

3. **Verificar API Key**:
   - APIs & Services > Credentials
   - Verificar que tu API key tenga acceso a Vertex AI

---

### Paso 4: Reiniciar Backend

```powershell
.\iniciar.ps1
```

O reiniciar solo el backend:

```powershell
cd backend
npm run dev
```

---

## ✅ Verificación

### 1. Test Manual con cURL

```bash
# Test de la API key (reemplazar PROJECT_ID)
curl "https://europe-west1-aiplatform.googleapis.com/v1/projects/YOUR_PROJECT_ID/locations/europe-west1/publishers/google/models/gemini-1.5-pro:generateContent" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": {
      "role": "user",
      "parts": { "text": "Hola, ¿funciona la API?" }
    }
  }'
```

### 2. Verificar Logs del Backend

```powershell
# Ver logs en tiempo real
tail -f backend\logs\combined.log | grep "Vertex"
```

Deberías ver:
```
✅ [Vertex AI] Conectado exitosamente
🤖 [Vertex AI] Modelo: gemini-1.5-pro
📍 [Vertex AI] Ubicación: europe-west1
```

### 3. Test desde el Frontend

Ir al módulo **Inteligencia Artificial** en DobackSoft:

1. Abrir chat IA
2. Enviar mensaje: "Analiza el estado de la flota"
3. Verificar respuesta del modelo Gemini

---

## 💰 Costes y Límites

### Pricing de Vertex AI (Gemini 1.5 Pro)

| Tipo | Precio | Límite gratuito |
|------|--------|-----------------|
| **Input tokens** | $0.0025 por 1K tokens | 50,000 tokens/día |
| **Output tokens** | $0.01 por 1K tokens | 10,000 tokens/día |
| **Imágenes** | $0.002 por imagen | 1,000 imágenes/día |

### Cálculo de Costes Estimados

**Escenario DobackSoft: Uso moderado**

```
Análisis diarios:
- 10 análisis de flota/día × 500 tokens input = 5,000 tokens/día
- 10 análisis × 2,000 tokens output = 20,000 tokens/día

Coste mensual:
- Input: 5,000 × 30 × $0.0025 / 1000 = $0.38/mes
- Output: 20,000 × 30 × $0.01 / 1000 = $6.00/mes
- TOTAL: ~$6-7/mes ✅ MUY ASEQUIBLE

Con límite gratuito:
- GRATIS durante los primeros meses ✅
```

---

## 🎯 Casos de Uso en DobackSoft

### 1. Análisis Predictivo de Mantenimiento

**Servicio**: `AIMaintenancePredictionService`

```typescript
// Predice cuándo un vehículo necesitará mantenimiento
const prediction = await vertexAIService.predictMaintenance({
  vehicleId: 'vehicle-123',
  canData: recentCanData,
  gpsData: recentGpsData,
  stabilityMetrics: stabilityData
});

// Respuesta:
// {
//   nextMaintenanceIn: "15 días",
//   confidence: 0.87,
//   components: ["Frenos", "Suspensión"],
//   reasoning: "Anomalías detectadas en presión de frenos..."
// }
```

### 2. Generación de Reportes con IA

**Servicio**: `AIReportGenerationService`

```typescript
// Genera reporte PDF con análisis IA
const report = await vertexAIService.generateReport({
  sessionId: 'session-456',
  metrics: sessionMetrics,
  template: 'stability-analysis'
});

// Genera PDF con:
// - Resumen ejecutivo
// - Análisis de incidencias
// - Recomendaciones personalizadas
// - Gráficas y mapas
```

### 3. Detección de Anomalías en Tiempo Real

**Servicio**: `AIAnomalyDetectionService`

```typescript
// Detecta comportamientos anómalos
const anomaly = await vertexAIService.detectAnomaly({
  vehicleId: 'vehicle-789',
  realtimeData: currentData,
  historicalData: lastWeekData
});

// Respuesta:
// {
//   isAnomaly: true,
//   severity: "high",
//   description: "Aceleración lateral inusual",
//   suggestedAction: "Revisar suspensión inmediatamente"
// }
```

### 4. Asistente de Chat para Usuarios

**Servicio**: `AIChatAssistantService`

```typescript
// Chat conversacional sobre la flota
const response = await vertexAIService.chat({
  userId: 'user-123',
  message: "¿Qué vehículo tiene más incidencias este mes?",
  context: {
    organization: organizationData,
    vehicles: vehicleList
  }
});

// Respuesta natural:
// "El vehículo con más incidencias es BUP-101 con 12 eventos,
//  principalmente problemas de frenos y suspensión..."
```

### 5. Optimización de Rutas con IA

**Servicio**: `AIRouteOptimizationService`

```typescript
// Optimiza rutas basándose en históricos
const optimizedRoute = await vertexAIService.optimizeRoute({
  origin: { lat: 40.4169, lon: -3.7038 },
  destination: { lat: 40.5000, lon: -3.8000 },
  vehicleType: 'emergencia',
  historicalData: pastRoutes
});

// Sugiere ruta óptima considerando:
// - Tráfico histórico
// - Condiciones de carretera
// - Consumo de combustible
// - Tiempos de respuesta
```

---

## 🔧 Configuración Avanzada

### Variables de Entorno Completas

```env
# Google Vertex AI
GOOGLE_VERTEX_API_KEY=AQ.Ab8RN6LLA2nneA7-lzaJIK07l7eooDNu2RJaPKCTu3L6oZ9m_A
GOOGLE_VERTEX_PROJECT_ID=dobacksoft-vertex
GOOGLE_VERTEX_LOCATION=europe-west1
GOOGLE_VERTEX_MODEL=gemini-1.5-pro

# Configuración del modelo
VERTEX_AI_ENABLED=true
VERTEX_AI_TIMEOUT=30000              # 30 segundos
VERTEX_AI_MAX_TOKENS=8192            # Tokens máximos por respuesta
VERTEX_AI_TEMPERATURE=0.7            # 0.0 = determinista, 1.0 = creativo
VERTEX_AI_TOP_P=0.95                 # Nucleus sampling
VERTEX_AI_TOP_K=40                   # Top-K sampling

# Cache y optimización
VERTEX_AI_CACHE_ENABLED=true
VERTEX_AI_CACHE_TTL=3600             # 1 hora
VERTEX_AI_BATCH_SIZE=10              # Requests por batch

# Rate limiting
VERTEX_AI_MAX_REQUESTS_PER_MINUTE=60
VERTEX_AI_MAX_TOKENS_PER_DAY=100000

# Fallback
VERTEX_AI_FALLBACK_TO_OPENAI=true    # Si Vertex falla, usar OpenAI
OPENAI_API_KEY=your-openai-key       # Backup API
```

---

## 🐛 Troubleshooting

### Error: "API key inválida"

**Causa**: La API key no tiene permisos para Vertex AI

**Solución**:
1. Verificar que la API key es correcta
2. Ir a Google Cloud Console > APIs & Services > Credentials
3. Verificar que Vertex AI API está habilitada
4. Regenerar API key si es necesario

### Error: "Project ID no encontrado"

**Causa**: El Project ID en `.env` no coincide con tu proyecto

**Solución**:
1. Ir a Google Cloud Console
2. Verificar el Project ID real (parte superior de la consola)
3. Actualizar `GOOGLE_VERTEX_PROJECT_ID` en `.env`

### Error: "Quota excedida"

**Causa**: Se superó el límite gratuito o de pago

**Solución**:
1. Verificar uso actual en Google Cloud Console
2. Aumentar quota si es necesario
3. Habilitar cache para reducir requests

### Error: "Timeout al conectar"

**Causa**: Red lenta o servicio no disponible

**Solución**:
1. Aumentar `VERTEX_AI_TIMEOUT` a 60000 (1 minuto)
2. Verificar conexión a internet
3. Comprobar estado de servicios de Google Cloud

---

## 📊 Monitoreo

### Métricas Recomendadas

```sql
-- Uso de IA por día
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_requests,
    AVG(response_time_ms) as avg_response_time,
    SUM(input_tokens) as total_input_tokens,
    SUM(output_tokens) as total_output_tokens
FROM ai_requests_log
WHERE provider = 'vertex-ai'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Costes estimados
SELECT 
    DATE(created_at) as date,
    SUM(input_tokens) * 0.0025 / 1000 as input_cost,
    SUM(output_tokens) * 0.01 / 1000 as output_cost,
    (SUM(input_tokens) * 0.0025 / 1000 + SUM(output_tokens) * 0.01 / 1000) as total_cost
FROM ai_requests_log
WHERE provider = 'vertex-ai'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## 🔒 Seguridad

### Mejores Prácticas

1. **NUNCA exponer la API key en frontend**
   ```typescript
   // ❌ MAL
   const apiKey = process.env.VITE_VERTEX_API_KEY;
   
   // ✅ BIEN - solo en backend
   const apiKey = process.env.GOOGLE_VERTEX_API_KEY;
   ```

2. **Limitar acceso por IP** (producción)
   - Google Cloud Console > API Key > IP restrictions

3. **Rotar API keys regularmente**
   - Cada 90 días como mínimo

4. **Monitorear uso anómalo**
   - Alertas si uso > 2x promedio

---

## 📚 Referencias

- [Google Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [Gemini 1.5 Pro Guide](https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/gemini)
- [Vertex AI Pricing](https://cloud.google.com/vertex-ai/pricing)
- [API Reference](https://cloud.google.com/vertex-ai/docs/reference/rest)

---

**Estado**: ✅ Configurado  
**API Key**: AQ.Ab8RN6LLA2nneA7-lzaJIK07l7eooDNu2RJaPKCTu3L6oZ9m_A  
**Última actualización**: 6 noviembre 2025  
**Versión**: 1.0

---

## 🎉 Resumen

Con esta configuración, DobackSoft tiene acceso a:

✅ **Gemini 1.5 Pro** - IA de última generación  
✅ **Análisis predictivo** - Mantenimientos y fallos  
✅ **Reportes automáticos** - PDFs con IA  
✅ **Chat inteligente** - Asistente conversacional  
✅ **Optimización** - Rutas y operaciones  
✅ **Detección de anomalías** - Tiempo real  

**Coste estimado**: $6-7/mes (o GRATIS con límite gratuito)  
**ROI**: MUY ALTO - automatización y prevención de fallos









