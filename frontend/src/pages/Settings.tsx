import { NotificationsActive as AlertIcon, Settings as SettingsIcon, PersonOutline as UserIcon } from '@mui/icons-material';
import {
import { logger } from '../utils/logger';
    Box,
    Button,
    Card,
    CardContent,
    Divider,
    FormControl,
    FormControlLabel,
    FormGroup,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    SelectChangeEvent,
    Switch,
    Tab,
    Tabs,
    TextField,
    Typography,
    useTheme
} from '@mui/material';
import { useState } from 'react';
import BackButton from '../components/BackButton';
import { t } from "../i18n";

// Definir un tipo más preciso para el manejador de eventos
type InputChangeEvent = React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent;
type InputChangeHandler = (event: InputChangeEvent) => void;

// Componente para una sección de configuración
const SettingsSection = ({ title, children, icon }: { title: string, children: React.ReactNode, icon: React.ReactNode }) => {
    return (
        <Card sx={{ mb: 3 }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {icon}
                    <Typography variant="h6" sx={{ ml: 1 }}>
                        {title}
                    </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
                {children}
            </CardContent>
        </Card>
    );
};

const Settings = () => {
    const theme = useTheme();
    const [tabValue, setTabValue] = useState(0);
    const [formValues, setFormValues] = useState({
        language: 'es',
        unitsSystem: 'metric',
        darkMode: true,
        notifications: true,
        dataRefreshRate: '30',
        defaultVehicle: '1',
        alertThreshold: 'medium',
        rollAlertThreshold: '8',
        speedAlertThreshold: '80',
        accelerationAlertThreshold: '0.3',
    });

    // Manejador de cambio de pestaña
    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    // Manejador para cambios en los inputs
    const handleChange = (event: InputChangeEvent) => {
        const { name, value } = event.target;
        setFormValues({
            ...formValues,
            [name as string]: value
        });
    };

    // Manejador para los switches
    const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = event.target;
        setFormValues({
            ...formValues,
            [name]: checked
        });
    };

    // Manejador de envío del formulario
    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        logger.info('Configuración actualizada:', formValues);
        // Aquí iría la lógica para guardar la configuración
    };

    return (
        <Box sx={{ p: 3, maxWidth: '1200px', mx: 'auto' }}>
            <BackButton sx={{ mb: 2 }} />
            <Typography variant="h4" gutterBottom fontWeight="bold">
                {t('configuracion')}</Typography>

            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab label="General" />
                    <Tab label="Alertas" />
                    <Tab label="Sistema" />
                </Tabs>

                <Box sx={{ p: 3 }}>
                    {/* Configuración General */}
                    {tabValue === 0 && (
                        <Box component="form" onSubmit={handleSubmit}>
                            <SettingsSection title="Preferencias de Usuario" icon={<UserIcon color="primary" />}>
                                <Grid container spacing={3}>
                                    <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                                        <FormControl fullWidth>
                                            <InputLabel id="language-label">{t('idioma')}</InputLabel>
                                            <Select
                                                labelId="language-label"
                                                name="language"
                                                value={formValues.language}
                                                label="Idioma"
                                                onChange={handleChange}
                                            >
                                                <MenuItem value="es">{t('espanol')}</MenuItem>
                                                <MenuItem value="en">{t('english')}</MenuItem>
                                                <MenuItem value="fr">{t('francais')}</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                                        <FormControl fullWidth>
                                            <InputLabel id="units-label">{t('sistema_de_unidades')}</InputLabel>
                                            <Select
                                                labelId="units-label"
                                                name="unitsSystem"
                                                value={formValues.unitsSystem}
                                                label="Sistema de Unidades"
                                                onChange={handleChange}
                                            >
                                                <MenuItem value="metric">{t('metrico_kmh_kg')}</MenuItem>
                                                <MenuItem value="imperial">{t('imperial_mph_lb')}</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid sx={{ gridColumn: 'span 12' }}>
                                        <FormGroup>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={formValues.darkMode}
                                                        onChange={handleSwitchChange}
                                                        name="darkMode"
                                                        color="primary"
                                                    />
                                                }
                                                label="Modo Oscuro"
                                            />
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={formValues.notifications}
                                                        onChange={handleSwitchChange}
                                                        name="notifications"
                                                        color="primary"
                                                    />
                                                }
                                                label="Notificaciones"
                                            />
                                        </FormGroup>
                                    </Grid>
                                </Grid>
                            </SettingsSection>

                            <SettingsSection title="Vehículos" icon={<SettingsIcon color="primary" />}>
                                <Grid container spacing={3}>
                                    <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                                        <FormControl fullWidth>
                                            <InputLabel id="default-vehicle-label">{t('vehiculo_predeterminado')}</InputLabel>
                                            <Select
                                                labelId="default-vehicle-label"
                                                name="defaultVehicle"
                                                value={formValues.defaultVehicle}
                                                label="Vehículo Predeterminado"
                                                onChange={handleChange}
                                            >
                                                <MenuItem value="1">{t('bomberos_01')}</MenuItem>
                                                <MenuItem value="2">{t('bomberos_02')}</MenuItem>
                                                <MenuItem value="3">{t('logistica_01')}</MenuItem>
                                                <MenuItem value="4">{t('ambulancia_01')}</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                                        <FormControl fullWidth>
                                            <InputLabel id="refresh-rate-label">{t('intervalo_de_actualizacion')}</InputLabel>
                                            <Select
                                                labelId="refresh-rate-label"
                                                name="dataRefreshRate"
                                                value={formValues.dataRefreshRate}
                                                label="Intervalo de Actualización"
                                                onChange={handleChange}
                                            >
                                                <MenuItem value="10">{t('10_segundos')}</MenuItem>
                                                <MenuItem value="30">{t('30_segundos_1')}</MenuItem>
                                                <MenuItem value="60">{t('1_minuto_1')}</MenuItem>
                                                <MenuItem value="300">{t('5_minutos_1')}</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>
                            </SettingsSection>

                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                <Button variant="contained" type="submit">
                                    {t('guardar_cambios')}</Button>
                            </Box>
                        </Box>
                    )}

                    {/* Configuración de Alertas */}
                    {tabValue === 1 && (
                        <Box component="form" onSubmit={handleSubmit}>
                            <SettingsSection title="Configuración de Alertas" icon={<AlertIcon color="primary" />}>
                                <Grid container spacing={3}>
                                    <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                                        <FormControl fullWidth>
                                            <InputLabel id="alert-threshold-label">{t('nivel_de_sensibilidad')}</InputLabel>
                                            <Select
                                                labelId="alert-threshold-label"
                                                name="alertThreshold"
                                                value={formValues.alertThreshold}
                                                label="Nivel de Sensibilidad"
                                                onChange={handleChange}
                                            >
                                                <MenuItem value="low">{t('bajo_menos_alertas')}</MenuItem>
                                                <MenuItem value="medium">{t('medio')}</MenuItem>
                                                <MenuItem value="high">{t('alto_mas_alertas')}</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                                        <TextField
                                            fullWidth
                                            label="Umbral de Inclinación (grados)"
                                            name="rollAlertThreshold"
                                            value={formValues.rollAlertThreshold}
                                            onChange={handleChange}
                                            type="number"
                                            InputProps={{
                                                endAdornment: '°',
                                            }}
                                        />
                                    </Grid>
                                    <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                                        <TextField
                                            fullWidth
                                            label="Umbral de Velocidad"
                                            name="speedAlertThreshold"
                                            value={formValues.speedAlertThreshold}
                                            onChange={handleChange}
                                            type="number"
                                            InputProps={{
                                                endAdornment: 'km/h',
                                            }}
                                        />
                                    </Grid>
                                    <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                                        <TextField
                                            fullWidth
                                            label="Umbral de Aceleración Lateral"
                                            name="accelerationAlertThreshold"
                                            value={formValues.accelerationAlertThreshold}
                                            onChange={handleChange}
                                            type="number"
                                            InputProps={{
                                                endAdornment: 'G',
                                            }}
                                        />
                                    </Grid>
                                </Grid>
                            </SettingsSection>

                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                <Button variant="contained" type="submit">
                                    {t('guardar_cambios_1')}</Button>
                            </Box>
                        </Box>
                    )}

                    {/* Configuración de Sistema */}
                    {tabValue === 2 && (
                        <Box component="form" onSubmit={handleSubmit}>
                            <SettingsSection title="Configuración del Sistema" icon={<SettingsIcon color="primary" />}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                    {t('esta_seccion_esta_destinada_a_los_administradores_del_sistema_los_cambios_aqui_pueden_afectar_el_rendimiento_y_la_seguridad_de_la_aplicacion')}</Typography>

                                <Grid container spacing={3}>
                                    <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                                        <TextField
                                            fullWidth
                                            label="URL del Servidor API"
                                            name="apiUrl"
                                            value="http://localhost:9998"
                                            disabled
                                        />
                                    </Grid>
                                    <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                                        <TextField
                                            fullWidth
                                            label="Timeout de Conexión (ms)"
                                            name="connectionTimeout"
                                            value="30000"
                                            disabled
                                        />
                                    </Grid>
                                    <Grid sx={{ gridColumn: 'span 12' }}>
                                        <FormGroup>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={true}
                                                        disabled
                                                        name="debugMode"
                                                        color="primary"
                                                    />
                                                }
                                                label="Modo de Desarrollo"
                                            />
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={true}
                                                        disabled
                                                        name="simulationMode"
                                                        color="primary"
                                                    />
                                                }
                                                label="Modo de Simulación de Datos"
                                            />
                                        </FormGroup>
                                        <Typography variant="caption" color="text.secondary">
                                            {t('para_cambiar_estos_valores_edite_el_archivo_de_configuracion_o_comuniquese_con_el_administrador_del_sistema')}</Typography>
                                    </Grid>
                                </Grid>
                            </SettingsSection>
                        </Box>
                    )}
                </Box>
            </Paper>
        </Box>
    );
};

export default Settings; 