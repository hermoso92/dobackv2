export const formatDate = (date: string): string => {
    return new Date(date).toLocaleString();
};

export const formatNumber = (value: number, precision: number = 3): string => {
    return value.toFixed(precision);
};

export const formatLocation = (location: { latitude: number; longitude: number }): string => {
    return `Lat: ${location.latitude.toFixed(4)}, Lon: ${location.longitude.toFixed(4)}`;
}; 