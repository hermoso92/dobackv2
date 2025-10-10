import { Alert, AlertTitle } from '@mui/material';
import React from 'react';
import { t } from "../../i18n";

interface ErrorMessageProps {
    message: string | Error | null;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
    if (!message) return null;

    const errorMessage = message instanceof Error ? message.message : message;

    return (
        <Alert severity="error" sx={{ mt: 2 }}>
            <AlertTitle>{t('error_3')}</AlertTitle>
            {errorMessage}
        </Alert>
    );
}; 