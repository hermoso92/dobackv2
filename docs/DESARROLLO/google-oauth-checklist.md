# ✅ Checklist - Implementación Google OAuth 2.0

## 📋 Progreso General

- [ ] 1. Configuración de Google Cloud Console
- [ ] 2. Configuración de variables de entorno
- [ ] 3. Migración de base de datos
- [ ] 4. Instalación de dependencias
- [ ] 5. Implementación backend
- [ ] 6. Implementación frontend
- [ ] 7. Testing
- [ ] 8. Documentación

---

## 1️⃣ Configuración de Google Cloud Console

### Google Cloud Platform
- [ ] Crear proyecto "DobackSoft OAuth"
- [ ] Habilitar Google+ API
- [ ] Configurar OAuth Consent Screen
  - [ ] Tipo: External
  - [ ] App name: DobackSoft
  - [ ] User support email
  - [ ] Developer contact email
  - [ ] Scopes: email, profile

### Credenciales OAuth 2.0
- [ ] Crear OAuth Client ID (Web application)
- [ ] Configurar Authorized JavaScript origins:
  - [ ] `http://localhost:5174` (desarrollo)
  - [ ] `https://dobacksoft.com` (producción)
- [ ] Configurar Authorized redirect URIs:
  - [ ] `http://localhost:9998/api/auth/google/callback` (desarrollo)
  - [ ] `https://api.dobacksoft.com/api/auth/google/callback` (producción)
- [ ] Copiar Client ID
- [ ] Copiar Client Secret

---

## 2️⃣ Configuración de Variables de Entorno

### Backend (.env)
- [ ] Añadir `GOOGLE_CLIENT_ID`
- [ ] Añadir `GOOGLE_CLIENT_SECRET`
- [ ] Añadir `GOOGLE_CALLBACK_URL`
- [ ] Añadir `FRONTEND_URL`
- [ ] Verificar formato de credenciales
- [ ] Guardar backup de .env

**Comando de ayuda:**
```powershell
.\scripts\setup\configure-google-oauth.ps1
```

---

## 3️⃣ Migración de Base de Datos

### SQL Migration
- [ ] Revisar archivo `database/migrations/add_google_oauth.sql`
- [ ] Aplicar migración:
  ```bash
  psql -U postgres -d dobacksoft -f database/migrations/add_google_oauth.sql
  ```
- [ ] Verificar campo `googleId` en tabla `User`
- [ ] Verificar índice único en `googleId`
- [ ] Verificar que `password` es nullable

**Verificación:**
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'User' AND column_name IN ('googleId', 'password');
```

---

## 4️⃣ Instalación de Dependencias

### Backend
- [ ] Instalar Passport:
  ```bash
  npm install passport passport-google-oauth20
  ```
- [ ] Instalar tipos TypeScript:
  ```bash
  npm install --save-dev @types/passport @types/passport-google-oauth20
  ```
- [ ] Verificar instalación en `package.json`
- [ ] Ejecutar `npm install` (por si acaso)

### Frontend
- [ ] No requiere dependencias adicionales ✅
- [ ] Verificar que Material-UI tiene `GoogleIcon`

---

## 5️⃣ Implementación Backend

### Archivo: `backend/src/config/passport.ts` (NUEVO)
- [ ] Crear archivo
- [ ] Importar dependencias
- [ ] Configurar Google Strategy
- [ ] Implementar callback de Google OAuth
- [ ] Lógica de creación automática de usuario
- [ ] Actualizar/crear `googleId` en usuario existente
- [ ] Determinar rol automático (primer usuario = ADMIN)
- [ ] Asociar a organización
- [ ] Configurar serialización de Passport
- [ ] Logging apropiado

### Archivo: `backend/src/routes/auth.ts` (MODIFICAR)
- [ ] Importar `passport`
- [ ] Añadir ruta `GET /google`
  - [ ] Configurar scopes: `['profile', 'email']`
- [ ] Añadir ruta `GET /google/callback`
  - [ ] Manejar errores de OAuth
  - [ ] Generar JWT
  - [ ] Establecer cookie httpOnly
  - [ ] Redirigir a frontend con token
- [ ] Logging apropiado

### Archivo: `backend/src/index.ts` (MODIFICAR)
- [ ] Importar `passport`
- [ ] Importar `configurePassport`
- [ ] Inicializar Passport antes de rutas:
  ```typescript
  configurePassport();
  app.use(passport.initialize());
  ```

### Verificación Backend
- [ ] Compilar TypeScript sin errores
- [ ] Linter sin errores
- [ ] Reiniciar backend
- [ ] Verificar logs de inicio
- [ ] Endpoint `/api/auth/google` disponible
- [ ] Endpoint `/api/auth/google/callback` disponible

---

## 6️⃣ Implementación Frontend

### Archivo: `frontend/src/pages/Login.tsx` (MODIFICAR)
- [ ] Importar `GoogleIcon` de Material-UI
- [ ] Añadir función `handleGoogleLogin`:
  ```typescript
  const handleGoogleLogin = () => {
    window.location.href = `${API_CONFIG.BASE_URL}/api/auth/google`;
  };
  ```
- [ ] Añadir botón "Iniciar sesión con Google"
  - [ ] Diseño acorde a branding de Google
  - [ ] Icono de Google
  - [ ] Texto claro
  - [ ] Estilo diferenciado de login tradicional
- [ ] Añadir `<Divider>` con texto "O continúa con"
- [ ] Posicionar botón después de login tradicional

### Archivo: `frontend/src/App.tsx` o `Dashboard.tsx` (MODIFICAR)
- [ ] Importar `useSearchParams` de react-router-dom
- [ ] Capturar `token` de URL query params
- [ ] Guardar token en localStorage
- [ ] Actualizar contexto de autenticación
- [ ] Limpiar URL (remover `?token=...`)
- [ ] Redirigir a `/dashboard`

### Manejo de Errores
- [ ] Capturar `?error=oauth_failed` en URL
- [ ] Capturar `?error=user_not_found` en URL
- [ ] Capturar `?error=oauth_error` en URL
- [ ] Mostrar mensajes de error apropiados
- [ ] Logging de errores

### Verificación Frontend
- [ ] Compilar React sin errores
- [ ] Linter sin errores
- [ ] Botón visible en página de login
- [ ] Diseño responsivo
- [ ] Accesibilidad (aria-labels)

---

## 7️⃣ Testing

### Pruebas Manuales - Usuario Nuevo
- [ ] Click en "Iniciar sesión con Google"
- [ ] Redirigido a Google OAuth Consent Screen
- [ ] Autorizar aplicación
- [ ] Redirigido de vuelta al frontend
- [ ] Usuario creado automáticamente en BD
- [ ] Verificar campos en BD:
  - [ ] `email` correcto
  - [ ] `name` correcto
  - [ ] `googleId` poblado
  - [ ] `password` vacío
  - [ ] `role` = ADMIN (si es primer usuario)
  - [ ] `organizationId` asignado
  - [ ] `status` = ACTIVE
- [ ] Token JWT válido
- [ ] Sesión iniciada correctamente
- [ ] Acceso al dashboard

### Pruebas Manuales - Usuario Existente
- [ ] Crear usuario con email tradicional
- [ ] Login con Google usando mismo email
- [ ] `googleId` actualizado en BD
- [ ] Sesión iniciada correctamente
- [ ] Datos del usuario preservados

### Pruebas Manuales - Compatibilidad
- [ ] Login tradicional (email/password) sigue funcionando
- [ ] Registro tradicional sigue funcionando
- [ ] Ambos métodos coexisten sin conflictos
- [ ] Logout funciona correctamente
- [ ] Refresh de token funciona

### Pruebas de Seguridad
- [ ] Cookie httpOnly establecida
- [ ] Token JWT válido por 24h
- [ ] No se expone `accessToken` de Google
- [ ] Validación de email recibido de Google
- [ ] Protección contra CSRF
- [ ] Tokens expirados manejados correctamente

### Pruebas de Errores
- [ ] Google OAuth cancelado por usuario
- [ ] Email no proporcionado por Google
- [ ] Error de red durante callback
- [ ] Credenciales inválidas en .env
- [ ] Base de datos no disponible
- [ ] Frontend muestra errores apropiados

### Verificación en Base de Datos
```sql
-- Verificar usuarios creados con Google OAuth
SELECT id, email, name, role, googleId, password, status
FROM "User"
WHERE "googleId" IS NOT NULL;

-- Verificar que password esté vacío para usuarios OAuth
SELECT COUNT(*)
FROM "User"
WHERE "googleId" IS NOT NULL AND password != '';
```

### Logging
- [ ] Logs de inicio de OAuth
- [ ] Logs de callback de Google
- [ ] Logs de creación de usuario
- [ ] Logs de generación de JWT
- [ ] Logs de errores con contexto

---

## 8️⃣ Documentación

### Documentación Técnica
- [x] Guía de implementación completa
- [ ] Diagramas de flujo OAuth
- [ ] Ejemplos de código
- [ ] Troubleshooting común

### Documentación de Usuario
- [ ] Cómo usar "Iniciar sesión con Google"
- [ ] Qué datos se obtienen de Google
- [ ] Cómo desvincular cuenta de Google
- [ ] FAQ de autenticación

### Documentación de Despliegue
- [ ] Configuración en producción
- [ ] Variables de entorno necesarias
- [ ] Configuración de Google Cloud para producción
- [ ] Rollback plan

### Actualizar README
- [ ] Añadir sección de Google OAuth
- [ ] Actualizar diagrama de arquitectura
- [ ] Actualizar instrucciones de instalación
- [ ] Actualizar variables de entorno requeridas

---

## 🚀 Despliegue

### Pre-deploy Checklist
- [ ] Todas las pruebas pasadas
- [ ] Documentación completa
- [ ] Código revisado
- [ ] Variables de entorno configuradas
- [ ] Migración de BD aplicada
- [ ] Backup de BD creado

### Producción
- [ ] Actualizar callback URL en Google Cloud Console
- [ ] Configurar variables de entorno en servidor
- [ ] Aplicar migración: `npx prisma migrate deploy`
- [ ] Reiniciar backend
- [ ] Verificar logs del servidor
- [ ] Smoke test en producción
- [ ] Monitorear errores (primeras 24h)

---

## 📊 Métricas de Éxito

### KPIs a Monitorear
- [ ] Configurar analytics de login con Google
- [ ] Medir tasa de adopción (Google vs tradicional)
- [ ] Medir tiempo promedio de registro
- [ ] Medir tasa de errores de OAuth
- [ ] Medir satisfacción de usuario

### Targets
- [ ] ✅ Tasa de adopción > 30% en primer mes
- [ ] ✅ Tiempo de registro < 15 segundos
- [ ] ✅ Tasa de errores < 1%
- [ ] ✅ Compatibilidad 100% con login tradicional

---

## 🔮 Próximas Fases

### Fase 2: Autenticación Biométrica (Future)
- [ ] Investigar Web Authentication API
- [ ] Implementar Face ID / Touch ID
- [ ] Testing en dispositivos compatibles

### Fase 3: Otros Proveedores OAuth (Future)
- [ ] Microsoft Azure AD
- [ ] GitHub
- [ ] Apple Sign In

### Fase 4: Multi-Factor Authentication (Future)
- [ ] SMS / Email verification
- [ ] Authenticator Apps
- [ ] Security keys (YubiKey)

---

**Estado actual**: 📋 Planificación  
**Rama**: `feature/google-oauth-login`  
**Responsable**: [Tu nombre]  
**Fecha inicio**: 2025-11-05  
**Fecha estimada**: 2025-11-12

