import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';

const router = Router();
const authController = new AuthController();
const prisma = new PrismaClient();

console.log('🔧 Módulo auth.ts cargado - Endpoint /register disponible');

// Endpoint de prueba simple
router.get('/test-simple', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Backend funcionando correctamente',
        timestamp: new Date().toISOString(),
        routes: {
            login: 'POST /api/auth/login',
            register: 'POST /api/auth/register',
            verify: 'GET /api/auth/verify',
            logout: 'POST /api/auth/logout'
        }
    });
});

// Rutas públicas
router.post('/login', authLimiter, authController.login);

// Endpoint de registro de usuarios
router.post('/register', async (req, res) => {
    console.log('🔧 Endpoint /register llamado con body:', req.body);
    try {
        const { username, email, password, firstName, lastName, role } = req.body;

        // Construir nombre completo
        const name = firstName && lastName ? `${firstName} ${lastName}` : (username || email.split('@')[0]);

        // Validaciones
        if (!email || !password || !name) {
            return res.status(400).json({
                success: false,
                message: 'Email, contraseña y nombre son obligatorios'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        // Verificar si el email ya existe
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'El email ya está registrado'
            });
        }

        // Buscar o crear organización por defecto
        let organization = await prisma.organization.findFirst();

        if (!organization) {
            organization = await prisma.organization.create({
                data: {
                    name: 'Bomberos Madrid'
                }
            });
        }

        // Hashear contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear usuario
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || 'USER',
                status: 'ACTIVE',
                organizationId: organization.id
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                createdAt: true
            }
        });

        res.status(201).json({
            success: true,
            message: 'Usuario creado exitosamente',
            user: newUser
        });
    } catch (error) {
        console.error('Error creando usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Endpoint de verificación de token
router.get('/verify', authenticate, (req, res) => {
    res.json({
        success: true,
        user: (req as any).user,
        message: 'Token válido'
    });
});

// Endpoint de logout
router.post('/logout', authenticate, (req, res) => {
    res.json({
        success: true,
        message: 'Logout exitoso'
    });
});

// Endpoint de prueba
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Endpoint de autenticación funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

// Rutas protegidas
router.get('/verify', authenticate, authController.verifyToken);

router.post('/refresh-token', authController.refreshToken);

router.get('/me', authenticate, authController.getCurrentUser);

router.post('/logout', authenticate, authController.logout);

// Endpoint temporal para crear superadmin
router.post('/create-superadmin', async (req, res) => {
    try {
        // Verificar si ya existe
        const existingSuperAdmin = await prisma.user.findUnique({
            where: { email: 'superadmin@dobacksoft.com' }
        });

        if (existingSuperAdmin) {
            return res.json({
                success: true,
                message: 'Usuario Super Admin ya existe',
                user: {
                    id: existingSuperAdmin.id,
                    name: existingSuperAdmin.name,
                    email: existingSuperAdmin.email,
                    role: existingSuperAdmin.role
                }
            });
        }

        // Crear usuario super admin
        const superAdminPassword = await bcrypt.hash('superadmin123', 10);

        const superAdmin = await prisma.user.create({
            data: {
                email: 'superadmin@dobacksoft.com',
                name: 'Super Administrador',
                password: superAdminPassword,
                role: 'ADMIN',
                organizationId: null,
                status: 'ACTIVE'
            }
        });

        res.json({
            success: true,
            message: 'Usuario Super Admin creado exitosamente',
            user: {
                id: superAdmin.id,
                name: superAdmin.name,
                email: superAdmin.email,
                role: superAdmin.role
            },
            credentials: {
                email: 'superadmin@dobacksoft.com',
                password: 'superadmin123'
            }
        });
    } catch (error: any) {
        console.error('Error creando Super Admin:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear usuario Super Admin',
            error: error.message
        });
    }
});

// Endpoint temporal para crear organización de prueba
router.post('/create-test-organization', async (req, res) => {
    try {
        console.log('🏢 Creando organización de prueba...');

        // 1. Crear la organización
        const organization = await prisma.organization.create({
            data: {
                name: 'Empresa de Pruebas S.L.',
                apiKey: 'api_key_pruebas_2024_' + Date.now()
            }
        });

        // 2. Crear usuarios
        const users = [
            {
                email: 'admin@pruebas.com',
                name: 'Administrador Pruebas',
                role: 'ADMIN' as const,
                password: 'admin123'
            },
            {
                email: 'usuario@pruebas.com',
                name: 'Usuario Normal',
                role: 'USER' as const,
                password: 'user123'
            },
            {
                email: 'operador@pruebas.com',
                name: 'Operador Pruebas',
                role: 'OPERATOR' as const,
                password: 'operator123'
            }
        ];

        const createdUsers = [];

        for (const userData of users) {
            const hashedPassword = await bcrypt.hash(userData.password, 10);

            const user = await prisma.user.create({
                data: {
                    email: userData.email,
                    name: userData.name,
                    password: hashedPassword,
                    role: userData.role,
                    organizationId: organization.id,
                    status: 'ACTIVE'
                }
            });

            createdUsers.push(user);
        }

        // 3. Crear vehículos específicos para esta organización
        const vehicles = [
            {
                name: 'Vehículo Prueba 01',
                model: 'Ford Transit',
                licensePlate: 'PR-001-TE',
                brand: 'Ford',
                identifier: 'PRUEBA_001',
                type: 'CAR' as const
            },
            {
                name: 'Vehículo Prueba 02',
                model: 'Volkswagen Crafter',
                licensePlate: 'PR-002-TE',
                brand: 'Volkswagen',
                identifier: 'PRUEBA_002',
                type: 'TRUCK' as const
            }
        ];

        const createdVehicles = [];

        for (const vehicleData of vehicles) {
            const vehicle = await prisma.vehicle.create({
                data: {
                    name: vehicleData.name,
                    model: vehicleData.model,
                    licensePlate: vehicleData.licensePlate,
                    brand: vehicleData.brand,
                    identifier: vehicleData.identifier,
                    type: vehicleData.type,
                    organizationId: organization.id,
                    userId: createdUsers[1].id, // Asignar al usuario normal
                    status: 'ACTIVE'
                }
            });

            createdVehicles.push(vehicle);
        }

        // 4. Crear algunas sesiones de prueba
        const sessions = [
            {
                vehicleId: createdVehicles[0].id,
                userId: createdUsers[1].id,
                startTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // Ayer
                endTime: new Date(Date.now() - 23 * 60 * 60 * 1000),
                sessionNumber: 1,
                sequence: 1
            },
            {
                vehicleId: createdVehicles[1].id,
                userId: createdUsers[1].id,
                startTime: new Date(Date.now() - 12 * 60 * 60 * 1000), // Hace 12 horas
                endTime: new Date(Date.now() - 11 * 60 * 60 * 1000),
                sessionNumber: 1,
                sequence: 1
            }
        ];

        for (const sessionData of sessions) {
            await prisma.session.create({
                data: sessionData
            });
        }

        res.json({
            success: true,
            message: 'Organización de prueba creada exitosamente',
            organization: {
                id: organization.id,
                name: organization.name,
                apiKey: organization.apiKey
            },
            users: users.map((u) => ({
                email: u.email,
                password: u.password,
                role: u.role,
                name: u.name
            })),
            vehicles: createdVehicles.map((v) => ({
                name: v.name,
                licensePlate: v.licensePlate,
                model: v.model
            })),
            testInstructions: {
                loginAs: 'usuario@pruebas.com / user123',
                shouldOnlySee: 'Vehículos de "Empresa de Pruebas S.L."',
                compareWith: 'Otros usuarios de otras organizaciones'
            }
        });
    } catch (error: any) {
        console.error('Error creando organización de prueba:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear organización de prueba',
            error: error.message
        });
    }
});

export default router;
