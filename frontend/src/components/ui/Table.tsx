import React from 'react';
import { t } from "../../i18n";

export interface Column<T> {
    key: string;
    title: string;
    render?: (value: any, record: T, index: number) => React.ReactNode;
}

export interface TableProps<T> {
    columns: Column<T>[];
    data: T[];
    className?: string;
    rowKey?: string | ((record: T) => string);
    loading?: boolean;
    emptyText?: React.ReactNode;
}

export function Table<T extends Record<string, any>>({
    columns,
    data,
    className = '',
    rowKey = 'id',
    loading = false,
    emptyText = 'No hay datos disponibles'
}: TableProps<T>) {
    const baseStyles = 'min-w-full divide-y divide-gray-200';
    const combinedStyles = `${baseStyles} ${className}`;

    const getRowKey = (record: T, index: number): string => {
        if (typeof rowKey === 'function') {
            return rowKey(record);
        }
        return record[rowKey]?.toString() || index.toString();
    };

    return (
        <div className="overflow-x-auto">
            <table className={combinedStyles}>
                <thead className="bg-gray-50">
                    <tr>
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                {column.title}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                        <tr>
                            <td
                                colSpan={columns.length}
                                className="px-6 py-4 text-center text-sm text-gray-500"
                            >
                                {t('cargando_5')}</td>
                        </tr>
                    ) : data.length === 0 ? (
                        <tr>
                            <td
                                colSpan={columns.length}
                                className="px-6 py-4 text-center text-sm text-gray-500"
                            >
                                {emptyText}
                            </td>
                        </tr>
                    ) : (
                        data.map((record, index) => (
                            <tr key={getRowKey(record, index)}>
                                {columns.map((column) => (
                                    <td
                                        key={`${getRowKey(record, index)}-${column.key}`}
                                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                                    >
                                        {column.render
                                            ? column.render(record[column.key], record, index)
                                            : record[column.key]}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
} 