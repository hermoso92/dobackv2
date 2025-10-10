import AddIcon from '@mui/icons-material/Add';
import BuildIcon from '@mui/icons-material/Build';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SpeedIcon from '@mui/icons-material/Speed';
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography
} from '@mui/material';
import React, { useState } from 'react';
import { t } from "../i18n";

interface CANVariable {
    id: string;
    name: string;
    icon: React.ReactNode;
    unit: string;
}

interface AlarmConfig {
    id: string;
    variable: string;
    condition: 'greater' | 'less' | 'equal';
    value: number;
    message: string;
    color: string;
    notify: boolean;
}

const CAN_VARIABLES: CANVariable[] = [
    { id: 'rpm', name: 'RPM', icon: <SpeedIcon />, unit: 'rpm' },
    { id: 'speed', name: 'Velocidad', icon: <SpeedIcon />, unit: 'km/h' },
    { id: 'fuel', name: 'Nivel de Combustible', icon: <LocalGasStationIcon />, unit: '%' },
    { id: 'tps', name: 'TPS (Posición del Acelerador)', icon: <BuildIcon />, unit: '%' },
];

const COLORS = [
    { id: 'red', name: '🔴 Rojo' },
    { id: 'yellow', name: '🟡 Amarillo' },
    { id: 'orange', name: '🟠 Naranja' },
    { id: 'blue', name: '🔵 Azul' },
];

const CANAlarmConfig: React.FC = () => {
    const [alarms, setAlarms] = useState<AlarmConfig[]>([
        {
            id: '1',
            variable: 'rpm',
            condition: 'greater',
            value: 3000,
            message: '🚨 Motor sobre revolucionado',
            color: 'red',
            notify: true,
        },
        {
            id: '2',
            variable: 'speed',
            condition: 'greater',
            value: 60,
            message: '⚠️ Velocidad excesiva',
            color: 'orange',
            notify: true,
        },
    ]);

    const handleAddAlarm = () => {
        const newAlarm: AlarmConfig = {
            id: Date.now().toString(),
            variable: 'rpm',
            condition: 'greater',
            value: 0,
            message: '',
            color: 'red',
            notify: true,
        };
        setAlarms([...alarms, newAlarm]);
    };

    const handleDeleteAlarm = (id: string) => {
        setAlarms(alarms.filter(alarm => alarm.id !== id));
    };

    const handleAlarmChange = (id: string, field: keyof AlarmConfig, value: any) => {
        setAlarms(alarms.map(alarm =>
            alarm.id === id ? { ...alarm, [field]: value } : alarm
        ));
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">{t('configuracion_de_alarmas_can')}</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddAlarm}
                >
                    {t('nueva_alarma')}</Button>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                {alarms.map((alarm) => (
                    <Card key={alarm.id}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="h6">
                                    {CAN_VARIABLES.find(v => v.id === alarm.variable)?.name}
                                </Typography>
                                <IconButton
                                    color="error"
                                    onClick={() => handleDeleteAlarm(alarm.id)}
                                    size="small"
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <FormControl fullWidth>
                                    <InputLabel>{t('variable')}</InputLabel>
                                    <Select
                                        value={alarm.variable}
                                        label="Variable"
                                        onChange={(e) => handleAlarmChange(alarm.id, 'variable', e.target.value)}
                                    >
                                        {CAN_VARIABLES.map((variable) => (
                                            <MenuItem key={variable.id} value={variable.id}>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    {variable.icon}
                                                    <Typography sx={{ ml: 1 }}>
                                                        {variable.name} ({variable.unit})
                                                    </Typography>
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl fullWidth>
                                    <InputLabel>{t('condicion_1')}</InputLabel>
                                    <Select
                                        value={alarm.condition}
                                        label="Condición"
                                        onChange={(e) => handleAlarmChange(alarm.id, 'condition', e.target.value)}
                                    >
                                        <MenuItem value="greater">{t('ygt_mayor_que')}</MenuItem>
                                        <MenuItem value="less">{t('ylt_menor_que')}</MenuItem>
                                        <MenuItem value="equal">{t('igual_a_1')}</MenuItem>
                                    </Select>
                                </FormControl>

                                <TextField
                                    fullWidth
                                    label="Valor"
                                    type="number"
                                    value={alarm.value}
                                    onChange={(e) => handleAlarmChange(alarm.id, 'value', Number(e.target.value))}
                                />

                                <TextField
                                    fullWidth
                                    label="Mensaje de Alarma"
                                    value={alarm.message}
                                    onChange={(e) => handleAlarmChange(alarm.id, 'message', e.target.value)}
                                />

                                <FormControl fullWidth>
                                    <InputLabel>{t('color_en_mapa')}</InputLabel>
                                    <Select
                                        value={alarm.color}
                                        label="Color en Mapa"
                                        onChange={(e) => handleAlarmChange(alarm.id, 'color', e.target.value)}
                                    >
                                        {COLORS.map((color) => (
                                            <MenuItem key={color.id} value={color.id}>
                                                {color.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip
                                        icon={<NotificationsIcon />}
                                        label="Notificar"
                                        color={alarm.notify ? 'primary' : 'default'}
                                        onClick={() => handleAlarmChange(alarm.id, 'notify', !alarm.notify)}
                                    />
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                ))}
            </Box>
        </Box>
    );
};

export default CANAlarmConfig; 