/**
 * 📦 FILE UPLOAD MANAGER - COMPONENTE PRINCIPAL MODULARIZADO
 * 
 * Componente principal que orquesta la funcionalidad de upload
 * dividido en sub-componentes para mejor mantenibilidad.
 * 
 * @version 2.0 (Modularizado)
 * @date 2025-10-22
 */

import { Box, Tab, Tabs, Typography } from '@mui/material';
import React, { useState } from 'react';
import { AutoProcessTab } from './AutoProcessTab';
import { ManualUploadTab } from './ManualUploadTab';
import { useAutoProcess } from './hooks/useAutoProcess';
import { useFileUpload } from './hooks/useFileUpload';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`upload-tabpanel-${index}`}
            aria-labelledby={`upload-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

/**
 * Componente principal del File Upload Manager
 */
const FileUploadManager: React.FC = () => {
    const [currentTab, setCurrentTab] = useState(0);

    // Custom hooks para separar lógica de negocio
    const fileUploadState = useFileUpload();
    const autoProcessState = useAutoProcess();

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setCurrentTab(newValue);
    };

    return (
        <Box sx={{ p: 3, maxWidth: '1400px', mx: 'auto', overflowY: 'auto', height: 'calc(100vh - 100px)' }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Gestión de Datos de Vehículos
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                Sube archivos individuales o procesa automáticamente todos los vehículos de CMadrid
            </Typography>

            {/* Pestañas */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={currentTab} onChange={handleTabChange} aria-label="upload tabs">
                    <Tab label="Subida Manual" id="upload-tab-0" aria-controls="upload-tabpanel-0" />
                    <Tab label="Procesamiento Automático" id="upload-tab-1" aria-controls="upload-tabpanel-1" />
                </Tabs>
            </Box>

            {/* Pestaña 1: Subida Manual */}
            <TabPanel value={currentTab} index={0}>
                <ManualUploadTab {...fileUploadState} />
            </TabPanel>

            {/* Pestaña 2: Procesamiento Automático */}
            <TabPanel value={currentTab} index={1}>
                <AutoProcessTab {...autoProcessState} />
            </TabPanel>
        </Box>
    );
};

export default FileUploadManager;

