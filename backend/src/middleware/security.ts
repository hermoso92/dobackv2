import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Headers de seguridad
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

// Rate limiting para autenticación
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  message: { error: 'Demasiados intentos de login, intenta de nuevo en 15 minutos' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit excedido en autenticación', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
    });
    res.status(429).json({ error: 'Demasiados intentos de login, intenta de nuevo en 15 minutos' });
  },
});

// Rate limiting para API general
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests
  message: { error: 'Demasiadas peticiones, intenta de nuevo en 15 minutos' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit excedido en API', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
    });
    res.status(429).json({ error: 'Demasiadas peticiones, intenta de nuevo en 15 minutos' });
  },
});

// Rate limiting para subida de archivos
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // 10 subidas por hora
  message: { error: 'Demasiadas subidas de archivos, intenta de nuevo en 1 hora' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit excedido en subida de archivos', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
    });
    res.status(429).json({ error: 'Demasiadas subidas de archivos, intenta de nuevo en 1 hora' });
  },
});

// Middleware para validar tamaño de request
export const requestSizeLimiter = (maxSize: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.get('content-length') || '0');
    const maxBytes = parseSize(maxSize);
    
    if (contentLength > maxBytes) {
      logger.warn('Request demasiado grande', {
        contentLength,
        maxBytes,
        ip: req.ip,
        path: req.path,
      });
      return res.status(413).json({ error: 'Request demasiado grande' });
    }
    
    next();
  };
};

// Función auxiliar para parsear tamaños
function parseSize(size: string): number {
  const units: { [key: string]: number } = {
    'B': 1,
    'KB': 1024,
    'MB': 1024 * 1024,
    'GB': 1024 * 1024 * 1024,
  };
  
  const match = size.match(/^(\d+(?:\.\d+)?)\s*([A-Z]+)$/i);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  
  return value * (units[unit] || 1);
}

// Middleware para validar IPs
export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (!allowedIPs.includes(clientIP || '')) {
      logger.warn('IP no autorizada', {
        ip: clientIP,
        path: req.path,
        allowedIPs,
      });
      return res.status(403).json({ error: 'IP no autorizada' });
    }
    
    next();
  };
};

// Middleware para detectar ataques
export const attackDetector = (req: Request, res: Response, next: NextFunction) => {
  const userAgent = req.get('User-Agent') || '';
  const suspiciousPatterns = [
    /sqlmap/i,
    /nikto/i,
    /nmap/i,
    /masscan/i,
    /zap/i,
    /burp/i,
    /w3af/i,
    /havij/i,
    /sqlninja/i,
  ];
  
  if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
    logger.warn('Posible ataque detectado', {
      ip: req.ip,
      userAgent,
      path: req.path,
    });
    return res.status(403).json({ error: 'Acceso denegado' });
  }
  
  next();
};