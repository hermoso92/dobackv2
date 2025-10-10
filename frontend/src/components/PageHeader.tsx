import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import { Box, Button, InputAdornment, TextField, Typography } from '@mui/material';
import React from 'react';
interface PageHeaderProps {
    title: string;
    onAdd?: () => void;
    addButtonText?: string;
    searchTerm: string;
    onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    searchPlaceholder?: string;
}

/**
 * Componente de encabezado de página reutilizable
 * Proporciona un estilo coherente para todas las páginas con título, descripción y acciones.
 */
const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    onAdd,
    addButtonText = 'Nuevo',
    searchTerm,
    onSearchChange,
    searchPlaceholder = 'Buscar...'
}) => {
    return (
        <Box sx={{ my: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    {title}
                </Typography>
                {onAdd && (
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={onAdd}
                        sx={{ minWidth: 200 }}
                    >
                        {addButtonText}
                    </Button>
                )}
            </Box>

            <Box sx={{ mb: 2 }}>
                <TextField
                    size="small"
                    variant="outlined"
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={onSearchChange}
                    sx={{ minWidth: 250 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>
        </Box>
    );
};

export default PageHeader; 