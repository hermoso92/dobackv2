import { Box } from '@mui/material';
import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
    return (
        <Box
            sx={{
                minHeight: '100vh',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <Outlet />
        </Box>
    );
};