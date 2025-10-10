import { z } from 'zod';
import { RiskLevel } from './domain';

export enum RuleOperator {
    GREATER_THAN = '>',
    LESS_THAN = '<',
    EQUALS = '==',
    NOT_EQUALS = '!=',
    GREATER_THAN_EQUALS = '>=',
    LESS_THAN_EQUALS = '<=',
    AND = '&&',
    OR = '||'
}

export enum RuleActionType {
    GENERATE_ALARM = 'generate_alarm',
    SEND_NOTIFICATION = 'send_notification',
    LOG_EVENT = 'log_event',
    TRIGGER_MAINTENANCE = 'trigger_maintenance',
    STOP_RECORDING = 'stop_recording'
}

export const ruleConditionSchema = z.object({
    field: z.string(),
    operator: z.nativeEnum(RuleOperator),
    value: z.union([z.string(), z.number(), z.boolean()]),
    unit: z.string().optional()
});

export const ruleActionSchema = z.object({
    type: z.nativeEnum(RuleActionType),
    params: z.record(z.unknown()).optional(),
    delay: z.number().min(0).optional(), // delay in milliseconds
    retryCount: z.number().min(0).optional(),
    retryInterval: z.number().min(0).optional() // retry interval in milliseconds
});

export const ruleSchema = z.object({
    id: z.number(),
    organizationId: z.number(),
    name: z.string(),
    description: z.string(),
    enabled: z.boolean(),
    conditions: z.array(ruleConditionSchema).min(1),
    actions: z.array(ruleActionSchema).min(1),
    severity: z.nativeEnum(RiskLevel),
    metadata: z.record(z.unknown()).optional(),
    createdAt: z.date(),
    updatedAt: z.date()
});

export type RuleCondition = z.infer<typeof ruleConditionSchema>;
export type RuleAction = z.infer<typeof ruleActionSchema>;
export type Rule = z.infer<typeof ruleSchema>;
