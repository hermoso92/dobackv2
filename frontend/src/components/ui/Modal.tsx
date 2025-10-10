import React, { useEffect } from 'react';
import { t } from "../../i18n";

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = 'md',
    className = '',
}) => {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEsc);

        return () => {
            document.removeEventListener('keydown', handleEsc);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
    };

    const baseStyles = 'bg-white rounded-lg shadow-xl overflow-hidden';
    const combinedStyles = `${baseStyles} ${sizeClasses[size]} ${className}`;

    return (
        <div className="fixed inset-0 z-50 overflow-auto bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
            <div className={combinedStyles}>
                {title && (
                    <div className="px-4 py-3 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
                    </div>
                )}

                <div className="px-4 py-5">{children}</div>

                {footer && (
                    <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}; 