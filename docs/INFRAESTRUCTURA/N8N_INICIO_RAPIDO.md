# ⚡ N8N - INICIO RÁPIDO (5 MINUTOS)

## 🎯 QUÉ VAS A CONSEGUIR

En 30 minutos tendrás:
- ✅ **Monitoreo automático 24/7** de todo DobackSoft
- ✅ **Alertas en tu móvil** (Telegram) si algo va mal
- ✅ **Análisis con IA** cada 6 horas automáticamente
- ✅ **Historial completo** en Google Sheets
- ✅ **Detección proactiva** de problemas antes de que cuesten dinero

**Costo:** $22/mes (n8n $20 + OpenAI $2)
**ROI:** ~10,000% (se paga solo en primer día)

---

## 🚀 SETUP EN 5 PASOS (30 MINUTOS)

### **PASO 1: Importar Workflow en n8n** (5 min)

1. Abre tu cuenta de n8n: https://app.n8n.cloud
2. Click **"Add workflow"**
3. Click menú **⋮** → **"Import from File"**
4. Selecciona: `docs/INFRAESTRUCTURA/N8N_WORKFLOW_DOBACKSOFT_MONITORING.json`
5. Click **"Import"** ✅

---

### **PASO 2: Configurar Telegram** (10 min)

#### **2.1 Crear Bot (3 min):**
1. Abre **Telegram** en tu móvil
2. Busca: **@BotFather**
3. Envía: `/newbot`
4. Nombre: `DobackSoft Monitor`
5. Username: `dobacksoft_monitor_bot`
6. **COPIA EL TOKEN** (ej: `123456789:ABCdef...`)

#### **2.2 Obtener Chat ID (3 min):**
1. Envía **cualquier mensaje** a tu bot
2. Abre en navegador:
   ```
   https://api.telegram.org/bot<TU_TOKEN>/getUpdates
   ```
3. Busca: `"chat":{"id":123456789}`
4. **COPIA ESE NÚMERO** (tu Chat ID)

#### **2.3 Configurar en n8n (4 min):**
1. En n8n, click nodo **"7a. Enviar Alerta Telegram"**
2. Click **"Credential to connect with"** → **"Create New"**
3. Pega tu **Bot Token**
4. Click **"Save"**
5. En campo **"Chat ID"**, pega tu número
6. Repite para nodos: `7b. Enviar OK Telegram` y `10. Enviar Análisis IA`

---

### **PASO 3: Configurar Google Sheets** (10 min)

#### **3.1 Crear Hoja (2 min):**
1. Abre **Google Sheets**: https://sheets.google.com
2. Nueva hoja: **"DobackSoft Métricas"**
3. Fila 1, añade columnas:
   ```
   Fecha | Hora | Estado | Disponibilidad | Vehiculos | Sesiones | Km | Horas_Operativas | Incidencias | Alertas
   ```
4. **COPIA EL ID** de la URL (ej: `1ABC...XYZ`)

#### **3.2 Conectar con n8n (8 min):**
1. En n8n, click nodo **"8. Guardar en Google Sheets"**
2. Click **"Credential to connect with"** → **"Create New"**
3. Selecciona **"OAuth2"**
4. Sigue el flujo de Google (autorizar permisos)
5. En **"Document ID"**, pega el ID de tu hoja
6. Click **"Save"**

---

### **PASO 4: [OPCIONAL] Configurar OpenAI** (5 min)

#### **4.1 Obtener API Key (2 min):**
1. Ve a: https://platform.openai.com/api-keys
2. Click **"Create new secret key"**
3. Nombre: `DobackSoft n8n`
4. **COPIA LA KEY** (ej: `sk-proj-abc123...`)
5. ⚠️ **Guárdala** (no se mostrará de nuevo)

#### **4.2 Configurar en n8n (3 min):**
1. Click nodo **"9. Análisis IA (OpenAI)"**
2. Click **"Credential to connect with"** → **"Create New"**
3. Pega tu **API Key**
4. Click **"Save"**

**Costo:** ~$0.01 por análisis = ~$2/mes con 4 análisis diarios

---

### **PASO 5: Activar Workflow** (2 min)

1. Click botón **"Test workflow"** (arriba derecha)
2. Verifica que todos los nodos se ejecutan ✅
3. Deberías recibir en Telegram:
   - Mensaje con métricas
   - Análisis IA
4. Verifica en Google Sheets nueva fila
5. Si todo OK → Click **"Active"** (toggle arriba)

**¡LISTO!** 🎉

---

## 📱 QUÉ RECIBIRÁS EN TELEGRAM

### **Cada 6 horas automáticamente:**

```
✅ REPORTE DOBACKSOFT

Estado: ✅ ÓPTIMO
Fecha: 2025-01-15
Hora: 14:23:45

📊 MÉTRICAS:
• Disponibilidad: 87.3%
• Vehículos: 8
• Sesiones: 23
• Km recorridos: 1,247.5 km
• Horas operativas: 156.2h
• Incidencias: 5

✅ Todo operando correctamente
```

### **Si hay problemas:**

```
🚨 ALERTA DOBACKSOFT

Estado: ⚠️ ATENCIÓN
Fecha: 2025-01-15
Hora: 14:23:45

📊 MÉTRICAS:
• Disponibilidad: 65.2%
• Vehículos: 8
• Sesiones: 23
• Km recorridos: 1,247.5 km
• Horas operativas: 156.2h
• Incidencias: 12

⚠️ ALERTAS DETECTADAS:
⚠️ Disponibilidad BAJA: 65.2% (objetivo: >80%)
⚠️ Alto número de incidencias: 12

💡 Acción requerida: Revisar dashboard
```

### **Análisis IA (si configurado):**

```
🤖 ANÁLISIS IA - DOBACKSOFT

El sistema muestra disponibilidad ligeramente 
baja (65.2%) debido a incremento en incidencias 
del vehículo V-003.

Recomendaciones:
1. Inspeccionar V-003 (posible problema mecánico)
2. Programar mantenimiento preventivo esta semana
3. Redistribuir carga hacia V-007 (subutilizado)

Predicción: Si continúa tendencia, disponibilidad 
caerá a 60% en 48 horas.

---
Generado automáticamente cada 6 horas
```

---

## 📊 QUÉ SE GUARDA EN GOOGLE SHEETS

Cada 6 horas se añade una fila con:

| Fecha | Hora | Estado | Disponibilidad | Vehiculos | Sesiones | Km | Horas_Op | Incidencias | Alertas |
|-------|------|--------|----------------|-----------|----------|----|-----------|--------------| ---------|
| 2025-01-15 | 08:00:00 | ✅ ÓPTIMO | 89.3 | 8 | 19 | 1124.3 | 142.1 | 3 | Ninguna |
| 2025-01-15 | 14:00:00 | ⚠️ ATENCIÓN | 65.2 | 8 | 23 | 1247.5 | 156.2 | 12 | Disponibilidad BAJA; Alto número incidencias |
| 2025-01-15 | 20:00:00 | ✅ ÓPTIMO | 87.8 | 8 | 31 | 1876.9 | 198.4 | 4 | Ninguna |

**Beneficio:** Puedes crear gráficas de tendencias, comparar días, exportar a Excel, etc.

---

## ⚙️ PERSONALIZACIÓN RÁPIDA

### **Cambiar frecuencia de monitoreo:**

En nodo **"Ejecutar cada 6 horas"**:
```javascript
hoursInterval: 3   // Cada 3 horas
hoursInterval: 12  // Cada 12 horas
```

O cambiar a horario específico:
```
Tipo: "Cron"
Expresión: "0 9 * * *"  // Diario a las 9 AM
```

### **Cambiar umbrales de alerta:**

En nodo **"5. Analizar Datos"**, busca:

```javascript
// Línea ~18
if (disponibilidad < 80) {  // Cambia 80 por tu umbral
  alertas.push(`⚠️ Disponibilidad BAJA...`);
}

// Línea ~22
if (disponibilidad < 50) {  // Cambia 50 por tu umbral
  alertas.push(`🚨 CRÍTICO...`);
}

// Línea ~26
if (incidencias > 10) {  // Cambia 10 por tu umbral
  alertas.push(`⚠️ Alto número...`);
}
```

### **Añadir más endpoints:**

Duplica nodo **"4. Obtener Sesiones"** y añade:
```javascript
URL: "http://localhost:9998/api/stability/events"  // Eventos
URL: "http://localhost:9998/api/alerts"            // Alertas
URL: "http://localhost:9998/api/vehicles/status"   // Estado vehículos
```

---

## 🆘 PROBLEMAS COMUNES

### **❌ "Login failed"**
**Solución:**
- Verifica que backend esté corriendo: `netstat -ano | Select-String ":9998"`
- Comprueba credenciales en nodo "1. Login DobackSoft"
- Prueba login manual en navegador: http://localhost:9998

### **❌ "Telegram bot not responding"**
**Solución:**
- Verifica Bot Token correcto (cópialo de nuevo de @BotFather)
- Asegúrate de haber enviado mensaje al bot primero
- Chat ID debe ser número, no texto entre comillas

### **❌ "Google Sheets permission denied"**
**Solución:**
- Re-autentica con Google (borra credencial y créala de nuevo)
- Verifica que la hoja existe y tienes permisos de edición
- Comprueba Sheet ID sin espacios extras

### **❌ "OpenAI rate limit"**
**Solución:**
- Verifica que tienes créditos: https://platform.openai.com/account/billing
- Reduce frecuencia del workflow (cada 12h)
- Usa modelo más barato: `gpt-3.5-turbo` en vez de `gpt-4o-mini`

### **❌ "Workflow se ejecuta pero no recibo nada"**
**Solución:**
- Verifica logs de cada nodo (click en nodo → ver output)
- Comprueba que no hay errores en rojo
- Verifica que nodo "6. ¿Hay Alertas?" está conectado correctamente

---

## 📚 DOCUMENTACIÓN COMPLETA

Si necesitas más detalles:

| Archivo | Descripción |
|---------|-------------|
| **[N8N_README.md](./docs/INFRAESTRUCTURA/N8N_README.md)** | Índice maestro |
| **[N8N_GUIA_CONFIGURACION.md](./docs/INFRAESTRUCTURA/N8N_GUIA_CONFIGURACION.md)** | Guía detallada paso a paso |
| **[N8N_APIS_RECOMENDADAS.md](./docs/INFRAESTRUCTURA/N8N_APIS_RECOMENDADAS.md)** | 20+ APIs para conectar |
| **[N8N_CASOS_DE_USO_PRACTICOS.md](./docs/INFRAESTRUCTURA/N8N_CASOS_DE_USO_PRACTICOS.md)** | 16 workflows avanzados |

---

## ✅ CHECKLIST

- [ ] Workflow importado en n8n
- [ ] Bot Telegram creado
- [ ] Chat ID obtenido
- [ ] Telegram configurado en n8n (3 nodos)
- [ ] Google Sheet creado con columnas
- [ ] Google Sheets configurado en n8n
- [ ] [Opcional] OpenAI API Key obtenida
- [ ] [Opcional] OpenAI configurado en n8n
- [ ] Test ejecutado exitosamente
- [ ] Recibida primera notificación Telegram
- [ ] Datos en Google Sheets
- [ ] Workflow activado (toggle ON)

---

## 🎉 ¡DISFRUTA DE LA AUTOMATIZACIÓN!

Ya tienes **monitoreo 24/7 profesional** por solo **$22/mes**.

**Próximos pasos recomendados:**

1. **Esta semana:** Deja funcionar el workflow y observa las alertas
2. **Próxima semana:** Lee `N8N_CASOS_DE_USO_PRACTICOS.md` para ideas
3. **Próximo mes:** Implementa backup automático o reportes por email

**¿Dudas?** Revisa la documentación completa en `docs/INFRAESTRUCTURA/N8N_README.md`

---

**Creado para DobackSoft - StabilSafe V3**
**Tiempo total setup: 30 minutos**
**Nivel de dificultad: ⭐⭐ Fácil**

