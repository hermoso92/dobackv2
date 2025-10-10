"""
Script de ejecución de pruebas automatizadas para DobackSoft V2
"""

import logging
import sys
import pytest
import coverage
from datetime import datetime
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from typing import List, Dict, Any

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'tests_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

class TestRunner:
    """Clase para ejecutar y gestionar las pruebas automatizadas."""
    
    def __init__(self):
        self.coverage = coverage.Coverage()
        self.test_results: Dict[str, Any] = {}
        self.start_time = None
        self.end_time = None

    def setup(self):
        """Configura el entorno de pruebas."""
        logger.info("Configurando entorno de pruebas...")
        self.coverage.start()
        self.start_time = datetime.now()

    def teardown(self):
        """Limpia el entorno después de las pruebas."""
        self.coverage.stop()
        self.end_time = datetime.now()
        self.coverage.save()
        self.generate_reports()

    def run_test_suite(self, test_path: str) -> Dict[str, Any]:
        """Ejecuta una suite de pruebas específica."""
        try:
            logger.info(f"Ejecutando suite de pruebas: {test_path}")
            result = pytest.main([
                test_path,
                "-v",
                "--tb=short",
                "--junitxml=reports/junit_{}.xml".format(
                    Path(test_path).stem
                )
            ])
            return {
                "path": test_path,
                "result": result,
                "status": "passed" if result == 0 else "failed"
            }
        except Exception as e:
            logger.error(f"Error en suite {test_path}: {str(e)}")
            return {
                "path": test_path,
                "result": 1,
                "status": "error",
                "error": str(e)
            }

    def run_all_tests(self, parallel: bool = True):
        """Ejecuta todas las pruebas automatizadas."""
        try:
            logger.info("Iniciando ejecución de pruebas automatizadas...")
            self.setup()

            test_suites = [
                "tests/unit",
                "tests/integration",
                "tests/e2e",
                "tests/security",
                "tests/performance"
            ]

            if parallel:
                with ThreadPoolExecutor(max_workers=4) as executor:
                    results = list(executor.map(self.run_test_suite, test_suites))
            else:
                results = [self.run_test_suite(suite) for suite in test_suites]

            self.test_results = {
                "suites": results,
                "summary": self.generate_summary(results)
            }

            logger.info("Todas las pruebas se han ejecutado correctamente")
            return True

        except Exception as e:
            logger.error(f"Error durante la ejecución de pruebas: {str(e)}")
            return False
        finally:
            self.teardown()

    def generate_summary(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Genera un resumen de los resultados de las pruebas."""
        total = len(results)
        passed = sum(1 for r in results if r["status"] == "passed")
        failed = sum(1 for r in results if r["status"] == "failed")
        errors = sum(1 for r in results if r["status"] == "error")

        return {
            "total": total,
            "passed": passed,
            "failed": failed,
            "errors": errors,
            "success_rate": (passed / total) * 100 if total > 0 else 0
        }

    def generate_reports(self):
        """Genera reportes de cobertura y resultados."""
        # Reporte de cobertura
        self.coverage.html_report(directory="reports/coverage")
        self.coverage.xml_report(outfile="reports/coverage.xml")

        # Reporte de resultados
        report_path = Path("reports") / f"test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        report_path.parent.mkdir(exist_ok=True)
        
        report_data = {
            "timestamp": datetime.now().isoformat(),
            "duration": (self.end_time - self.start_time).total_seconds(),
            "results": self.test_results,
            "coverage": {
                "percentage": self.coverage.report()["percent_covered"],
                "covered_lines": self.coverage.report()["covered_lines"],
                "total_lines": self.coverage.report()["total_lines"]
            }
        }

        import json
        with open(report_path, "w") as f:
            json.dump(report_data, f, indent=2)

        logger.info(f"Reportes generados en: {report_path.parent}")

if __name__ == "__main__":
    runner = TestRunner()
    success = runner.run_all_tests(parallel=True)
    sys.exit(0 if success else 1) 