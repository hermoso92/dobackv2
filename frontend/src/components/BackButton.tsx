import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import React from 'react';
import { useNavigate } from 'react-router-dom';
const BackButton: React.FC<{ sx?: any }> = ({ sx }) => {
    const navigate = useNavigate();

    const handleBack = () => {
        if (window.history.length > 2) {
            navigate(-1);
        } else {
            navigate('/dashboard');
        }
    };

    return (
        <Tooltip title="Volver">
            <IconButton onClick={handleBack} sx={sx} aria-label="Volver">
                <ArrowBackIcon />
            </IconButton>
        </Tooltip>
    );
};

export default BackButton; 