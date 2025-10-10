import React, { forwardRef } from 'react';
import { t } from "../../i18n";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', label, error, fullWidth = false, ...props }, ref) => {
        const baseStyles = 'block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm';
        const errorStyles = error ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:outline-none focus:ring-red-500' : '';
        const widthStyles = fullWidth ? 'w-full' : '';

        const combinedStyles = `${baseStyles} ${errorStyles} ${widthStyles} ${className}`;

        return (
            <div className={fullWidth ? 'w-full' : ''}>
                {label && (
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={combinedStyles}
                    {...props}
                />
                {error && (
                    <p className="mt-2 text-sm text-red-600" id={`${props.id}-error`}>
                        {error}
                    </p>
                )}
            </div>
        );
    }
); 