import CloseIcon from '@mui/icons-material/Close';
import { Alert, Avatar, Box, Button, Card, CardContent, Snackbar, Tab, Tabs, Typography } from '@mui/material';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import React, { useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { useVehicleContext } from '../contexts/VehicleContext';
import { useEventClusters } from '../hooks/useEventClusters';
import { useParks } from '../hooks/useParks';
import { useVehicles } from '../hooks/useVehicles';
import { deletePark } from '../services/parks';
import { deleteVehicle } from '../services/vehicles';
import { deleteZone } from '../services/zones';
import { EventClusterMap } from './EventClusterMap';
import { OptimizedEventList } from './OptimizedEventList';
import { ParkForm } from './ParkForm';
import { ParkKPIWidget } from './ParkKPIWidget';
import { ParkList } from './ParkList';
import { ReportGenerator } from './ReportGenerator';

import { VehicleForm } from './VehicleForm';
import { VehicleKPIWidget } from './VehicleKPIWidget';
import { VehicleList } from './VehicleList';
import { ZoneForm } from './ZoneForm';
import { ZoneList } from './ZoneList';

const tabLabels = [
    'KPIs', // antes 'Vista General'
    'Parques',
    'Zonas',
    'Vehículos',
    'KPIs Parque',
    'Informes',
    'Mapa Clustering',
    'Eventos Críticos',
    'Información', // nueva pestaña para la ficha del vehículo
];

export const ManagementDashboard: React.FC<{ token: string; userRole: string }> = ({ token, userRole }) => {
    const { selectedVehicle, setSelectedVehicle } = useVehicleContext();
    const [tab, setTab] = useState(0);
    const [showForm, setShowForm] = useState(false);
    const [editData, setEditData] = useState<any>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [parkId, setParkId] = useState<string | undefined>(undefined);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
    const [selectedEvent, setSelectedEvent] = useState<any>(null);

    const handleTabChange = (_: any, newValue: number) => setTab(newValue);
    const handleCreate = () => { setEditData(null); setShowForm(true); };
    const handleEdit = (data: any) => { setEditData(data); setShowForm(true); };
    const handleFormSubmit = () => { setShowForm(false); setEditData(null); setRefreshKey(k => k + 1); };
    const handleSnackbar = (message: string, severity: 'success' | 'error') => setSnackbar({ open: true, message, severity });

    const handleDeletePark = async (park: any) => { try { await deletePark(park.id, token); setRefreshKey(k => k + 1); handleSnackbar('Parque eliminado', 'success'); } catch { handleSnackbar('Error al eliminar parque', 'error'); } };
    const handleDeleteZone = async (zone: any) => { try { await deleteZone(zone.id, token); setRefreshKey(k => k + 1); handleSnackbar('Zona eliminada', 'success'); } catch { handleSnackbar('Error al eliminar zona', 'error'); } };
    const handleDeleteVehicle = async (vehicle: any) => { try { await deleteVehicle(vehicle.id, token); setRefreshKey(k => k + 1); handleSnackbar('Vehículo eliminado', 'success'); } catch { handleSnackbar('Error al eliminar vehículo', 'error'); } };

    const { parks } = useParks(token);
    const { vehicles } = useVehicles(token);
    const emptyParams = useMemo(() => ({}), []);
    const { clusters: eventos, loading: loadingEventos, error: errorEventos } = useEventClusters(emptyParams, token);

    const handleVehicleSelect = (vehicle: any) => {
        setSelectedVehicle(vehicle);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', m: 0, p: 0, pt: '64px' }}>
            {/* Contenido principal */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', m: 0, p: 0 }}>
                {/* Header */}
                <Box sx={{
                    p: 1,
                    m: 0,
                    borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                    backgroundColor: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: 48
                }}>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main', lineHeight: 1.2 }}>
                            Centro de Mando
                        </Typography>
                        {selectedVehicle && (
                            <Typography variant="subtitle2" sx={{ color: 'text.secondary', mt: 0.5, lineHeight: 1 }}>
                                Vehículo seleccionado: {selectedVehicle.name || selectedVehicle.identifier}
                            </Typography>
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {userRole === 'ADMIN' && (
                            <Button variant="contained" onClick={handleCreate} size="small">
                                Nuevo {tab === 1 ? 'Parque' : tab === 2 ? 'Zona' : tab === 3 ? 'Vehículo' : 'Elemento'}
                            </Button>
                        )}
                    </Box>
                </Box>

                {/* Tabs de navegación */}
                <Box sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    backgroundColor: 'white',
                    pl: 2,
                    borderLeft: '1px solid #e0e0e0',
                    boxShadow: '2px 0 4px -2px rgba(0,0,0,0.08)',
                    m: 0,
                    minHeight: 40
                }}>
                    <Tabs
                        value={tab}
                        onChange={handleTabChange}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{ px: 1, minHeight: 40 }}
                    >
                        {tabLabels.map((label, idx) => (
                            <Tab key={label} label={label} sx={{ minHeight: 40, py: 0.5 }} />
                        ))}
                    </Tabs>
                </Box>

                {/* Contenido de tabs */}
                <Box sx={{ flex: 1, overflow: 'auto', p: 2, backgroundColor: '#f5f5f5' }}>
                    {/* KPIs del vehículo (pestaña 0) */}
                    {tab === 0 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
                            {/* KPIs del vehículo */}
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 2 }}>
                                    KPIs del Vehículo
                                </Typography>
                                {selectedVehicle ? (
                                    <VehicleKPIWidget vehicleId={selectedVehicle.id} token={token} />
                                ) : (
                                    <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                                        Selecciona un vehículo en el panel lateral para ver sus KPIs
                                    </Typography>
                                )}
                            </CardContent>
                        </Box>
                    )}

                    {/* Información del vehículo (pestaña 8) */}
                    {tab === 8 && (
                        <Card sx={{ maxWidth: 900, mx: 'auto', p: 2 }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 2 }}>
                                    Información del Vehículo
                                </Typography>
                                {selectedVehicle ? (
                                    <Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                            <Avatar sx={{ width: 48, height: 48, fontSize: '1.5rem' }}>
                                                {selectedVehicle.type === 'TRUCK' ? '🚛' :
                                                    selectedVehicle.type === 'VAN' ? '🚐' :
                                                        selectedVehicle.type === 'CAR' ? '🚗' :
                                                            selectedVehicle.type === 'BUS' ? '🚌' :
                                                                selectedVehicle.type === 'MOTORCYCLE' ? '🏍️' : '🚙'}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                                    {selectedVehicle.name || selectedVehicle.identifier}
                                                </Typography>
                                                <Typography variant="body1" sx={{ color: 'primary.contrastText' }}>
                                                    {selectedVehicle.licensePlate || selectedVehicle.identifier}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2 }}>
                                            <Box>
                                                <Typography variant="caption" sx={{ color: 'text.secondary', opacity: 0.8 }}>
                                                    Tipo
                                                </Typography>
                                                <Typography variant="body2">
                                                    {selectedVehicle.type}
                                                </Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="caption" sx={{ color: 'text.secondary', opacity: 0.8 }}>
                                                    Estado
                                                </Typography>
                                                <Typography variant="body2">
                                                    {selectedVehicle.status}
                                                </Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="caption" sx={{ color: 'text.secondary', opacity: 0.8 }}>
                                                    Parque
                                                </Typography>
                                                <Typography variant="body2">
                                                    {selectedVehicle.parkId || 'No asignado'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                ) : (
                                    <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                                        Selecciona un vehículo en el panel lateral para ver su información detallada
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {tab === 1 && (
                        <Card>
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 2 }}>Gestión de Parques</Typography>
                                <ParkList key={refreshKey} token={token} onEdit={userRole === 'ADMIN' ? handleEdit : undefined} onDelete={userRole === 'ADMIN' ? handleDeletePark : undefined} />
                            </CardContent>
                        </Card>
                    )}

                    {tab === 2 && (
                        <Card>
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 2 }}>Gestión de Zonas</Typography>
                                <ZoneList key={refreshKey} token={token} onEdit={userRole === 'ADMIN' ? handleEdit : undefined} onDelete={userRole === 'ADMIN' ? handleDeleteZone : undefined} />
                            </CardContent>
                        </Card>
                    )}

                    {tab === 3 && (
                        <Card>
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 2 }}>Gestión de Vehículos</Typography>
                                <VehicleList key={refreshKey} token={token} onEdit={userRole === 'ADMIN' ? handleEdit : undefined} onDelete={userRole === 'ADMIN' ? handleDeleteVehicle : undefined} />
                            </CardContent>
                        </Card>
                    )}

                    {tab === 4 && (
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <VehicleKPIWidget vehicleId={selectedVehicle?.id} token={token} />
                            <ParkKPIWidget parkId={parkId} token={token} onParkSelect={setParkId} />
                        </Box>
                    )}

                    {tab === 5 && (
                        <Card>
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 2 }}>Generación de Informes</Typography>
                                <ReportGenerator token={token} />
                            </CardContent>
                        </Card>
                    )}

                    {tab === 6 && (
                        <Card>
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 2 }}>Mapa de Clustering de Eventos</Typography>
                                <EventClusterMap
                                    token={token}
                                    parks={parks}
                                    vehicles={vehicles}
                                    selectedEvent={selectedEvent}
                                    onSelectEvent={setSelectedEvent}
                                />
                            </CardContent>
                        </Card>
                    )}

                    {tab === 7 && (
                        <Card>
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 2 }}>Eventos Críticos y Moderados</Typography>
                                {loadingEventos && <div>Cargando eventos...</div>}
                                {errorEventos && <div style={{ color: 'red' }}>Error: {errorEventos}</div>}
                                {!loadingEventos && !errorEventos && (
                                    <OptimizedEventList
                                        events={eventos || []}
                                        height={600}
                                        parks={parks}
                                        vehicles={vehicles}
                                        onEventClick={setSelectedEvent}
                                        selectedEventId={selectedEvent ? (selectedEvent.id || `${selectedEvent.timestamp}-${selectedEvent.lat}-${selectedEvent.lon}`) : null}
                                    />
                                )}
                            </CardContent>
                        </Card>
                    )}
                </Box>
            </Box>

            {/* Formularios modales */}
            {showForm && (
                <Drawer anchor="right" open={showForm} onClose={() => setShowForm(false)}>
                    <Box sx={{ width: 500, p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">
                                {editData ? 'Editar' : 'Crear'} {tab === 1 ? 'Parque' : tab === 2 ? 'Zona' : 'Vehículo'}
                            </Typography>
                            <IconButton onClick={() => setShowForm(false)}><CloseIcon /></IconButton>
                        </Box>
                        {tab === 1 && <ParkForm token={token} initialData={editData} onSubmit={handleFormSubmit} />}
                        {tab === 2 && <ZoneForm token={token} initialData={editData} onSubmit={handleFormSubmit} />}
                        {tab === 3 && <VehicleForm token={token} initialData={editData} onSubmit={handleFormSubmit} />}
                    </Box>
                </Drawer>
            )}

            {/* Detalle de evento */}
            <Drawer anchor="right" open={!!selectedEvent} onClose={() => setSelectedEvent(null)}>
                <Box sx={{ width: 400, p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">Detalle de Evento</Typography>
                        <IconButton onClick={() => setSelectedEvent(null)}><CloseIcon /></IconButton>
                    </Box>
                    {selectedEvent && (
                        <>
                            <Typography variant="subtitle2" sx={{ mt: 2 }}>Tipo: {selectedEvent.tipos?.join(', ')}</Typography>
                            <Typography variant="body2">Severidad: {selectedEvent.level}</Typography>
                            <Typography variant="body2">Vehículo: {selectedEvent.vehicleId}</Typography>
                            <Typography variant="body2">Parque: {selectedEvent.parkId}</Typography>
                            <Typography variant="body2">Fecha: {new Date(selectedEvent.timestamp).toLocaleString()}</Typography>
                            <Typography variant="body2">SI: {selectedEvent.perc}</Typography>
                            <Typography variant="body2">Velocidad: {selectedEvent.can?.vehicleSpeed} km/h</Typography>
                            <Typography variant="body2">RPM: {selectedEvent.can?.engineRPM}</Typography>
                            <Box sx={{ mt: 2, height: 200 }}>
                                <MapContainer center={[selectedEvent.lat, selectedEvent.lon]} zoom={15} style={{ height: 200, width: '100%' }} scrollWheelZoom={false}>
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <Marker position={[selectedEvent.lat, selectedEvent.lon]}>
                                        <Popup>Evento aquí</Popup>
                                    </Marker>
                                </MapContainer>
                            </Box>
                        </>
                    )}
                </Box>
            </Drawer>

            {/* Snackbar para notificaciones */}
            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}; 