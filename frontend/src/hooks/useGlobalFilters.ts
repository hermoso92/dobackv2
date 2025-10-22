import { useFiltersContext } from '../contexts/FiltersContext';

export const useGlobalFilters = () => {
    // Unificación definitiva: usar exclusivamente el contexto de filtros
    return useFiltersContext();
};
