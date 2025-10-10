import { NextFunction, Request, Response, Router } from 'express';
import { logger } from '../utils/logger';
import { AppError } from './error';

interface RouteConfig {
    path: string;
    method: string;
    handler: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    middleware?: ((req: Request, res: Response, next: NextFunction) => void)[];
    description?: string;
    version?: string;
    deprecated?: boolean;
}

interface RouterConfig {
    prefix?: string;
    middleware?: ((req: Request, res: Response, next: NextFunction) => void)[];
    routes: RouteConfig[];
}

// Crear router con configuración
export const createRouter = (config: RouterConfig): Router => {
    const router = Router();
    const prefix = config.prefix || '';

    // Aplicar middleware global
    if (config.middleware) {
        router.use(...config.middleware);
    }

    // Registrar rutas
    config.routes.forEach((route) => {
        const path = prefix + route.path;
        const middleware = route.middleware || [];
        const method = route.method.toLowerCase();

        if (!(method in router)) {
            throw new Error(`Método HTTP no soportado: ${route.method}`);
        }

        // Envolver handler para manejo de errores
        const wrappedHandler = async (req: Request, res: Response, next: NextFunction) => {
            try {
                await route.handler(req, res, next);
            } catch (error) {
                next(error);
            }
        };

        // Registrar ruta
        (router as any)[method](path, ...middleware, wrappedHandler);

        logger.info('Ruta registrada', {
            path,
            method: route.method,
            description: route.description,
            version: route.version,
            deprecated: route.deprecated
        });
    });

    return router;
};

// Middleware para documentación de rutas
export const routeDocsMiddleware = (router: Router) => {
    const routes = (router as any).stack
        .filter((layer: any) => layer.route)
        .map((layer: any) => {
            const route = layer.route;
            return {
                path: route.path,
                methods: Object.keys(route.methods),
                middleware: route.stack
                    .filter((s: any) => s.name !== '<anonymous>')
                    .map((s: any) => s.name),
                deprecated: route.deprecated,
                version: route.version,
                description: route.description
            };
        });

    return (req: Request, res: Response) => {
        res.json({
            routes,
            timestamp: new Date(),
            total: routes.length
        });
    };
};

// Middleware para rutas deprecadas
export const deprecatedRouteMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const route = (req as any).route;
    if (route && route.deprecated) {
        logger.warn('Ruta deprecada accedida', {
            path: req.path,
            method: req.method,
            version: route.version
        });

        res.set('Warning', `299 - "Ruta deprecada, usar versión ${route.version}"`);
    }
    next();
};

// Middleware para versiones de API
export const apiVersionMiddleware = (supportedVersions: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const version = req.get('api-version');

        if (!version) {
            return next(new AppError(400, 'Versión de API requerida'));
        }

        if (!supportedVersions.includes(version)) {
            return next(new AppError(400, 'Versión de API no soportada'));
        }

        (req as any).apiVersion = version;
        next();
    };
};

// Middleware para rutas no encontradas
export const notFoundMiddleware = (req: Request, res: Response, next: NextFunction) => {
    next(new AppError(404, `Ruta no encontrada: ${req.method} ${req.path}`));
};

// Middleware para métodos no permitidos
export const methodNotAllowedMiddleware = (req: Request, res: Response, next: NextFunction) => {
    next(new AppError(405, `Método no permitido: ${req.method}`));
};
