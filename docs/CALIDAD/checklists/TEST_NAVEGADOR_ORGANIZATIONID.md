# 🔍 TEST URGENTE - EJECUTAR EN NAVEGADOR

## 🚨 PASOS INMEDIATOS

### 1️⃣ ABRIR DEVTOOLS
- Presiona **F12**
- Ve a la pestaña **Console**

### 2️⃣ COPIAR Y PEGAR ESTE CÓDIGO:

```javascript
// TEST 1: Ver qué hay en localStorage
console.log('=== LOCALSTORAGE ACTUAL ===');
console.log('auth_user:', localStorage.getItem('auth_user'));
try {
  const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
  console.log('User parseado:', user);
  console.log('organizationId en localStorage:', user.organizationId);
} catch(e) {
  console.log('Error parseando user:', e);
}

// TEST 2: Hacer login fresco
console.log('\n=== HACIENDO LOGIN FRESCO ===');
fetch('http://localhost:9998/api/auth/login', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    email: 'test@bomberosmadrid.es', 
    password: 'admin123'
  })
})
.then(r => r.json())
.then(data => {
  console.log('RESPUESTA COMPLETA DEL BACKEND:');
  console.log(JSON.stringify(data, null, 2));
  
  if (data.user) {
    console.log('\n=== USUARIO EN RESPUESTA ===');
    console.log('ID:', data.user.id);
    console.log('Email:', data.user.email);
    console.log('Name:', data.user.name);
    console.log('Role:', data.user.role);
    console.log('OrganizationId:', data.user.organizationId);
    
    if (!data.user.organizationId || data.user.organizationId === '') {
      console.error('\n❌ ERROR: organizationId está VACÍO');
      console.error('El backend NO está devolviendo organizationId');
      console.error('Esto causará que el frontend use "default-org"');
    } else {
      console.log('\n✅ organizationId presente:', data.user.organizationId);
    }
  }
})
.catch(err => console.error('Error:', err));
```

### 3️⃣ ESPERAR Y VER LA RESPUESTA

Debes ver algo como:

**✅ CORRECTO:**
```
USUARIO EN RESPUESTA ===
ID: xxx
Email: test@bomberosmadrid.es
Name: Test User
Role: ADMIN
OrganizationId: a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26
✅ organizationId presente: a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26
```

**❌ INCORRECTO:**
```
OrganizationId: null
❌ ERROR: organizationId está VACÍO
```

---

## 📋 COPIA Y PEGA AQUÍ LA RESPUESTA COMPLETA

Necesito ver **TODO** lo que sale en la consola para diagnosticar el problema.

