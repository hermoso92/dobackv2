import {
    AllInclusive as AllTimeIcon,
    CalendarToday as CalendarIcon,
    DateRange as DateRangeIcon
} from '@mui/icons-material';
import { Box, Button, ButtonGroup, Typography } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { es } from 'date-fns/locale';
import React, { useState } from 'react';

export interface DateRangeConfig {
    type: 'single' | 'range' | 'all_time';
    startDate?: Date;
    endDate?: Date;
    singleDate?: Date;
}

interface DateRangeSelectorProps {
    onDateRangeChange: (config: DateRangeConfig) => void;
    initialConfig?: DateRangeConfig;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
    onDateRangeChange,
    initialConfig = { type: 'single', singleDate: new Date() }
}) => {
    const [config, setConfig] = useState<DateRangeConfig>(initialConfig);

    const handleTypeChange = (type: 'single' | 'range' | 'all_time') => {
        const newConfig: DateRangeConfig = { type };

        if (type === 'single') {
            newConfig.singleDate = config.singleDate || new Date();
        } else if (type === 'range') {
            newConfig.startDate = config.startDate || new Date();
            newConfig.endDate = config.endDate || new Date();
        }

        setConfig(newConfig);
        onDateRangeChange(newConfig);
    };

    const handleSingleDateChange = (date: Date | null) => {
        if (date) {
            const newConfig = { ...config, singleDate: date };
            setConfig(newConfig);
            onDateRangeChange(newConfig);
        }
    };

    const handleStartDateChange = (date: Date | null) => {
        if (date) {
            const newConfig = { ...config, startDate: date };
            setConfig(newConfig);
            onDateRangeChange(newConfig);
        }
    };

    const handleEndDateChange = (date: Date | null) => {
        if (date) {
            const newConfig = { ...config, endDate: date };
            setConfig(newConfig);
            onDateRangeChange(newConfig);
        }
    };

    const getPresetRanges = () => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);

        const lastMonth = new Date(today);
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        return [
            { label: 'Ayer', start: yesterday, end: yesterday },
            { label: 'Ultima semana', start: lastWeek, end: today },
            { label: 'Ultimo mes', start: lastMonth, end: today }
        ];
    };

    const applyPresetRange = (start: Date, end: Date) => {
        const newConfig: DateRangeConfig = {
            type: 'range',
            startDate: start,
            endDate: end
        };
        setConfig(newConfig);
        onDateRangeChange(newConfig);
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2, backgroundColor: '#fafafa' }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon />
                    Configuracion de Analisis
                </Typography>

                <Box sx={{ mb: 2 }}>
                    <ButtonGroup variant="outlined" fullWidth>
                        <Button
                            startIcon={<CalendarIcon />}
                            variant={config.type === 'single' ? 'contained' : 'outlined'}
                            onClick={() => handleTypeChange('single')}
                        >
                            Dia Especifico
                        </Button>
                        <Button
                            startIcon={<DateRangeIcon />}
                            variant={config.type === 'range' ? 'contained' : 'outlined'}
                            onClick={() => handleTypeChange('range')}
                        >
                            Rango de Fechas
                        </Button>
                        <Button
                            startIcon={<AllTimeIcon />}
                            variant={config.type === 'all_time' ? 'contained' : 'outlined'}
                            onClick={() => handleTypeChange('all_time')}
                        >
                            Todo el Tiempo
                        </Button>
                    </ButtonGroup>
                </Box>

                {config.type === 'single' && (
                    <Box sx={{ mb: 2 }}>
                        <DatePicker
                            label="Fecha de analisis"
                            value={config.singleDate}
                            onChange={handleSingleDateChange}
                            slotProps={{ textField: { fullWidth: true } }}
                        />
                    </Box>
                )}

                {config.type === 'range' && (
                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                            <DatePicker
                                label="Fecha inicio"
                                value={config.startDate}
                                onChange={handleStartDateChange}
                                slotProps={{ textField: { fullWidth: true } }}
                            />
                            <DatePicker
                                label="Fecha fin"
                                value={config.endDate}
                                onChange={handleEndDateChange}
                                slotProps={{ textField: { fullWidth: true } }}
                            />
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" gutterBottom>
                                Rangos preestablecidos:
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {getPresetRanges().map((preset, index) => (
                                    <Button
                                        key={index}
                                        size="small"
                                        variant="outlined"
                                        onClick={() => applyPresetRange(preset.start, preset.end)}
                                    >
                                        {preset.label}
                                    </Button>
                                ))}
                            </Box>
                        </Box>
                    </Box>
                )}

                {config.type === 'all_time' && (
                    <Box sx={{ p: 2, backgroundColor: '#e3f2fd', borderRadius: 1 }}>
                        <Typography variant="body2" color="primary">
                            Se analizaran todos los datos historicos disponibles del vehiculo
                        </Typography>
                    </Box>
                )}
            </Box>
        </LocalizationProvider>
    );
};

export default DateRangeSelector;