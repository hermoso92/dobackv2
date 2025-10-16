# ⚡ REINICIAR BACKEND AHORA

## 🔴 PROBLEMA
El backend tiene errores de compilación TypeScript que impiden que se carguen las correcciones.

## ✅ SOLUCIÓN APLICADA
Ya se corrigió `backend/src/services/auth.ts` (eliminados caracteres inválidos).

---

## 🚨 INSTRUCCIONES URGENTES

### 1. CERRAR TODAS LAS VENTANAS DE POWERSHELL
- Cerrar manualmente la ventana del backend
- Cerrar manualmente la ventana del frontend

### 2. REINICIAR CON iniciar.ps1
```powershell
.\iniciar.ps1
```

**Verificar que el backend inicie SIN errores de compilación:**
```
✅ CORRECTO:
[INFO] ts-node-dev ver. 2.0.0
info: CacheService inicializado
info: 🚒 Inicializados 3 vehículos
...

❌ INCORRECTO:
[ERROR] ⨯ Unable to compile TypeScript:
src/services/auth.ts(202,1): error TS1127: Invalid character.
```

### 3. ABRIR NAVEGADOR EN MODO INCÓGNITO
```
Ctrl + Shift + N (Chrome)
Ctrl + Shift + P (Edge)
```

### 4. IR A http://localhost:5174

### 5. LOGIN
```
Email: test@bomberosmadrid.es
Password: admin123
```

### 6. ABRIR DEVTOOLS (F12) > NETWORK

**Buscar la petición:** `POST /api/auth/login`

**Verificar respuesta:**
```json
{
  "user": {
    "organizationId": "a5dfb0b4-..." // ✅ DEBE TENER VALOR (no null)
  }
}
```

---

## 📊 SI TODO FUNCIONA

Las peticiones a KPIs deben usar el organizationId correcto:

**Buscar en Network:** `GET /api/kpis/summary?organizationId=...`

- ✅ **CORRECTO**: `organizationId=a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26`
- ❌ **INCORRECTO**: `organizationId=default-org`

---

## 🔧 SI SIGUE FALLANDO

Ejecutar en consola del navegador (DevTools > Console):
```javascript
// Ver qué hay en localStorage
console.log('Auth user:', localStorage.getItem('auth_user'));
console.log('Parsed:', JSON.parse(localStorage.getItem('auth_user') || '{}'));
```

Si `organizationId` es `null`, limpiar localStorage:
```javascript
localStorage.clear();
location.reload();
```

---

**🎯 OBJETIVO: Backend debe compilar sin errores y devolver organizationId válido en login**
