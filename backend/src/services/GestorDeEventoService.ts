
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';
// Puedes importar servicios de notificación y comandos si existen



export class GestorDeEventoService {
    async crearCondicion(data: any) {
        return prisma.gestorDeEvento.create({ data });
    }

    async actualizarCondicion(id: string, data: any) {
        return prisma.gestorDeEvento.update({ where: { id }, data });
    }

    async eliminarCondicion(id: string) {
        return prisma.gestorDeEvento.delete({ where: { id } });
    }

    async obtenerCondicion(id: string) {
        return prisma.gestorDeEvento.findUnique({ where: { id } });
    }

    async listarCondiciones(filtros: any = {}) {
        return prisma.gestorDeEvento.findMany({ where: filtros });
    }

    async evaluarCondiciones(datos: any, vehiculoId: string, sesionId?: string) {
        const condiciones = await prisma.gestorDeEvento.findMany({
            where: {
                status: 'ACTIVE',
                OR: [
                    { vehicles: { some: { vehicleId: vehiculoId } } },
                    { vehicles: { none: {} } } // Si la condición aplica a todos
                ]
            },
            include: {
                conditions: true
            }
        });

        for (const condicion of condiciones) {
            if (this.evaluarCondicion(condicion, datos)) {
                await this.registrarEjecucion(condicion, datos, vehiculoId, sesionId);
                await this.ejecutarAcciones(condicion, datos);
            }
        }
    }

    /**
     * Evalúa automáticamente eventos con autoEvaluate=true al crear una sesión
     */
    async evaluarEventosAutomaticos(sessionId: string, vehiculoId: string, datos: any) {
        try {
            logger.info('Iniciando evaluación automática de eventos', { sessionId, vehiculoId });

            // Buscar eventos con autoEvaluate=true (simulamos el campo por ahora)
            const eventosAutomaticos = await prisma.gestorDeEvento.findMany({
                where: {
                    status: 'ACTIVE',
                    // Cuando tengamos el campo: autoEvaluate: true,
                    OR: [
                        { vehicles: { some: { vehicleId: vehiculoId } } },
                        { vehicles: { none: {} } } // Eventos que aplican a todos los vehículos
                    ]
                },
                include: {
                    conditions: true,
                    vehicles: true
                }
            });

            let eventosEvaluados = 0;
            let eventosTriggerados = 0;

            for (const evento of eventosAutomaticos) {
                // Por ahora, simulamos que todos los eventos tienen autoEvaluate=true
                // En el futuro, verificaremos: if (evento.autoEvaluate)

                if (this.evaluarCondicionesEvento(evento, datos)) {
                    await this.registrarEjecucionEvento(evento, datos, vehiculoId, sessionId);
                    await this.ejecutarAccionesEvento(evento, datos);
                    eventosTriggerados++;

                    logger.info('Evento automático triggerado', {
                        eventoId: evento.id,
                        eventoName: evento.name,
                        sessionId,
                        vehiculoId
                    });
                }
                eventosEvaluados++;
            }

            logger.info('Evaluación automática completada', {
                sessionId,
                vehiculoId,
                eventosEvaluados,
                eventosTriggerados
            });

            return {
                eventosEvaluados,
                eventosTriggerados
            };
        } catch (error) {
            logger.error('Error en evaluación automática de eventos', {
                error,
                sessionId,
                vehiculoId
            });
            throw error;
        }
    }

    /**
     * Evalúa las condiciones de un evento específico
     */
    evaluarCondicionesEvento(evento: any, datos: any): boolean {
        try {
            if (!evento.conditions || evento.conditions.length === 0) {
                return false;
            }

            let resultado = true;
            const operadorLogico = evento.logicOperator || 'AND';

            for (const condicion of evento.conditions) {
                const evaluacion = this.evaluarCondicionIndividual(condicion, datos);

                if (operadorLogico === 'AND') {
                    resultado = resultado && evaluacion;
                } else if (operadorLogico === 'OR') {
                    resultado = resultado || evaluacion;
                }
            }

            return resultado;
        } catch (error) {
            logger.error('Error evaluando condiciones del evento', {
                error,
                eventoId: evento.id
            });
            return false;
        }
    }

    /**
     * Evalúa una condición individual
     */
    evaluarCondicionIndividual(condicion: any, datos: any): boolean {
        const valor = datos[condicion.variable];
        if (valor === undefined || valor === null) return false;

        switch (condicion.operator) {
            case 'GREATER_THAN':
                return valor > condicion.value;
            case 'LESS_THAN':
                return valor < condicion.value;
            case 'EQUALS':
                return valor === condicion.value;
            case 'GREATER_THAN_OR_EQUAL':
                return valor >= condicion.value;
            case 'LESS_THAN_OR_EQUAL':
                return valor <= condicion.value;
            case 'NOT_EQUALS':
                return valor !== condicion.value;
            case 'BETWEEN':
                return valor >= condicion.value && valor <= (condicion.value2 || condicion.value);
            default:
                logger.warn('Operador no reconocido', { operator: condicion.operator });
                return false;
        }
    }

    /**
     * Registra la ejecución de un evento
     */
    async registrarEjecucionEvento(evento: any, datos: any, vehiculoId: string, sesionId?: string) {
        try {
            // Obtener la fecha real del evento desde los datos o desde la sesión
            let fechaRealEvento = new Date();

            // Si hay timestamp en los datos, usarlo
            if (datos.timestamp) {
                fechaRealEvento = new Date(datos.timestamp);
            } else if (sesionId) {
                // Si no hay timestamp, obtener la fecha de la sesión
                const sesion = await prisma.session.findUnique({
                    where: { id: sesionId },
                    select: { startTime: true, endTime: true }
                });

                if (sesion) {
                    // Usar la fecha de inicio de la sesión como fecha del evento
                    fechaRealEvento = new Date(sesion.startTime);
                }
            }

            const ejecucion = await prisma.ejecucionEvento.create({
                data: {
                    eventId: evento.id,
                    vehicleId: vehiculoId,
                    sessionId: sesionId,
                    data: datos,
                    displayData: {
                        eventName: evento.name,
                        eventType: evento.type,
                        triggeredBy: 'AUTO_EVALUATION',
                        timestamp: fechaRealEvento.toISOString(), // Fecha real del evento
                        originalTimestamp: datos.timestamp || null // Timestamp original si existe
                    },
                    status: 'ACTIVE',
                    triggeredAt: fechaRealEvento // Usar la fecha real del evento
                }
            });

            logger.info('Ejecución de evento registrada con fecha real', {
                ejecucionId: ejecucion.id,
                eventoId: evento.id,
                vehiculoId,
                sesionId,
                fechaRealEvento: fechaRealEvento.toISOString()
            });

            return ejecucion;
        } catch (error) {
            logger.error('Error registrando ejecución de evento', {
                error,
                eventoId: evento.id,
                vehiculoId,
                sesionId
            });
            throw error;
        }
    }

    /**
     * Ejecuta las acciones de un evento
     */
    async ejecutarAccionesEvento(evento: any, datos: any) {
        try {
            // Por ahora, solo registramos las acciones
            // En el futuro, podríamos ejecutar notificaciones, comandos, etc.

            logger.info('Ejecutando acciones del evento', {
                eventoId: evento.id,
                eventoName: evento.name,
                eventoType: evento.type,
                datos
            });

            // Aquí podríamos agregar lógica para:
            // - Enviar notificaciones
            // - Ejecutar comandos
            // - Crear alertas
            // - Etc.
        } catch (error) {
            logger.error('Error ejecutando acciones del evento', {
                error,
                eventoId: evento.id
            });
            throw error;
        }
    }

    // Métodos existentes (compatibilidad hacia atrás)
    evaluarCondicion(condicion: any, datos: any): boolean {
        let resultado = true;
        let ultimaUnion: 'AND' | 'OR' | null = null;
        for (const c of condicion.condiciones) {
            const evaluacion = this.evaluarExpresion(c, datos);
            if (ultimaUnion === 'AND') {
                resultado = resultado && evaluacion;
            } else if (ultimaUnion === 'OR') {
                resultado = resultado || evaluacion;
            } else {
                resultado = evaluacion;
            }
            ultimaUnion = c.union || null;
        }
        return resultado;
    }

    evaluarExpresion(cond: any, datos: any): boolean {
        const valor = datos[cond.variable];
        if (valor === undefined) return false;
        switch (cond.operador) {
            case '>':
                return valor > cond.valor;
            case '<':
                return valor < cond.valor;
            case '==':
                return valor === cond.valor;
            case '>=':
                return valor >= cond.valor;
            case '<=':
                return valor <= cond.valor;
            case '!=':
                return valor !== cond.valor;
            default:
                return false;
        }
    }

    async registrarEjecucion(condicion: any, datos: any, vehiculoId: string, sesionId?: string) {
        await prisma.ejecucionEvento.create({
            data: {
                eventId: condicion.id,
                vehicleId: vehiculoId,
                sessionId: sesionId,
                data: datos,
                displayData: {
                    condicionId: condicion.id,
                    triggeredBy: 'MANUAL_EVALUATION'
                },
                status: 'ACTIVE'
            }
        });
    }

    async ejecutarAcciones(condicion: any, datos: any) {
        // Implementar acciones personalizadas
        logger.info('Ejecutando acciones para condición', { id: condicion.id });
    }

    // Métodos CRUD para gestión de eventos
    async crearEvento(data: any) {
        try {
            // Limpiar el objeto data para eliminar cualquier campo 'organization' que pueda causar conflictos
            const { organization, ...cleanData } = data;

            logger.info('Datos recibidos para crear evento:', JSON.stringify(cleanData, null, 2));

            // Mapeo de tipos del frontend a valores válidos del enum
            const mapTipoEvento = (
                tipo: string
            ): 'STABILITY' | 'CAN' | 'COMBINED' | 'GPS' | 'SYSTEM' | 'MAINTENANCE' | 'CUSTOM' => {
                const tipoUpper = tipo.toUpperCase();
                switch (tipoUpper) {
                    case 'TELEMETRIA':
                    case 'CAN':
                        return 'CAN';
                    case 'ESTABILIDAD':
                    case 'STABILITY':
                        return 'STABILITY';
                    case 'GPS':
                        return 'GPS';
                    case 'COMBINADO':
                    case 'COMBINED':
                        return 'COMBINED';
                    case 'SISTEMA':
                    case 'SYSTEM':
                        return 'SYSTEM';
                    case 'MANTENIMIENTO':
                    case 'MAINTENANCE':
                        return 'MAINTENANCE';
                    case 'PERSONALIZADO':
                    case 'CUSTOM':
                        return 'CUSTOM';
                    default:
                        logger.warn('Tipo de evento no reconocido, usando CAN por defecto:', tipo);
                        return 'CAN';
                }
            };

            // Extraer y mapear los datos del frontend
            const eventoData = {
                name: cleanData.name || cleanData.nombre || 'Sin nombre',
                description: cleanData.description || cleanData.descripcion || '',
                type: mapTipoEvento(cleanData.tipo || cleanData.type || 'CAN'),
                status: 'ACTIVE' as const,
                isPredefined: false,
                autoEvaluate: Boolean(cleanData.autoEvaluate),
                logicOperator: 'AND' as const,
                organizationId: cleanData.organizationId,
                createdById: cleanData.createdById
            };

            logger.info('Creando evento con datos mapeados:', eventoData);

            // Crear el evento principal
            const eventData: any = {
                name: eventoData.name,
                description: eventoData.description,
                type: eventoData.type,
                status: eventoData.status,
                isPredefined: eventoData.isPredefined,
                autoEvaluate: eventoData.autoEvaluate,
                logicOperator: eventoData.logicOperator,
                createdBy: { connect: { id: cleanData.createdById } },
                organization: { connect: { id: cleanData.organizationId } }
            };

            const evento = await prisma.gestorDeEvento.create({
                data: eventData
            });

            logger.info('Evento creado exitosamente:', { id: evento.id });

            // Procesar condiciones si existen
            if (cleanData.condiciones && Array.isArray(cleanData.condiciones)) {
                logger.info('Procesando condiciones:', { count: cleanData.condiciones.length });

                for (const condicion of cleanData.condiciones) {
                    const condicionData = {
                        eventId: evento.id,
                        type: 'STABILITY' as const,
                        variable: condicion.variable || '',
                        operator: condicion.operator || 'GREATER_THAN',
                        value: parseFloat(condicion.value || '0'),
                        value2: condicion.value2 ? parseFloat(condicion.value2) : null,
                        unit: condicion.unit || null
                    };

                    await prisma.eventCondition.create({
                        data: condicionData
                    });
                }
            }

            // Procesar vehículos si existen
            if (cleanData.vehiculos && Array.isArray(cleanData.vehiculos)) {
                logger.info('Procesando vehículos:', { count: cleanData.vehiculos.length });

                for (const vehicleId of cleanData.vehiculos) {
                    await prisma.gestorDeEventoVehicle.create({
                        data: {
                            gestorDeEventoId: evento.id,
                            vehicleId: vehicleId
                        }
                    });
                }
            }

            // Procesar variables a mostrar si existen
            if (cleanData.variablesAMostrar && Array.isArray(cleanData.variablesAMostrar)) {
                logger.info('Procesando variables visibles:', {
                    count: cleanData.variablesAMostrar.length
                });

                for (let i = 0; i < cleanData.variablesAMostrar.length; i++) {
                    await prisma.eventoVariableVisible.create({
                        data: {
                            eventoId: evento.id,
                            nombre: cleanData.variablesAMostrar[i],
                            orden: i + 1
                        }
                    });
                }
            }

            logger.info('Evento completo creado exitosamente:', { eventoId: evento.id });
            return evento;
        } catch (error) {
            logger.error('Error creando evento completo:', error);
            throw error;
        }
    }

    async listarEventos(filtros?: any) {
        try {
            // Lista blanca de campos válidos para filtrar (ajustar según el modelo actual)
            const allowedFields = [
                'id',
                'name',
                'description',
                'type',
                'status',
                'isPredefined',
                'autoEvaluate',
                'logicOperator',
                'timeWindowStart',
                'timeWindowEnd',
                'createdById',
                'createdAt',
                'updatedAt',
                'version',
                'organizationId'
            ];
            // Elimina cualquier campo no permitido (como 'existe')
            const safeFiltros = Object.fromEntries(
                Object.entries(filtros || {}).filter(([key]) => allowedFields.includes(key))
            );

            logger.info('Filtros recibidos en listarEventos', { filtros, safeFiltros });

            return await prisma.gestorDeEvento.findMany({
                where: safeFiltros,
                include: {
                    conditions: true,
                    vehicles: true,
                    createdBy: true,
                    executions: true,
                    variablesVisibles: true
                }
            });
        } catch (error) {
            logger.error('Error listando eventos:', error);
            throw error;
        }
    }

    async obtenerEvento(id: string) {
        try {
            return await prisma.gestorDeEvento.findUnique({
                where: { id },
                include: {
                    conditions: true,
                    vehicles: {
                        include: {
                            vehicle: true
                        }
                    },
                    createdBy: true,
                    executions: {
                        include: {
                            session: true,
                            vehicle: true
                        },
                        orderBy: {
                            triggeredAt: 'desc'
                        },
                        take: 10
                    }
                }
            });
        } catch (error) {
            logger.error('Error obteniendo evento:', error);
            throw error;
        }
    }

    async actualizarEvento(id: string, data: any) {
        try {
            // Actualizar las relaciones de vehículos
            if (data.vehicles) {
                await prisma.gestorDeEventoVehicle.deleteMany({
                    where: { gestorDeEventoId: id }
                });
            }

            const evento = await prisma.gestorDeEvento.update({
                where: { id },
                data: {
                    name: data.name,
                    description: data.description,
                    type: data.type,
                    status: data.status,
                    isPredefined: data.isPredefined,
                    autoEvaluate: data.autoEvaluate,
                    logicOperator: data.logicOperator,
                    vehicles: data.vehicles
                        ? {
                              create: data.vehicles.map((vehicleId: string) => ({
                                  vehicleId
                              }))
                          }
                        : undefined
                },
                include: {
                    conditions: true,
                    vehicles: true,
                    createdBy: true
                }
            });
            return evento;
        } catch (error) {
            logger.error('Error actualizando evento:', error);
            throw error;
        }
    }

    async eliminarEvento(id: string) {
        try {
            // Eliminar dependencias hijas manualmente antes de eliminar el evento principal
            await prisma.ejecucionEvento.deleteMany({ where: { eventId: id } });
            await prisma.eventCondition.deleteMany({ where: { eventId: id } });
            await prisma.eventoVariableVisible.deleteMany({ where: { eventoId: id } });
            await prisma.gestorDeEventoVehicle.deleteMany({ where: { gestorDeEventoId: id } });
            logger.info('Dependencias eliminadas para el evento', { id });
            await prisma.gestorDeEvento.delete({ where: { id } });
            logger.info('Evento eliminado correctamente', { id });
        } catch (error) {
            logger.error('Error eliminando evento:', error);
            throw error;
        }
    }

    async eliminarTodosEventos() {
        try {
            await prisma.gestorDeEvento.deleteMany({});
        } catch (error) {
            logger.error('Error eliminando todos los eventos:', error);
            throw error;
        }
    }

    async obtenerEjecucionesEventos(filtros: any = {}, paginacion: any = {}) {
        try {
            const { limit = 50, offset = 0 } = paginacion;

            return await prisma.ejecucionEvento.findMany({
                where: filtros,
                include: {
                    event: true,
                    vehicle: true,
                    session: true
                },
                orderBy: {
                    triggeredAt: 'desc'
                },
                take: limit,
                skip: offset
            });
        } catch (error) {
            logger.error('Error obteniendo ejecuciones:', error);
            throw error;
        }
    }

    async obtenerEjecucionEvento(id: string) {
        try {
            return await prisma.ejecucionEvento.findUnique({
                where: { id },
                include: {
                    event: true,
                    vehicle: true,
                    session: true,
                    actions: true
                }
            });
        } catch (error) {
            logger.error('Error obteniendo ejecución:', error);
            throw error;
        }
    }

    async obtenerEventosActivosVehiculo(vehicleId: string) {
        try {
            return await prisma.gestorDeEvento.findMany({
                where: {
                    status: 'ACTIVE',
                    vehicles: {
                        some: {
                            vehicleId
                        }
                    }
                },
                include: {
                    conditions: true,
                    vehicles: true
                }
            });
        } catch (error) {
            logger.error('Error obteniendo eventos activos del vehículo:', error);
            throw error;
        }
    }

    async updateEventStatus(id: string, status: string) {
        try {
            return await prisma.gestorDeEvento.update({
                where: { id },
                data: { status: status as any }, // Cast explícito para cumplir con el tipado de Prisma
                include: {
                    conditions: true,
                    vehicles: true,
                    createdBy: true
                }
            });
        } catch (error) {
            logger.error('Error actualizando estado del evento:', error);
            throw error;
        }
    }
}
