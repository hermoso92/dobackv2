const fs = require('fs');
const PDFDocument = require('pdfkit');
const path = require('path');

async function createSampleProfessionalReport() {
    console.log('🚀 Generando reporte profesional de muestra...');
    
    // Datos de muestra realistas
    const sampleData = {
        globalSummary: {
            totalSessions: 12,
            totalDistance: 245.7,
            totalDuration: 540, // 9 horas
            totalFuelConsumption: 19.8,
            avgFuelConsumption: 8.1,
            totalCriticalEvents: 23,
            vehiclesCount: 3
        },
        vehiclesData: [
            {
                vehicleId: 'v1',
                vehicle: { licensePlate: '8592LMG', brand: 'Ford', model: 'Transit' },
                totalSessions: 5,
                totalDistance: 125.3,
                totalDuration: 280,
                totalFuelConsumption: 10.2,
                avgFuelConsumption: 8.1,
                sessions: [
                    {
                        id: 's1',
                        startTime: new Date('2025-01-17T09:15:00'),
                        endTime: new Date('2025-01-17T09:45:00'),
                        duration: 30,
                        distance: 15.2,
                        maxSpeed: 85,
                        avgSpeed: 32,
                        estimatedFuelConsumption: 1.2,
                        fuelConsumptionPer100km: 7.9,
                        startLocation: { address: 'Calle Mayor, 12, Madrid' },
                        endLocation: { address: 'Av. Principal, 45, Madrid' },
                        eventsSummary: { total: 3, critical: 1, danger: 1, moderate: 1 }
                    },
                    {
                        id: 's2',
                        startTime: new Date('2025-01-17T14:20:00'),
                        endTime: new Date('2025-01-17T15:10:00'),
                        duration: 50,
                        distance: 28.6,
                        maxSpeed: 95,
                        avgSpeed: 38,
                        estimatedFuelConsumption: 2.4,
                        fuelConsumptionPer100km: 8.4,
                        startLocation: { address: 'Av. Principal, 45, Madrid' },
                        endLocation: { address: 'Polígono Industrial Norte' },
                        eventsSummary: { total: 5, critical: 2, danger: 2, moderate: 1 }
                    }
                ]
            },
            {
                vehicleId: 'v2',
                vehicle: { licensePlate: '7234BCN', brand: 'Mercedes', model: 'Sprinter' },
                totalSessions: 4,
                totalDistance: 89.4,
                totalDuration: 180,
                totalFuelConsumption: 7.1,
                avgFuelConsumption: 7.9,
                sessions: [
                    {
                        id: 's3',
                        startTime: new Date('2025-01-17T08:30:00'),
                        endTime: new Date('2025-01-17T09:15:00'),
                        duration: 45,
                        distance: 22.3,
                        maxSpeed: 78,
                        avgSpeed: 35,
                        estimatedFuelConsumption: 1.8,
                        fuelConsumptionPer100km: 8.1,
                        startLocation: { address: 'Base Central, Getafe' },
                        endLocation: { address: 'Centro Comercial Plaza Norte' },
                        eventsSummary: { total: 2, critical: 0, danger: 1, moderate: 1 }
                    }
                ]
            }
        ],
        reportPeriod: {
            startDate: new Date('2025-01-10'),
            endDate: new Date('2025-01-17')
        }
    };
    
    const config = {
        startDate: new Date('2025-01-10'),
        endDate: new Date('2025-01-17'),
        title: 'Informe Profesional DobackSoft - Muestra',
        fuelReferenceBase: 7.5
    };
    
    // Crear directorio de reportes
    const REPORTS_DIR = './reports';
    if (!fs.existsSync(REPORTS_DIR)) {
        fs.mkdirSync(REPORTS_DIR, { recursive: true });
    }
    
    const fileName = `sample-professional-report-${Date.now()}.pdf`;
    const filePath = path.join(REPORTS_DIR, fileName);
    
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 40,
                info: {
                    Title: 'Informe Profesional DobackSoft - Muestra',
                    Author: 'DobackSoft - Sistema de Gestión de Flotas',
                    Subject: 'Análisis Detallado de Sesiones de Conducción',
                    CreationDate: new Date()
                }
            });
            
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);
            
            // Header profesional
            buildProfessionalHeader(doc, config);
            buildGlobalSummarySection(doc, sampleData.globalSummary);
            
            // Secciones por vehículo
            sampleData.vehiclesData.forEach((vehicleData, index) => {
                if (index > 0) doc.addPage();
                buildVehicleSectionProfessional(doc, vehicleData, config);
            });
            
            doc.end();
            
            stream.on('finish', () => {
                const stats = fs.statSync(filePath);
                console.log('✅ Reporte profesional generado exitosamente:');
                console.log(`📁 Archivo: ${filePath}`);
                console.log(`📊 Tamaño: ${(stats.size / 1024).toFixed(2)} KB`);
                console.log(`🚗 Vehículos: ${sampleData.globalSummary.vehiclesCount}`);
                console.log(`🛣️ Sesiones: ${sampleData.globalSummary.totalSessions}`);
                console.log(`📏 Distancia total: ${sampleData.globalSummary.totalDistance} km`);
                console.log(`⚠️ Eventos críticos: ${sampleData.globalSummary.totalCriticalEvents}`);
                resolve({ filePath, size: stats.size });
            });
            
            stream.on('error', reject);
            
        } catch (error) {
            reject(error);
        }
    });
}

function buildProfessionalHeader(doc, config) {
    // Fondo azul profesional
    doc.rect(0, 0, 595, 140)
        .fillColor('#1E3A8A')
        .fill();

    // Logo y título
    doc.fontSize(24).font('Helvetica-Bold')
        .fillColor('#FFFFFF')
        .text('DOBACK SOFT', 50, 30);
    
    doc.fontSize(12).font('Helvetica')
        .fillColor('#E5E7EB')
        .text('Sistema de Gestión de Flotas', 50, 55);

    doc.fontSize(18).font('Helvetica-Bold')
        .fillColor('#FFFFFF')
        .text('Informe de viajes (detallado)', 50, 85);

    // Información del período
    doc.fontSize(11).font('Helvetica')
        .fillColor('#E5E7EB')
        .text(`Período: ${config.startDate.toLocaleDateString('es-ES')} - ${config.endDate.toLocaleDateString('es-ES')}`, 350, 40)
        .text('Conductor: Todos los conductores', 350, 55)
        .text('Vehículos: Todos', 350, 70)
        .text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 350, 85);

    doc.y = 160;
}

function buildGlobalSummarySection(doc, summary) {
    doc.fontSize(16).font('Helvetica-Bold')
        .fillColor('#1F2937')
        .text('RESUMEN GLOBAL DEL PERÍODO', 50, doc.y);

    const startY = doc.y + 25;
    
    // Cajas de métricas
    createMetricBoxSample(doc, 50, startY, 'Total de viajes', summary.totalSessions.toString(), '#3B82F6');
    createMetricBoxSample(doc, 170, startY, 'Distancia total', `${summary.totalDistance} km`, '#10B981');
    createMetricBoxSample(doc, 290, startY, 'Duración total', `${Math.floor(summary.totalDuration / 60)}h ${summary.totalDuration % 60}min`, '#F59E0B');
    createMetricBoxSample(doc, 410, startY, 'Vehículos', summary.vehiclesCount.toString(), '#8B5CF6');

    // Segunda fila
    createMetricBoxSample(doc, 50, startY + 70, 'Consumo total', `${summary.totalFuelConsumption} l`, '#EF4444');
    createMetricBoxSample(doc, 170, startY + 70, 'Consumo medio', `${summary.avgFuelConsumption} l/100km`, '#F97316');
    createMetricBoxSample(doc, 290, startY + 70, 'Eventos críticos', summary.totalCriticalEvents.toString(), '#DC2626');
    createMetricBoxSample(doc, 410, startY + 70, 'Promedio/viaje', `${(summary.totalDistance / summary.totalSessions).toFixed(1)} km`, '#6366F1');

    doc.y = startY + 150;
}

function createMetricBoxSample(doc, x, y, label, value, color) {
    const boxWidth = 115;
    const boxHeight = 60;
    
    // Fondo
    doc.rect(x, y, boxWidth, boxHeight)
        .fillColor('#F9FAFB')
        .fill()
        .strokeColor('#E5E7EB')
        .lineWidth(1)
        .stroke();
    
    // Barra de color
    doc.rect(x, y, boxWidth, 4)
        .fillColor(color)
        .fill();
    
    // Valor
    doc.fontSize(18).font('Helvetica-Bold')
        .fillColor('#1F2937')
        .text(value, x + 8, y + 12, { width: boxWidth - 16, align: 'center' });
    
    // Etiqueta
    doc.fontSize(8).font('Helvetica')
        .fillColor('#6B7280')
        .text(label, x + 8, y + 38, { width: boxWidth - 16, align: 'center' });
}

function buildVehicleSectionProfessional(doc, vehicleData, config) {
    // Header del vehículo
    const headerY = doc.y;
    doc.rect(50, headerY, 495, 30)
        .fillColor('#F3F4F6')
        .fill()
        .strokeColor('#D1D5DB')
        .lineWidth(1)
        .stroke();

    doc.fontSize(14).font('Helvetica-Bold')
        .fillColor('#1F2937')
        .text(vehicleData.vehicle.licensePlate, 60, headerY + 8);
    
    doc.fontSize(11).font('Helvetica')
        .fillColor('#6B7280')
        .text(`${vehicleData.vehicle.brand} ${vehicleData.vehicle.model}`, 180, headerY + 10);

    doc.fontSize(10).font('Helvetica')
        .fillColor('#374151')
        .text(`${vehicleData.totalSessions} viajes • ${vehicleData.totalDistance} km • ${vehicleData.avgFuelConsumption} l/100km`, 350, headerY + 10);

    doc.y = headerY + 45;

    // Tabla de sesiones
    buildSessionsTableSample(doc, vehicleData.sessions, config);
}

function buildSessionsTableSample(doc, sessions, config) {
    const tableHeaders = [
        'Fecha/Hora', 'Duración', 'Distancia', 'Velocidades', 
        'Ubicación inicio', 'Ubicación fin', 'Consumo', 'Eventos'
    ];
    
    const columnWidths = [80, 50, 55, 65, 95, 95, 70, 50];
    let currentY = doc.y;

    // Header
    doc.rect(50, currentY, 520, 20)
        .fillColor('#374151')
        .fill();

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#FFFFFF');
    let currentX = 55;
    
    tableHeaders.forEach((header, index) => {
        doc.text(header, currentX, currentY + 6, { width: columnWidths[index] - 10, align: 'center' });
        currentX += columnWidths[index];
    });

    currentY += 25;

    // Datos
    sessions.forEach((session, index) => {
        const bgColor = index % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
        
        doc.rect(50, currentY - 2, 520, 16)
            .fillColor(bgColor)
            .fill();

        currentX = 55;
        
        const startTime = session.startTime.toLocaleString('es-ES', { 
            day: '2-digit', 
            month: '2-digit',
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        const endTime = session.endTime?.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
        }) || 'N/A';

        const rowData = [
            `${startTime}\n${endTime}`,
            `${session.duration} min`,
            `${session.distance} km`,
            `Max: ${session.maxSpeed}\nMed: ${session.avgSpeed}`,
            session.startLocation.address.substring(0, 25),
            session.endLocation.address.substring(0, 25),
            `${session.estimatedFuelConsumption}l\n${session.fuelConsumptionPer100km}l/100km`,
            `${session.eventsSummary.total}\n(${session.eventsSummary.critical}C)`
        ];

        doc.fontSize(8).font('Helvetica').fillColor('#374151');

        rowData.forEach((data, colIndex) => {
            // Resaltado para consumo anómalo
            if (colIndex === 6) {
                const consumption = session.fuelConsumptionPer100km;
                const reference = config.fuelReferenceBase;
                if (Math.abs(consumption - reference) > 1.0) {
                    doc.rect(currentX - 3, currentY - 2, columnWidths[colIndex] - 4, 16)
                        .fillColor('#FEE2E2')
                        .fill();
                    doc.fillColor('#DC2626');
                }
            }

            if (colIndex === 7 && session.eventsSummary.critical > 0) {
                doc.fillColor('#DC2626');
            }

            doc.text(data, currentX, currentY, { 
                width: columnWidths[colIndex] - 10, 
                align: 'center',
                lineGap: 1
            });
            
            currentX += columnWidths[colIndex];
            doc.fillColor('#374151');
        });

        currentY += 18;
    });

    doc.moveTo(50, currentY)
        .lineTo(570, currentY)
        .strokeColor('#E5E7EB')
        .lineWidth(1)
        .stroke();

    doc.y = currentY + 20;
}

// Ejecutar
createSampleProfessionalReport()
    .then(result => {
        console.log('\n🎉 ¡Reporte profesional de muestra creado exitosamente!');
        console.log('Este reporte muestra todas las mejoras implementadas:');
        console.log('✓ Diseño profesional estilo Webfleet');
        console.log('✓ Métricas detalladas de consumo y distancia');
        console.log('✓ Geocodificación de ubicaciones');
        console.log('✓ Eventos críticos clasificados por severidad');
        console.log('✓ Resaltado condicional de anomalías');
        console.log('✓ Tablas profesionales con alternancia de colores');
        console.log('✓ Header con branding corporativo');
    })
    .catch(error => {
        console.error('❌ Error creando reporte:', error.message);
    }); 