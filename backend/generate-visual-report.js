const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function generateVisualReport() {
    try {
        console.log('📊 GENERANDO REPORTE VISUAL DEL SISTEMA...');

        // Obtener estadísticas generales
        const totalSessions = await prisma.session.count();
        const totalStabilityMeasurements = await prisma.stabilityMeasurement.count();
        const totalCanMeasurements = await prisma.canMeasurement.count();
        const totalGpsMeasurements = await prisma.gpsMeasurement.count();
        const totalRotativoMeasurements = await prisma.rotativoMeasurement.count();

        // Obtener estadísticas por vehículo
        const sessionsByVehicle = await prisma.session.groupBy({
            by: ['vehicleId'],
            _count: {
                id: true
            },
            include: {
                vehicle: {
                    select: {
                        name: true
                    }
                }
            }
        });

        // Obtener estadísticas por fecha
        const sessionsByDate = await prisma.session.groupBy({
            by: ['startTime'],
            _count: {
                id: true
            },
            orderBy: {
                startTime: 'desc'
            },
            take: 20
        });

        // Obtener sesiones recientes con detalles
        const recentSessions = await prisma.session.findMany({
            take: 10,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                vehicle: {
                    select: {
                        name: true
                    }
                },
                organization: {
                    select: {
                        name: true
                    }
                },
                _count: {
                    select: {
                        stabilityMeasurements: true,
                        canMeasurements: true,
                        gpsMeasurements: true,
                        rotativoMeasurements: true
                    }
                }
            }
        });

        // Generar reporte HTML
        const htmlReport = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte del Sistema de Procesamiento - Doback Soft</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 30px;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #007acc;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #007acc;
            margin: 0;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
        }
        .stat-number {
            font-size: 2.5em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .stat-label {
            font-size: 0.9em;
            opacity: 0.9;
        }
        .section {
            margin-bottom: 30px;
        }
        .section h2 {
            color: #333;
            border-bottom: 1px solid #ddd;
            padding-bottom: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #f8f9fa;
            font-weight: 600;
        }
        .success { color: #28a745; }
        .warning { color: #ffc107; }
        .danger { color: #dc3545; }
        .info { color: #17a2b8; }
        .timestamp {
            color: #666;
            font-size: 0.9em;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Reporte del Sistema de Procesamiento</h1>
            <p class="timestamp">Generado el: ${new Date().toLocaleString('es-ES')}</p>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">${totalSessions}</div>
                <div class="stat-label">Sesiones Totales</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${totalStabilityMeasurements.toLocaleString()}</div>
                <div class="stat-label">Mediciones Estabilidad</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${totalCanMeasurements.toLocaleString()}</div>
                <div class="stat-label">Mediciones CAN</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${totalGpsMeasurements.toLocaleString()}</div>
                <div class="stat-label">Mediciones GPS</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${totalRotativoMeasurements.toLocaleString()}</div>
                <div class="stat-label">Mediciones Rotativo</div>
            </div>
        </div>

        <div class="section">
            <h2>🚗 Sesiones por Vehículo</h2>
            <table>
                <thead>
                    <tr>
                        <th>Vehículo</th>
                        <th>Sesiones</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    ${sessionsByVehicle.map(session => `
                        <tr>
                            <td>${session.vehicle?.name || 'Desconocido'}</td>
                            <td>${session._count.id}</td>
                            <td><span class="success">✅ Activo</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>📅 Sesiones Recientes</h2>
            <table>
                <thead>
                    <tr>
                        <th>ID Sesión</th>
                        <th>Vehículo</th>
                        <th>Organización</th>
                        <th>Fecha</th>
                        <th>Estabilidad</th>
                        <th>CAN</th>
                        <th>GPS</th>
                        <th>Rotativo</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${recentSessions.map(session => `
                        <tr>
                            <td>${session.id.substring(0, 8)}...</td>
                            <td>${session.vehicle?.name || 'N/A'}</td>
                            <td>${session.organization?.name || 'N/A'}</td>
                            <td>${new Date(session.startTime).toLocaleDateString('es-ES')}</td>
                            <td class="info">${session._count.stabilityMeasurements}</td>
                            <td class="info">${session._count.canMeasurements}</td>
                            <td class="info">${session._count.gpsMeasurements}</td>
                            <td class="info">${session._count.rotativoMeasurements}</td>
                            <td class="success"><strong>${session._count.stabilityMeasurements + session._count.canMeasurements + session._count.gpsMeasurements + session._count.rotativoMeasurements}</strong></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>📊 Cómo se Organizan las Sesiones</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 15px 0;">
                <h3>✅ Estructura Correcta Implementada:</h3>
                <ul>
                    <li><strong>Una sesión por fecha del vehículo</strong> (no por archivo individual)</li>
                    <li><strong>Agrupa todos los tipos de archivos</strong> (CAN, GPS, ESTABILIDAD, ROTATIVO) en la misma sesión</li>
                    <li><strong>Correlación temporal</strong>: Los archivos de la misma fecha van juntos</li>
                    <li><strong>Relaciones correctas</strong>: Sesión conectada a vehículo, organización y usuario</li>
                </ul>
                
                <h3>📁 Ejemplo de Organización:</h3>
                <pre style="background: #e9ecef; padding: 15px; border-radius: 5px; overflow-x: auto;">
Vehículo: doback022
Fecha: 2025-07-07
├── Sesión ID: abc123...
├── ESTABILIDAD_DOBACK022_20250707_0.txt → StabilityMeasurements
├── ESTABILIDAD_DOBACK022_20250707_1.txt → StabilityMeasurements
├── CAN_DOBACK022_20250707_0.txt → CanMeasurements
├── GPS_DOBACK022_20250707_0.txt → GpsMeasurements
└── ROTATIVO_DOBACK022_20250707_0.txt → RotativoMeasurements
                </pre>
            </div>
        </div>

        <div class="footer">
            <p>Sistema de Procesamiento de Datos - Doback Soft</p>
            <p>Reporte generado automáticamente</p>
        </div>
    </div>
</body>
</html>`;

        // Guardar reporte HTML
        const reportPath = path.join(process.cwd(), 'processing-report.html');
        fs.writeFileSync(reportPath, htmlReport);

        console.log('✅ Reporte HTML generado:', reportPath);

        // Generar reporte JSON para programático
        const jsonReport = {
            timestamp: new Date().toISOString(),
            summary: {
                totalSessions,
                totalStabilityMeasurements,
                totalCanMeasurements,
                totalGpsMeasurements,
                totalRotativoMeasurements
            },
            sessionsByVehicle,
            recentSessions: recentSessions.map(session => ({
                id: session.id,
                vehicleName: session.vehicle?.name,
                organizationName: session.organization?.name,
                startTime: session.startTime,
                measurements: {
                    stability: session._count.stabilityMeasurements,
                    can: session._count.canMeasurements,
                    gps: session._count.gpsMeasurements,
                    rotativo: session._count.rotativoMeasurements,
                    total: session._count.stabilityMeasurements + session._count.canMeasurements + session._count.gpsMeasurements + session._count.rotativoMeasurements
                }
            }))
        };

        const jsonReportPath = path.join(process.cwd(), 'processing-report.json');
        fs.writeFileSync(jsonReportPath, JSON.stringify(jsonReport, null, 2));

        console.log('✅ Reporte JSON generado:', jsonReportPath);

        console.log('\n📊 RESUMEN DEL SISTEMA:');
        console.log('========================');
        console.log(`📅 Sesiones totales: ${totalSessions}`);
        console.log(`📊 Mediciones de estabilidad: ${totalStabilityMeasurements.toLocaleString()}`);
        console.log(`🚗 Mediciones CAN: ${totalCanMeasurements.toLocaleString()}`);
        console.log(`🗺️ Mediciones GPS: ${totalGpsMeasurements.toLocaleString()}`);
        console.log(`🔴 Mediciones Rotativo: ${totalRotativoMeasurements.toLocaleString()}`);
        console.log(`📈 Total de mediciones: ${(totalStabilityMeasurements + totalCanMeasurements + totalGpsMeasurements + totalRotativoMeasurements).toLocaleString()}`);

    } catch (error) {
        console.error('❌ Error generando reporte:', error);
    } finally {
        await prisma.$disconnect();
    }
}

generateVisualReport();
