/**
 * 🔬 TESTS FÍSICOS - VALIDACIÓN DE ESCALA
 * 
 * Tests que verifican la corrección física de los datos parseados.
 * Estos tests fallarán si hay errores de escala o unidades.
 */

import { parseEstabilidadRobust } from '../RobustStabilityParser';

describe('RobustStabilityParser - Physical Validation', () => {
    describe('Gravity validation (az ≈ 9.81 m/s²)', () => {
        it('should keep az near gravity in rest data', () => {
            // Crear archivo de prueba con datos en reposo
            const restData = `ESTABILIDAD;01/10/2025 09:36:57;DOBACK024;0;1
ax;ay;az;gx;gy;gz;roll;pitch;yaw;timeantwifi;usciclo1;usciclo2;usciclo3;usciclo4;usciclo5;si;accmag;microsds;k3
09:36:57
61.37;359.66;939.40;-74.64;702.10;-457.62;-0.98;11.66;-0.32;73874.00;19729;10211;19840;19788;19798;0.84;987.64;0;0.85
61.24;365.39;937.45;-78.27;696.83;-459.36;-0.96;11.58;-0.34;173990.00;19751;10221;19856;19801;19815;0.84;988.23;184414;0.85`;

            const buffer = Buffer.from(restData, 'utf-8');
            const result = parseEstabilidadRobust(buffer);

            expect(result.mediciones.length).toBeGreaterThan(0);

            const avgAz = result.mediciones.reduce((sum, m) => sum + m.az, 0) / result.mediciones.length;

            // az debe estar cerca de 9.81 m/s² (gravedad)
            expect(avgAz).toBeGreaterThan(9.0);
            expect(avgAz).toBeLessThan(10.5);
        });

        it('should not have az > 15 m/s² (impossible in normal conditions)', () => {
            const data = `ESTABILIDAD;01/10/2025 09:36:57;DOBACK024;0;1
ax;ay;az;gx;gy;gz;roll;pitch;yaw;timeantwifi;usciclo1;usciclo2;usciclo3;usciclo4;usciclo5;si;accmag;microsds;k3
09:36:57
50.00;200.00;1000.00;0;0;0;0;0;0;0;19729;10211;19840;19788;19798;0.84;1020.00;0;0.85`;

            const buffer = Buffer.from(data, 'utf-8');
            const result = parseEstabilidadRobust(buffer);

            result.mediciones.forEach(m => {
                expect(Math.abs(m.az)).toBeLessThan(15.0);
            });
        });
    });

    describe('Lateral acceleration validation', () => {
        it('should not exceed 5g lateral acceleration in normal driving', () => {
            const data = `ESTABILIDAD;01/10/2025 09:36:57;DOBACK024;0;1
ax;ay;az;gx;gy;gz;roll;pitch;yaw;timeantwifi;usciclo1;usciclo2;usciclo3;usciclo4;usciclo5;si;accmag;microsds;k3
09:36:57
100.00;300.00;980.00;0;0;0;2;3;0;0;19729;10211;19840;19788;19798;0.84;1032.64;0;0.85`;

            const buffer = Buffer.from(data, 'utf-8');
            const result = parseEstabilidadRobust(buffer);

            const maxAy = Math.max(...result.mediciones.map(m => Math.abs(m.ay)));

            // 5g = 49 m/s² es el límite físico razonable
            expect(maxAy).toBeLessThan(50.0);
        });

        it('should have realistic lateral acceleration values (< 5 m/s² for normal driving)', () => {
            const data = `ESTABILIDAD;01/10/2025 09:36:57;DOBACK024;0;1
ax;ay;az;gx;gy;gz;roll;pitch;yaw;timeantwifi;usciclo1;usciclo2;usciclo3;usciclo4;usciclo5;si;accmag;microsds;k3
09:36:57
50.00;200.00;980.00;0;0;0;1;2;0;0;19729;10211;19840;19788;19798;0.84;1005.10;0;0.85`;

            const buffer = Buffer.from(data, 'utf-8');
            const result = parseEstabilidadRobust(buffer);

            result.mediciones.forEach(m => {
                // En conducción normal, ay debería ser < 5 m/s²
                expect(Math.abs(m.ay)).toBeLessThan(5.0);
            });
        });
    });

    describe('Magnitude consistency validation', () => {
        it('should validate accmag = sqrt(ax² + ay² + az²)', () => {
            const data = `ESTABILIDAD;01/10/2025 09:36:57;DOBACK024;0;1
ax;ay;az;gx;gy;gz;roll;pitch;yaw;timeantwifi;usciclo1;usciclo2;usciclo3;usciclo4;usciclo5;si;accmag;microsds;k3
09:36:57
61.37;359.66;939.40;-74.64;702.10;-457.62;-0.98;11.66;-0.32;73874.00;19729;10211;19840;19788;19798;0.84;1007.77;0;0.85
61.24;365.39;937.45;-78.27;696.83;-459.36;-0.96;11.58;-0.34;173990.00;19751;10221;19856;19801;19815;0.84;1008.00;184414;0.85`;

            const buffer = Buffer.from(data, 'utf-8');
            const result = parseEstabilidadRobust(buffer);

            result.mediciones.forEach(m => {
                const calculated = Math.sqrt(m.ax ** 2 + m.ay ** 2 + m.az ** 2);
                const error = Math.abs(calculated - m.accmag);

                // Error debe ser < 0.5 m/s²
                expect(error).toBeLessThan(0.5);
            });
        });
    });

    describe('Scale validation warnings', () => {
        it('should warn if az is far from gravity', () => {
            // Simular datos con escala incorrecta (sin dividir por 100)
            const badData = `ESTABILIDAD;01/10/2025 09:36:57;DOBACK024;0;1
ax;ay;az;gx;gy;gz;roll;pitch;yaw;timeantwifi;usciclo1;usciclo2;usciclo3;usciclo4;usciclo5;si;accmag;microsds;k3
09:36:57`;

            // Añadir 110 líneas con az = 950 (debería disparar validación en línea 100)
            for (let i = 0; i < 110; i++) {
                badData += `\n50.00;200.00;95000.00;0;0;0;0;0;0;0;19729;10211;19840;19788;19798;0.84;95002.00;0;0.85`;
            }

            const buffer = Buffer.from(badData, 'utf-8');
            const result = parseEstabilidadRobust(buffer);

            // Debe haber detectado problema de escala
            const scaleWarning = result.problemas.find(p => p.tipo === 'VALIDACION_FISICA_FALLIDA');
            expect(scaleWarning).toBeDefined();
        });
    });
});

