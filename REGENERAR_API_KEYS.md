# 🔐 REGENERAR API KEYS - INSTRUCCIONES

## ⚠️ IMPORTANTE
Tus API keys estuvieron en commits de Git (aunque no llegaron a GitHub). Por seguridad, **debes regenerarlas**.

---

## 1️⃣ **OpenAI API Key**

### **Paso 1: Acceder a OpenAI**
1. Ve a: https://platform.openai.com/api-keys
2. Inicia sesión con tu cuenta

### **Paso 2: Revocar key antigua**
1. Busca la key que empieza con: `sk-proj-1srOrThV4N4AIDO7iXUzu...`
2. Haz clic en **"Revoke"** o **"Delete"**

### **Paso 3: Crear nueva key**
1. Haz clic en **"+ Create new secret key"**
2. Dale un nombre: `DobackSoft Production`
3. **Copia la key** (solo se muestra una vez)

### **Paso 4: Actualizar en tu proyecto**
1. Abre: `backend/config.env`
2. Reemplaza la línea 27:
   ```env
   OPENAI_API_KEY=tu_nueva_key_aqui
   ```

---

## 2️⃣ **Radar API Keys**

### **Paso 1: Acceder a Radar**
1. Ve a: https://radar.com/dashboard
2. Inicia sesión

### **Paso 2: Revocar keys antiguas**
1. Ve a **Settings** → **API Keys**
2. Busca y revoca estas keys:
   - `prj_live_sk_66852a80bb80d76a04c0d08a17dfe9b032001afd`
   - `prj_live_pk_7fc0cf11a1ec557ef13588a43a6764ffdebfd3fd`

### **Paso 3: Crear nuevas keys**
1. Haz clic en **"Create API Key"**
2. **Copia ambas**:
   - **Secret Key** (`sk_...`)
   - **Publishable Key** (`pk_...`)

### **Paso 4: Actualizar en tu proyecto**
1. Abre: `backend/config.env`
2. Reemplaza las líneas 30-31:
   ```env
   RADAR_SECRET_KEY=tu_nueva_secret_key_aqui
   RADAR_PUBLISHABLE_KEY=tu_nueva_publishable_key_aqui
   ```
3. También actualiza la línea 41:
   ```env
   VITE_RADAR_PUBLISHABLE_KEY=tu_nueva_publishable_key_aqui
   ```

---

## 3️⃣ **TomTom API Key**

### **Paso 1: Acceder a TomTom**
1. Ve a: https://developer.tomtom.com/user/me/apps
2. Inicia sesión

### **Paso 2: Revocar key antigua**
1. Busca la key: `u8wN3BM4AMzDGGC76lLF14vHblDP37HG`
2. Elimínala o crea una nueva app

### **Paso 3: Crear nueva key**
1. Haz clic en **"Register a new app"** o edita la existente
2. **Copia la nueva Consumer Key**

### **Paso 4: Actualizar en tu proyecto**
1. Abre: `backend/config.env`
2. Reemplaza las líneas 24 y 40:
   ```env
   TOMTOM_API_KEY=tu_nueva_key_aqui
   VITE_TOMTOM_API_KEY=tu_nueva_key_aqui
   ```

---

## ✅ **Verificación Final**

Una vez regeneradas todas las keys:

```cmd
# 1. Verifica que el backend arranca sin errores
cd backend
npm start

# 2. Verifica que el frontend arranca sin errores  
cd ..\frontend
npm run dev

# 3. Prueba que las APIs funcionan
# - OpenAI: Prueba el módulo de IA
# - Radar: Prueba las geocercas
# - TomTom: Prueba los mapas
```

---

## 📝 **Notas de Seguridad**

✅ **Archivos `.env` NUNCA deben subirse a Git**
✅ **Usa `.env.example` con valores de ejemplo**
✅ **En producción, usa variables de entorno del servidor**
✅ **Guarda las keys en un gestor de contraseñas (1Password, Bitwarden, etc.)**

---

## 🗑️ **Limpieza (Opcional)**

Si ya no necesitas los backups:

```cmd
del backend\config.env.backup
del config.env.backup
```

---

**Fecha:** 10 de octubre de 2025
**Repositorio:** https://github.com/hermoso92/dobackv2

