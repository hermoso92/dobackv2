# 🧪 Guía de Testing - DobackSoft Backend

## 📋 Índice
- [Configuración](#configuración)
- [Ejecutar Tests](#ejecutar-tests)
- [Estructura de Tests](#estructura-de-tests)
- [Escribir Tests](#escribir-tests)
- [Cobertura de Código](#cobertura-de-código)
- [Mejores Prácticas](#mejores-prácticas)
- [Troubleshooting](#troubleshooting)

## 🔧 Configuración

### Prerrequisitos
- Node.js 18+
- PostgreSQL (para tests de integración)
- Redis (opcional, para tests de cache)

### Instalación
```bash
# Instalar dependencias
npm install

# Configurar base de datos de pruebas
npm run test:setup
```

### Variables de Entorno
Crear archivo `env.test`:
```env
NODE_ENV=test
DATABASE_URL="postgresql://test:test@localhost:5432/dobacksoft_test"
JWT_SECRET="test-jwt-secret-key"
REDIS_URL="redis://localhost:6379/1"
```

## 🚀 Ejecutar Tests

### Comandos Principales
```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch
npm run test:watch

# Ejecutar con cobertura
npm run test:coverage

# Ejecutar tests con UI
npm run test:ui

# Ejecutar solo tests unitarios
npm test -- --exclude="**/integration/**"

# Ejecutar solo tests de integración
npm test -- --include="**/integration/**"
```

### Filtros por Archivo
```bash
# Ejecutar tests de un servicio específico
npm test -- AuthService

# Ejecutar tests de un controlador
npm test -- AuthController

# Ejecutar tests de middleware
npm test -- auth.test.ts
```

## 📁 Estructura de Tests

```
backend/
├── src/
│   ├── controllers/
│   │   └── __tests__/           # Tests de controladores
│   ├── services/
│   │   └── __tests__/           # Tests de servicios
│   ├── middleware/
│   │   └── __tests__/           # Tests de middleware
│   └── __tests__/
│       └── integration/         # Tests de integración
├── vitest.config.ts            # Configuración de Vitest
├── vitest.setup.ts             # Setup global de tests
└── TESTING_GUIDE.md            # Esta guía
```

### Tipos de Tests

#### 1. **Tests Unitarios**
- Ubicación: `src/**/__tests__/`
- Propósito: Probar funciones/métodos individuales
- Mocks: Todos los servicios externos

#### 2. **Tests de Integración**
- Ubicación: `src/__tests__/integration/`
- Propósito: Probar flujos completos
- Base de datos: Real (test DB)

#### 3. **Tests E2E**
- Ubicación: `e2e/`
- Propósito: Probar la aplicación completa
- Servicios: Todos reales

## ✍️ Escribir Tests

### Estructura de un Test
```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('MiServicio', () => {
    let servicio: MiServicio;
    let mockDependency: any;

    beforeEach(() => {
        // Setup antes de cada test
        mockDependency = {
            metodo: vi.fn()
        };
        servicio = new MiServicio(mockDependency);
        vi.clearAllMocks();
    });

    describe('metodoPrincipal', () => {
        it('debería funcionar correctamente con datos válidos', async () => {
            // Arrange
            const datosEntrada = { id: 1, nombre: 'Test' };
            mockDependency.metodo.mockResolvedValue({ success: true });

            // Act
            const resultado = await servicio.metodoPrincipal(datosEntrada);

            // Assert
            expect(resultado).toEqual({ success: true });
            expect(mockDependency.metodo).toHaveBeenCalledWith(datosEntrada);
        });

        it('debería manejar errores correctamente', async () => {
            // Arrange
            const datosEntrada = { id: 1, nombre: 'Test' };
            mockDependency.metodo.mockRejectedValue(new Error('Error de prueba'));

            // Act & Assert
            await expect(servicio.metodoPrincipal(datosEntrada))
                .rejects.toThrow('Error de prueba');
        });
    });
});
```

### Mocks Comunes

#### Mock de Prisma
```typescript
import { createMockPrisma } from '../../test/utils';

const mockPrisma = createMockPrisma();
vi.mock('@prisma/client', () => ({
    PrismaClient: vi.fn(() => mockPrisma)
}));
```

#### Mock de Logger
```typescript
vi.mock('../../utils/logger', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn()
    }
}));
```

#### Mock de Request/Response
```typescript
import { mockRequest, mockResponse } from '../../test/utils';

const req = mockRequest({ body: { data: 'test' } });
const res = mockResponse();
const next = vi.fn();
```

### Tests de Middleware
```typescript
describe('auth middleware', () => {
    it('debería autenticar token válido', async () => {
        // Arrange
        req.headers = { authorization: 'Bearer valid-token' };
        mockJwtVerify.mockReturnValue({ userId: '123' });
        mockPrisma.user.findUnique.mockResolvedValue(mockUser);

        // Act
        await authenticateToken(req, res, next);

        // Assert
        expect(req.user).toBeDefined();
        expect(next).toHaveBeenCalled();
    });
});
```

### Tests de Controladores
```typescript
describe('AuthController', () => {
    it('debería hacer login exitoso', async () => {
        // Arrange
        req.body = { email: 'test@example.com', password: 'password' };
        mockAuthService.login.mockResolvedValue({ token: 'jwt-token', user: mockUser });

        // Act
        await authController.login(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            token: 'jwt-token',
            user: mockUser
        });
    });
});
```

### Tests de Integración
```typescript
describe('Auth Integration Tests', () => {
    beforeAll(async () => {
        // Setup base de datos
        await setupTestDatabase();
    });

    afterAll(async () => {
        // Cleanup
        await cleanupTestDatabase();
    });

    it('debería registrar y autenticar usuario', async () => {
        // Arrange
        const userData = {
            email: 'test@example.com',
            name: 'Test User',
            password: 'password123'
        };

        // Act - Registro
        const registerResponse = await request(app)
            .post('/api/auth/register')
            .send(userData);

        // Act - Login
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: userData.email,
                password: userData.password
            });

        // Assert
        expect(registerResponse.status).toBe(201);
        expect(loginResponse.status).toBe(200);
        expect(loginResponse.body.token).toBeDefined();
    });
});
```

## 📊 Cobertura de Código

### Configuración
Los umbrales están configurados en `vitest.config.ts`:
```typescript
coverage: {
    thresholds: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70
        }
    }
}
```

### Verificar Cobertura
```bash
# Generar reporte de cobertura
npm run test:coverage

# Ver reporte HTML
open coverage/index.html
```

### Interpretar Resultados
- **Lines**: Porcentaje de líneas ejecutadas
- **Functions**: Porcentaje de funciones ejecutadas
- **Branches**: Porcentaje de ramas condicionales ejecutadas
- **Statements**: Porcentaje de declaraciones ejecutadas

## ✅ Mejores Prácticas

### 1. **Nomenclatura**
```typescript
// ✅ Bueno
describe('AuthService', () => {
    describe('login', () => {
        it('debería autenticar usuario con credenciales válidas', () => {});
        it('debería rechazar usuario con credenciales inválidas', () => {});
    });
});

// ❌ Malo
describe('test', () => {
    it('should work', () => {});
});
```

### 2. **Estructura AAA**
```typescript
it('debería crear usuario exitosamente', async () => {
    // Arrange - Preparar datos
    const userData = { email: 'test@example.com', name: 'Test' };
    mockPrisma.user.create.mockResolvedValue(mockUser);

    // Act - Ejecutar acción
    const result = await userService.createUser(userData);

    // Assert - Verificar resultado
    expect(result).toEqual(mockUser);
    expect(mockPrisma.user.create).toHaveBeenCalledWith({ data: userData });
});
```

### 3. **Mocks Específicos**
```typescript
// ✅ Bueno - Mock específico
mockPrisma.user.findUnique.mockResolvedValue(mockUser);

// ❌ Malo - Mock genérico
vi.mock('@prisma/client');
```

### 4. **Cleanup**
```typescript
beforeEach(() => {
    vi.clearAllMocks(); // Limpiar mocks
});

afterEach(async () => {
    // Limpiar base de datos si es necesario
    await cleanupDatabase();
});
```

### 5. **Tests Independientes**
```typescript
// ✅ Cada test es independiente
it('test 1', () => {
    // No depende de otros tests
});

it('test 2', () => {
    // No depende de otros tests
});
```

### 6. **Manejo de Errores**
```typescript
it('debería manejar errores de base de datos', async () => {
    // Arrange
    const error = new Error('Database connection failed');
    mockPrisma.user.create.mockRejectedValue(error);

    // Act & Assert
    await expect(userService.createUser(userData))
        .rejects.toThrow('Database connection failed');
});
```

## 🔧 Troubleshooting

### Problemas Comunes

#### 1. **Error de Conexión a BD**
```bash
Error: Authentication failed against database server
```
**Solución:**
```bash
# Verificar que PostgreSQL esté ejecutándose
pg_isready -h localhost -p 5432

# Crear usuario y BD de prueba
npm run test:setup
```

#### 2. **Tests Lentos**
```bash
# Ejecutar tests en paralelo
npm test -- --threads

# Excluir tests lentos temporalmente
npm test -- --exclude="**/integration/**"
```

#### 3. **Mocks No Funcionan**
```typescript
// Verificar que el mock esté antes de la importación
vi.mock('module-name');

import { moduleFunction } from 'module-name';
```

#### 4. **Variables de Entorno**
```bash
# Verificar variables de entorno
echo $DATABASE_URL

# Usar archivo .env.test
npm test -- --env-file=env.test
```

#### 5. **Tests que Fallan Intermitentemente**
```typescript
// Usar waitFor para operaciones asíncronas
import { waitFor } from '@testing-library/react';

await waitFor(() => {
    expect(mockFunction).toHaveBeenCalled();
});
```

### Debug de Tests
```bash
# Ejecutar un test específico con debug
npm test -- --reporter=verbose AuthService.test.ts

# Ejecutar con logs detallados
DEBUG=vitest npm test

# Usar breakpoints en VS Code
// Colocar breakpoint en el test y ejecutar con debugger
```

### Limpieza de Tests
```bash
# Limpiar archivos de cobertura
rm -rf coverage/

# Limpiar cache de tests
npm test -- --clearCache

# Resetear base de datos de pruebas
npm run test:db:reset
```

## 📚 Recursos Adicionales

- [Documentación de Vitest](https://vitest.dev/)
- [Documentación de Supertest](https://github.com/ladjs/supertest)
- [Guía de Testing de Express](https://expressjs.com/en/guide/testing.html)
- [Jest vs Vitest Migration Guide](https://vitest.dev/guide/migration.html)

## 🤝 Contribuir

1. Escribir tests para nuevas funcionalidades
2. Mantener cobertura mínima del 70%
3. Seguir las mejores prácticas documentadas
4. Actualizar esta guía si es necesario

---

**Nota**: Esta guía se actualiza constantemente. Si encuentras algún problema o tienes sugerencias, por favor crea un issue o PR.
