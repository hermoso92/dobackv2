import AddIcon from '@mui/icons-material/Add';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    TextField,
    Typography,
} from '@mui/material';
import { format } from 'date-fns';
import React, { useMemo, useState } from 'react';
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { CANAlarmRule, CANData } from '../types/vehicleData';
import { t } from "../i18n";

interface Props {
    data: CANData[];
    title: string;
    sessionId: number;
}

const DEFAULT_PIDS = [
    { id: 'S1_PID_03_FuelSystemStatus', name: 'Estado Sistema Combustible' },
    { id: 'S1_PID_04_EngineLoad', name: 'Carga del Motor' },
    { id: 'S1_PID_05_EngineCoolantTemp', name: 'Temperatura Refrigerante' },
    { id: 'S1_PID_0C_EngineRPM', name: 'RPM Motor' },
    { id: 'S1_PID_0D_VehicleSpeed', name: 'Velocidad Vehículo' },
];

const CANChart: React.FC<Props> = ({ data, title, sessionId }) => {
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedPID, setSelectedPID] = useState('');
    const [condition, setCondition] = useState<'equals' | 'greater' | 'less'>('greater');
    const [value, setValue] = useState('');
    const [alarmRules, setAlarmRules] = useState<CANAlarmRule[]>([]);

    const formattedData = useMemo(() => {
        return data.map((item) => ({
            timestamp: format(new Date(item.timestamp), 'HH:mm:ss'),
            rpm: item.engineRPM,
            speed: item.vehicleSpeed,
            load: item.engineLoad,
            temp: item.engineTemp,
            alarms: item.alarms || [],
        }));
    }, [data]);

    const handleAddRule = () => {
        if (!selectedPID || !value) return;

        const newRule: CANAlarmRule = {
            pid: selectedPID,
            description: DEFAULT_PIDS.find(p => p.id === selectedPID)?.name || selectedPID,
            condition,
            value: parseFloat(value),
            message: `${DEFAULT_PIDS.find(p => p.id === selectedPID)?.name || selectedPID} ${condition === 'equals' ? '=' : condition === 'greater' ? '>' : '<'} ${value}`,
        };

        setAlarmRules([...alarmRules, newRule]);
        setOpenDialog(false);
        setSelectedPID('');
        setValue('');
    };

    return (
        <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                    {title} {t('sesion')}{sessionId}
                </Typography>
                <IconButton
                    color="primary"
                    onClick={() => setOpenDialog(true)}
                    title="Añadir regla de alarma"
                >
                    <AddIcon />
                </IconButton>
            </Box>

            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Box sx={{ height: 300 }}>
                        <Typography variant="subtitle1" align="center">
                            {t('rpm_y_velocidad')}</Typography>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={formattedData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="timestamp" />
                                <YAxis yAxisId="left" />
                                <YAxis yAxisId="right" orientation="right" />
                                <Tooltip />
                                <Legend />
                                <Line
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="rpm"
                                    stroke="#8884d8"
                                    name="RPM Motor"
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="speed"
                                    stroke="#82ca9d"
                                    name="Velocidad (km/h)"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Box sx={{ height: 300 }}>
                        <Typography variant="subtitle1" align="center">
                            {t('carga_y_temperatura')}</Typography>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={formattedData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="timestamp" />
                                <YAxis yAxisId="left" />
                                <YAxis yAxisId="right" orientation="right" />
                                <Tooltip />
                                <Legend />
                                <Line
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="load"
                                    stroke="#ffc658"
                                    name="Carga Motor (%)"
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="temp"
                                    stroke="#ff7300"
                                    name="Temperatura (°C)"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Box>
                </Grid>
            </Grid>

            {alarmRules.length > 0 && (
                <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        {t('reglas_de_alarma_configuradas')}</Typography>
                    <ul>
                        {alarmRules.map((rule, index) => (
                            <li key={index}>
                                {rule.message}
                            </li>
                        ))}
                    </ul>
                </Box>
            )}

            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>{t('configurar_regla_de_alarma')}</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>{t('pid')}</InputLabel>
                        <Select
                            value={selectedPID}
                            label="PID"
                            onChange={(e) => setSelectedPID(e.target.value)}
                        >
                            {DEFAULT_PIDS.map((pid) => (
                                <MenuItem key={pid.id} value={pid.id}>
                                    {pid.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>{t('condicion_2')}</InputLabel>
                        <Select
                            value={condition}
                            label="Condición"
                            onChange={(e) => setCondition(e.target.value as 'equals' | 'greater' | 'less')}
                        >
                            <MenuItem value="equals">{t('igual_a_2')}</MenuItem>
                            <MenuItem value="greater">{t('mayor_que_1')}</MenuItem>
                            <MenuItem value="less">{t('menor_que_1')}</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        fullWidth
                        sx={{ mt: 2 }}
                        label="Valor"
                        type="number"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>{t('cancelar_1')}</Button>
                    <Button onClick={handleAddRule} variant="contained" color="primary">
                        {t('anadir_regla')}</Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

export default CANChart; 