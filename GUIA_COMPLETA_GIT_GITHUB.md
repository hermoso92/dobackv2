# 📚 Guía Completa de Git y GitHub - DobackSoft V3

**Tu manual de referencia rápida para trabajar con Git**

---

## 📖 **Índice**

1. [Scripts Disponibles](#-scripts-disponibles)
2. [Comandos Básicos](#-comandos-básicos)
3. [Trabajo con Ramas](#-trabajo-con-ramas)
4. [Subir Cambios](#-subir-cambios)
5. [Pull Requests](#-pull-requests)
6. [Resolver Problemas](#-resolver-problemas)
7. [Workflow Recomendado](#-workflow-recomendado)
8. [Comandos Avanzados](#-comandos-avanzados)

---

## 🚀 **Scripts Disponibles**

### **1. `.\subir.ps1` - PRINCIPAL (USO DIARIO)**

```powershell
.\subir.ps1
```

**Qué hace:**
- Muestra archivos modificados
- Pide mensaje del commit
- Sube cambios a GitHub

**Cuándo usarlo:**
- ✅ Para cualquier cambio importante
- ✅ Cuando quieras describir qué hiciste
- ✅ **Recomendado para uso diario**

---

### **2. `.\subir-rapido.ps1` - RÁPIDO**

```powershell
.\subir-rapido.ps1
```

**Qué hace:**
- Sube TODO sin preguntar
- Mensaje automático con fecha/hora
- Ejemplo: "Actualización 10/10/2025 15:30"

**Cuándo usarlo:**
- ✅ Cambios pequeños
- ✅ Cuando tienes prisa
- ✅ Backups rápidos

---

## 🔧 **Comandos Básicos**

### **Ver estado actual**
```powershell
git status
```
Muestra:
- Archivos modificados
- Archivos nuevos
- Rama actual

---

### **Ver en qué rama estás**
```powershell
git branch
```
Muestra todas las ramas, la activa tiene un `*`

---

### **Ver historial de commits**
```powershell
git log --oneline
```
Muestra los últimos commits realizados

---

### **Ver diferencias (qué cambió)**
```powershell
git diff
```
Muestra línea por línea qué modificaste

---

## 🌿 **Trabajo con Ramas**

### **¿Qué es una rama?**
Una rama es una copia paralela de tu código donde puedes experimentar sin afectar el código principal (`main`).

---

### **Crear nueva rama**
```powershell
git checkout -b nombre-de-la-rama
```

**Ejemplo:**
```powershell
git checkout -b nueva-funcionalidad
git checkout -b fix-bug-dashboard
git checkout -b testeo-kpis
```

**Resultado:**
- Crea la rama
- Cambia automáticamente a esa rama

---

### **Cambiar de rama**
```powershell
# Ir a main
git checkout main

# Ir a otra rama
git checkout testeo-reglas-kpis
```

---

### **Ver todas las ramas**
```powershell
# Locales
git branch

# Locales y remotas
git branch -a
```

---

### **Subir rama nueva a GitHub**
```powershell
git push -u origin nombre-de-la-rama
```

**Ejemplo:**
```powershell
git push -u origin testeo-reglas-kpis
```

---

### **Eliminar rama**

**Local:**
```powershell
git branch -d nombre-rama
```

**En GitHub:**
```powershell
git push origin --delete nombre-rama
```

**Ambos:**
```powershell
git branch -d nombre-rama
git push origin --delete nombre-rama
```

---

## 💾 **Subir Cambios**

### **Método 1: Con Script (Recomendado)**

```powershell
.\subir.ps1
```

---

### **Método 2: Manual**

```powershell
# 1. Ver qué cambió
git status

# 2. Añadir todos los archivos
git add .

# 3. Crear commit
git commit -m "Descripción de cambios"

# 4. Subir a GitHub
git push origin nombre-rama
```

**Ejemplos de mensajes:**
```powershell
git commit -m "feat: Añadido módulo de reportes"
git commit -m "fix: Corregido error en dashboard"
git commit -m "docs: Actualizada documentación"
git commit -m "refactor: Mejorada lógica de KPIs"
git commit -m "style: Formato de código"
git commit -m "chore: Actualizar dependencias"
```

---

### **Añadir archivos específicos**

```powershell
# Un archivo
git add archivo.txt

# Varios archivos
git add archivo1.txt archivo2.js

# Todos los .js
git add *.js

# Todo de una carpeta
git add frontend/src/
```

---

## 🔀 **Pull Requests**

### **¿Qué es un Pull Request?**
Es una petición para fusionar cambios de una rama (ej: `testeo-kpis`) a otra (ej: `main`).

---

### **Crear Pull Request**

**Paso 1: Subir tu rama**
```powershell
.\subir.ps1
# Mensaje: "feat: Implementadas nuevas reglas de KPIs"
```

**Paso 2: Ir a GitHub**
1. Ve a: https://github.com/hermoso92/dobackv2
2. Verás un banner amarillo: "Compare & pull request"
3. Click en el botón
4. Escribe descripción (opcional)
5. Click en "Create pull request"

**Paso 3: Revisar y fusionar**
1. Revisa los cambios
2. Si todo está bien, click en "Merge pull request"
3. Click en "Confirm merge"
4. ¡Listo! Los cambios ya están en `main`

---

### **Fusionar rama en terminal (sin PR)**

```powershell
# 1. Ve a la rama destino (main)
git checkout main

# 2. Fusiona la rama de origen
git merge testeo-reglas-kpis

# 3. Sube main actualizado
git push origin main
```

---

## 🆘 **Resolver Problemas**

### **"No hay cambios para commitear"**

**Causa:** No has modificado ningún archivo desde el último commit.

**Solución:** Modifica archivos y vuelve a intentar.

---

### **"Rejected - non-fast-forward"**

**Causa:** Hay cambios en GitHub que no tienes en local.

**Solución:**
```powershell
# Descargar cambios de GitHub
git pull origin nombre-rama

# Volver a subir
git push origin nombre-rama
```

---

### **"Merge conflict"**

**Causa:** Dos personas modificaron las mismas líneas de código.

**Solución:**
1. Git marca los conflictos en los archivos
2. Abre el archivo y verás:
```
<<<<<<< HEAD
Tu código
=======
Código de GitHub
>>>>>>> rama
```
3. Elige qué código mantener
4. Elimina las marcas (`<<<<<<<`, `=======`, `>>>>>>>`)
5. Guarda el archivo
6. Ejecuta:
```powershell
git add .
git commit -m "fix: Resuelto conflicto"
git push origin nombre-rama
```

---

### **Deshacer último commit (SIN perder cambios)**

```powershell
git reset --soft HEAD~1
```

Los cambios quedan en tus archivos, solo elimina el commit.

---

### **Deshacer último commit (PERDIENDO cambios)**

```powershell
git reset --hard HEAD~1
```

⚠️ **CUIDADO:** Pierdes los cambios permanentemente.

---

### **Ver qué cambió en un commit específico**

```powershell
git show commit-hash
```

---

### **Descargar cambios de GitHub sin fusionar**

```powershell
git fetch origin
```

---

### **Actualizar rama desde main**

Si estás en `testeo-kpis` y `main` se actualizó:

```powershell
# 1. Ve a main
git checkout main

# 2. Descarga últimos cambios
git pull origin main

# 3. Vuelve a tu rama
git checkout testeo-kpis

# 4. Fusiona main en tu rama
git merge main
```

---

## ✅ **Workflow Recomendado**

### **Desarrollo de nueva funcionalidad**

```powershell
# 1. Crear rama para la funcionalidad
git checkout -b feat-reportes-pdf

# 2. Subir rama a GitHub
git push -u origin feat-reportes-pdf

# 3. Hacer cambios en archivos...

# 4. Guardar cambios frecuentemente
.\subir.ps1
# Mensaje: "feat: Añadido generador de PDF"

# 5. Más cambios...
.\subir.ps1
# Mensaje: "feat: Añadidos gráficos al PDF"

# 6. Cuando termines, crear Pull Request en GitHub

# 7. Fusionar a main (en GitHub o terminal)

# 8. Volver a main
git checkout main

# 9. Descargar cambios actualizados
git pull origin main

# 10. Eliminar rama (opcional)
git branch -d feat-reportes-pdf
git push origin --delete feat-reportes-pdf
```

---

### **Corrección de bug urgente**

```powershell
# 1. Crear rama desde main
git checkout main
git checkout -b fix-bug-dashboard

# 2. Subir rama
git push -u origin fix-bug-dashboard

# 3. Corregir el bug...

# 4. Guardar y subir
.\subir.ps1
# Mensaje: "fix: Corregido error en KPIs"

# 5. Fusionar inmediatamente a main
git checkout main
git merge fix-bug-dashboard
git push origin main

# 6. Eliminar rama
git branch -d fix-bug-dashboard
```

---

### **Trabajo diario normal**

```powershell
# Opción 1: Directamente en main (cambios pequeños)
git checkout main
# ... hacer cambios ...
.\subir.ps1

# Opción 2: En rama (cambios grandes/experimentales)
git checkout -b mejoras-dashboard
git push -u origin mejoras-dashboard
# ... hacer cambios ...
.\subir.ps1
# ... cuando termines, Pull Request
```

---

## 🔥 **Comandos Avanzados**

### **Ver ramas remotas**
```powershell
git branch -r
```

---

### **Eliminar archivos del repositorio (pero NO del disco)**
```powershell
git rm --cached archivo.txt
git commit -m "Eliminado archivo del repo"
git push origin main
```

---

### **Ver cambios de un archivo específico**
```powershell
git log -- ruta/archivo.txt
```

---

### **Crear alias (atajos)**
```powershell
# Atajo para 'git status'
git config --global alias.st status

# Ahora puedes usar:
git st
```

**Aliases útiles:**
```powershell
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.lg "log --oneline --graph"
```

---

### **Ver quién modificó cada línea de un archivo**
```powershell
git blame archivo.txt
```

---

### **Guardar cambios temporalmente (sin commit)**
```powershell
# Guardar cambios
git stash

# Ver lista de stashes
git stash list

# Recuperar últimos cambios guardados
git stash pop
```

---

### **Cambiar mensaje del último commit**
```powershell
git commit --amend -m "Nuevo mensaje"
```

---

### **Ver diferencias entre ramas**
```powershell
git diff main..testeo-kpis
```

---

## 📊 **Tabla de Referencia Rápida**

| Acción | Comando |
|--------|---------|
| **Ver estado** | `git status` |
| **Crear rama** | `git checkout -b nombre-rama` |
| **Cambiar rama** | `git checkout nombre-rama` |
| **Ver ramas** | `git branch` |
| **Subir cambios (script)** | `.\subir.ps1` |
| **Añadir archivos** | `git add .` |
| **Commit** | `git commit -m "mensaje"` |
| **Subir a GitHub** | `git push origin rama` |
| **Fusionar rama** | `git merge nombre-rama` |
| **Descargar cambios** | `git pull origin rama` |
| **Ver historial** | `git log --oneline` |
| **Eliminar rama local** | `git branch -d nombre-rama` |
| **Eliminar rama remota** | `git push origin --delete rama` |

---

## 🎯 **Ejemplos Prácticos**

### **Ejemplo 1: Nueva funcionalidad**

```powershell
# Crear rama
git checkout -b feat-exportar-excel

# Subir rama a GitHub
git push -u origin feat-exportar-excel

# Trabajar... modificar archivos...

# Guardar progreso
.\subir.ps1
# Mensaje: "feat: Añadida función de exportar a Excel"

# Más trabajo...
.\subir.ps1
# Mensaje: "feat: Añadidos estilos al Excel"

# Terminar
# Crear Pull Request en GitHub y fusionar
```

---

### **Ejemplo 2: Corrección rápida**

```powershell
# Ya estás en main
.\subir.ps1
# Mensaje: "fix: Corregido typo en README"
```

---

### **Ejemplo 3: Experimentar sin miedo**

```powershell
# Crear rama experimental
git checkout -b experimental-nueva-ui

# Probar cosas...
.\subir.ps1

# Si funciona: fusionar a main
# Si NO funciona: simplemente eliminar la rama
git checkout main
git branch -d experimental-nueva-ui
```

---

## 🔗 **Enlaces Útiles**

- **Tu repositorio:** https://github.com/hermoso92/dobackv2
- **Documentación Git:** https://git-scm.com/doc
- **GitHub Docs:** https://docs.github.com

---

## 💡 **Consejos Finales**

✅ **Haz commits frecuentes** - Mejor muchos commits pequeños que uno gigante  
✅ **Mensajes descriptivos** - Usa "feat:", "fix:", "docs:", etc.  
✅ **Crea ramas para experimentar** - No tengas miedo de probar cosas  
✅ **Sincroniza con GitHub diariamente** - Usa `.\subir.ps1` al final del día  
✅ **Revisa cambios antes de subir** - Usa `git status` y `git diff`  
✅ **No subas archivos sensibles** - `.env`, contraseñas, API keys (ya protegidos)  

---

**¡Guarda este documento como referencia! 📚**

*Actualizado: 10 de octubre de 2025*

