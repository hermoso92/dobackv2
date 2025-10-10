const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 9998;

// Middleware
app.use(cors());
app.use(express.json());

// Crear directorio de reportes si no existe
const reportsDir = path.join(__dirname, 'reports');
fs.mkdir(reportsDir, { recursive: true }).catch(console.error);

// Ruta de salud
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Servidor funcionando' });
});

// Ruta de reporte del dashboard
app.post('/api/simple-reports/dashboard', async (req, res) => {
    try {
        console.log('📊 Generando reporte del dashboard...');
        const { filters, includeCharts = true, includeMaps = true } = req.body;

        console.log('📋 Filtros recibidos:', filters);

        // Datos de ejemplo basados en los filtros
        const timePreset = filters?.timePreset || 'DAY';
        const scope = filters?.scope || 'vehicles';
        const vehicleCount = filters?.vehicleIds?.length || 20;

        const dashboardData = {
            period: timePreset.toLowerCase(),
            lastUpdate: new Date().toISOString(),
            organizationId: 'bomberos-madrid',
            timeInPark: 156.5,
            timeOutOfPark: 43.2,
            timeInParkWithRotary: 12.8,
            timeInWorkshopWithRotary: 3.2,
            timeInEnclave5: 8.5,
            timeInEnclave2: 15.3,
            timeOutOfParkWithRotary: 28.7,
            vehiclesInPark: Math.max(1, Math.floor(vehicleCount * 0.6)),
            vehiclesOutOfPark: Math.max(1, Math.floor(vehicleCount * 0.4)),
            vehiclesWithRotaryOn: Math.max(1, Math.floor(vehicleCount * 0.75)),
            vehiclesWithRotaryOff: Math.max(1, Math.floor(vehicleCount * 0.25)),
            vehiclesInWorkshop: Math.max(0, Math.floor(vehicleCount * 0.1)),
            totalEvents: 47,
            criticalEvents: 3,
            severeEvents: 8,
            lightEvents: 36,
            timeExcesses: 4,
            speedExcesses: 12,
            complianceRate: 94.2,
            ltrScore: 8.7,
            ssfScore: 7.9,
            drsScore: 8.2,
            totalVehicles: vehicleCount,
            activeVehicles: Math.max(1, Math.floor(vehicleCount * 0.9)),
            totalSessions: 25,
            appliedFilters: {
                scope,
                timePreset,
                vehicleIds: filters?.vehicleIds || [],
                parkId: filters?.parkId || null
            }
        };

        // Formatear fecha actual
        const now = new Date();
        const reportDate = now.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Calcular métricas derivadas
        const totalHours = (dashboardData.timeInPark || 0) + (dashboardData.timeOutOfPark || 0);
        const rotativoPct = dashboardData.totalVehicles > 0 ?
            ((dashboardData.vehiclesWithRotaryOn || 0) / dashboardData.totalVehicles * 100).toFixed(1) : '0.0';

        // HTML del reporte
        const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte Ejecutivo - Dashboard DobackSoft</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #f8fafc;
            color: #1e293b;
        }
        .header { 
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
            border-radius: 12px 12px 0 0;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header h1 { margin: 0; font-size: 2.5em; font-weight: 700; }
        .header p { margin: 10px 0 0 0; font-size: 1.2em; opacity: 0.9; }
        .content { 
            background: white; 
            padding: 30px; 
            border-radius: 0 0 12px 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .kpi-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
            gap: 20px; 
            margin: 20px 0; 
        }
        .kpi { 
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); 
            border: 1px solid #cbd5e1; 
            padding: 20px; 
            border-radius: 12px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        .kpi h3 { 
            margin: 0 0 15px 0; 
            color: #1e40af; 
            font-size: 1.3em; 
            font-weight: 600;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 8px;
        }
        .kpi-row { 
            display: flex; 
            justify-content: space-between; 
            margin: 10px 0; 
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        .kpi-row:last-child { border-bottom: none; }
        .kpi-label { font-weight: 500; color: #475569; }
        .kpi-value { font-weight: 600; color: #1e293b; }
        .footer { 
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%); 
            color: white; 
            padding: 20px; 
            text-align: center; 
            margin-top: 30px; 
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .summary-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .stat-card {
            background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
            color: white;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .stat-number { font-size: 2em; font-weight: 700; margin: 0; }
        .stat-label { font-size: 0.9em; opacity: 0.9; margin: 5px 0 0 0; }
        .filters-info {
            background: #f1f5f9;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #3b82f6;
        }
        .filters-info h4 { margin: 0 0 10px 0; color: #1e40af; }
        .filter-item { margin: 5px 0; color: #475569; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Reporte Ejecutivo</h1>
        <p>Dashboard DobackSoft - Análisis Integral de Flota</p>
    </div>
    
    <div class="content">
        <div class="filters-info">
            <h4>📋 Información del Reporte</h4>
            <div class="filter-item"><strong>Generado:</strong> ${reportDate}</div>
            <div class="filter-item"><strong>Período:</strong> ${dashboardData.period || 'Día actual'}</div>
            <div class="filter-item"><strong>Organización:</strong> Bomberos Madrid</div>
            <div class="filter-item"><strong>Última actualización:</strong> ${new Date(dashboardData.lastUpdate).toLocaleString('es-ES')}</div>
            <div class="filter-item"><strong>Alcance:</strong> ${dashboardData.appliedFilters.scope === 'vehicles' ? 'Vehículos específicos' : 'Parque'}</div>
            <div class="filter-item"><strong>Período de tiempo:</strong> ${dashboardData.appliedFilters.timePreset}</div>
            ${dashboardData.appliedFilters.vehicleIds?.length > 0 ? `
                <div class="filter-item"><strong>Vehículos filtrados:</strong> ${dashboardData.appliedFilters.vehicleIds.join(', ')}</div>
            ` : ''}
            ${dashboardData.appliedFilters.parkId ? `
                <div class="filter-item"><strong>Parque:</strong> ${dashboardData.appliedFilters.parkId}</div>
            ` : ''}
        </div>

        <div class="summary-stats">
            <div class="stat-card">
                <div class="stat-number">${dashboardData.totalVehicles || 0}</div>
                <div class="stat-label">Vehículos Totales</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${dashboardData.activeVehicles || 0}</div>
                <div class="stat-label">Vehículos Activos</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${dashboardData.totalEvents || 0}</div>
                <div class="stat-label">Eventos Totales</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${dashboardData.complianceRate || 0}%</div>
                <div class="stat-label">Cumplimiento</div>
            </div>
        </div>
        
        <div class="kpi-grid">
            <div class="kpi">
                <h3>⏱️ Métricas de Tiempo</h3>
                <div class="kpi-row">
                    <span class="kpi-label">Tiempo en Parque:</span>
                    <span class="kpi-value">${dashboardData.timeInPark || 0} h</span>
                </div>
                <div class="kpi-row">
                    <span class="kpi-label">Tiempo fuera de Parque:</span>
                    <span class="kpi-value">${dashboardData.timeOutOfPark || 0} h</span>
                </div>
                <div class="kpi-row">
                    <span class="kpi-label">Tiempo en Taller:</span>
                    <span class="kpi-value">${dashboardData.timeInWorkshopWithRotary || 0} h</span>
                </div>
                <div class="kpi-row">
                    <span class="kpi-label">Total Horas:</span>
                    <span class="kpi-value">${totalHours.toFixed(1)} h</span>
                </div>
            </div>
            
            <div class="kpi">
                <h3>🔄 Estado del Rotativo</h3>
                <div class="kpi-row">
                    <span class="kpi-label">Vehículos con Rotativo:</span>
                    <span class="kpi-value">${dashboardData.vehiclesWithRotaryOn || 0}</span>
                </div>
                <div class="kpi-row">
                    <span class="kpi-label">Vehículos sin Rotativo:</span>
                    <span class="kpi-value">${dashboardData.vehiclesWithRotaryOff || 0}</span>
                </div>
                <div class="kpi-row">
                    <span class="kpi-label">% Uso Rotativo:</span>
                    <span class="kpi-value">${rotativoPct}%</span>
                </div>
                <div class="kpi-row">
                    <span class="kpi-label">Clave 2:</span>
                    <span class="kpi-value">${dashboardData.timeInEnclave2 || 0} h</span>
                </div>
                <div class="kpi-row">
                    <span class="kpi-label">Clave 5:</span>
                    <span class="kpi-value">${dashboardData.timeInEnclave5 || 0} h</span>
                </div>
            </div>
            
            <div class="kpi">
                <h3>🚨 Eventos e Incidencias</h3>
                <div class="kpi-row">
                    <span class="kpi-label">Eventos Críticos:</span>
                    <span class="kpi-value" style="color: #dc2626;">${dashboardData.criticalEvents || 0}</span>
                </div>
                <div class="kpi-row">
                    <span class="kpi-label">Eventos Graves:</span>
                    <span class="kpi-value" style="color: #ea580c;">${dashboardData.severeEvents || 0}</span>
                </div>
                <div class="kpi-row">
                    <span class="kpi-label">Eventos Leves:</span>
                    <span class="kpi-value" style="color: #16a34a;">${dashboardData.lightEvents || 0}</span>
                </div>
                <div class="kpi-row">
                    <span class="kpi-label">Excesos de Velocidad:</span>
                    <span class="kpi-value">${dashboardData.speedExcesses || 0}</span>
                </div>
                <div class="kpi-row">
                    <span class="kpi-label">Excesos de Tiempo:</span>
                    <span class="kpi-value">${dashboardData.timeExcesses || 0}</span>
                </div>
            </div>
            
            <div class="kpi">
                <h3>📊 Puntuaciones de Estabilidad</h3>
                <div class="kpi-row">
                    <span class="kpi-label">LTR Score:</span>
                    <span class="kpi-value">${dashboardData.ltrScore || 0}/10</span>
                </div>
                <div class="kpi-row">
                    <span class="kpi-label">SSF Score:</span>
                    <span class="kpi-value">${dashboardData.ssfScore || 0}/10</span>
                </div>
                <div class="kpi-row">
                    <span class="kpi-label">DRS Score:</span>
                    <span class="kpi-value">${dashboardData.drsScore || 0}/10</span>
                </div>
                <div class="kpi-row">
                    <span class="kpi-label">Tasa de Cumplimiento:</span>
                    <span class="kpi-value">${dashboardData.complianceRate || 0}%</span>
                </div>
            </div>
        </div>
        
        <div class="kpi">
            <h3>🚗 Estado de la Flota</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <div class="kpi-row">
                    <span class="kpi-label">En Parque:</span>
                    <span class="kpi-value">${dashboardData.vehiclesInPark || 0} vehículos</span>
                </div>
                <div class="kpi-row">
                    <span class="kpi-label">Fuera de Parque:</span>
                    <span class="kpi-value">${dashboardData.vehiclesOutOfPark || 0} vehículos</span>
                </div>
                <div class="kpi-row">
                    <span class="kpi-label">En Taller:</span>
                    <span class="kpi-value">${dashboardData.vehiclesInWorkshop || 0} vehículos</span>
                </div>
                <div class="kpi-row">
                    <span class="kpi-label">Sesiones Totales:</span>
                    <span class="kpi-value">${dashboardData.totalSessions || 0}</span>
                </div>
            </div>
        </div>
    </div>
    
    <div class="footer">
        <p>📋 Reporte generado por DobackSoft - Sistema de Gestión de Flotas</p>
        <p>🔒 Información confidencial - Solo para uso interno</p>
    </div>
</body>
</html>`;

        // Guardar HTML
        const fileName = `reporte-dashboard-${Date.now()}.html`;
        const filePath = path.join(reportsDir, fileName);
        await fs.writeFile(filePath, html);

        console.log('✅ Reporte HTML generado exitosamente:', filePath);

        res.json({
            success: true,
            data: {
                id: `report-${Date.now()}`,
                fileName,
                filePath,
                message: 'Reporte HTML generado exitosamente',
                downloadUrl: `/api/simple-reports/download/${fileName}`
            }
        });

    } catch (error) {
        console.error('❌ Error generando reporte del dashboard:', error);
        res.status(500).json({
            success: false,
            error: `Error interno del servidor: ${error.message}`
        });
    }
});

// Ruta para descargar reportes
app.get('/api/simple-reports/download/:fileName', async (req, res) => {
    try {
        const { fileName } = req.params;
        
        const filePath = path.join(reportsDir, fileName);
        
        // Verificar que el archivo existe
        try {
            await fs.access(filePath);
        } catch (error) {
            return res.status(404).json({
                success: false,
                error: 'Archivo no encontrado'
            });
        }
        
        // Enviar el archivo
        res.download(filePath, fileName, (err) => {
            if (err) {
                console.error('❌ Error descargando archivo:', err);
                res.status(500).json({
                    success: false,
                    error: 'Error descargando archivo'
                });
            }
        });
        
    } catch (error) {
        console.error('❌ Error en descarga de reporte:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor de reportes iniciado en puerto ${PORT}`);
    console.log(`📊 Endpoint de reportes: http://localhost:${PORT}/api/simple-reports/dashboard`);
    console.log(`💾 Descarga de reportes: http://localhost:${PORT}/api/simple-reports/download/:fileName`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});
