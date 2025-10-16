# 🔧 CAMBIO DE UMBRAL DE CORRELACIÓN

**Fecha:** 12/10/2025  
**Archivo:** `backend/src/services/upload/SessionCorrelationRules.ts`

---

## ⚙️ **CAMBIO REALIZADO**

### **ANTES:**
```typescript
export const CORRELATION_TIME_THRESHOLD_SECONDS = 120; // 2 minutos
```

### **DESPUÉS:**
```typescript
export const CORRELATION_TIME_THRESHOLD_SECONDS = 300; // 5 minutos
```

---

## 📊 **JUSTIFICACIÓN**

### **Problema detectado:**
- **30 grupos completos** (EST + GPS + ROT) disponibles
- **Solo 6 sesiones creadas**
- **Rechazos masivos** por "Falta ROTATIVO" o "Falta GPS"
- **Logs muestran:** Archivos existen pero no se correlacionan

### **Causa raíz:**
El umbral de 120 segundos es **demasiado estricto** para vehículos de emergencia donde:
1. **GPS tarda en obtener señal satelital** (puede tardar 2-5 minutos)
2. **Sistemas arrancan con desfase** (ESTABILIDAD, GPS, ROTATIVO no sincronizan perfectamente)
3. **Arranques rápidos** en emergencias causan desfases temporales

### **Evidencia:**
```
Correlacionando: EST=8, GPS=6, ROT=7
→ 15 sesiones correlacionadas
→ Solo 2 válidas (las demás sin GPS o ROT correlacionado)
```

**Interpretación:** Las sesiones ESTABILIDAD no encuentran GPS/ROT dentro del rango de ±120s.

---

## 📈 **IMPACTO ESPERADO**

### **Con umbral 120s (ANTES):**
- Sesiones creadas: 6
- Sesiones rechazadas: ~300+ por "Falta ROTATIVO/GPS"

### **Con umbral 300s (AHORA):**
- Sesiones esperadas: ~50-89 (más correlaciones exitosas)
- Sesiones rechazadas: Solo las que realmente no cumplen criterios

---

## 🚀 **INSTRUCCIONES**

### **1. Reiniciar backend:**
```powershell
# Ctrl+C en ventana del backend
.\iniciar.ps1
```

### **2. Probar:**
1. Ir a `/upload`
2. Limpiar BD
3. Procesar (GPS obligatorio activo)

### **3. Verificar:**
- Sesiones creadas >= 50
- Menos "Falta ROTATIVO" (deberían correlacionarse mejor)
- Timestamps correctos (09:xx en lugar de 11:xx)

---

## 🔄 **SI TODAVÍA NO ES SUFICIENTE:**

### **Plan B: Aumentar a 600s (10 minutos)**
```typescript
export const CORRELATION_TIME_THRESHOLD_SECONDS = 600;
```

### **Plan C: Correlación por solape temporal**
En lugar de solo comparar tiempos de inicio, verificar si los rangos de tiempo se solapan:
- ESTABILIDAD: 09:33 - 10:38
- ROTATIVO: 09:33 - 10:38  
- Solape: SÍ → Correlacionar

---

_Cambio aplicado. Reinicia el backend y prueba._

