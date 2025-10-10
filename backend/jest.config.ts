import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
    transform: {
        '^.+\\.ts$': 'ts-jest'
    },
    moduleFileExtensions: ['ts', 'js', 'json', 'node'],
    setupFiles: ['<rootDir>/src/tests/setup.ts'],
    setupFilesAfterEnv: ['<rootDir>/src/tests/setupAfterEnv.ts'],
    verbose: true,
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov'],
    coveragePathIgnorePatterns: ['/node_modules/', '/dist/', '/coverage/', '/src/tests/']
};

export default config;
