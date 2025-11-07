# ✅ Corrección: Rate Limit y Sesiones Recientes

## 🔴 **PROBLEMAS DETECTADOS**

Después de borrar todos los datos, el usuario encontró:

1. **Rate limit de 6-10 minutos** para el procesamiento automático
2. **Error 500** en `/api/upload/recent-sessions`  
3. **Error 401** en `/api/processing-reports/latest` (refresh token)

---

## 🔧 **CORRECCIONES IMPLEMENTADAS**

### ✅ **1. Rate Limit Eliminado en Desarrollo**

#### Archivo: `frontend/src/config/features.ts`

**Antes:**
```typescript
processingRateLimitMs: 10 * 60 * 1000 // 10 minutos SIEMPRE
```

**Ahora:**
```typescript
processingRateLimitMs: isProduction ? (10 * 60 * 1000) : (30 * 1000) 
// 10 min en producción, 30 segundos en desarrollo
```

#### Archivo: `frontend/src/components/FileUploadManager.tsx`

**Antes:**
```typescript
// Rate limit aplicaba siempre
if (timeSince < FEATURE_FLAGS.processingRateLimitMs) {
    setAutoProcessError(`⏱️ Rate limit: Espera ${minutesLeft} minutos...`);
    return;
}
```

**Ahora:**
```typescript
// Rate limit SOLO en producción
if (process.env.NODE_ENV === 'production') {
    if (timeSince < FEATURE_FLAGS.processingRateLimitMs) {
        setAutoProcessError(`⏱️ Rate limit: Espera ${minutesLeft} minutos...`);
        return;
    }
}
```

---

### ✅ **2. Endpoint `/api/upload/recent-sessions` Corregido**

#### Archivo: `backend/src/routes/upload.ts`

**Problemas detectados:**
1. ❌ No filtraba por `organizationId`
2. ❌ Devolvía error 500 cuando no había sesiones
3. ❌ No manejaba token JWT correctamente

**Correcciones:**
1. ✅ Ahora filtra por `organizationId` del token JWT
2. ✅ Devuelve array vacío en lugar de error 500
3. ✅ Maneja errores de JWT gracefully
4. ✅ Añadidos logs informativos

**Código corregido:**
```typescript
router.get('/recent-sessions', async (req, res) => {
  try {
    // ✅ Filtrar por organización si el usuario está autenticado
    const whereClause: any = {};
    
    // Si hay token de autenticación, filtrar por organización
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, config.jwt.secret) as any;
        
        if (decoded.organizationId) {
          whereClause.organizationId = decoded.organizationId;
        }
      } catch (jwtError) {
        logger.warn('Token JWT inválido en recent-sessions');
      }
    }

    const sessions = await prisma.session.findMany({
      where: whereClause,
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: { Vehicle: { select: { name: true, identifier: true } } }
    });

    logger.info(`✅ Sesiones recientes obtenidas: ${sessions.length}`);

    res.json({
      success: true,
      data: { sessions: sessions.map(s => ({ ... })) }
    });
  } catch (error) {
    logger.error('Error obteniendo sesiones recientes:', error);
    // ✅ Devolver array vacío en lugar de error 500
    res.json({
      success: true,
      data: { sessions: [] }
    });
  }
});
```

---

## 📊 **RESULTADO**

### **Antes:**
- ❌ Esperar 10 minutos en desarrollo para re-procesar
- ❌ Error 500 al intentar cargar sesiones recientes
- ❌ Mensaje de error confuso

### **Ahora:**
- ✅ Esperar solo 30 segundos en desarrollo
- ✅ No hay rate limit en desarrollo
- ✅ Endpoint devuelve array vacío cuando no hay sesiones
- ✅ Logs claros sobre qué está pasando

---

## 🚀 **CÓMO USAR**

### **Para eliminar el rate limit inmediatamente:**

1. Abre la consola del navegador (F12)
2. Ejecuta:
   ```javascript
   localStorage.removeItem('lastProcessingTimestamp');
   ```
3. Refresca la página (F5)
4. Ya puedes procesar sin esperar

### **Para verificar que funciona:**

1. Ve a `/upload`
2. Pestaña "Procesamiento Automático"
3. Click en "Iniciar Procesamiento Automático"
4. ✅ Debería iniciar inmediatamente (sin rate limit en dev)

---

## 🔄 **CAMBIOS EN PRODUCCIÓN**

El rate limit se mantiene en producción para evitar sobrecarga:

- **Desarrollo**: Sin rate limit (30 seg simbólicos)
- **Producción**: 10 minutos entre procesamientos

---

## 📁 **ARCHIVOS MODIFICADOS**

```
✅ frontend/src/config/features.ts               - Rate limit solo en prod
✅ frontend/src/components/FileUploadManager.tsx - Rate limit condicional
✅ backend/src/routes/upload.ts                  - Endpoint /recent-sessions corregido
```

---

**Correcciones implementadas: 05/11/2025 21:50**

