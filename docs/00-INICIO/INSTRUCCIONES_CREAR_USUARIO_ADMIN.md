# 🔐 INSTRUCCIONES: CREAR USUARIO ADMIN

## ⚡ **PASO CRÍTICO: REINICIAR EL SISTEMA**

El endpoint de registro está implementado, pero necesitas **reiniciar el backend** para que se cargue:

### **Usar `iniciar.ps1`:**
```powershell
.\iniciar.ps1
```

Este script:
- ✅ Libera puertos 9998 y 5174
- ✅ Reinicia backend y frontend
- ✅ Carga las nuevas rutas
- ✅ Abre el navegador automáticamente

---

## 🚀 **DESPUÉS DE REINICIAR**

### **Opción A: Crear tu Usuario desde la UI** (RECOMENDADO)

1. **Ve a:** `http://localhost:5174/login`

2. **Click en la pestaña "Crear Usuario"**

3. **Completa el formulario:**
   ```
   Nombre de Usuario: miusuario
   Email: miusuario@dobacksoft.com
   Nombre: Mi Nombre
   Apellidos: Apellido
   Contraseña: password123
   Confirmar Contraseña: password123
   Rol: ADMIN ← ¡IMPORTANTE!
   ```

4. **Click en "Crear Usuario"**

5. **Mensaje de éxito:**
   ```
   ✅ Usuario "miusuario" creado exitosamente con rol ADMIN!
   ```

6. **Inicia sesión** con tus nuevas credenciales

7. **Ve a "Gestión"** → `/administration`

---

### **Opción B: Usar las credenciales por defecto**

Si existen en la base de datos:

```
Email: admin@cosigein.com
Password: admin123
```

1. **Inicia sesión** con estas credenciales
2. **Ve a "Gestión"** → `/administration`

Si no puedes entrar con estas credenciales, usa la **Opción A** para crear tu propio usuario.

---

### **Opción C: Verificar si hay usuarios ADMIN en la BD**

Ejecuta este comando:

```powershell
npx ts-node backend/scripts/check-admin-user.ts
```

Te mostrará qué usuarios ADMIN existen en la base de datos.

---

## 🎯 **ENDPOINTS IMPLEMENTADOS**

```
POST /api/auth/register
```

**Request:**
```json
{
  "username": "miusuario",
  "email": "miusuario@dobacksoft.com",
  "password": "password123",
  "firstName": "Mi Nombre",
  "lastName": "Apellido",
  "role": "ADMIN"
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "Usuario creado exitosamente",
  "user": {
    "id": "...",
    "name": "Mi Nombre Apellido",
    "email": "miusuario@dobacksoft.com",
    "role": "ADMIN",
    "status": "ACTIVE"
  }
}
```

---

## ✅ **ARCHIVOS IMPLEMENTADOS**

```
✅ backend/src/routes/auth.ts
   - Endpoint POST /api/auth/register
   - Validaciones completas
   - Asignación automática a organización

✅ frontend/src/pages/Login.tsx
   - 2 pestañas: Login y Crear Usuario
   - Formulario de registro completo
   - Validaciones en frontend
```

---

## 🆘 **SI TODAVÍA NO FUNCIONA**

### **1. Verificar que el backend se reinició correctamente:**
```powershell
curl http://localhost:9998/api/auth/test-simple
```

Debería devolver:
```json
{
  "status": "OK",
  "message": "Backend funcionando correctamente"
}
```

### **2. Probar el endpoint de registro directamente:**
```powershell
Invoke-RestMethod -Uri "http://localhost:9998/api/auth/register" -Method POST -ContentType "application/json" -Body '{"email":"test@test.com","password":"password123","firstName":"Test","lastName":"User","role":"ADMIN"}'
```

### **3. Ver logs del backend:**
Busca en la consola del backend si hay errores al cargar las rutas.

---

## 🎉 **SIGUIENTE PASO**

1. **Reinicia el sistema:**
   ```powershell
   .\iniciar.ps1
   ```

2. **Ve al login:**
   ```
   http://localhost:5174/login
   ```

3. **Crea tu usuario ADMIN** desde la pestaña "Crear Usuario"

4. **¡Disfruta de acceso completo al sistema!**

---

**Última actualización:** 8 de octubre de 2025  
**Estado:** ✅ Endpoint implementado - Requiere reinicio del sistema

