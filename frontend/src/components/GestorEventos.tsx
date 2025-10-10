import React, { useEffect, useState } from 'react';
import { authService } from '../services/auth';
import { eventService } from '../services/events';
import { CreateEventDTO, Event, EventSeverity, EventStatus, EventType } from '../types/events';
import { mapBackendSeverity } from '../utils/eventUtils';
import { logger } from '../utils/logger';
import { t } from "../i18n";

const GestorEventos: React.FC = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [formData, setFormData] = useState<CreateEventDTO>({
        name: '',
        description: '',
        severity: EventSeverity.WARNING,
        estado: EventStatus.ACTIVE,
        tipo: EventType.COMBINED,
        isPredefined: false,
        vehicles: [],
        conditions: []
    });
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            setLoading(true);
            setError(null);
            setErrorMessage(null);
            setSuccessMessage(null);
            logger.debug('Iniciando carga de eventos');

            const response = await eventService.getEvents({});
            logger.debug('Eventos cargados:', response);

            if (response && response.length > 0) {
                setEvents(response);
                logger.debug('Eventos cargados correctamente:', response.length);
            } else {
                logger.debug('No se encontraron eventos');
                setEvents([]);
            }
        } catch (error) {
            logger.error('Error al cargar eventos:', error);
            setError(error instanceof Error ? error.message : 'Error al cargar eventos');
            setErrorMessage(error instanceof Error ? error.message : 'Error al cargar eventos');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (event: Event) => {
        const mappedSeverity = mapBackendSeverity(event.severity);
        logger.debug('Severidad mapeada:', { original: event.severity, mapped: mappedSeverity });

        setFormData({
            name: event.name,
            description: event.description,
            severity: mappedSeverity,
            estado: event.estado,
            tipo: event.tipo,
            isPredefined: event.isPredefined,
            vehicles: event.vehicles || [],
            conditions: event.conditions || []
        });
        setEditingEvent(event);
        setIsModalOpen(true);
    };

    const handleCreateTestEvent = async () => {
        try {
            setLoading(true);
            setError(null);
            setErrorMessage(null);
            setSuccessMessage(null);

            const newEvent = await eventService.createTestEvent();
            logger.debug('Evento de prueba creado:', newEvent);

            setSuccessMessage('Evento de prueba creado correctamente');
            await loadEvents();
        } catch (error) {
            logger.error('Error creando evento de prueba:', error);
            setError(error instanceof Error ? error.message : 'Error al crear evento de prueba');
            setErrorMessage(error instanceof Error ? error.message : 'Error al crear evento de prueba');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);
            setErrorMessage(null);
            setSuccessMessage(null);

            // Asegurar que la severidad tenga un valor válido
            const severity = formData.severity || EventSeverity.WARNING;

            // Mapear la severidad del frontend al backend antes de enviar
            const backendEvent: CreateEventDTO = {
                ...formData,
                severity
            };

            logger.debug('Datos del evento a enviar:', {
                originalFormData: formData,
                backendEvent
            });

            if (editingEvent) {
                await eventService.updateEvent(editingEvent.id, backendEvent);
                setSuccessMessage('Evento actualizado correctamente');
            } else {
                const token = authService.getToken();
                if (!token) {
                    throw new Error('No se encontró el token de autenticación');
                }
                const tokenData = JSON.parse(atob(token.split('.')[1]));
                const organizationId = tokenData.organizationId;
                if (!organizationId) {
                    throw new Error('No se pudo obtener el ID de la organización del token');
                }
                await eventService.createEvent(backendEvent, organizationId);
                setSuccessMessage('Evento creado correctamente');
            }

            // Limpiar el formulario
            setFormData({
                name: '',
                description: '',
                severity: EventSeverity.WARNING,
                estado: EventStatus.ACTIVE,
                tipo: EventType.COMBINED,
                isPredefined: false,
                vehicles: [],
                conditions: []
            });
            setEditingEvent(null);
            setShowForm(false);
            await loadEvents();
        } catch (error) {
            logger.error('Error al guardar el evento:', error);
            setError(error instanceof Error ? error.message : 'Error al guardar el evento');
            setErrorMessage(error instanceof Error ? error.message : 'Error al guardar el evento');
        } finally {
            setLoading(false);
        }
    };

    const getSeverityColor = (severity: EventSeverity) => {
        switch (severity) {
            case EventSeverity.INFO:
                return 'bg-blue-100 text-blue-800';
            case EventSeverity.WARNING:
                return 'bg-yellow-100 text-yellow-800';
            case EventSeverity.CRITICAL:
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">{t('gestor_de_eventos')}</h1>
                <div className="space-x-4">
                    <button
                        onClick={() => {
                            setFormData({
                                name: '',
                                description: '',
                                severity: EventSeverity.WARNING,
                                estado: EventStatus.ACTIVE,
                                tipo: EventType.COMBINED,
                                isPredefined: false,
                                vehicles: [],
                                conditions: []
                            });
                            setShowForm(true);
                            setEditingEvent(null);
                        }}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        {t('nuevo_evento')}</button>
                    <button
                        onClick={handleCreateTestEvent}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                        {t('crear_evento_de_prueba')}</button>
                </div>
            </div>

            {errorMessage && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {errorMessage}
                </div>
            )}

            {successMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    {successMessage}
                </div>
            )}

            {loading ? (
                <div className="text-center py-4">{t('cargando')}</div>
            ) : (
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('nombre')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('tipo_2')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('severidad')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('estado_1')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('acciones')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {events.map((event) => (
                                <tr key={event.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{event.name}</div>
                                        <div className="text-sm text-gray-500">{event.description}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{event.type}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={getSeverityColor(event.severity)}>
                                            {event.severity}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${event.status === EventStatus.ACTIVE
                                            ? 'bg-green-100 text-green-800'
                                            : event.status === EventStatus.PENDING
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {event.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => handleEdit(event)}
                                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                                        >
                                            {t('editar')}</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
                        <h2 className="text-xl font-bold mb-4">
                            {editingEvent ? 'Editar Evento' : 'Nuevo Evento'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    {t('severidad_1')}</label>
                                <select
                                    value={formData.severity || EventSeverity.WARNING}
                                    onChange={(e) => setFormData({ ...formData, severity: e.target.value as EventSeverity })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    <option value={EventSeverity.INFO}>{t('informacion')}</option>
                                    <option value={EventSeverity.WARNING}>{t('advertencia')}</option>
                                    <option value={EventSeverity.CRITICAL}>{t('critica')}</option>
                                </select>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GestorEventos; 