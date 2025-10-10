export const getMetricColor = (metric: string, value: number): string => {
    switch (metric) {
        case 'ltr':
            return Math.abs(value) > 0.8 ? '#ff4d4f' : Math.abs(value) > 0.6 ? '#faad14' : '#52c41a';
        case 'ssf':
            return value < 1.2 ? '#ff4d4f' : value < 1.5 ? '#faad14' : '#52c41a';
        case 'drs':
            return value < 1.0 ? '#ff4d4f' : value < 1.2 ? '#faad14' : '#52c41a';
        case 'rsc':
            return value < 1.0 ? '#ff4d4f' : value < 1.2 ? '#faad14' : '#52c41a';
        default:
            return '#52c41a';
    }
};

export const getSeverityColor = (severity: string): string => {
    switch (severity) {
        case 'critical':
            return '#ff4d4f';
        case 'warning':
            return '#faad14';
        case 'info':
            return '#1890ff';
        default:
            return '#52c41a';
    }
}; 