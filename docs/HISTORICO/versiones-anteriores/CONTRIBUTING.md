# Guía de Contribución

¡Gracias por tu interés en contribuir a DobackSoft! Esta guía te ayudará a configurar el proyecto para desarrollo y a entender nuestro proceso de contribución.

## Configuración del Entorno de Desarrollo

1. **Requisitos Previos**
   - Node.js v14 o superior
   - MySQL v8.0 o superior
   - Git
   - Docker y Docker Compose (opcional)

2. **Clonar el Repositorio**
   ```bash
   git clone https://github.com/tu-usuario/DobackSoft-backend.git
   cd DobackSoft-backend
   ```

3. **Instalar Dependencias**
   ```bash
   npm install
   ```

4. **Configurar Variables de Entorno**
   ```bash
   cp .env.example .env
   # Editar .env con tus configuraciones
   ```

5. **Configurar Base de Datos**
   ```bash
   # Usando Docker
   docker-compose up -d db

   # O manualmente
   mysql -u root -p < src/config/database.sql
   ```

6. **Iniciar en Modo Desarrollo**
   ```bash
   npm run dev
   ```

## Proceso de Contribución

1. **Crear una Rama**
   - Crea una rama para tu feature o fix
   ```bash
   git checkout -b feature/nombre-descriptivo
   ```

2. **Convenciones de Código**
   - Usa TypeScript
   - Sigue el estilo de código existente
   - Usa nombres descriptivos en inglés
   - Documenta el código nuevo
   - Añade tests para nuevas funcionalidades

3. **Convenciones de Commits**
   - Usa commits semánticos:
     - `feat`: Nueva funcionalidad
     - `fix`: Corrección de bug
     - `docs`: Cambios en documentación
     - `style`: Cambios de formato
     - `refactor`: Refactorización de código
     - `test`: Añadir o modificar tests
     - `chore`: Cambios en build o herramientas

4. **Tests**
   - Ejecuta los tests antes de commit
   ```bash
   npm test
   ```
   - Asegura una cobertura adecuada
   ```bash
   npm run test:coverage
   ```

5. **Linting y Formateo**
   - Verifica el linting
   ```bash
   npm run lint
   ```
   - Formatea el código
   ```bash
   npm run format
   ```

6. **Pull Request**
   - Actualiza el CHANGELOG.md
   - Describe los cambios en el PR
   - Referencia issues relacionados
   - Espera la revisión de código
   - Responde a los comentarios

## Estructura del Proyecto

```
.
├── src/
│   ├── __tests__/        # Tests
│   ├── config/           # Configuración
│   ├── controllers/      # Controladores
│   ├── models/          # Modelos
│   ├── repositories/    # Repositorios
│   ├── routes/          # Rutas
│   ├── services/        # Servicios
│   ├── types/           # Tipos TypeScript
│   ├── utils/           # Utilidades
│   └── app.ts           # Punto de entrada
```

## Guías de Desarrollo

### Tests
- Escribe tests unitarios para servicios y utilidades
- Escribe tests de integración para APIs
- Mantén la cobertura sobre 80%
- Usa mocks apropiadamente

### Seguridad
- Valida todas las entradas
- Usa tipos estrictos
- Maneja errores apropiadamente
- Sigue las mejores prácticas de OWASP

### Performance
- Optimiza consultas a base de datos
- Usa caching cuando sea apropiado
- Minimiza el uso de memoria
- Monitorea el rendimiento

### Documentación
- Documenta APIs con JSDoc
- Mantén el README actualizado
- Documenta decisiones de arquitectura
- Añade comentarios cuando sea necesario

## Recursos Útiles

- [Documentación de TypeScript](https://www.typescriptlang.org/docs/)
- [Guía de Express.js](https://expressjs.com/en/guide/routing.html)
- [Documentación de Jest](https://jestjs.io/docs/getting-started)
- [Conventional Commits](https://www.conventionalcommits.org/)

## ¿Preguntas?

Si tienes preguntas o encuentras problemas, por favor:
1. Revisa los issues existentes
2. Crea un nuevo issue con detalles
3. Contacta al equipo de mantenimiento

¡Gracias por contribuir! 