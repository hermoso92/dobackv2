# 🧹 LIMPIEZA COMPLETA DEL NAVEGADOR

## 🚨 PROBLEMA
El selector sigue mostrando "DOBACK024" en lugar de "BRP ALCOBENDAS" a pesar de las correcciones.

**CAUSA**: El navegador tiene código JavaScript viejo en caché.

---

## ✅ SOLUCIÓN (HACER EN ORDEN)

### 1️⃣ LIMPIAR LOCALSTORAGE
**Opción A - DevTools (F12)**
1. Abrir DevTools (F12)
2. Ir a **Application** > **Local Storage** > `http://localhost:5174`
3. Click derecho > **Clear**
4. Cerrar DevTools

**Opción B - Consola**
```javascript
localStorage.clear();
console.log('✅ localStorage limpiado');
```

---

### 2️⃣ HARD RELOAD (Limpiar caché del sitio)

**Chrome/Edge:**
1. Abrir DevTools (F12)
2. Click derecho en el botón de **Recargar** (al lado de la URL)
3. Seleccionar **"Vaciar caché y volver a cargar de manera forzada"** (Hard Reload)

**O usar teclado:**
- **Windows**: `Ctrl + Shift + R` o `Ctrl + F5`
- **Mac**: `Cmd + Shift + R`

---

### 3️⃣ SI SIGUE FALLANDO: Limpiar TODA la caché

**Chrome/Edge:**
1. `Ctrl + Shift + Delete`
2. Seleccionar **"Imágenes y archivos en caché"**
3. Rango: **"Última hora"**
4. Click en **"Borrar datos"**
5. Recargar `http://localhost:5174`

---

### 4️⃣ VERIFICACIÓN

Después de limpiar, deberías ver en el selector:

✅ **CORRECTO:**
```
BRP ALCOBENDAS          (en lugar de DOBACK024)
ESCALA ALCOBENDAS       (en lugar de DOBACK027)
BRP ROZAS               (en lugar de DOBACK028)
```

❌ **INCORRECTO:**
```
DOBACK024
DOBACK027
DOBACK028
```

---

## 🔍 DEBUG: Verificar qué vehículos están cargados

Si después de limpiar SIGUE mostrando "DOBACK024", ejecuta esto en la consola (F12 > Console):

```javascript
// Ver qué vehículos tiene el hook
const vehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
console.table(vehicles.map(v => ({ 
  id: v.id?.substring(0, 8) + '...', 
  name: v.name, 
  identifier: v.identifier 
})));

// Hacer request fresco
fetch('http://localhost:9998/api/dashboard/vehicles', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
  }
})
.then(r => r.json())
.then(data => {
  console.log('\n=== VEHÍCULOS DESDE BACKEND ===');
  console.table(data.data.map(v => ({ 
    id: v.id?.substring(0, 8) + '...', 
    name: v.name, 
    identifier: v.identifier 
  })));
});
```

**COPIA Y PEGA AQUÍ EL RESULTADO** si sigue fallando.

---

## 🎯 ÚLTIMA OPCIÓN: Reiniciar Vite

Si todo lo anterior falla, reinicia el frontend:

1. Cerrar la ventana de PowerShell del **frontend**
2. En nueva terminal:
```powershell
cd frontend
npm run dev
```

3. Esperar a que compile
4. Abrir navegador en **modo incógnito**: `Ctrl + Shift + N`
5. Ir a `http://localhost:5174`
6. Login y verificar selector

