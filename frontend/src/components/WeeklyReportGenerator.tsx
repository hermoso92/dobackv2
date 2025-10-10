import { Button } from '@mui/material';
import React from 'react';

const WeeklyReportGenerator: React.FC = () => {
    const handleClick = () => {
        window.alert('El informe semanal estara disponible proximamente.');
    };

    return (
        <Button variant="outlined" onClick={handleClick}>
            Informe semanal
        </Button>
    );
};

export default WeeklyReportGenerator;
