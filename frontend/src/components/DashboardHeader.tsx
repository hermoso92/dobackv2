import {
    Box,
    Typography,
    useTheme
} from '@mui/material';
import React from 'react';

interface DashboardHeaderProps {
    title?: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    title = "Dashboard"
}) => {
    const theme = useTheme();

    return (
        <Box
            sx={{
                mb: 3,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                borderRadius: 2,
                p: 3,
                color: 'white'
            }}
        >
            <Typography
                variant="h4"
                component="h1"
                sx={{
                    fontWeight: 'bold',
                    textAlign: 'center'
                }}
            >
                {title}
            </Typography>
        </Box>
    );
};

export default DashboardHeader; 