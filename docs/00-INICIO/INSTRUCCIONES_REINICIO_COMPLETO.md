# 🔄 INSTRUCCIONES DE REINICIO COMPLETO

**IMPORTANTE**: El navegador tiene caché del login anterior que usa `organizationId='default-org'`.

---

## ✅ **PASOS PARA REINICIAR COMPLETAMENTE**

### **1. CERRAR TODO** ❌

Cierra **TODAS** las ventanas de PowerShell:
- Backend (npx ts-node-dev)
- Frontend (npm run dev)
- Cualquier otra

### **2. LIMPIAR CACHÉ DEL NAVEGADOR** 🧹

**Opción A (Recomendada)**: Modo Incógnito

1. Cierra la pestaña de `localhost:5174`
2. Abre una **ventana de incógnito** (Ctrl + Shift + N en Chrome/Edge)

**Opción B**: Limpiar localStorage

1. Abre la consola del navegador (F12)
2. Ve a la pestaña "Aplicación" o "Application"
3. Haz clic en "Local Storage" > `http://localhost:5174`
4. Haz clic derecho > "Borrar todo"
5. Cierra y vuelve a abrir el navegador

### **3. REINICIAR CON INICIAR.PS1** 🚀

Abre PowerShell en `C:\Users\Cosigein SL\Desktop\DobackSoft` y ejecuta:

```powershell
.\iniciar.ps1
```

Espera a que:
- ✅ Backend diga: "Backend funcionando en puerto 9998"
- ✅ Frontend diga: "Frontend funcionando en puerto 5174"
- ✅ Se abra el navegador automáticamente

### **4. LOGIN CON INCÓGNITO** 🔐

Usa: `antoniohermoso92@gmail.com / admin123`

### **5. VERIFICAR EN CONSOLA** 🔍

Abre la consola del navegador (F12) y busca:

```
[INFO] Login exitoso
[INFO] Autenticacion establecida {hasAccessToken: true, hasRefreshToken: true}
```

Luego verifica en la consola del navegador:

```javascript
// Pega esto en la consola del navegador:
const user = JSON.parse(localStorage.getItem('auth_user'));
console.log('organizationId:', user.organizationId);
```

**Debe mostrar**:
```
organizationId: a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26  ✅
```

**NO debe mostrar**:
```
organizationId: null  ❌
organizationId: default-org  ❌
organizationId: ""  ❌
```

---

## 🎯 **QUÉ DEBERÍAS VER DESPUÉS**

### **Pestaña "Estados y Tiempos"**:
- ✅ KPIs: 36:19:40, ~6,464 km, ~1,303 eventos
- ✅ Carga en ~5-9 segundos

### **Pestaña "Puntos Negros"**:
- ✅ **Mapa con clusters** (puntos rojos/amarillos/verdes)
- ✅ Mensaje: "X eventos, Y clusters"
- ✅ Al seleccionar un vehículo, los clusters cambian

### **Pestaña "Velocidad"**:
- ✅ **Sin error 500**
- ⚠️  "0 violaciones" (normal, TomTom no integrado)
- ✅ Mapa visible

---

## 📋 **SI AÚN NO FUNCIONA**

Después de hacer TODO lo de arriba (incluyendo modo incógnito), si SIGUE mostrando `organizationId=default-org`:

### **Ejecuta este test en PowerShell**:

```powershell
cd C:\Users\Cosigein SL\Desktop\DobackSoft
node backend/test-login-organizationid.js
```

**Debe mostrar**:
```
✅ organizationId correcto: a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26
✅ name: Test User
```

Si el test muestra `organizationId: MISSING/NULL`, entonces el problema es que el backend no se actualizó correctamente y necesitamos reiniciarlo con `iniciar.ps1`.

---

## 🚀 **RESUMEN RÁPIDO**

1. **Cierra** todas las ventanas de PowerShell
2. **Usa modo incógnito** (Ctrl + Shift + N)
3. **Ejecuta** `.\iniciar.ps1`
4. **Espera** a que todo se inicie
5. **Login** con `antoniohermoso92@gmail.com / admin123`
6. **Ve a** "Puntos Negros" → Debería aparecer el mapa

---

**IMPORTANTE**: El problema es caché del navegador, no del código. Todo el código ya está corregido y compilado ✅

