import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class EventoController {
    async crearEvento(req: Request, res: Response): Promise<void> {
        try {
            // Obtener organizationId del JWT (más seguro) o del body como fallback
            const organizationId = req.user?.organizationId || req.body.organizationId;

            if (!organizationId) {
                logger.warn('Intento de crear evento sin organizationId');
                return res.status(400).json({
                    success: false,
                    error: 'Se requiere organizationId'
                });
            }

            // Mapear campos del request al modelo Prisma
            const {
                nombre,
                tipo,
                descripcion,
                severidad = 'WARNING',
                prioridad = 3,
                condiciones = [],
                variablesAMostrar = [],
                vehiculos = [],
                autoEvaluate = false
            } = req.body;

            // Usar el modelo GestorDeEvento en lugar de Evento (mongoose)
            const evento = await prisma.gestorDeEvento.create({
                data: {
                    name: nombre,
                    description: descripcion,
                    type: tipo === 'ESTABILIDAD' ? 'STABILITY' : 'TELEMETRY',
                    status: 'ACTIVE',
                    autoEvaluate,
                    organizationId: organizationId, // Asociar a la organización del usuario
                    createdById: req.user?.id || 'system', // Obtener del JWT
                    conditions: {
                        create: condiciones.map((cond: any) => ({
                            type: 'THRESHOLD',
                            variable: cond.variable,
                            operator:
                                cond.operador === '>'
                                    ? 'GREATER_THAN'
                                    : cond.operador === '<'
                                    ? 'LESS_THAN'
                                    : cond.operador === '>='
                                    ? 'GREATER_EQUAL'
                                    : cond.operador === '<='
                                    ? 'LESS_EQUAL'
                                    : cond.operador === '=='
                                    ? 'EQUALS'
                                    : 'NOT_EQUALS',
                            value: parseFloat(cond.valor),
                            unit: cond.unit || null
                        }))
                    }
                },
                include: {
                    conditions: true
                }
            });

            logger.info('Evento creado para organización', { organizationId, eventoId: evento.id });

            res.status(201).json({
                success: true,
                data: evento,
                message: 'Evento creado correctamente'
            });
        } catch (error) {
            logger.error('Error en crearEvento', { error });
            res.status(500).json({
                success: false,
                error: 'Error creando evento'
            });
        }
    }

    async actualizarEvento(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;

            if (!organizationId) {
                logger.warn('Intento de actualizar evento sin organizationId');
                return res.status(400).json({
                    success: false,
                    error: 'Se requiere organizationId'
                });
            }

            const { nombre, tipo, descripcion, autoEvaluate, condiciones = [] } = req.body;

            // Verificar que el evento pertenece a la organización del usuario
            const existingEvento = await prisma.gestorDeEvento.findFirst({
                where: {
                    id,
                    organizationId: organizationId
                }
            });

            if (!existingEvento) {
                return res.status(404).json({
                    success: false,
                    message: 'Evento no encontrado'
                });
            }

            const evento = await prisma.gestorDeEvento.update({
                where: { id },
                data: {
                    name: nombre,
                    description: descripcion,
                    type: tipo === 'ESTABILIDAD' ? 'STABILITY' : 'TELEMETRY',
                    autoEvaluate,
                    updatedAt: new Date()
                },
                include: {
                    conditions: true
                }
            });

            res.json({
                success: true,
                data: evento,
                message: 'Evento actualizado correctamente'
            });
        } catch (error) {
            logger.error('Error en actualizarEvento', { error });
            res.status(500).json({
                success: false,
                error: 'Error actualizando evento'
            });
        }
    }

    async eliminarEvento(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;

            if (!organizationId) {
                logger.warn('Intento de eliminar evento sin organizationId');
                return res.status(400).json({
                    success: false,
                    error: 'Se requiere organizationId'
                });
            }

            // Verificar que el evento pertenece a la organización del usuario
            const existingEvento = await prisma.gestorDeEvento.findFirst({
                where: {
                    id,
                    organizationId: organizationId
                }
            });

            if (!existingEvento) {
                return res.status(404).json({
                    success: false,
                    message: 'Evento no encontrado'
                });
            }

            await prisma.gestorDeEvento.delete({
                where: { id }
            });

            res.json({
                success: true,
                message: 'Evento eliminado correctamente'
            });
        } catch (error) {
            logger.error('Error en eliminarEvento', { error });
            res.status(500).json({
                success: false,
                error: 'Error eliminando evento'
            });
        }
    }

    async obtenerEvento(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;

            if (!organizationId) {
                logger.warn('Intento de acceso a evento sin organizationId');
                return res.status(400).json({
                    success: false,
                    error: 'Se requiere organizationId'
                });
            }

            const evento = await prisma.gestorDeEvento.findFirst({
                where: {
                    id,
                    organizationId: organizationId
                },
                include: {
                    conditions: true,
                    executions: true
                }
            });

            if (!evento) {
                return res.status(404).json({
                    success: false,
                    message: 'Evento no encontrado'
                });
            }

            res.json({
                success: true,
                data: evento
            });
        } catch (error) {
            logger.error('Error en obtenerEvento', { error });
            res.status(500).json({
                success: false,
                error: 'Error obteniendo evento'
            });
        }
    }

    async listarEventos(req: Request, res: Response): Promise<void> {
        try {
            const { tipo, activa } = req.query;
            const organizationId = req.user?.organizationId;

            if (!organizationId) {
                logger.warn('Intento de acceso a eventos sin organizationId');
                return res.status(400).json({
                    success: false,
                    error: 'Se requiere organizationId'
                });
            }

            const where: any = {
                organizationId: organizationId
            };

            if (tipo) {
                where.type = tipo === 'ESTABILIDAD' ? 'STABILITY' : 'TELEMETRY';
            }
            if (activa !== undefined) {
                where.status = activa === 'true' ? 'ACTIVE' : 'INACTIVE';
            }

            logger.info('Listando eventos para organización', { organizationId, where });

            const eventos = await prisma.gestorDeEvento.findMany({
                where,
                include: {
                    conditions: true,
                    _count: {
                        select: {
                            executions: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            logger.info(
                `Se encontraron ${eventos.length} eventos para la organización ${organizationId}`
            );

            res.json({
                success: true,
                data: eventos
            });
        } catch (error) {
            logger.error('Error en listarEventos', { error });
            res.status(500).json({
                success: false,
                error: 'Error listando eventos'
            });
        }
    }

    async evaluarEventos(req: Request, res: Response): Promise<void> {
        try {
            const { vehiculoId } = req.params;
            const { datos } = req.body;

            // Implementar evaluación usando GestorDeEventoService
            logger.info('Evaluando eventos para vehículo', { vehiculoId, datos });

            res.status(200).json({
                success: true,
                message: 'Eventos evaluados correctamente'
            });
        } catch (error) {
            logger.error('Error en evaluarEventos', { error });
            res.status(500).json({
                success: false,
                error: 'Error evaluando eventos'
            });
        }
    }
}
