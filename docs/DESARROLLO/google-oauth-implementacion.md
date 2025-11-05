# 🔐 Implementación de Google OAuth 2.0 - DobackSoft

## 📋 Resumen Ejecutivo

Implementación de **Iniciar sesión con Google** (OAuth 2.0) en DobackSoft para:
- ✅ Mejorar la experiencia de usuario (login en 1 clic)
- ✅ Registro automático de usuarios nuevos
- ✅ Mantener compatibilidad con login tradicional (email/password)
- ✅ Seguridad reforzada con autenticación de Google
- ✅ Preparación para Face ID y otros métodos biométricos

## 🎯 Objetivos

### Funcionalidades Principales
1. **Login con Google** → Botón "Iniciar sesión con Google"
2. **Registro automático** → Usuarios nuevos se crean automáticamente
3. **Compatibilidad** → Login tradicional sigue funcionando
4. **Seguridad** → JWT + httpOnly cookies (como siempre)
5. **Roles automáticos** → Primer usuario ADMIN, resto USER

## 🏗️ Arquitectura

### Stack Tecnológico
- **Frontend**: React + Material-UI
- **Backend**: Express + Passport.js (estrategia Google OAuth 2.0)
- **Base de datos**: PostgreSQL (Prisma)
- **Autenticación**: JWT tokens (igual que ahora)

### Flujo de Autenticación

```
┌─────────────┐
│   Usuario   │
└──────┬──────┘
       │ (1) Click "Iniciar con Google"
       ▼
┌─────────────────────────────┐
│  Frontend (Login.tsx)       │
│  - Redirige a /auth/google  │
└──────┬──────────────────────┘
       │ (2) Redirect a Google
       ▼
┌─────────────────────────────┐
│  Google OAuth Consent       │
│  - Usuario autoriza         │
└──────┬──────────────────────┘
       │ (3) Callback con código
       ▼
┌─────────────────────────────────────┐
│  Backend (/auth/google/callback)    │
│  1. Verifica código con Google      │
│  2. Obtiene perfil del usuario      │
│  3. Busca usuario en BD             │
│  4. Si no existe → crear automático │
│  5. Genera JWT                      │
│  6. Establece cookie httpOnly       │
└──────┬──────────────────────────────┘
       │ (4) Redirect con token
       ▼
┌─────────────────────────────┐
│  Frontend (Dashboard)       │
│  - Usuario autenticado      │
└─────────────────────────────┘
```

## 📦 Dependencias a Instalar

### Backend
```bash
npm install passport passport-google-oauth20
npm install --save-dev @types/passport @types/passport-google-oauth20
```

### Frontend
```bash
# No requiere dependencias adicionales
# Usaremos redirect simple a /api/auth/google
```

## 🔧 Implementación - Backend

### 1. Configuración de Variables de Entorno

**Archivo**: `backend/.env`

```env
# Google OAuth 2.0
GOOGLE_CLIENT_ID=tu-client-id-de-google.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
GOOGLE_CALLBACK_URL=http://localhost:9998/api/auth/google/callback

# Para producción
# GOOGLE_CALLBACK_URL=https://dobacksoft.com/api/auth/google/callback
```

### 2. Configuración de Passport (Google Strategy)

**Archivo**: `backend/src/config/passport.ts` (NUEVO)

```typescript
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import passport from 'passport';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

export const configurePassport = () => {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID!,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
                callbackURL: process.env.GOOGLE_CALLBACK_URL!,
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    logger.info('Google OAuth callback recibido', {
                        profileId: profile.id,
                        email: profile.emails?.[0]?.value,
                    });

                    const email = profile.emails?.[0]?.value;

                    if (!email) {
                        return done(new Error('Email no proporcionado por Google'));
                    }

                    // Buscar usuario existente
                    let user = await prisma.user.findUnique({
                        where: { email },
                        include: { Organization: true },
                    });

                    // Si no existe, crear automáticamente
                    if (!user) {
                        logger.info('Usuario no existe, creando automáticamente...', { email });

                        // Determinar organización
                        let organization = await prisma.organization.findFirst();

                        if (!organization) {
                            organization = await prisma.organization.create({
                                data: { name: 'Organización Principal' },
                            });
                        }

                        // Determinar rol: primer usuario = ADMIN, resto = USER
                        const userCount = await prisma.user.count();
                        const role = userCount === 0 ? 'ADMIN' : 'USER';

                        // Crear usuario
                        user = await prisma.user.create({
                            data: {
                                email,
                                name: profile.displayName || email.split('@')[0],
                                password: '', // No se usa password para OAuth
                                role,
                                status: 'ACTIVE',
                                organizationId: organization.id,
                                googleId: profile.id, // NUEVO CAMPO
                            },
                            include: { Organization: true },
                        });

                        logger.info('Usuario creado automáticamente', {
                            userId: user.id,
                            email: user.email,
                            role: user.role,
                        });
                    } else {
                        // Actualizar googleId si no existe
                        if (!user.googleId) {
                            user = await prisma.user.update({
                                where: { id: user.id },
                                data: { googleId: profile.id },
                                include: { Organization: true },
                            });
                        }

                        logger.info('Usuario existente autenticado', {
                            userId: user.id,
                            email: user.email,
                        });
                    }

                    return done(null, user);
                } catch (error) {
                    logger.error('Error en Google OAuth callback', { error });
                    return done(error);
                }
            }
        )
    );

    // Serialización (no necesaria para JWT pero requerida por Passport)
    passport.serializeUser((user: any, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id: string, done) => {
        try {
            const user = await prisma.user.findUnique({ where: { id } });
            done(null, user);
        } catch (error) {
            done(error);
        }
    });
};
```

### 3. Rutas de Autenticación OAuth

**Archivo**: `backend/src/routes/auth.ts` (MODIFICAR)

```typescript
import passport from 'passport';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { logger } from '../utils/logger';

const router = Router();

// ... (rutas existentes)

// 🆕 NUEVAS RUTAS GOOGLE OAUTH

// Ruta para iniciar autenticación con Google
router.get(
    '/google',
    passport.authenticate('google', {
        scope: ['profile', 'email'],
    })
);

// Callback de Google OAuth
router.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login?error=oauth_failed' }),
    async (req, res) => {
        try {
            const user = req.user as any;

            if (!user) {
                logger.error('Usuario no encontrado después de OAuth');
                return res.redirect('http://localhost:5174/login?error=user_not_found');
            }

            // Generar JWT (igual que login tradicional)
            const token = jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    organizationId: user.organizationId,
                },
                config.jwt.secret,
                { expiresIn: '24h' }
            );

            logger.info('JWT generado para usuario OAuth', {
                userId: user.id,
                email: user.email,
            });

            // Establecer cookie httpOnly (igual que login tradicional)
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 24 * 60 * 60 * 1000, // 24 horas
            });

            // Redirigir al dashboard con token en query param (fallback)
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
            res.redirect(`${frontendUrl}/dashboard?token=${token}`);
        } catch (error) {
            logger.error('Error en callback de Google OAuth', { error });
            res.redirect('http://localhost:5174/login?error=oauth_error');
        }
    }
);

export default router;
```

### 4. Inicializar Passport en Express

**Archivo**: `backend/src/index.ts` (MODIFICAR)

```typescript
import express from 'express';
import passport from 'passport';
import { configurePassport } from './config/passport';

const app = express();

// ... (middleware existente)

// 🆕 INICIALIZAR PASSPORT
configurePassport();
app.use(passport.initialize());

// ... (rutas existentes)
```

### 5. Migración de Base de Datos

**Archivo**: `backend/prisma/schema.prisma` (MODIFICAR)

```prisma
model User {
  id             String         @id @default(uuid())
  email          String         @unique
  name           String
  password       String         // Vacío para usuarios OAuth
  googleId       String?        @unique // 🆕 NUEVO CAMPO
  role           UserRole       @default(USER)
  status         UserStatus     @default(ACTIVE)
  organizationId String?
  Organization   Organization?  @relation(fields: [organizationId], references: [id])
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt
  // ... (resto de campos)
}
```

**Comando de migración:**
```bash
npx prisma migrate dev --name add-google-oauth
```

## 🎨 Implementación - Frontend

### 1. Botón "Iniciar sesión con Google"

**Archivo**: `frontend/src/pages/Login.tsx` (MODIFICAR)

```typescript
import GoogleIcon from '@mui/icons-material/Google';
import { Button, Divider, Box } from '@mui/material';

// Dentro del componente LoginWithRegister, después del botón de login tradicional:

<Box sx={{ mt: 3 }}>
    <Divider sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
            O continúa con
        </Typography>
    </Divider>

    <Button
        fullWidth
        variant="outlined"
        startIcon={<GoogleIcon />}
        onClick={handleGoogleLogin}
        sx={{
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 600,
            borderColor: '#4285f4',
            color: '#4285f4',
            '&:hover': {
                borderColor: '#357ae8',
                backgroundColor: 'rgba(66, 133, 244, 0.04)',
            },
        }}
    >
        Iniciar sesión con Google
    </Button>
</Box>
```

### 2. Función de Login con Google

```typescript
const handleGoogleLogin = () => {
    // Redirigir directamente al endpoint de Google OAuth
    const backendUrl = API_CONFIG.BASE_URL;
    window.location.href = `${backendUrl}/api/auth/google`;
};
```

### 3. Manejar Token en URL (Dashboard)

**Archivo**: `frontend/src/App.tsx` o `frontend/src/pages/Dashboard.tsx`

```typescript
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
    const [searchParams] = useSearchParams();
    const { setToken } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Capturar token de OAuth callback
        const token = searchParams.get('token');

        if (token) {
            // Guardar token en localStorage y context
            localStorage.setItem('token', token);
            setToken(token);

            // Limpiar URL
            navigate('/dashboard', { replace: true });
        }
    }, [searchParams, setToken, navigate]);

    // ... resto del componente
};
```

## 🔒 Configuración de Google Cloud Console

### Paso 1: Crear Proyecto en Google Cloud

1. Ir a https://console.cloud.google.com/
2. Crear nuevo proyecto: "DobackSoft OAuth"
3. Habilitar **Google+ API**

### Paso 2: Configurar OAuth Consent Screen

1. Ir a **APIs & Services** → **OAuth consent screen**
2. Tipo: **External** (para testing) o **Internal** (para empresa)
3. Rellenar información:
   - **App name**: DobackSoft
   - **User support email**: tu-email@empresa.com
   - **Developer contact**: tu-email@empresa.com
4. Scopes: `email`, `profile`
5. Test users (modo desarrollo): añadir emails permitidos

### Paso 3: Crear Credenciales OAuth 2.0

1. Ir a **Credentials** → **Create Credentials** → **OAuth Client ID**
2. Tipo: **Web application**
3. Nombre: "DobackSoft Web Client"
4. **Authorized JavaScript origins**:
   - `http://localhost:5174` (desarrollo)
   - `https://dobacksoft.com` (producción)
5. **Authorized redirect URIs**:
   - `http://localhost:9998/api/auth/google/callback` (desarrollo)
   - `https://api.dobacksoft.com/api/auth/google/callback` (producción)
6. **Guardar** → Copiar **Client ID** y **Client Secret**

### Paso 4: Configurar Variables de Entorno

Copiar credenciales al archivo `backend/.env`:

```env
GOOGLE_CLIENT_ID=123456789-abc123def456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
GOOGLE_CALLBACK_URL=http://localhost:9998/api/auth/google/callback
FRONTEND_URL=http://localhost:5174
```

## 🧪 Testing

### Pruebas Manuales

1. **Login con Google (usuario nuevo)**:
   - ✅ Click en "Iniciar con Google"
   - ✅ Autorizar en Google
   - ✅ Usuario creado automáticamente
   - ✅ Redirigido al dashboard
   - ✅ Token JWT válido

2. **Login con Google (usuario existente)**:
   - ✅ Usuario ya registrado con email tradicional
   - ✅ Login con Google funciona
   - ✅ `googleId` actualizado en BD

3. **Compatibilidad con login tradicional**:
   - ✅ Login con email/password sigue funcionando
   - ✅ Ambos métodos coexisten

### Comandos de Verificación

```bash
# Verificar usuario en BD
psql -U postgres -d dobacksoft -c "SELECT id, email, name, role, googleId FROM \"User\" WHERE email='tu-email@gmail.com';"

# Logs del backend
tail -f backend/logs/combined.log | grep "Google OAuth"
```

## 🚀 Despliegue

### Desarrollo
```bash
# Backend
cd backend
npm install passport passport-google-oauth20
npx prisma migrate dev --name add-google-oauth
npm run dev

# Frontend (sin cambios)
cd frontend
npm run dev
```

### Producción
1. Configurar variables de entorno en servidor
2. Actualizar callback URL en Google Cloud Console
3. Aplicar migración de BD: `npx prisma migrate deploy`
4. Reiniciar servicios

## 📊 Métricas de Éxito

- ✅ **Tasa de adopción**: % usuarios que usan Google OAuth vs tradicional
- ✅ **Tiempo de registro**: reducido de ~2 min a ~10 seg
- ✅ **Errores de autenticación**: <1%
- ✅ **Compatibilidad**: 100% con login tradicional

## 🔮 Futuras Mejoras

### Fase 2: Autenticación Biométrica
- **Face ID / Touch ID** (Web Authentication API)
- **Huella dactilar** en dispositivos compatibles
- **Reconocimiento facial** con cámara web

### Fase 3: Otros Proveedores OAuth
- **Microsoft Azure AD** (para empresas)
- **GitHub** (para desarrolladores)
- **Apple Sign In** (para ecosistema Apple)

### Fase 4: Autenticación Multi-Factor (MFA)
- **SMS / Email** con código de verificación
- **Authenticator Apps** (Google Authenticator, Authy)
- **Llaves de seguridad físicas** (YubiKey, etc.)

## 📝 Notas Importantes

### Seguridad
- ✅ **NUNCA almacenar** `accessToken` de Google en BD
- ✅ **SIEMPRE usar HTTPS** en producción
- ✅ **Validar email** recibido de Google
- ✅ **Revocar tokens** al logout

### Privacidad (GDPR)
- ✅ Informar a usuarios qué datos se obtienen de Google
- ✅ Permitir desconectar cuenta de Google
- ✅ Eliminar `googleId` al borrar usuario

### UX
- ✅ Mostrar mensaje claro si Google OAuth falla
- ✅ Permitir vincular cuenta Google a usuario existente
- ✅ Mostrar avatar de Google en perfil

## 📚 Referencias

- [Passport.js Google OAuth 2.0](http://www.passportjs.org/packages/passport-google-oauth20/)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Web Authentication API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)

---

**Rama**: `feature/google-oauth-login`  
**Estado**: 📋 Planificación completa  
**Siguiente paso**: Aplicar migración de BD y configurar Google Cloud Console

