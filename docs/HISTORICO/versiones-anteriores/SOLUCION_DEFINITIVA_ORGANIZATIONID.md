# 🔧 SOLUCIÓN DEFINITIVA: organizationId = default-org

## 🐛 PROBLEMA RAÍZ IDENTIFICADO

El frontend envía `organizationId=default-org` porque el backend NO está devolviendo el `organizationId` correcto en la respuesta de login.

### Causas detectadas:

1. **Backend con caracteres inválidos**: El archivo `auth.ts` tenía caracteres invisibles al final que impedían la compilación correcta
2. **User object incompleto**: El login estaba devolviendo un objeto `user` sin los campos `name`, `createdAt`, `updatedAt`
3. **Frontend fallback**: Cuando `user.organizationId` es `null` o `undefined`, el frontend usa `'default-org'` como fallback

## ✅ CORRECCIONES APLICADAS

### 1. Limpieza de `auth.ts`
- ✅ Eliminados caracteres invisibles de las líneas 202-203
- ✅ Archivo ahora compila sin errores

### 2. Login devuelve datos completos
```typescript
// backend/src/services/auth.ts (líneas 27-39)
const user = await this.prisma.user.findUnique({
    where: { email },
    select: {
        id: true,
        email: true,
        password: true,
        name: true,           // ✅ Añadido
        role: true,
        organizationId: true,
        status: true,
        createdAt: true,      // ✅ Añadido
        updatedAt: true       // ✅ Añadido
    }
});
```

### 3. Response incluye `organizationId` siempre
```typescript
// Líneas 74-78
return {
    access_token: accessToken,
    refresh_token: refreshToken,
    user: userWithoutPassword  // Incluye organizationId
};
```

## 🚨 PASOS PARA APLICAR LA SOLUCIÓN

### 1️⃣ PARAR TODOS LOS PROCESOS NODE
```powershell
# Cerrar TODAS las ventanas de PowerShell con backend/frontend
# O ejecutar:
Get-Process node | Stop-Process -Force
```

### 2️⃣ REINICIAR CON iniciar.ps1
```powershell
.\iniciar.ps1
```

### 3️⃣ LIMPIAR NAVEGADOR

**Opción A - Modo Incógnito (RECOMENDADO)**
- Abrir navegador en modo incógnito
- Ir a `http://localhost:5174`
- Login con credenciales

**Opción B - Limpiar localStorage**
1. Abrir DevTools (F12)
2. Ir a "Application" > "Local Storage" > `http://localhost:5174`
3. Eliminar keys: `auth_token`, `auth_user`, `user`
4. Refrescar página

### 4️⃣ VERIFICAR RESPUESTA DE LOGIN

Después de hacer login, verificar en DevTools > Network:

**Request: POST /api/auth/login**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "user": {
    "id": "xxx",
    "email": "test@bomberosmadrid.es",
    "name": "Test User",
    "role": "ADMIN",
    "organizationId": "a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26",  // ✅ DEBE TENER VALOR
    "status": "ACTIVE",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### 5️⃣ VERIFICAR PETICIONES SUBSECUENTES

Todas las peticiones posteriores deben usar el `organizationId` correcto:

**Antes (INCORRECTO):**
```
GET /api/kpis/summary?organizationId=default-org&from=...
```

**Después (CORRECTO):**
```
GET /api/kpis/summary?organizationId=a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26&from=...
```

## 🔍 SI PERSISTE EL PROBLEMA

### Verificar usuario en BD:
```sql
SELECT id, email, name, "organizationId", status 
FROM "User" 
WHERE email = 'test@bomberosmadrid.es';
```

**Si `organizationId` es NULL:**
```sql
UPDATE "User" 
SET "organizationId" = 'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26' 
WHERE email = 'test@bomberosmadrid.es';
```

### Ejecutar test de login:
```bash
node test-login-final.js
```

Esto mostrará:
- ✅ Qué devuelve el endpoint de login
- ✅ Qué tiene el usuario en BD
- ⚠️ Discrepancias entre BD y API

## 📊 RESULTADO ESPERADO

Después de aplicar la solución:

1. ✅ Backend compila sin errores
2. ✅ Login devuelve `organizationId` válido
3. ✅ Frontend usa el `organizationId` correcto en todas las peticiones
4. ✅ Puntos Negros, Velocidad, Estados cargan datos correctamente
5. ✅ No más errores 500 por `organizationId=default-org`

---

**🎯 PRIORIDAD MÁXIMA: Reiniciar backend + Limpiar navegador**
