export const getApiBaseUrl = (): string => {
    const url = import.meta.env.VITE_API_URL || 'http://localhost:9998/api';
    if (!url) {
        console.warn('VITE_API_URL no está definido, usando http://localhost:9998/api');
    }
    return url;
};
