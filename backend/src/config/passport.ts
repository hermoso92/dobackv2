import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import passport from 'passport';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

export const configurePassport = () => {
    // Log INMEDIATO para verificar que la función se ejecuta
    console.log('═══════════════════════════════════════════════════');
    console.log('🔧 INICIANDO configurePassport()');
    console.log('═══════════════════════════════════════════════════');
    
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:9998/api/auth/google/callback';

    console.log('GOOGLE_CLIENT_ID:', GOOGLE_CLIENT_ID ? '✅ Definido' : '❌ Undefined');
    console.log('GOOGLE_CLIENT_SECRET:', GOOGLE_CLIENT_SECRET ? '✅ Definido' : '❌ Undefined');
    
    logger.info('🔧 Configurando Passport con Google OAuth 2.0...');
    logger.debug('Variables de entorno:', {
        hasClientId: !!GOOGLE_CLIENT_ID,
        hasClientSecret: !!GOOGLE_CLIENT_SECRET,
        clientIdPreview: GOOGLE_CLIENT_ID ? GOOGLE_CLIENT_ID.substring(0, 20) + '...' : 'undefined',
        callbackUrl: GOOGLE_CALLBACK_URL,
    });

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        logger.warn('⚠️ Google OAuth no configurado. GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET no encontrados');
        logger.warn('⚠️ Las rutas /api/auth/google NO estarán disponibles');
        return;
    }

    passport.use(
        new GoogleStrategy(
            {
                clientID: GOOGLE_CLIENT_ID,
                clientSecret: GOOGLE_CLIENT_SECRET,
                callbackURL: GOOGLE_CALLBACK_URL,
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    logger.info('🔐 Google OAuth callback recibido', {
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
                        logger.info('👤 Usuario no existe, creando automáticamente...', { email });

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
                                googleId: profile.id,
                            },
                            include: { Organization: true },
                        });

                        logger.info('✅ Usuario creado automáticamente', {
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

                        logger.info('✅ Usuario existente autenticado', {
                            userId: user.id,
                            email: user.email,
                        });
                    }

                    return done(null, user);
                } catch (error) {
                    logger.error('❌ Error en Google OAuth callback', { error });
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

    logger.info('✅ Passport configurado con Google OAuth 2.0');
};

