# 🔧 Scripts del Proyecto DobackSoft

Colección de scripts de desarrollo, análisis y utilidades.

---

## 📁 Estructura

### **analisis/** - Scripts de Análisis
Scripts para analizar datos, archivos y sistema:
- Análisis de archivos Doback
- Análisis de sesiones
- Correlación de datos
- Detección de patrones
- Análisis de rotativo y GPS

**Uso:** Scripts temporales de desarrollo, no necesarios para producción.

### **testing/** - Scripts de Testing
Scripts para probar funcionalidades:
- Tests de endpoints
- Tests de KPIs
- Tests de hotspots
- Validación de cálculos
- Tests de integración

**Uso:** Para validar funcionalidades durante desarrollo.

### **setup/** - Scripts de Inicialización
Scripts para configurar el sistema:
- Inicialización de BD
- Creación de datos de prueba
- Configuración inicial
- Setup de administración

**Uso:** Ejecutar una vez para configurar el sistema.

### **utils/** - Scripts de Utilidad
Scripts de utilidad general:
- Verificación de datos
- Verificación de configuración
- Procesamiento de vehículos
- Pruebas del sistema completo

**Uso:** Utilidades para mantenimiento y verificación.

### **historico/** - Scripts Históricos
Scripts antiguos/temporales ya no en uso activo:
- Implementaciones anteriores
- Parches aplicados
- Scripts de migración
- Utilidades obsoletas

**Uso:** Archivo histórico, no usar en desarrollo actual.

---

## 🚀 Scripts Importantes

### **En la Raíz del Proyecto**
```powershell
# Iniciar sistema completo (PRINCIPAL)
.\iniciar.ps1

# Iniciar en modo desarrollo
.\iniciardev.ps1
```

### **Setup (scripts/setup/)**
```powershell
# Inicializar base de datos completa
.\scripts\setup\inicializar-bd-completo.ps1

# Crear datos de prueba
.\scripts\setup\crear-datos-completos.ps1
```

### **Utils (scripts/utils/)**
```powershell
# Verificar configuración del sistema
.\scripts\utils\verificar-configuracion.ps1

# Probar sistema completo
.\scripts\utils\probar-sistema-completo.ps1
```

### **Testing (scripts/testing/)**
```powershell
# Test de upload limpio
.\scripts\testing\test-upload-clean.ps1
```

```javascript
// Tests de endpoints
node scripts/testing/test-endpoints-completo.js

// Tests de KPIs
node scripts/testing/test-kpis-nuevos.js
```

### **Análisis (scripts/analisis/)**
```javascript
// Analizar archivos completos
node scripts/analisis/analisis-completo-archivos.js

// Verificar datos de BD
node scripts/analisis/verificar-datos-bd.js
```

---

## ⚠️ Notas Importantes

1. **Scripts .ps1** son para PowerShell (Windows)
2. **Scripts .js** requieren Node.js
3. **Mayoría son temporales** de desarrollo
4. **No necesarios en producción**
5. **Históricos preservados** por referencia

---

## 🗑️ Limpieza

Puedes eliminar estas carpetas en producción:
- `scripts/analisis/` - Scripts de análisis temporal
- `scripts/testing/` - Scripts de testing
- `scripts/historico/` - Scripts obsoletos

Mantener solo:
- `scripts/setup/` - Para configuración inicial
- `scripts/utils/` - Para mantenimiento

---

## 📊 Estadísticas

```
analisis/     ~15 scripts - Análisis de datos
testing/      ~8 scripts  - Testing
setup/        ~5 scripts  - Inicialización
utils/        ~8 scripts  - Utilidades
historico/    ~5 scripts  - Obsoletos
```

---

**DobackSoft © 2025**

