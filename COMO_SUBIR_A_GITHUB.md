# 📤 Cómo Subir Cambios a GitHub

## 💬 **Opción 1: Con Mensaje Personalizado (RECOMENDADO)**

```powershell
.\subir.ps1
```

**Características:**
- ✅ Muestra los archivos modificados
- ✅ Pide el mensaje del commit
- ✅ Muestra ejemplos de mensajes
- ✅ Validación de errores completa
- ✅ Interfaz clara y visual

**Ejemplo de uso:**
```
Archivos modificados:
M  frontend/src/pages/Dashboard.tsx
A  backend/routes/reports.ts

Escribe el mensaje del commit:
  Ejemplos:
  - feat: Añadido módulo de reportes
  - fix: Corregido error en dashboard

Mensaje: feat: Implementado sistema de reportes PDF
```

---

## ⚡ **Opción 2: Script Rápido (Sin Preguntas)**

```powershell
.\subir-rapido.ps1
```

**Características:**
- ✅ Sube todo directamente sin preguntar
- ✅ Mensaje automático con fecha y hora
- ✅ Perfecto para actualizaciones rápidas

**Mensaje automático:** `Actualización 10/10/2025 15:30`

---

## 🛠️ **Opción 3: Comandos Manuales**

```powershell
# Ver qué archivos cambiaron (opcional)
git status

# Añadir todos los cambios
git add .

# Hacer commit con mensaje personalizado
git commit -m "Descripción de tus cambios"

# Subir a GitHub
git push origin main
```

---

## 💡 **Ejemplos de Mensajes de Commit**

```powershell
git commit -m "feat: Añadido módulo de reportes PDF"
git commit -m "fix: Corregido error en dashboard"
git commit -m "docs: Actualizada documentación"
git commit -m "refactor: Mejorada lógica de sesiones"
git commit -m "Actualización diaria"
```

---

## ⚠️ **Notas Importantes**

1. **Archivos `.env` NO se subirán** (están protegidos por `.gitignore`)
2. **`node_modules/` NO se subirá** (están ignorados)
3. **Solo código fuente y archivos importantes** se suben
4. **Es seguro usar `git add .`** en este proyecto

---

## 🔗 **Tu Repositorio**

https://github.com/hermoso92/dobackv2

---

## 🆘 **Si Git no funciona**

1. Instala Git para Windows: https://git-scm.com/download/win
2. Durante la instalación, selecciona "Git from the command line and also from 3rd-party software"
3. Reinicia PowerShell
4. Ejecuta el script de nuevo

---

**¡Listo para subir tus cambios! 🚀**

