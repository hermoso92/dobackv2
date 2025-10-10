import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import {
    Box,
    Checkbox,
    Collapse,
    FormControlLabel,
    IconButton,
    Paper,
    Tooltip,
    Typography
} from '@mui/material';
import React from 'react';
import { StabilityDataPoint, VariableGroup } from '../types/stability';
import { t } from "../i18n";

interface VariableSelectorProps {
    variableGroups: VariableGroup[];
    selectedVariables: Record<keyof StabilityDataPoint, boolean>;
    onVariableChange: (variable: keyof StabilityDataPoint) => void;
}

const VariableSelector: React.FC<VariableSelectorProps> = ({
    variableGroups,
    selectedVariables,
    onVariableChange
}) => {
    const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>(
        variableGroups.reduce((acc, group) => ({ ...acc, [group.title]: true }), {})
    );

    const toggleGroup = (groupTitle: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupTitle]: !prev[groupTitle]
        }));
    };

    return (
        <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                {t('variables')}</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {variableGroups.map(group => (
                    <Box key={group.title} sx={{ flex: '1 1 300px', minWidth: 0 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                mb: 1,
                                cursor: 'pointer'
                            }}
                            onClick={() => toggleGroup(group.title)}
                        >
                            <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
                                {group.title}
                            </Typography>
                            <IconButton size="small">
                                {expandedGroups[group.title] ? (
                                    <ChevronUpIcon className="h-4 w-4" />
                                ) : (
                                    <ChevronDownIcon className="h-4 w-4" />
                                )}
                            </IconButton>
                        </Box>
                        <Collapse in={expandedGroups[group.title]}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                {group.variables.map(variable => (
                                    <FormControlLabel
                                        key={variable.key}
                                        control={
                                            <Checkbox
                                                size="small"
                                                checked={selectedVariables[variable.key as keyof StabilityDataPoint]}
                                                onChange={() => onVariableChange(variable.key as keyof StabilityDataPoint)}
                                            />
                                        }
                                        label={
                                            <Tooltip title={`${variable.label} (${variable.unit})`}>
                                                <Typography variant="body2" noWrap>
                                                    {variable.label}
                                                </Typography>
                                            </Tooltip>
                                        }
                                        sx={{ m: 0 }}
                                    />
                                ))}
                            </Box>
                        </Collapse>
                    </Box>
                ))}
            </Box>
        </Paper>
    );
};

export default VariableSelector; 