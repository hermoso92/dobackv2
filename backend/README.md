# Backend de DobackSoft

Este es el backend del sistema de monitoreo de estabilidad de vehículos DobackSoft.

## 🚀 Inicio Rápido

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
```

3. Inicializar la base de datos:
```bash
npm run db:init
```

4. Poblar la base de datos con datos de prueba:
```bash
npm run db:seed
```

5. Iniciar el servidor en modo desarrollo:
```bash
npm run dev
```

## 📦 Scripts Disponibles

- `npm run dev`: Inicia el servidor en modo desarrollo con recarga automática
- `npm run build`: Compila el proyecto TypeScript
- `npm run start`: Inicia el servidor en modo producción
- `npm run test`: Ejecuta las pruebas
- `npm run test:watch`: Ejecuta las pruebas en modo watch
- `npm run test:coverage`: Genera reporte de cobertura de pruebas
- `npm run prisma:generate`: Regenera el cliente Prisma
- `npm run prisma:migrate`: Ejecuta las migraciones de Prisma
- `npm run prisma:studio`: Abre Prisma Studio para gestionar la base de datos
- `npm run db:init`: Inicializa la base de datos
- `npm run db:reset`: Resetea la base de datos
- `npm run db:migrate`: Ejecuta las migraciones personalizadas
- `npm run db:seed`: Pobla la base de datos con datos de prueba

## 🗄️ Gestión de la Base de Datos

### Inicialización

La base de datos se inicializa con el comando `npm run db:init`. Este comando:
1. Verifica la conexión a la base de datos
2. Crea la tabla de migraciones si no existe
3. Crea los índices necesarios

### Migraciones

Las migraciones se gestionan a través de Prisma y scripts personalizados:

- `npm run prisma:migrate`: Ejecuta las migraciones de Prisma
- `npm run db:migrate`: Ejecuta las migraciones personalizadas

### Datos de Prueba

Para poblar la base de datos con datos de prueba, ejecuta:
```bash
npm run db:seed
```

Esto creará:
- Una organización de prueba
- Usuarios de prueba (admin y operador)
- Vehículos de prueba
- Sesiones de prueba
- Eventos de prueba
- Reglas de prueba

### Credenciales de Prueba

- **Administrador**:
  - Email: admin@example.com
  - Contraseña: admin123

- **Operador**:
  - Email: operador@example.com
  - Contraseña: operator123

## 🔧 Configuración

### Variables de Entorno

Crea un archivo `.env` con las siguientes variables:

```env
# Base de datos
DATABASE_URL="file:./dev.db"

# JWT
JWT_SECRET="tu-secreto-jwt"
JWT_EXPIRES_IN="24h"

# Servidor
PORT=3000
NODE_ENV=development
```

## 📚 Estructura del Proyecto

```
backend/
├── src/
│   ├── config/         # Configuraciones
│   ├── controllers/    # Controladores
│   ├── database/       # Gestión de base de datos
│   ├── middleware/     # Middleware
│   ├── models/         # Modelos
│   ├── routes/         # Rutas
│   ├── scripts/        # Scripts
│   ├── services/       # Servicios
│   ├── types/          # Tipos TypeScript
│   ├── utils/          # Utilidades
│   ├── app.ts          # Aplicación Express
│   └── index.ts        # Punto de entrada
├── prisma/
│   └── schema.prisma   # Esquema de Prisma
├── tests/              # Pruebas
└── package.json
```

## 🧪 Pruebas

Las pruebas se ejecutan con Jest:

```bash
# Ejecutar todas las pruebas
npm run test

# Ejecutar pruebas en modo watch
npm run test:watch

# Generar reporte de cobertura
npm run test:coverage
```

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. 