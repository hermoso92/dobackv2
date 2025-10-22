/**
 * 🧪 TESTS - useFileUpload Hook
 * 
 * Tests unitarios para el hook de subida de archivos
 */

import { act, renderHook } from '@testing-library/react';
import { useFileUpload } from '../hooks/useFileUpload';

describe('useFileUpload', () => {
    test('debe inicializar con estado vacío', () => {
        const { result } = renderHook(() => useFileUpload());

        expect(result.current.selectedFiles).toEqual([]);
        expect(result.current.uploading).toBe(false);
        expect(result.current.uploadResult).toBeNull();
        expect(result.current.uploadError).toBeNull();
    });

    test('debe validar formato de archivo correctamente', () => {
        const { result } = renderHook(() => useFileUpload());

        const validFile = new File(['content'], 'ESTABILIDAD_DOBACK023_20250930.txt', { type: 'text/plain' });
        const invalidFile = new File(['content'], 'archivo_invalido.txt', { type: 'text/plain' });

        const validEvent = {
            target: { files: [validFile] }
        } as unknown as React.ChangeEvent<HTMLInputElement>;

        act(() => {
            result.current.handleFileSelect(validEvent);
        });

        expect(result.current.selectedFiles).toHaveLength(1);
        expect(result.current.uploadError).toBeNull();
    });

    test('debe rechazar archivo con formato inválido', () => {
        const { result } = renderHook(() => useFileUpload());

        const invalidFile = new File(['content'], 'archivo_invalido.txt', { type: 'text/plain' });

        const invalidEvent = {
            target: { files: [invalidFile] }
        } as unknown as React.ChangeEvent<HTMLInputElement>;

        act(() => {
            result.current.handleFileSelect(invalidEvent);
        });

        expect(result.current.selectedFiles).toHaveLength(0);
        expect(result.current.uploadError).toContain('Formato inválido');
    });

    test('debe remover archivo por índice', () => {
        const { result } = renderHook(() => useFileUpload());

        const file1 = new File(['content'], 'ESTABILIDAD_DOBACK023_20250930.txt');
        const file2 = new File(['content'], 'GPS_DOBACK023_20250930.txt');

        const event = {
            target: { files: [file1, file2] }
        } as unknown as React.ChangeEvent<HTMLInputElement>;

        act(() => {
            result.current.handleFileSelect(event);
        });

        expect(result.current.selectedFiles).toHaveLength(2);

        act(() => {
            result.current.removeFile(0);
        });

        expect(result.current.selectedFiles).toHaveLength(1);
        expect(result.current.selectedFiles[0].name).toBe('GPS_DOBACK023_20250930.txt');
    });

    test('debe limpiar todos los archivos', () => {
        const { result } = renderHook(() => useFileUpload());

        const file = new File(['content'], 'ESTABILIDAD_DOBACK023_20250930.txt');
        const event = {
            target: { files: [file] }
        } as unknown as React.ChangeEvent<HTMLInputElement>;

        act(() => {
            result.current.handleFileSelect(event);
        });

        expect(result.current.selectedFiles).toHaveLength(1);

        act(() => {
            result.current.clearAllFiles();
        });

        expect(result.current.selectedFiles).toHaveLength(0);
        expect(result.current.uploadResult).toBeNull();
        expect(result.current.uploadError).toBeNull();
    });
});

