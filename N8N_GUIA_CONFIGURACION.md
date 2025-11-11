# 🚀 GUÍA DE CONFIGURACIÓN N8N - DOBACKSOFT

## 📋 RESUMEN

Este workflow de n8n monitorea DobackSoft 24/7 y te proporciona:

- ✅ **Monitoreo automático cada 6 horas** de todos los KPIs
- ✅ **Alertas inteligentes** vía Telegram si hay problemas
- ✅ **Análisis con IA** (OpenAI GPT-4) de tendencias y recomendaciones
- ✅ **Historial automático** en Google Sheets para análisis
- ✅ **Detección proactiva** de problemas antes de que sean críticos

---

## 🎯 QUÉ HACE ESTE WORKFLOW

### **Flujo Completo:**

```
[Cada 6 horas]
    ↓
[Login DobackSoft] → Autentica con tu sistema
    ↓
[Obtener KPIs] → Dashboard principal
    ↓
[Obtener Vehículos] → Lista de toda la flota
    ↓
[Obtener Sesiones] → Sesiones del día
    ↓
[Analizar Datos] → Detecta alertas automáticamente
    ↓
[¿Hay Alertas?] → Divide el flujo
    ↓                    ↓
[SÍ]                  [NO]
Alerta Telegram      OK Telegram
    ↓                    ↓
[Guardar en Google Sheets] → Historial
    ↓
[Análisis IA] → OpenAI analiza tendencias
    ↓
[Enviar Análisis] → Telegram con recomendaciones
```

---

## 🔧 CONFIGURACIÓN PASO A PASO

### **PASO 1: Importar Workflow en n8n**

1. Abre n8n (tu cuenta de pago)
2. Click en **"Add workflow"**
3. Click en menú **⋮** → **"Import from File"**
4. Selecciona: `N8N_WORKFLOW_DOBACKSOFT_MONITORING.json`
5. Click **"Import"**

---

### **PASO 2: Configurar Telegram Bot**

#### **2.1 Crear Bot:**
1. Abre Telegram
2. Busca: `@BotFather`
3. Envía: `/newbot`
4. Nombre: `DobackSoft Monitor`
5. Username: `dobacksoft_monitor_bot`
6. **Copia el TOKEN** que te da (ejemplo: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

#### **2.2 Obtener Chat ID:**
1. Envía un mensaje a tu bot (cualquier texto)
2. Abre en navegador:
   ```
   https://api.telegram.org/bot<TU_TOKEN>/getUpdates
   ```
3. Busca en el JSON: `"chat":{"id":123456789}`
4. **Copia ese número** (tu Chat ID)

#### **2.3 Configurar en n8n:**
1. En el workflow, click en nodo **"7a. Enviar Alerta Telegram"**
2. Click en **"Credential to connect with"** → **"Create New"**
3. Pega tu **Bot Token**
4. Click **"Save"**
5. En el campo **"Chat ID"**, pega tu número
6. Repite para los nodos:
   - `7b. Enviar OK Telegram`
   - `10. Enviar Análisis IA`

---

### **PASO 3: Configurar Google Sheets**

#### **3.1 Crear Hoja de Cálculo:**
1. Abre Google Sheets
2. Crea nueva hoja: **"DobackSoft Métricas"**
3. En fila 1, añade estas columnas:
   ```
   Fecha | Hora | Estado | Disponibilidad | Vehiculos | Sesiones | Km | Horas_Operativas | Incidencias | Alertas
   ```
4. Copia el **ID de la URL** (ejemplo: `1ABC...XYZ` de `https://docs.google.com/spreadsheets/d/1ABC...XYZ`)

#### **3.2 Configurar en n8n:**
1. Click en nodo **"8. Guardar en Google Sheets"**
2. Click en **"Credential to connect with"** → **"Create New"**
3. Selecciona **"OAuth2"**
4. Sigue el flujo de autenticación de Google
5. En **"Document ID"**, pega el ID de tu hoja
6. Click **"Save"**

---

### **PASO 4: Configurar OpenAI** (Opcional pero Recomendado)

#### **4.1 Obtener API Key:**
1. Ve a: https://platform.openai.com/api-keys
2. Click **"Create new secret key"**
3. Nombre: `DobackSoft n8n`
4. **Copia la key** (ejemplo: `sk-proj-abc123...`)
5. ⚠️ **IMPORTANTE:** Guárdala, no se mostrará de nuevo

#### **4.2 Configurar en n8n:**
1. Click en nodo **"9. Análisis IA (OpenAI)"**
2. Click en **"Credential to connect with"** → **"Create New"**
3. Pega tu **API Key**
4. Click **"Save"**

**Costo estimado:** ~$0.01 por análisis (con GPT-4o-mini), ~$24/mes con 4 análisis diarios.

---

### **PASO 5: Ajustar Configuración DobackSoft**

En el nodo **"1. Login DobackSoft"**, verifica:

```javascript
{
  "email": "admin@dobacksoft.com",  // ← Tu email de admin
  "password": "admin123"             // ← Tu contraseña
}
```

En todos los nodos que usan la API, verifica:

```javascript
"x-organization-id": "org-1"  // ← Tu organization ID
```

---

### **PASO 6: Probar el Workflow**

1. Click en **"Test workflow"** (botón arriba a la derecha)
2. Observa que cada nodo se ejecute correctamente ✅
3. Deberías recibir en Telegram:
   - Mensaje con métricas actuales
   - Análisis IA con recomendaciones
4. Verifica en Google Sheets que se haya añadido una fila

**Si todo funciona → Click en "Active"** (toggle arriba) para activarlo permanentemente.

---

## 🎛️ PERSONALIZACIÓN AVANZADA

### **Cambiar Frecuencia de Monitoreo:**

En el nodo **"Ejecutar cada 6 horas"**:
- Cada 3 horas: `hoursInterval: 3`
- Cada 12 horas: `hoursInterval: 12`
- Diario a las 9 AM: Cambiar a "Cron" → `0 9 * * *`

### **Ajustar Umbrales de Alerta:**

En el nodo **"5. Analizar Datos"**, modifica:

```javascript
// Alerta si disponibilidad < 80%
if (disponibilidad < 80) {
  alertas.push(`⚠️ Disponibilidad BAJA: ${disponibilidad.toFixed(1)}%`);
}

// Cambia a 70% si quieres menos alertas
if (disponibilidad < 70) { ... }
```

### **Añadir Más Endpoints:**

Duplica el nodo **"4. Obtener Sesiones"** y añade:
- `/api/stability/events` - Eventos de estabilidad
- `/api/alerts` - Alertas del sistema
- `/api/maintenance` - Mantenimientos programados

---

## 📊 MÉTRICAS QUE MONITOREA

| Métrica | Descripción | Alerta Si |
|---------|-------------|-----------|
| **Disponibilidad** | % de vehículos operativos | < 80% (⚠️) o < 50% (🚨) |
| **Vehículos** | Total en el sistema | = 0 (🚨) |
| **Sesiones** | Sesiones registradas | = 0 (⚠️) |
| **Km Recorridos** | Total de kilómetros | - |
| **Horas Operativas** | Tiempo de operación | - |
| **Incidencias** | Eventos detectados | > 10 (⚠️) |

---

## 🔍 ANÁLISIS IA INCLUYE

El análisis de OpenAI proporciona:

1. **Evaluación del estado general** del sistema
2. **Tendencias detectadas** en las últimas ejecuciones
3. **Recomendaciones de acción** específicas
4. **Predicciones de mantenimiento** basadas en patrones

Ejemplo de respuesta:

```
🤖 ANÁLISIS IA - DOBACKSOFT

Estado General: El sistema opera dentro de parámetros normales con una 
disponibilidad del 87.3%, ligeramente por encima del objetivo del 80%.

Tendencias Detectadas:
- Los km recorridos muestran un aumento del 12% respecto a la media
- Las incidencias se mantienen estables (5 eventos en las últimas 6 horas)

Recomendaciones:
1. Revisar vehículo V-003 que muestra disponibilidad del 65%
2. Programar mantenimiento preventivo para próxima semana
3. Optimizar rutas para reducir km innecesarios

Predicción: Mantenimiento requerido en 7-10 días para la flota principal.
```

---

## 💰 COSTOS ESTIMADOS (Cuenta de Pago)

Con tu cuenta de pago de n8n:

| Servicio | Uso | Costo Mensual |
|----------|-----|---------------|
| **n8n Cloud** | Plan Pro | ~$20/mes |
| **Telegram** | Ilimitado | Gratis |
| **Google Sheets** | Hasta 1M filas | Gratis |
| **OpenAI** | 120 análisis/mes | ~$2.40/mes |
| **TOTAL** | | **~$22.40/mes** |

**ROI:** Detección proactiva de problemas puede ahorrar miles en mantenimientos correctivos.

---

## 🚨 SOLUCIÓN DE PROBLEMAS

### **Error: "Authentication failed" en Login**
- ✅ Verifica credenciales en nodo 1
- ✅ Asegúrate de que backend esté corriendo (puerto 9998)
- ✅ Prueba login manual: `curl -X POST http://localhost:9998/api/auth/login -d '{"email":"admin@dobacksoft.com","password":"admin123"}' -H "Content-Type: application/json"`

### **Error: "Telegram bot not responding"**
- ✅ Verifica Bot Token correcto
- ✅ Asegúrate de haber enviado mensaje al bot primero
- ✅ Verifica Chat ID es número (no texto)

### **Error: "Google Sheets permission denied"**
- ✅ Re-autentica con Google OAuth2
- ✅ Verifica permisos de edición en la hoja
- ✅ Comprueba que el Sheet ID es correcto

### **Error: "OpenAI rate limit"**
- ✅ Verifica que tienes créditos en tu cuenta OpenAI
- ✅ Reduce frecuencia del workflow (cada 12h en vez de 6h)
- ✅ Usa modelo más económico: `gpt-3.5-turbo` en vez de `gpt-4`

---

## 📈 MEJORAS FUTURAS

### **Nivel 1: Añadir Email**
- Instala nodo **Gmail** o **SendGrid**
- Envía reportes semanales automáticos
- CC a gerencia con análisis ejecutivo

### **Nivel 2: Slack Integration**
- Crea canal #dobacksoft-alerts
- Notificaciones al equipo técnico
- Integración con sistema de tickets

### **Nivel 3: Backup Automático**
- Nodo **AWS S3**
- Backup diario de métricas
- Retención de 90 días

### **Nivel 4: Machine Learning**
- Entrenar modelo predictivo
- Detección de anomalías avanzada
- Predicción de fallos con 48h anticipación

---

## ✅ CHECKLIST FINAL

Antes de activar el workflow:

- [ ] ✅ Workflow importado correctamente
- [ ] ✅ Telegram Bot Token configurado
- [ ] ✅ Telegram Chat ID configurado
- [ ] ✅ Google Sheets autenticado
- [ ] ✅ Google Sheet ID configurado
- [ ] ✅ OpenAI API Key configurado (opcional)
- [ ] ✅ Credenciales DobackSoft verificadas
- [ ] ✅ Organization ID correcto
- [ ] ✅ Test ejecutado exitosamente
- [ ] ✅ Recibida notificación Telegram
- [ ] ✅ Datos guardados en Google Sheets
- [ ] ✅ Workflow activado (toggle ON)

---

## 🎉 ¡LISTO!

Una vez completada la configuración, tendrás:

- ✅ **Monitoreo 24/7 automático** de todo DobackSoft
- ✅ **Alertas instantáneas** ante cualquier problema
- ✅ **Análisis inteligente con IA** cada 6 horas
- ✅ **Historial completo** en Google Sheets
- ✅ **Predicción de problemas** antes de que ocurran
- ✅ **Sistema enterprise-grade** por ~$22/mes

---

## 📞 SOPORTE

**Archivos relacionados:**
- `N8N_WORKFLOW_DOBACKSOFT_MONITORING.json` - Workflow para importar
- `N8N_GUIA_CONFIGURACION.md` - Esta guía

**Problemas comunes:**
- Backend debe correr en puerto 9998
- Frontend debe correr en puerto 5174
- PostgreSQL debe estar activo (Docker)

**¿Necesitas ayuda?** Revisa los logs de cada nodo en n8n para ver errores específicos.

---

**Creado para DobackSoft - StabilSafe V3**
**Versión: 1.0**
**Fecha: 2025-01-15**









