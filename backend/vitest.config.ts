import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['./vitest.setup.ts'],
        include: [
            '**/__tests__/**/*.{test,spec}.{js,ts}',
            '**/*.{test,spec}.{js,ts}'
        ],
        exclude: [
            'node_modules',
            'dist',
            '.git',
            '.cache'
        ],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            reportsDirectory: './coverage',
            exclude: [
                'node_modules/',
                'dist/',
                'coverage/',
                '**/*.d.ts',
                '**/*.config.{js,ts}',
                '**/migrations/**',
                '**/prisma/**',
                '**/scripts/**'
            ],
            thresholds: {
                global: {
                    branches: 70,
                    functions: 70,
                    lines: 70,
                    statements: 70
                }
            }
        },
        testTimeout: 10000,
        hookTimeout: 10000,
        teardownTimeout: 10000
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './src')
        }
    }
});
