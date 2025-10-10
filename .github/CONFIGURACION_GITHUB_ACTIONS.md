# 🚀 Configuración GitHub Actions para DobackSoft

## 📋 Pasos para Activar GitHub Actions

### **1️⃣ Subir los archivos a GitHub**

Si aún no has subido el código:

```powershell
# Inicializar git (si no lo has hecho)
git init

# Añadir todos los archivos
git add .

# Primer commit
git commit -m "🎉 Inicial - DobackSoft con GitHub Actions"

# Conectar con GitHub (crea el repo primero en github.com)
git remote add origin https://github.com/TU_USUARIO/DobackSoft.git

# Subir a GitHub
git push -u origin main
```

### **2️⃣ Verificar que GitHub Actions se activó**

1. Ve a tu repositorio en GitHub
2. Click en la pestaña **"Actions"**
3. Deberías ver los workflows:
   - ✅ **CI - Build y Tests**
   - ✅ **PR Validation**
   - ✅ **Scheduled Tasks**

### **3️⃣ Configurar Secrets (si es necesario)**

Para variables sensibles (contraseñas, API keys):

1. En GitHub: **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"**
3. Añade:
   - `DATABASE_URL` - URL de PostgreSQL de producción
   - `JWT_SECRET` - Secret para tokens JWT
   - Otros secrets que necesites

### **4️⃣ Configurar Dependabot**

1. Edita `.github/dependabot.yml`
2. Cambia `TU_USUARIO_GITHUB` por tu usuario real
3. Haz commit y push
4. Dependabot empezará a crear PRs automáticos cada lunes

### **5️⃣ Activar Deploy Automático (Opcional)**

Si quieres deploy automático:

1. Renombra: `.github/workflows/deploy.yml.example` → `deploy.yml`
2. Configura los métodos de deploy según tu servidor
3. Añade secrets necesarios
4. Haz commit y push

---

## 🎯 Qué Pasa Ahora Automáticamente

### **Cuando haces PUSH a main/develop:**
```
✅ GitHub Actions detecta el push
   ├─ Ejecuta build del Backend
   ├─ Ejecuta build del Frontend
   ├─ Ejecuta linting
   ├─ Ejecuta tests
   ├─ Valida Prisma schema
   └─ Te notifica si algo falla ❌
```

### **Cuando creas un Pull Request:**
```
✅ GitHub Actions valida el PR
   ├─ Verifica el título del PR
   ├─ Busca archivos prohibidos (.env, claves)
   ├─ Detecta console.log (no permitido)
   ├─ Detecta URLs hardcodeadas
   ├─ Genera estadísticas del PR
   └─ Muestra un resumen completo
```

### **Todos los días a las 3 AM:**
```
✅ GitHub Actions ejecuta tareas programadas
   ├─ Identifica logs viejos
   ├─ Verifica dependencias desactualizadas
   ├─ Ejecuta auditoría de seguridad
   └─ Genera estadísticas del proyecto
```

### **Cada lunes a las 9 AM:**
```
✅ Dependabot revisa actualizaciones
   ├─ Verifica Backend (npm packages)
   ├─ Verifica Frontend (npm packages)
   ├─ Verifica GitHub Actions
   └─ Crea PRs automáticos para actualizar
```

---

## 📊 Ver Resultados

### **Ver estado de workflows:**
1. GitHub → Pestaña **Actions**
2. Click en cualquier workflow
3. Ver logs detallados de cada step

### **Ver errores:**
Si algo falla (marcado en rojo ❌):
1. Click en el workflow fallido
2. Click en el job que falló
3. Expande el step para ver el error
4. Corrige en tu código local
5. Push → se ejecuta automáticamente de nuevo

### **Badges de estado en README:**
Añade al README.md:

```markdown
![CI Status](https://github.com/TU_USUARIO/DobackSoft/workflows/CI%20-%20Build%20y%20Tests/badge.svg)
![PR Validation](https://github.com/TU_USUARIO/DobackSoft/workflows/PR%20Validation/badge.svg)
```

---

## 🔧 Personalizar Workflows

### **Cambiar horario de tareas programadas:**

Edita `.github/workflows/scheduled-tasks.yml`:

```yaml
schedule:
  - cron: '0 3 * * *'  # 3 AM diario
  # Ejemplos:
  # - cron: '0 */6 * * *'  # Cada 6 horas
  # - cron: '0 9 * * 1'    # Lunes a las 9 AM
```

### **Añadir notificaciones a Slack/Discord:**

Añade step al final de cualquier workflow:

```yaml
- name: 📧 Notificar a Slack
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "✅ Build completado para DobackSoft"
      }
```

### **Añadir más validaciones:**

Edita `.github/workflows/pr-validation.yml` y añade steps personalizados.

---

## 🚨 Troubleshooting

### **Problema: Workflow no se ejecuta**
**Solución:**
- Verifica que el archivo esté en `.github/workflows/`
- Verifica la sintaxis YAML (indentación correcta)
- Ve a Actions → Click en el workflow → "Run workflow"

### **Problema: Build falla en GitHub pero funciona local**
**Solución:**
- Verifica que `package.json` tenga todos los scripts
- Verifica que no uses rutas absolutas de Windows
- Revisa los logs del workflow para ver el error exacto

### **Problema: Tests fallan**
**Solución:**
- Si no tienes tests, el workflow solo muestra warning
- Para desactivar tests, comenta el job `tests` en `ci.yml`

### **Problema: Prisma validation falla**
**Solución:**
- Asegúrate de que `prisma/schema.prisma` esté correcto
- Ejecuta local: `npx prisma validate`

---

## 📚 Recursos

- [Documentación GitHub Actions](https://docs.github.com/en/actions)
- [Sintaxis de Workflows](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Marketplace de Actions](https://github.com/marketplace?type=actions)
- [Dependabot Config](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file)

---

## ✅ Checklist Final

Antes de subir a GitHub, verifica:

- [ ] `.github/workflows/ci.yml` existe
- [ ] `.github/workflows/pr-validation.yml` existe
- [ ] `.github/workflows/scheduled-tasks.yml` existe
- [ ] `.github/dependabot.yml` configurado con tu usuario
- [ ] `.github/PULL_REQUEST_TEMPLATE.md` existe
- [ ] Secrets configurados en GitHub (si aplica)
- [ ] README actualizado con badges (opcional)

---

**🎉 ¡GitHub Actions configurado y listo!**

Cada vez que hagas push, verás las acciones ejecutándose automáticamente.

