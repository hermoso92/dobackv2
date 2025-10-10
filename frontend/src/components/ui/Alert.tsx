import React from 'react';
import { cn } from '../../utils/cn';
import { t } from "../../i18n";

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'destructive';
}

export const Alert: React.FC<AlertProps> = ({
    className,
    variant = 'default',
    ...props
}) => {
    return (
        <div
            className={cn(
                'relative w-full rounded-lg border p-4',
                {
                    'bg-background text-foreground': variant === 'default',
                    'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive': variant === 'destructive'
                },
                className
            )}
            {...props}
        />
    );
};

export const AlertTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
    className,
    ...props
}) => {
    return (
        <h5
            className={cn('mb-1 font-medium leading-none tracking-tight', className)}
            {...props}
        />
    );
};

export const AlertDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
    className,
    ...props
}) => {
    return (
        <div
            className={cn('text-sm [&_p]:leading-relaxed', className)}
            {...props}
        />
    );
}; 