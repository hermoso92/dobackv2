import React, { ReactNode } from 'react';
import GlobalFiltersBar from './GlobalFiltersBar';

interface FilteredPageWrapperProps {
    children: ReactNode;
    showFilters?: boolean;
}

const FilteredPageWrapper: React.FC<FilteredPageWrapperProps> = ({
    children,
    showFilters = true
}) => {
    return (
        <div className="h-full w-full">
            {/* Filtros globales - fijos en la parte superior */}
            {showFilters && <GlobalFiltersBar />}

            {/* Contenido de la página - con espacio para la barra de filtros */}
            <div
                className="w-full"
                style={{
                    paddingTop: showFilters ? '128px' : '0', // 64px nav + 64px filtros
                    minHeight: '100vh'
                }}
            >
                {children}
            </div>
        </div>
    );
};

export default FilteredPageWrapper;
