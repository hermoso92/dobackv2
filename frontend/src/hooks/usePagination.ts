import { useCallback, useMemo, useState } from 'react';

export interface PaginationOptions {
    page?: number;
    limit?: number;
    total?: number;
}

export interface PaginationState {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
    offset: number;
}

export interface PaginationActions {
    setPage: (page: number) => void;
    setLimit: (limit: number) => void;
    setTotal: (total: number) => void;
    nextPage: () => void;
    previousPage: () => void;
    goToFirstPage: () => void;
    goToLastPage: () => void;
    reset: () => void;
}

export interface UsePaginationReturn {
    pagination: PaginationState;
    actions: PaginationActions;
    queryParams: {
        page: number;
        limit: number;
        offset: number;
    };
}

export const usePagination = (
    initialOptions: PaginationOptions = {}
): UsePaginationReturn => {
    const [page, setPage] = useState(initialOptions.page || 1);
    const [limit, setLimit] = useState(initialOptions.limit || 20);
    const [total, setTotal] = useState(initialOptions.total || 0);

    const pagination = useMemo((): PaginationState => {
        const totalPages = Math.ceil(total / limit);
        const offset = (page - 1) * limit;

        return {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrevious: page > 1,
            offset
        };
    }, [page, limit, total]);

    const actions = useMemo((): PaginationActions => {
        const setPageSafe = (newPage: number) => {
            const maxPage = Math.ceil(total / limit);
            setPage(Math.max(1, Math.min(newPage, maxPage)));
        };

        const setLimitSafe = (newLimit: number) => {
            setLimit(Math.max(1, newLimit));
            // Ajustar página si es necesario
            const maxPage = Math.ceil(total / newLimit);
            if (page > maxPage) {
                setPage(maxPage || 1);
            }
        };

        return {
            setPage: setPageSafe,
            setLimit: setLimitSafe,
            setTotal,
            nextPage: () => setPageSafe(page + 1),
            previousPage: () => setPageSafe(page - 1),
            goToFirstPage: () => setPageSafe(1),
            goToLastPage: () => setPageSafe(Math.ceil(total / limit)),
            reset: () => {
                setPage(1);
                setLimit(initialOptions.limit || 20);
                setTotal(0);
            }
        };
    }, [page, limit, total, initialOptions.limit]);

    const queryParams = useMemo(() => ({
        page: pagination.page,
        limit: pagination.limit,
        offset: pagination.offset
    }), [pagination]);

    return {
        pagination,
        actions,
        queryParams
    };
};

export interface UsePaginatedDataOptions<T> {
    initialLimit?: number;
    fetchFunction: (page: number, limit: number) => Promise<{ data: T[]; total: number }>;
    onError?: (error: Error) => void;
    onSuccess?: (data: T[], total: number) => void;
}

export interface UsePaginatedDataReturn<T> {
    data: T[];
    loading: boolean;
    error: string | null;
    pagination: PaginationState;
    actions: PaginationActions & {
        changePage: (page: number) => Promise<void>;
        changeLimit: (limit: number) => Promise<void>;
        refresh: () => Promise<void>;
        loadPage: (page: number) => Promise<void>;
    };
    queryParams: {
        page: number;
        limit: number;
        offset: number;
    };
}

export const usePaginatedData = <T>(
    options: UsePaginatedDataOptions<T>
): UsePaginatedDataReturn<T> => {
    const {
        initialLimit = 20,
        fetchFunction,
        onError,
        onSuccess
    } = options;

    const { pagination, actions, queryParams } = usePagination({
        limit: initialLimit
    });

    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async (pageNum: number = pagination.page, limitNum: number = pagination.limit) => {
        setLoading(true);
        setError(null);

        try {
            const result = await fetchFunction(pageNum, limitNum);
            setData(result.data);
            actions.setTotal(result.total);

            if (onSuccess) {
                onSuccess(result.data, result.total);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error cargando datos';
            setError(errorMessage);

            if (onError) {
                onError(err instanceof Error ? err : new Error(errorMessage));
            }
        } finally {
            setLoading(false);
        }
    }, [fetchFunction, pagination.page, pagination.limit, actions, onError, onSuccess]);

    const changePage = useCallback(async (newPage: number) => {
        actions.setPage(newPage);
        await loadData(newPage, pagination.limit);
    }, [actions, loadData, pagination.limit]);

    const changeLimit = useCallback(async (newLimit: number) => {
        actions.setLimit(newLimit);
        await loadData(1, newLimit); // Reset to first page when changing limit
    }, [actions, loadData]);

    const refresh = useCallback(async () => {
        await loadData(pagination.page, pagination.limit);
    }, [loadData, pagination.page, pagination.limit]);

    const loadPage = useCallback(async (pageNum: number) => {
        await changePage(pageNum);
    }, [changePage]);

    const enhancedActions = {
        ...actions,
        changePage,
        changeLimit,
        refresh,
        loadPage
    };

    return {
        data,
        loading,
        error,
        pagination,
        actions: enhancedActions,
        queryParams
    };
};

export interface UseInfiniteScrollOptions<T> {
    fetchFunction: (page: number, limit: number) => Promise<{ data: T[]; total: number; hasMore: boolean }>;
    initialLimit?: number;
    onError?: (error: Error) => void;
    onLoadMore?: (newData: T[]) => void;
}

export interface UseInfiniteScrollReturn<T> {
    data: T[];
    loading: boolean;
    loadingMore: boolean;
    error: string | null;
    hasMore: boolean;
    actions: {
        loadMore: () => Promise<void>;
        refresh: () => Promise<void>;
        reset: () => void;
    };
}

export const useInfiniteScroll = <T>(
    options: UseInfiniteScrollOptions<T>
): UseInfiniteScrollReturn<T> => {
    const {
        fetchFunction,
        initialLimit = 20,
        onError,
        onLoadMore
    } = options;

    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const loadMore = useCallback(async () => {
        if (loadingMore || !hasMore) return;

        setLoadingMore(true);
        setError(null);

        try {
            const result = await fetchFunction(page, initialLimit);

            if (page === 1) {
                setData(result.data);
            } else {
                setData(prev => [...prev, ...result.data]);
            }

            setHasMore(result.hasMore);
            setPage(prev => prev + 1);

            if (onLoadMore) {
                onLoadMore(result.data);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error cargando más datos';
            setError(errorMessage);

            if (onError) {
                onError(err instanceof Error ? err : new Error(errorMessage));
            }
        } finally {
            setLoadingMore(false);
        }
    }, [fetchFunction, page, initialLimit, loadingMore, hasMore, onError, onLoadMore]);

    const refresh = useCallback(async () => {
        setLoading(true);
        setError(null);
        setPage(1);
        setHasMore(true);

        try {
            const result = await fetchFunction(1, initialLimit);
            setData(result.data);
            setHasMore(result.hasMore);
            setPage(2);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error refrescando datos';
            setError(errorMessage);

            if (onError) {
                onError(err instanceof Error ? err : new Error(errorMessage));
            }
        } finally {
            setLoading(false);
        }
    }, [fetchFunction, initialLimit, onError]);

    const reset = useCallback(() => {
        setData([]);
        setPage(1);
        setHasMore(true);
        setError(null);
        setLoading(false);
        setLoadingMore(false);
    }, []);

    return {
        data,
        loading,
        loadingMore,
        error,
        hasMore,
        actions: {
            loadMore,
            refresh,
            reset
        }
    };
};

export default {
    usePagination,
    usePaginatedData,
    useInfiniteScroll
};