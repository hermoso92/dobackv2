# 🔐 CREAR USUARIO ADMIN - SOLUCIÓN RÁPIDA

## ❗ **PROBLEMA IDENTIFICADO**
Los usuarios están hardcodeados en el código y no coinciden con tu usuario real.

---

## ✅ **SOLUCIÓN RÁPIDA**

### **Opción 1: Usar el usuario por defecto**

**Credenciales del sistema:**
```
Username: admin
Password: Admin123!
Email: admin@dobacksoft.com
```

1. **Cierra sesión** del usuario actual
2. **Inicia sesión** con estas credenciales
3. **Ve a Gestión** → Debería funcionar

---

### **Opción 2: Crear TU usuario como ADMIN**

**Dime tus credenciales actuales:**
- ¿Con qué username estás entrando?
- ¿Con qué email estás entrando?

Y crearé un script personalizado para hacer tu usuario ADMIN.

---

### **Opción 3: Desde la consola del navegador (TEMPORAL)**

**SOLUCIÓN INMEDIATA - Sin necesidad de cambiar la BD:**

1. **Abre la consola del navegador** (F12)
2. **Ve a la pestaña Console**
3. **Ejecuta este código:**

```javascript
// Obtener el usuario actual del localStorage
let authUser = JSON.parse(localStorage.getItem('auth_user'));
console.log('Usuario actual:', authUser);

// Cambiar el rol a ADMIN
authUser.role = 'ADMIN';

// Guardar el usuario modificado
localStorage.setItem('auth_user', JSON.stringify(authUser));

console.log('✅ Rol actualizado a ADMIN');
console.log('🔄 Recarga la página para que tome efecto');
```

4. **Recarga la página** (F5)
5. **Ve a Gestión** → Debería funcionar

⚠️ **NOTA:** Esto es temporal. Cuando cierres sesión, necesitarás hacerlo de nuevo o actualizar tu usuario en la base de datos.

---

### **Opción 4: Editar directamente en la base de datos**

Si tienes acceso a la base de datos:

**PostgreSQL:**
```sql
-- Ver todos los usuarios
SELECT username, email, role FROM "User";

-- Actualizar tu usuario a ADMIN
UPDATE "User" 
SET role = 'ADMIN' 
WHERE username = 'TU_USERNAME';
```

**SQLite:**
```sql
-- Ver todos los usuarios
SELECT username, email, role FROM User;

-- Actualizar tu usuario a ADMIN
UPDATE User 
SET role = 'ADMIN' 
WHERE username = 'TU_USERNAME';
```

---

## 🎯 **RECOMENDACIÓN**

**PRUEBA PRIMERO LA OPCIÓN 3** (desde la consola del navegador):
1. Es la más rápida
2. No requiere acceso a la base de datos
3. Funciona inmediatamente

Si funciona, luego podemos hacer el cambio permanente en la base de datos.

---

## 📝 **DESPUÉS DE SOLUCIONARLO**

Una vez que tengas acceso como ADMIN:

1. **Ve a Gestión** → `/administration`
2. **Verás 4 pestañas:**
   - 🏠 Parques
   - 🚛 Vehículos
   - 🗺️ Geocercas
   - 🌐 Zonas

3. **Podrás gestionar todo el sistema**

---

## 🆘 **SI NECESITAS AYUDA**

Dime:
1. ¿Con qué username/email estás entrando?
2. ¿Qué base de datos estás usando? (PostgreSQL, SQLite, MySQL)
3. ¿Tienes acceso directo a la base de datos?

Y te daré las instrucciones exactas para tu caso.

---

**Última actualización:** 8 de octubre de 2025

