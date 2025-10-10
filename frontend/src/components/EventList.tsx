import { List, ListItem, ListItemText, Typography } from '@mui/material';
import React from 'react';
import { Event } from '../types/events';
interface EventListProps {
    events: Event[];
}

const EventList: React.FC<EventListProps> = ({ events }) => {
    const getStatusColor = (status: string): string => {
        switch (status) {
            case 'active':
                return 'error.main';
            case 'acknowledged':
                return 'warning.main';
            case 'resolved':
                return 'success.main';
            default:
                return 'text.secondary';
        }
    };

    const formatTime = (timestamp: number): string => {
        const minutes = Math.floor(timestamp / 60);
        const seconds = Math.floor(timestamp % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <List>
            {events.map((event, index) => (
                <ListItem
                    key={index}
                    sx={{
                        mb: 1,
                        borderLeft: 4,
                        borderColor: getStatusColor(event.status),
                        bgcolor: 'background.paper'
                    }}
                >
                    <ListItemText
                        primary={
                            <Typography variant="subtitle2">
                                {formatTime(event.timestamp)} - {event.message}
                            </Typography>
                        }
                        secondary={
                            <Typography variant="body2" color="text.secondary">
                                {Object.entries(event.data).map(([key, value]) => (
                                    `${key}: ${typeof value === 'number' ? value.toFixed(2) : value}`
                                )).join(' | ')}
                            </Typography>
                        }
                    />
                </ListItem>
            ))}
            {events.length === 0 && (
                <ListItem>
                    <ListItemText
                        primary="No se han detectado eventos"
                        secondary="La sesión transcurre con normalidad"
                    />
                </ListItem>
            )}
        </List>
    );
};

export default EventList; 