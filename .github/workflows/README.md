# 🚀 GitHub Actions - DobackSoft

## 📋 Workflows Configurados

### 1️⃣ **CI - Build y Tests** (`ci.yml`)
**Cuándo se ejecuta:**
- ✅ Cada vez que haces `push` a `main` o `develop`
- ✅ Cada vez que creas o actualizas un Pull Request

**Qué hace:**
- 🔧 Verifica que el **Backend** compile sin errores
- 🎨 Verifica que el **Frontend** compile sin errores
- 🔍 Ejecuta **linting** (calidad de código)
- 🧪 Ejecuta **tests** (si existen)
- 🗄️ Valida el **schema de Prisma**
- 📊 Reporta el tamaño del bundle del frontend

**Por qué es útil:**
- Detecta errores antes de que lleguen a producción
- Asegura que el código cumple estándares de calidad
- Evita que código roto llegue a la rama principal

---

### 2️⃣ **PR Validation** (`pr-validation.yml`)
**Cuándo se ejecuta:**
- ✅ Cuando abres un Pull Request
- ✅ Cuando actualizas un Pull Request existente

**Qué hace:**
- 📝 Valida que el título del PR sea descriptivo
- 📊 Analiza cuántos archivos modificaste
- 🚫 Detecta archivos prohibidos (`.env`, contraseñas, claves)
- 🔍 Busca `console.log` (prohibido por reglas DobackSoft)
- 🔍 Busca URLs hardcodeadas (deben estar en `config/api.ts`)
- 📊 Genera un resumen del PR con estadísticas

**Por qué es útil:**
- Evita que subas archivos sensibles (contraseñas, claves)
- Asegura que el código sigue las reglas de DobackSoft
- Te avisa si el PR es muy grande y debería dividirse

---

### 3️⃣ **Scheduled Tasks** (`scheduled-tasks.yml`)
**Cuándo se ejecuta:**
- ⏰ Automáticamente todos los días a las **3 AM** (UTC)
- 🖱️ Manualmente cuando quieras (botón "Run workflow")

**Qué hace:**
- 🧹 Identifica logs antiguos para limpieza
- 📦 Verifica si hay dependencias desactualizadas
- 🔒 Ejecuta auditoría de seguridad (vulnerabilidades)
- 📊 Genera estadísticas del proyecto (líneas de código, archivos, commits)

**Por qué es útil:**
- Te mantiene informado sobre el estado del proyecto
- Detecta vulnerabilidades de seguridad automáticamente
- Te avisa cuando hay actualizaciones importantes

---

## 🎯 Cómo Usar GitHub Actions

### **Ver el estado de los Workflows:**
1. Ve a tu repositorio en GitHub
2. Click en la pestaña **"Actions"**
3. Verás todos los workflows ejecutándose o completados

### **Ejecutar manualmente un Workflow:**
1. Ve a **Actions** → Selecciona el workflow
2. Click en **"Run workflow"** (botón azul)
3. Elige la rama y confirma

### **Ver errores:**
Si un workflow falla:
1. Click en el workflow fallido
2. Click en el job que falló (marcado en rojo ❌)
3. Expande el step que falló para ver el error
4. Corrige el error en tu código local
5. Haz push → el workflow se ejecutará automáticamente

---

## 🔔 Badges de Estado

Puedes añadir badges en tu README para mostrar el estado:

```markdown
![CI Status](https://github.com/TU_USUARIO/DobackSoft/workflows/CI%20-%20Build%20y%20Tests/badge.svg)
```

---

## ⚙️ Configuración Adicional

### **Variables de entorno (Secrets):**
Si necesitas variables sensibles (API keys, passwords):
1. Ve a **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"**
3. Añade nombre y valor
4. Úsalo en workflows como: `${{ secrets.TU_SECRET }}`

### **Notificaciones:**
Por defecto, GitHub te envía email cuando un workflow falla.
Configúralo en: **Settings** → **Notifications** → **Actions**

---

## 📊 Ejemplo de Ejecución

```
🚀 CI - Build y Tests
├─ ✅ Backend - Build & Lint (2m 34s)
├─ ✅ Frontend - Build & Lint (3m 12s)
├─ ✅ Tests (1m 45s)
├─ ✅ Database Schema (45s)
└─ ✅ Reporte CI (12s)

✅ Todos los checks pasaron correctamente
```

---

## 🚨 Reglas de DobackSoft en GitHub Actions

Las GitHub Actions verifican automáticamente:
- ❌ **No `console.log`** → Usa `logger` de `utils/logger`
- ❌ **No URLs hardcodeadas** → Usa `config/api.ts`
- ❌ **No archivos `.env`** en el repositorio
- ❌ **No archivos >50** en un PR (mejor dividirlo)
- ✅ **Lint pass** → Código limpio
- ✅ **Build pass** → Código compila
- ✅ **Tests pass** → Funcionalidad verificada

---

## 🎓 Aprende Más

- [Documentación oficial de GitHub Actions](https://docs.github.com/en/actions)
- [Marketplace de Actions](https://github.com/marketplace?type=actions)
- [Sintaxis de workflows](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)

---

## 💡 Workflows Futuros (Opcional)

Puedes añadir más workflows para:
- 🚀 **Deploy automático** a servidor de producción
- 📦 **Backup automático** de base de datos
- 📧 **Notificaciones** a Slack/Discord
- 🏷️ **Releases automáticas** con changelog
- 🐳 **Build de Docker images**
- 📈 **Análisis de cobertura** de tests

---

**✅ GitHub Actions configurado y listo para usar**

