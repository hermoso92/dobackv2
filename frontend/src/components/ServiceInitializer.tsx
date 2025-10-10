import React, { useEffect } from 'react';
import { websocketService } from '../services/websocket';
interface ServiceInitializerProps {
    children: React.ReactNode;
}

const ServiceInitializer: React.FC<ServiceInitializerProps> = ({ children }) => {
    useEffect(() => {
        const initializeWebSocket = async () => {
            try {
                await websocketService.initialize();
            } catch (error) {
                console.error('Error initializing WebSocket:', error);
            }
        };

        initializeWebSocket();

        // Handle reconnection when window regains focus
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                initializeWebSocket();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            try {
                websocketService.disconnect();
            } catch (error) {
                console.warn('Error during WebSocket disconnection:', error);
            }
        };
    }, []);

    return <>{children}</>;
};

export default ServiceInitializer; 