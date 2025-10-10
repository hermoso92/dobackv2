# 🔧 SOLUCIÓN: ACCESO DENEGADO A GESTIÓN

## ❌ **PROBLEMA**
Recibes el mensaje "Acceso Denegado - Solo los administradores pueden acceder a esta sección" al intentar acceder a `/administration`.

---

## 🔍 **DIAGNÓSTICO**

### **Paso 1: Verificar tu rol en la consola del navegador**

1. Abre la consola del navegador (F12)
2. Ve a la página `/administration`
3. Busca estos logs en la consola:
   ```
   👤 Usuario en AdministrationPage: {id: "...", username: "...", role: "..."}
   🔐 Rol del usuario: "..."
   ✅ isAdmin(): true/false
   ```

4. **Si ves un mensaje de debug en rojo** con tu rol actual, anótalo

---

## ✅ **SOLUCIONES**

### **Solución 1: Verificar usuarios ADMIN en la base de datos**

Ejecuta este comando para ver qué usuarios son ADMIN:

```powershell
cd backend
npx ts-node scripts/check-admin-user.ts
```

**Output esperado:**
```
🔍 Verificando usuarios ADMIN...

✅ Usuarios ADMIN encontrados: 1

--- Usuario ADMIN 1 ---
ID: abc-123
Username: admin
Email: admin@dobacksoft.com
Nombre: Super Admin
Rol: ADMIN
Organización: Bomberos Madrid
Activo: Sí
```

---

### **Solución 2: Convertir tu usuario en ADMIN**

Si tu usuario NO es ADMIN, conviértelo con este comando:

```powershell
cd backend
npx ts-node scripts/set-user-admin.ts TU_USERNAME
```

**Ejemplo:**
```powershell
npx ts-node scripts/set-user-admin.ts admin
```

**Output esperado:**
```
🔍 Buscando usuario: admin...

✅ Usuario encontrado:
   Username: admin
   Email: admin@dobacksoft.com
   Rol actual: MANAGER

✅ Usuario actualizado exitosamente!
   Rol anterior: MANAGER
   Rol nuevo: ADMIN

🎉 Ahora puedes acceder a la sección de Gestión con este usuario
```

---

### **Solución 3: Crear un nuevo usuario ADMIN**

Si no tienes ningún usuario ADMIN, crea uno:

```powershell
cd backend
npx ts-node scripts/create-super-admin.ts
```

**Credenciales por defecto:**
```
Username: admin
Password: Admin123!
Email: admin@dobacksoft.com
Rol: ADMIN
```

---

### **Solución 4: Verificar en la consola del navegador**

Si las soluciones anteriores no funcionan, verifica el localStorage:

1. Abre la consola del navegador (F12)
2. Ve a la pestaña "Console"
3. Ejecuta:
   ```javascript
   JSON.parse(localStorage.getItem('auth_user'))
   ```

4. Verifica que el objeto tenga:
   ```javascript
   {
     id: "...",
     username: "...",
     role: "ADMIN",  // <-- DEBE SER "ADMIN" EN MAYÚSCULAS
     email: "...",
     ...
   }
   ```

---

### **Solución 5: Cerrar sesión y volver a iniciar**

A veces el token de autenticación está desactualizado:

1. **Cerrar sesión:**
   - Click en tu avatar (arriba a la derecha)
   - Click en "Cerrar Sesión"

2. **Volver a iniciar sesión:**
   - Username: `admin` (o tu usuario ADMIN)
   - Password: `Admin123!` (o tu contraseña)

3. **Verificar acceso:**
   - Ve a "Gestión" en el menú lateral
   - Deberías poder acceder ahora

---

## 🐛 **SI TODAVÍA NO FUNCIONA**

### **Opción A: Verificar el rol en la base de datos directamente**

**Si usas PostgreSQL:**
```sql
SELECT id, username, email, role, "isActive" 
FROM "User" 
WHERE role = 'ADMIN';
```

**Si usas SQLite:**
```sql
SELECT id, username, email, role, isActive 
FROM User 
WHERE role = 'ADMIN';
```

---

### **Opción B: Actualizar el rol directamente en la BD**

**Si usas PostgreSQL:**
```sql
UPDATE "User" 
SET role = 'ADMIN' 
WHERE username = 'TU_USERNAME';
```

**Si usas SQLite:**
```sql
UPDATE User 
SET role = 'ADMIN' 
WHERE username = 'TU_USERNAME';
```

---

## ⚠️ **VERIFICACIONES IMPORTANTES**

### **1. El rol DEBE ser "ADMIN" en MAYÚSCULAS**
❌ Incorrecto: `"admin"`, `"Admin"`, `"administrator"`  
✅ Correcto: `"ADMIN"`

### **2. El usuario debe estar activo**
Verifica que `isActive = true` en la base de datos

### **3. El usuario debe pertenecer a una organización**
Verifica que tenga un `organizationId` válido

---

## 📊 **ROLES DISPONIBLES EN EL SISTEMA**

```typescript
enum UserRole {
  ADMIN = 'ADMIN',      // Acceso total al sistema
  MANAGER = 'MANAGER',  // Solo su empresa y flota
  USER = 'USER'         // Acceso limitado
}
```

---

## 🎯 **DESPUÉS DE SOLUCIONAR**

Una vez que tengas acceso, verás:

```
🛠️ Gestión
├── 🏠 Parques
├── 🚛 Vehículos
├── 🗺️ Geocercas
└── 🌐 Zonas
```

Todas las pestañas con CRUD completo y estadísticas en tiempo real.

---

## 📝 **SCRIPTS CREADOS**

```
✅ backend/scripts/check-admin-user.ts    - Verificar usuarios ADMIN
✅ backend/scripts/set-user-admin.ts      - Convertir usuario a ADMIN
✅ backend/scripts/create-super-admin.ts  - Crear nuevo usuario ADMIN
```

---

## 🆘 **SI NECESITAS AYUDA ADICIONAL**

Comparte:
1. Output del script `check-admin-user.ts`
2. Los logs de la consola del navegador (👤, 🔐, ✅)
3. El resultado de `localStorage.getItem('auth_user')`

---

**Última actualización:** 8 de octubre de 2025  
**Estado:** ✅ Scripts de diagnóstico y solución creados

