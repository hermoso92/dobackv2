# DobackSoft Frontend

Este es el frontend de la aplicación DobackSoft, desarrollado con React, TypeScript y Material-UI.

## Requisitos

- Node.js 18 o superior
- npm 9 o superior

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/tu-usuario/DobackSoft.git
cd DobackSoft/frontend
```

2. Instalar dependencias:
```bash
npm install
```

3. Crear archivo .env:
```bash
cp .env.example .env
```

4. Configurar variables de entorno en el archivo .env:
```
VITE_API_URL=http://localhost:9998
VITE_APP_NAME=DobackSoft
VITE_APP_VERSION=2.0.0
```

## Desarrollo

Para iniciar el servidor de desarrollo:

```bash
npm run dev
```

La aplicación estará disponible en http://localhost:3000

## Construcción

Para construir la aplicación para producción:

```bash
npm run build
```

Los archivos generados se encontrarán en el directorio `dist`.

## Linting

Para ejecutar el linter:

```bash
npm run lint
```

## Estructura del Proyecto

```
frontend/
├── src/
│   ├── components/     # Componentes reutilizables
│   ├── contexts/       # Contextos de React
│   ├── pages/         # Páginas de la aplicación
│   ├── config/        # Configuración
│   ├── theme.ts       # Tema de Material-UI
│   ├── App.tsx        # Componente principal
│   └── index.tsx      # Punto de entrada
├── public/            # Archivos estáticos
├── .env              # Variables de entorno
├── package.json      # Dependencias y scripts
└── vite.config.ts    # Configuración de Vite
```

## Tecnologías Utilizadas

- React 18
- TypeScript
- Material-UI
- Vite
- React Router
- Axios

## Contribución

1. Fork el repositorio
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](../LICENSE) para más detalles. 