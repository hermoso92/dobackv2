# 🚨 SISTEMA DE EVENTOS DE ESTABILIDAD V2

**Estado:** ✅ Implementado y Validado  
**Versión:** 2.0 (Sistema Híbrido)  
**Fecha:** 3 de Noviembre de 2025

---

## 📋 INICIO RÁPIDO

### Usar el Detector V2

```typescript
import { eventDetectorV2 } from './services/eventDetectorV2';

// Detectar y guardar eventos de una sesión
const resultado = await eventDetectorV2.detectarYGuardarEventosV2(sessionId);
console.log(`Detectados: ${resultado.total}, Guardados: ${resultado.guardados}`);
```

### Validar Datos (Opcional)

```bash
cd DobackSoft
npx ts-node --project backend/tsconfig.json \
  scripts/analisis/validar-datos-eventos-v2.ts
```

---

## 🎯 SISTEMA HÍBRIDO

### Flujo de Detección

```
1️⃣  FILTRO: SI < 0.50 (Índice de Estabilidad)
    ↓
2️⃣  SEVERIDAD: Por SI
    • SI < 0.20  → GRAVE
    • 0.20-0.35  → MODERADA  
    • 0.35-0.50  → LEVE
    ↓
3️⃣  TIPO: Por fenómeno físico
    • MANIOBRA_BRUSCA (volantazo)
    • INCLINACION_LATERAL_EXCESIVA (pendiente)
    • CURVA_VELOCIDAD_EXCESIVA (curva rápida)
    • RIESGO_VUELCO (genérico)
```

---

## 📚 DOCUMENTACIÓN

| Documento | Descripción |
|-----------|-------------|
| `AUDITORIA_CALCULO_EVENTOS.md` | Auditoría completa del sistema |
| `SISTEMA_HIBRIDO_EVENTOS_V2_FINAL.md` | Especificación técnica detallada |
| `INFORME_FINAL_AUDITORIA_EVENTOS.md` | Resultados de validación |
| `README_EVENTOS_V2.md` | Este archivo (inicio rápido) |

---

## ✅ VALIDADO

```
✅ 6 sesiones validadas
✅ 209,221 mediciones analizadas
✅ 13 eventos detectados y guardados
✅ 100% conformidad con Mandamientos M3
```

---

**Próximo paso:** Desplegar con feature flag `EVENT_DETECTOR_V2=true`







