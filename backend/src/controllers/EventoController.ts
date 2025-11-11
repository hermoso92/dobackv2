
import {
    EventConditionOperator,
    EventConditionType,
    EventStatus,
    EventType
} from '@prisma/client';
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

// Helpers
const mapEventType = (tipo: string | undefined): EventType => {
    if (tipo === 'TELEMETRIA') {
        return EventType.GPS;
    }
    return EventType.STABILITY;
};

const mapConditionType = (tipo: string | undefined): EventConditionType => {
    if (tipo === 'TELEMETRIA') {
        return EventConditionType.GPS;
    }
    return EventConditionType.STABILITY;
};

const mapOperator = (operador: string | undefined): EventConditionOperator => {
    switch (operador) {
        case '>':
            return EventConditionOperator.GREATER_THAN;
        case '<':
            return EventConditionOperator.LESS_THAN;
        case '>=':
            return EventConditionOperator.GREATER_EQUALS;
        case '<=':
            return EventConditionOperator.LESS_EQUALS;
        case '!=':
            return EventConditionOperator.NOT_EQUALS;
        case 'between':
            return EventConditionOperator.BETWEEN;
        case 'in':
        case 'in_range':
            return EventConditionOperator.IN_RANGE;
        default:
            return EventConditionOperator.EQUALS;
    }
};



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
            const eventType = mapEventType(tipo);
            const conditionType = mapConditionType(tipo);

            const data: any = {
                name: nombre,
                description: descripcion,
                type: eventType,
                status: EventStatus.ACTIVE,
                autoEvaluate,
                organizationId,
                createdById: req.user?.id || 'system'
            };

            if (Array.isArray(condiciones) && condiciones.length > 0) {
                data.EventCondition = {
                    create: condiciones.map((cond: any) => ({
                        type: conditionType,
                        variable: cond.variable,
                        operator: mapOperator(cond.operador),
                        value: cond.valor !== undefined ? Number(cond.valor) : 0,
                        value2: cond.valorMax !== undefined ? Number(cond.valorMax) : undefined,
                        unit: cond.unit || null
                    }))
                };
            }

            if (Array.isArray(variablesAMostrar) && variablesAMostrar.length > 0) {
                data.EventoVariableVisible = {
                    create: variablesAMostrar.map((variable: string, index: number) => ({
                        nombre: variable,
                        orden: index + 1
                    }))
                };
            }

            if (Array.isArray(vehiculos) && vehiculos.length > 0) {
                data.GestorDeEventoVehicle = {
                    create: vehiculos.map((vehicleId: string) => ({
                        vehicleId
                    }))
                };
            }

            const evento = await prisma.gestorDeEvento.create({
                data,
                include: {
                    EventCondition: true,
                    EventoVariableVisible: true,
                    GestorDeEventoVehicle: {
                        include: {
                            Vehicle: {
                                select: {
                                    id: true,
                                    name: true,
                                    licensePlate: true
                                }
                            }
                        }
                    }
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

            const { nombre, tipo, descripcion, autoEvaluate, condiciones = [], vehiculos, variablesAMostrar } = req.body;

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

            const updateData: any = {
                updatedAt: new Date()
            };

            if (nombre !== undefined) updateData.name = nombre;
            if (descripcion !== undefined) updateData.description = descripcion;
            if (autoEvaluate !== undefined) updateData.autoEvaluate = autoEvaluate;
            if (tipo !== undefined) updateData.type = mapEventType(tipo);

            await prisma.gestorDeEvento.update({
                where: { id },
                data: updateData
            });

            await prisma.$transaction(async (tx) => {
                if (Array.isArray(condiciones)) {
                    await tx.eventCondition.deleteMany({ where: { eventId: id } });
                    if (condiciones.length > 0) {
                        await tx.eventCondition.createMany({
                            data: condiciones.map((cond: any) => ({
                                eventId: id,
                                type: mapConditionType(tipo),
                                variable: cond.variable,
                                operator: mapOperator(cond.operador),
                                value: cond.valor !== undefined ? Number(cond.valor) : 0,
                                value2: cond.valorMax !== undefined ? Number(cond.valorMax) : undefined,
                                unit: cond.unit || null
                            }))
                        });
                    }
                }

                if (Array.isArray(variablesAMostrar)) {
                    await tx.eventoVariableVisible.deleteMany({ where: { eventoId: id } });
                    if (variablesAMostrar.length > 0) {
                        await tx.eventoVariableVisible.createMany({
                            data: variablesAMostrar.map((variable: string, index: number) => ({
                                eventoId: id,
                                nombre: variable,
                                orden: index + 1
                            }))
                        });
                    }
                }

                if (Array.isArray(vehiculos)) {
                    await tx.gestorDeEventoVehicle.deleteMany({ where: { gestorDeEventoId: id } });
                    if (vehiculos.length > 0) {
                        await tx.gestorDeEventoVehicle.createMany({
                            data: vehiculos.map((vehicleId: string) => ({
                                gestorDeEventoId: id,
                                vehicleId
                            }))
                        });
                    }
                }
            });

            const evento = await prisma.gestorDeEvento.findFirst({
                where: { id },
                include: {
                    EventCondition: true,
                    EventoVariableVisible: true,
                    GestorDeEventoVehicle: {
                        include: {
                            Vehicle: {
                                select: {
                                    id: true,
                                    name: true,
                                    licensePlate: true
                                }
                            }
                        }
                    }
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
                    EventCondition: true,
                    EventoVariableVisible: true,
                    GestorDeEventoVehicle: {
                        include: {
                            Vehicle: {
                                select: {
                                    id: true,
                                    name: true,
                                    licensePlate: true
                                }
                            }
                        }
                    },
                    EjecucionEvento: {
                        orderBy: { triggeredAt: 'desc' },
                        take: 10,
                        include: {
                            Vehicle: {
                                select: {
                                    id: true,
                                    name: true,
                                    licensePlate: true
                                }
                            },
                            Session: {
                                select: {
                                    id: true,
                                    startTime: true,
                                    endTime: true
                                }
                            }
                        }
                    }
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
                where.type = mapEventType(tipo);
            }
            if (activa !== undefined) {
                where.status = activa === 'true' ? EventStatus.ACTIVE : EventStatus.ARCHIVED;
            }

            logger.info('Listando eventos para organización', { organizationId, where });

            const eventos = await prisma.gestorDeEvento.findMany({
                where,
                include: {
                    EventCondition: true,
                    EventoVariableVisible: true,
                    GestorDeEventoVehicle: {
                        include: {
                            Vehicle: {
                                select: {
                                    id: true,
                                    name: true,
                                    licensePlate: true
                                }
                            }
                        }
                    },
                    _count: {
                        select: {
                            EjecucionEvento: true
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
