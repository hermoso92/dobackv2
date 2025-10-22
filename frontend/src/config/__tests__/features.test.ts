/**
 * 🧪 TESTS - Feature Flags
 * 
 * Tests unitarios para el sistema de feature flags
 */

import { FEATURE_FLAGS, isFeatureEnabled } from '../features';

describe('Feature Flags', () => {
    describe('isFeatureEnabled', () => {
        test('allowDatabaseCleanup debe requerir rol ADMIN', () => {
            expect(isFeatureEnabled('allowDatabaseCleanup', 'USER')).toBe(false);
            expect(isFeatureEnabled('allowDatabaseCleanup', 'ADMIN')).toBeTruthy();
        });

        test('allowMassDelete debe requerir rol ADMIN', () => {
            expect(isFeatureEnabled('allowMassDelete', 'USER')).toBe(false);
            expect(isFeatureEnabled('allowMassDelete', 'ADMIN')).toBeTruthy();
        });

        test('enableParserV2 debe estar siempre activo', () => {
            expect(isFeatureEnabled('enableParserV2')).toBe(true);
        });

        test('enableAutoReprocessing debe estar activo', () => {
            expect(isFeatureEnabled('enableAutoReprocessing')).toBe(true);
        });
    });

    describe('FEATURE_FLAGS', () => {
        test('uploadTimeoutMs debe ser al menos 5 minutos', () => {
            expect(FEATURE_FLAGS.uploadTimeoutMs).toBeGreaterThanOrEqual(300000);
        });

        test('processingRateLimitMs debe ser 10 minutos', () => {
            expect(FEATURE_FLAGS.processingRateLimitMs).toBe(10 * 60 * 1000);
        });

        test('maxFilesPerUpload debe tener un límite razonable', () => {
            expect(FEATURE_FLAGS.maxFilesPerUpload).toBeGreaterThan(0);
            expect(FEATURE_FLAGS.maxFilesPerUpload).toBeLessThanOrEqual(10000);
        });
    });
});

