import { t } from "./i18n";

// Mock localStorage
const localStorageMock = {
    getItem: (key: string) => null,
    setItem: (key: string, value: string) => { },
    removeItem: (key: string) => { },
    clear: () => { },
    key: (index: number) => null,
    length: 0
};

global.localStorage = localStorageMock;

// Mock window
global.window = {
    localStorage: localStorageMock,
} as any;

// Configuración global para las pruebas
process.env.NODE_ENV = 'test'; 