# 🚨 SOLUCIÓN URGENTE: organizationId='default-org'

**SITUACIÓN ACTUAL**: Borraste caché, reiniciaste todo, pero sigue usando `default-org`.

**DIAGNÓSTICO**: El backend TypeScript NO se actualizó correctamente.

---

## ✅ **SOLUCIÓN GARANTIZADA** (Forzar recarga del backend)

### **PASO 1: Para TODO** ❌

**Cierra TODAS las ventanas de PowerShell**:
- La del backend (ts-node-dev)
- La del frontend (npm run dev)
- Cualquier otra

### **PASO 2: Verifica que los puertos se liberaron** 🔍

Abre PowerShell y ejecuta:

```powershell
Get-NetTCPConnection -LocalPort 9998,5174 -ErrorAction SilentlyContinue
```

**Debe devolver vacío** (sin resultados). Si hay algo, ejecuta:

```powershell
Get-Process node | Stop-Process -Force
```

### **PASO 3: REINICIA CON INICIAR.PS1** 🚀

```powershell
cd "C:\Users\Cosigein SL\Desktop\DobackSoft"
.\iniciar.ps1
```

**IMPORTANTE**: Espera a que el script diga:
```
✅ Backend funcionando correctamente en puerto 9998
✅ Frontend funcionando correctamente en puerto 5174
```

### **PASO 4: USA MODO INCÓGNITO** 🕵️

**NO uses la ventana normal del navegador**.

1. Cierra la ventana que se abrió automáticamente
2. Abre **modo incógnito**: Ctrl + Shift + N (Chrome/Edge)
3. Ve a `http://localhost:5174`
4. Login: `antoniohermoso92@gmail.com / admin123`

### **PASO 5: VERIFICA organizationId** 🔍

En la consola del navegador (F12 > Console), pega:

```javascript
const user = JSON.parse(localStorage.getItem('auth_user'));
console.log('✅ User:', user);
console.log('✅ organizationId:', user?.organizationId);
```

**Debe mostrar**:
```
organizationId: "a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26"
```

**Si muestra `null` o `""`** → El backend NO se actualizó.

---

## 🔧 **SI EL BACKEND NO SE ACTUALIZÓ**

### **Verifica que el archivo auth.ts tiene los cambios**:

Abre `backend/src/services/auth.ts` en Cursor y verifica que la línea ~27-39 tenga:

```typescript
const user = await this.prisma.user.findUnique({
    where: { email },
    select: {
        id: true,
        email: true,
        password: true,
        name: true,           // ← DEBE ESTAR
        role: true,
        organizationId: true,
        status: true,
        createdAt: true,      // ← DEBE ESTAR
        updatedAt: true       // ← DEBE ESTAR
    }
});
```

**Si NO tiene `name`, `createdAt`, `updatedAt`** → El archivo no se guardó.

**Si SÍ los tiene** → El backend no se recompiló.

---

## 🚀 **SOLUCIÓN ALTERNATIVA: Reinicio forzado**

Ejecuta estos comandos UNO POR UNO en PowerShell:

```powershell
# 1. Para todos los procesos Node
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. Espera 5 segundos
Start-Sleep -Seconds 5

# 3. Ve al backend
cd "C:\Users\Cosigein SL\Desktop\DobackSoft\backend"

# 4. Recompila manualmente
npm run build

# 5. Ve a la raíz
cd ..

# 6. Inicia de nuevo
.\iniciar.ps1
```

---

## 📊 **COMANDO PARA VERIFICAR**

Después de iniciar, ejecuta esto en PowerShell (en OTRA ventana, no donde corre el backend):

```powershell
curl -Method POST -Uri "http://localhost:9998/api/auth/login" -ContentType "application/json" -Body '{"email":"test@bomberosmadrid.es","password":"admin123"}' -UseBasicParsing | Select-Object -ExpandProperty Content
```

Busca en el output:
```json
"organizationId": "a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26"
```

**Si aparece** → Backend está bien, problema es frontend
**Si NO aparece** → Backend no se actualizó

---

## ⚠️ **PROBLEMA CONOCIDO: ts-node-dev no recarga auth.ts**

A veces `ts-node-dev` **NO recarga archivos en `/services/`** automáticamente.

**Solución**: Reiniciar completamente con `iniciar.ps1` (NO solo recargar con ts-node-dev).

---

## 📋 **CHECKLIST**

- [ ] Cerraste TODAS las ventanas de PowerShell
- [ ] Verificaste que puertos 9998 y 5174 están libres
- [ ] Ejecutaste `.\iniciar.ps1`
- [ ] Esperaste a ver "✅ Backend funcionando" y "✅ Frontend funcionando"
- [ ] Usaste modo incógnito (Ctrl + Shift + N)
- [ ] Hiciste login de nuevo
- [ ] Verificaste `localStorage` en consola del navegador

---

**EJECUTA PASO A PASO LOS COMANDOS ARRIBA** ✅  
**USA MODO INCÓGNITO** 🕵️  
**VERIFICA CON CURL SI EL BACKEND DEVUELVE organizationId** 🔍

