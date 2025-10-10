import { FilterList, Refresh } from '@mui/icons-material';
import { Box, Card, CardContent, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import React, { useState } from 'react';
import { Event } from '../types/events';
import { t } from "../i18n";

interface EventManagerProps {
    events: Event[];
    onRefresh: () => void;
    onStatusChange: (status: string) => void;
}

export const EventManager: React.FC<EventManagerProps> = ({
    events,
    onRefresh,
    onStatusChange
}) => {
    const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedStatus, setSelectedStatus] = useState<string>('all');

    const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
        setFilterAnchorEl(event.currentTarget);
    };

    const handleFilterClose = () => {
        setFilterAnchorEl(null);
    };

    const handleStatusFilter = (status: string) => {
        setSelectedStatus(status);
        onStatusChange(status);
        handleFilterClose();
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active':
                return 'error';
            case 'acknowledged':
                return 'warning';
            case 'resolved':
                return 'success';
            default:
                return 'default';
        }
    };

    const filteredEvents = events.filter(event => {
        const statusMatch = selectedStatus === 'all' || event.status === selectedStatus;
        return statusMatch;
    });

    return (
        <Box sx={{ width: '100%', p: 2 }}>
            <Card>
                <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6">{t('event_manager')}</Typography>
                        <Box>
                            <IconButton onClick={handleFilterClick}>
                                <FilterList />
                            </IconButton>
                            <IconButton onClick={onRefresh}>
                                <Refresh />
                            </IconButton>
                        </Box>
                    </Box>

                    <Menu
                        anchorEl={filterAnchorEl}
                        open={Boolean(filterAnchorEl)}
                        onClose={handleFilterClose}
                    >
                        <MenuItem onClick={() => handleStatusFilter('all')}>
                            {t('all_statuses')}</MenuItem>
                        <MenuItem onClick={() => handleStatusFilter('active')}>
                            {t('active')}</MenuItem>
                        <MenuItem onClick={() => handleStatusFilter('acknowledged')}>
                            {t('acknowledged')}</MenuItem>
                        <MenuItem onClick={() => handleStatusFilter('resolved')}>
                            {t('resolved')}</MenuItem>
                    </Menu>

                    {filteredEvents.map((event) => (
                        <Box
                            key={event.id}
                            sx={{
                                p: 2,
                                mb: 1,
                                borderLeft: 4,
                                borderColor: getStatusColor(event.status),
                                bgcolor: 'background.paper'
                            }}
                        >
                            <Typography variant="subtitle1">{event.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {event.description}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {t('status_1')}{event.status}
                            </Typography>
                        </Box>
                    ))}
                </CardContent>
            </Card>
        </Box>
    );
}; 