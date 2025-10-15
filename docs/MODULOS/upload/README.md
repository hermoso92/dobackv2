# 📋 SISTEMA DE UPLOAD MASIVO - DOCUMENTACIÓN

**Versión:** 2.0  
**Fecha:** 2025-10-11  
**Estado:** ACTIVO

---

## 📚 ÍNDICE DE DOCUMENTACIÓN

1. **[01-PROTOCOLOS.md](./01-PROTOCOLOS.md)** ⭐ - Reglas inmutables y arquitectura
2. **[02-VALIDACIONES.md](./02-VALIDACIONES.md)** - Sistema de validación completo
3. **[03-FLUJO-PROCESAMIENTO.md](./03-FLUJO-PROCESAMIENTO.md)** - Flujo paso a paso
4. **[04-TROUBLESHOOTING.md](./04-TROUBLESHOOTING.md)** - Solución de problemas
5. **[05-TESTING.md](./05-TESTING.md)** - Guía de pruebas
6. **[06-API-REFERENCE.md](./06-API-REFERENCE.md)** - Referencia de API

---

## 🚀 INICIO RÁPIDO

### **Para Desarrolladores Nuevos:**

1. Leer `01-PROTOCOLOS.md` (15 min)
2. Leer `03-FLUJO-PROCESAMIENTO.md` (10 min)
3. Revisar código en orden:
   - `backend/src/lib/prisma.ts`
   - `backend/src/validators/uploadValidator.ts`
   - `backend/src/routes/upload-unified.ts`
   - `backend/src/services/UnifiedFileProcessor.ts`
4. Ejecutar `.\verificar-sistema-upload.ps1`

### **Para Resolver Problemas:**

1. Consultar `04-TROUBLESHOOTING.md`
2. Buscar el error específico
3. Seguir pasos de diagnóstico
4. Aplicar solución documentada

### **Para Modificar Código:**

1. Leer `02-VALIDACIONES.md`
2. Seguir las reglas inmutables
3. Usar validadores en tu código
4. Ejecutar tests
5. Verificar con checklist

---

## 🎯 COMPONENTES PRINCIPALES

### **Backend:**
```
backend/src/
├── lib/
│   └── prisma.ts                    # Singleton Prisma (CRÍTICO)
├── validators/
│   ├── uploadValidator.ts           # Validaciones backend
│   └── __tests__/
│       └── uploadValidator.test.ts  # 80+ tests
├── routes/
│   ├── upload-unified.ts            # Endpoint principal
│   └── index.ts                     # Endpoint clean-all-sessions
├── services/
│   ├── UnifiedFileProcessor.ts      # Procesador principal
│   └── parsers/
│       ├── MultiSessionDetector.ts  # Detecta sesiones múltiples
│       ├── RobustGPSParser.ts       # Parser GPS con 5 validaciones
│       ├── RobustStabilityParser.ts # Parser Estabilidad
│       ├── RobustRotativoParser.ts  # Parser Rotativo
│       └── gpsUtils.ts              # Utilidades GPS
```

### **Frontend:**
```
frontend/src/
├── pages/
│   └── UploadPage.tsx               # Página principal
├── components/
│   └── FileUploadManager.tsx        # Componente principal
└── utils/
    └── uploadValidator.ts           # Validaciones frontend
```

---

## 🔒 REGLAS INMUTABLES (NUNCA VIOLAR)

1. **✅ SIEMPRE** usar singleton Prisma (`import { prisma } from '../lib/prisma'`)
2. **✅ SIEMPRE** validar autenticación y organizationId
3. **✅ SIEMPRE** seguir formato: `TIPO_DOBACK###_YYYYMMDD.txt`
4. **✅ SIEMPRE** detectar sesiones múltiples
5. **✅ SIEMPRE** validar GPS (5 validaciones)
6. **✅ SIEMPRE** crear vehículo si no existe
7. **✅ SIEMPRE** guardar en orden: Vehículo → Sesión → Mediciones → Calidad
8. **✅ SIEMPRE** invalidar cache después de upload
9. **✅ SIEMPRE** usar logger (no console.log)
10. **❌ NUNCA** procesar sin organizationId

---

## 🧪 TESTING RÁPIDO

```powershell
# Verificar sistema
.\verificar-sistema-upload.ps1 -Verbose

# Ejecutar tests
cd backend
npm test -- uploadValidator.test.ts

# Probar upload
# 1. Ir a http://localhost:5174/upload
# 2. Click "Limpiar Base de Datos"
# 3. Click "Iniciar Procesamiento Automático"
# 4. Ver resultado con métricas detalladas
```

---

## 📊 MÉTRICAS DE CALIDAD

### **Sistema debe tener:**
- ✅ 0 errores de "too many clients"
- ✅ > 90% de GPS válidos (después de validación)
- ✅ 100% de sesiones con organizationId
- ✅ < 5 segundos para archivos pequeños
- ✅ 100% de tests pasando

---

## 🆘 SOPORTE

**Si encuentras un problema:**
1. Consultar `04-TROUBLESHOOTING.md`
2. Revisar logs del backend
3. Ejecutar `verificar-sistema-upload.ps1`
4. Verificar BD manualmente

**Si necesitas ayuda:**
- Revisar documentación completa
- Ejecutar tests para ver qué falla
- Crear issue con logs y pasos para reproducir

---

**Última actualización:** 2025-10-11 19:47  
**Mantenedor:** DobackSoft Team

