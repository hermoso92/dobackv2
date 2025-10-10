import React, { forwardRef } from 'react';
import { t } from "../../i18n";

export interface SelectOption {
    value: string | number;
    label: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'value'> {
    options: SelectOption[];
    label?: string;
    error?: string;
    value?: string | number;
    fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ className = '', label, error, options, fullWidth = false, ...props }, ref) => {
        const baseStyles = 'block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm';
        const errorStyles = error ? 'border-red-300 text-red-900 focus:border-red-500 focus:outline-none focus:ring-red-500' : '';
        const widthStyles = fullWidth ? 'w-full' : '';

        const combinedStyles = `${baseStyles} ${errorStyles} ${widthStyles} ${className}`;

        return (
            <div className={fullWidth ? 'w-full' : ''}>
                {label && (
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {label}
                    </label>
                )}
                <select
                    ref={ref}
                    className={combinedStyles}
                    {...props}
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                {error && (
                    <p className="mt-2 text-sm text-red-600" id={`${props.id}-error`}>
                        {error}
                    </p>
                )}
            </div>
        );
    }
); 