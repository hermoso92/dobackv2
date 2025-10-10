import './test-setup.js';
import { runAllTests } from './utils/eventTester.js';
import { logger } from './utils/logger.js';
import { t } from "./i18n";

async function main() {
    try {
        logger.info('Iniciando pruebas de eventos...');
        await runAllTests();
        logger.info('Pruebas completadas exitosamente');
    } catch (error) {
        logger.error('Error ejecutando pruebas:', error);
        process.exit(1);
    }
}

main(); 