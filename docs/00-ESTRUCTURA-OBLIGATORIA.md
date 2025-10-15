# 🏗️ ESTRUCTURA OBLIGATORIA DEL PROYECTO

> **⚠️ ESTAS REGLAS SON OBLIGATORIAS Y NO NEGOCIABLES**

---

## 📂 ESTRUCTURA OFICIAL

```
DobackSoft/
│
├── README.md                    ⭐ ÚNICO .md PERMITIDO EN RAÍZ
├── iniciar.ps1                  ⭐ Script principal de inicio
├── iniciardev.ps1               Script modo desarrollo
├── package.json                 Dependencias Node.js
├── package-lock.json            Lock de dependencias
│
├── .env                         Variables de entorno
├── .gitignore                   Git ignore
├── config.env                   Configuración del sistema
├── Dockerfile                   Configuración Docker
│
├── backend/                     🔧 API y lógica de negocio
├── frontend/                    💻 Interfaz React
│
├── docs/                        📚 TODA LA DOCUMENTACIÓN AQUÍ
│   ├── README.md
│   ├── 01-inicio/               Guías de inicio
│   ├── 02-arquitectura/         Diseño del sistema
│   ├── 03-implementacion/       Fases de desarrollo
│   ├── 04-auditorias/           Control de calidad
│   ├── 05-correcciones/         Soluciones aplicadas
│   ├── 06-guias/                Manuales de uso
│   ├── 07-verificaciones/       Testing y validación
│   ├── 08-analisis/             Análisis técnicos
│   └── 09-historico/            Registro histórico
│
├── scripts/                     🔧 TODOS LOS SCRIPTS AQUÍ
│   ├── README.md
│   ├── analisis/                Scripts de análisis
│   ├── testing/                 Scripts de testing
│   ├── setup/                   Scripts de inicialización
│   ├── utils/                   Scripts de utilidad
│   └── historico/               Scripts obsoletos
│
├── database/                    💾 Scripts SQL y migraciones
├── tests/                       ✅ Tests automatizados (Playwright)
├── temp/                        📦 Archivos temporales
├── logs/                        📋 Logs del sistema
├── config/                      ⚙️ Configuración
├── data/                        💿 Datos de prueba
└── uploads/                     📤 Archivos subidos
```

---

## 🚨 REGLAS OBLIGATORIAS

### **❌ PROHIBIDO EN LA RAÍZ**

1. ❌ **Archivos .md** (excepto README.md)
2. ❌ **Scripts temporales** (.js, .ps1 de desarrollo)
3. ❌ **Archivos de análisis** (logs, json, html)
4. ❌ **Scripts SQL** (.sql)
5. ❌ **Archivos de backup** (.backup, .zip)
6. ❌ **Más de 20 archivos en total**

### **✅ PERMITIDO EN LA RAÍZ**

1. ✅ **README.md** (único .md)
2. ✅ **iniciar.ps1** (script principal)
3. ✅ **iniciardev.ps1** (script desarrollo)
4. ✅ **package.json** y **package-lock.json**
5. ✅ **Archivos de configuración** (.env, .gitignore, config.env, Dockerfile, etc.)
6. ✅ **Carpetas principales** (backend, frontend, docs, scripts, etc.)

---

## 📚 DOCUMENTACIÓN

### **Ubicación: `docs/`**

**TODA la documentación DEBE estar en `docs/` organizada por categorías:**

#### **📁 01-inicio/**
- Guías de inicio rápido
- Instrucciones de instalación
- README del sistema
- Crear usuarios

**Cuándo usar:** Documentos esenciales para empezar.

#### **📁 02-arquitectura/**
- Diseño del sistema
- Flujo de datos
- Protocolos
- Arquitectura técnica

**Cuándo usar:** Documentación técnica del sistema.

#### **📁 03-implementacion/**
- Fases completadas
- Cronogramas
- Progreso de desarrollo
- Integraciones

**Cuándo usar:** Registro de implementación y desarrollo.

#### **📁 04-auditorias/**
- Auditorías del sistema
- Reportes de estado
- Diagnósticos
- Informes de calidad

**Cuándo usar:** Control de calidad y auditorías.

#### **📁 05-correcciones/**
- Correcciones aplicadas
- Soluciones implementadas
- Fixes de bugs
- Mejoras realizadas

**Cuándo usar:** Registro de correcciones y soluciones.

#### **📁 06-guias/**
- Manuales de uso
- Guías de funcionalidades
- Configuración
- Licencias y contribución

**Cuándo usar:** Guías para usuarios y desarrolladores.

#### **📁 07-verificaciones/**
- Checklists de pruebas
- Planes de verificación
- Tests realizados
- Validaciones

**Cuándo usar:** Documentación de testing y QA.

#### **📁 08-analisis/**
- Análisis técnicos
- Análisis de archivos
- Cálculos de KPIs
- Descubrimientos

**Cuándo usar:** Análisis profundos del sistema.

#### **📁 09-historico/**
- Entregas anteriores
- Estados previos
- Consolidados históricos
- Versiones antiguas

**Cuándo usar:** Archivo histórico del proyecto.

---

## 🔧 SCRIPTS

### **Ubicación: `scripts/`**

**TODOS los scripts DEBEN estar en `scripts/` organizados por función:**

#### **📁 scripts/analisis/**
Scripts para analizar datos, archivos y sistema:
- Análisis de archivos Doback
- Análisis de sesiones
- Correlación de datos
- Detección de patrones

**Ejemplos:**
```javascript
scripts/analisis/analisis-completo-archivos.js
scripts/analisis/verificar-datos-bd.js
scripts/analisis/detectar-parques-bomberos.js
```

#### **📁 scripts/testing/**
Scripts para probar funcionalidades:
- Tests de endpoints
- Tests de KPIs
- Validación de cálculos
- Tests de integración

**Ejemplos:**
```javascript
scripts/testing/test-endpoints-completo.js
scripts/testing/test-kpis-nuevos.js
```

```powershell
scripts/testing/test-upload-clean.ps1
```

#### **📁 scripts/setup/**
Scripts para configurar el sistema:
- Inicialización de BD
- Creación de datos de prueba
- Configuración inicial

**Ejemplos:**
```powershell
scripts/setup/inicializar-bd-completo.ps1
scripts/setup/crear-datos-completos.ps1
```

#### **📁 scripts/utils/**
Scripts de utilidad general:
- Verificación de datos
- Verificación de configuración
- Procesamiento de datos
- Pruebas del sistema

**Ejemplos:**
```powershell
scripts/utils/verificar-configuracion.ps1
scripts/utils/probar-sistema-completo.ps1
```

```javascript
scripts/utils/verificar-geocercas.js
```

#### **📁 scripts/historico/**
Scripts obsoletos o ya no en uso:
- Implementaciones antiguas
- Parches aplicados
- Migraciones completadas

**Nota:** Preservados por referencia, no usar en desarrollo actual.

---

## 📦 ARCHIVOS TEMPORALES

### **Ubicación: `temp/`**

**TODOS los archivos temporales en `temp/`:**
- Logs de análisis (`.log`)
- JSON de resultados (`.json`)
- HTML de diagnóstico (`.html`)
- Archivos de texto temporales (`.txt`)
- Backups de análisis (`.zip`)

**Estos archivos:**
- ✅ Pueden eliminarse sin afectar el sistema
- ✅ Se regeneran automáticamente
- ✅ No se versionan en Git
- ✅ Útiles solo para debugging

---

## 💾 SCRIPTS SQL

### **Ubicación: `database/`**

**TODOS los archivos SQL en `database/`:**
- Scripts de creación de tablas
- Scripts de migración
- Scripts de revisión
- Queries de mantenimiento

**Ejemplos:**
```sql
database/crear-zonas.sql
database/revision-absoluta-completa-bd.sql
```

---

## ✅ CHECKLIST AL CREAR ARCHIVOS

### **¿Vas a crear documentación?**
- [ ] ¿Es un .md?
- [ ] ¿Debe ir en `docs/`?
- [ ] ¿En qué categoría? (01-inicio, 02-arquitectura, etc.)
- [ ] ❌ NO crear en la raíz

### **¿Vas a crear un script?**
- [ ] ¿Es .js o .ps1?
- [ ] ¿Es temporal o de desarrollo?
- [ ] ¿En qué categoría? (analisis, testing, setup, utils)
- [ ] ❌ NO dejar en la raíz

### **¿Es un archivo temporal?**
- [ ] ¿Es log, json, html, backup?
- [ ] Colocar en `temp/`
- [ ] ❌ NO dejar en la raíz

### **¿Es un script SQL?**
- [ ] Colocar en `database/`
- [ ] ❌ NO dejar en la raíz

---

## 🚨 VIOLACIONES COMUNES

### **❌ INCORRECTO:**
```
DobackSoft/
├── mi-analisis.js          ❌ Script en raíz
├── NUEVA_FUNCIONALIDAD.md  ❌ .md en raíz
├── test-algo.ps1           ❌ Test en raíz
├── analisis.log            ❌ Log en raíz
└── crear-datos.sql         ❌ SQL en raíz
```

### **✅ CORRECTO:**
```
DobackSoft/
├── scripts/
│   ├── analisis/
│   │   └── mi-analisis.js          ✅
│   └── testing/
│       └── test-algo.ps1           ✅
├── docs/
│   └── 03-implementacion/
│       └── NUEVA_FUNCIONALIDAD.md  ✅
├── temp/
│   └── analisis.log                ✅
└── database/
    └── crear-datos.sql             ✅
```

---

## 📊 MANTENIMIENTO

### **Revisión Periódica**

**Cada semana revisar:**
1. ✅ ¿Hay archivos .md en la raíz? → Mover a `docs/`
2. ✅ ¿Hay scripts en la raíz? → Mover a `scripts/`
3. ✅ ¿Hay logs o temporales en la raíz? → Mover a `temp/`
4. ✅ ¿Más de 20 archivos en raíz? → Limpiar
5. ✅ ¿Carpeta `temp/` muy grande? → Limpiar archivos antiguos

### **Limpieza de temp/**

```powershell
# Limpiar archivos temporales antiguos
Remove-Item -Path "temp\*" -Include "*.log","*.json" -Recurse
```

---

## 🎯 OBJETIVO

**Mantener la raíz limpia y profesional:**
- ✅ Solo archivos esenciales
- ✅ Máximo 20 archivos
- ✅ Estructura clara y organizada
- ✅ Fácil navegación
- ✅ Fácil mantenimiento

---

## 📞 CONSULTAS

**¿Dónde va mi archivo?**

| Tipo de archivo | Ubicación | Razón |
|-----------------|-----------|-------|
| `.md` documentación | `docs/XX-categoria/` | Organización por temática |
| `.js` / `.ps1` script | `scripts/categoria/` | Organización por función |
| `.log` / `.json` temporal | `temp/` | Archivos no esenciales |
| `.sql` | `database/` | Scripts de BD |
| Configuración | Raíz | Solo archivos config esenciales |

---

**⚠️ RECUERDA: ESTAS REGLAS SON OBLIGATORIAS**

Cualquier violación de estas reglas debe corregirse inmediatamente.

---

**DobackSoft © 2025**

