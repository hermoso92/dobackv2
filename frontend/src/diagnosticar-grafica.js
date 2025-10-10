// Script para diagnosticar problemas con la gráfica de estabilidad
console.log('=== DIAGNÓSTICO DE GRÁFICA DE ESTABILIDAD ===');

// Función para simular la generación de datos similar a la de Estabilidad.tsx
function generarDatosTest(numPoints = 20) {
    const data = [];
    console.log(`Generando ${numPoints} puntos de prueba...`);
    
    for (let i = 0; i < numPoints; i++) {
        // Calcular tiempo en segundos (para el eje X)
        const timeInSeconds = i * (5400 / numPoints);
        
        // Generar valores aleatorios pero realistas
        const ltr = 0.8 + (Math.random() * 0.2 - 0.1);
        const roll = 5 + (Math.random() * 10 - 5);
        const lateralAcc = 0.2 + (Math.random() * 0.3 - 0.15);
        const speed = 60 + (Math.random() * 20 - 10);
        
        data.push({
            time: timeInSeconds,
            ltr,
            roll,
            lateralAcceleration: lateralAcc,
            speed,
            // Valores derivados
            ssf: 1.5 - (Math.abs(roll) / 60) - ((1 - ltr) * 0.5),
            drs: ((1 - ltr) * 6) + (Math.random() * 4),
            ssc: 70 + (Math.random() * 20 - 10),
            pitch: Math.random() * 4 - 2
        });
    }
    
    return data;
}

// Simular la conversión de datos similar a convertToConfigurableFormat
function testConvertToConfigurableFormat(data) {
    console.log('Probando conversión de datos...');
    
    if (!data || data.length === 0) {
        console.error('❌ No hay datos para convertir');
        return [];
    }
    
    // Verificar el primer punto para diagnóstico
    const firstPoint = data[0];
    console.log('Primer punto de datos:', firstPoint);
    console.log('Tipo de time:', typeof firstPoint.time);
    
    // Intentar conversión
    try {
        const convertidos = data.map((point, index) => {
            // Verificar cada propiedad esencial
            if (point.time === undefined || point.time === null || isNaN(point.time)) {
                console.error(`❌ Punto ${index}: 'time' es inválido:`, point.time);
            }
            if (point.ltr === undefined || point.ltr === null || isNaN(point.ltr)) {
                console.error(`❌ Punto ${index}: 'ltr' es inválido:`, point.ltr);
            }
            if (point.roll === undefined || point.roll === null || isNaN(point.roll)) {
                console.error(`❌ Punto ${index}: 'roll' es inválido:`, point.roll);
            }
            
            return {
                time: point.time,
                ltr: point.ltr || 0,
                roll: point.roll || 0,
                pitch: point.pitch || 0,
                lateralAcceleration: point.lateralAcceleration || 0,
                speed: point.speed || 0,
                ssf: point.ssf || 1.5,
                drs: point.drs || 5,
                ssc: point.ssc || 80
            };
        });
        
        console.log('✅ Conversión exitosa');
        console.log('Primer punto convertido:', convertidos[0]);
        return convertidos;
    } catch (error) {
        console.error('❌ Error en la conversión:', error);
        return [];
    }
}

// Función para simular la función formatTime del gráfico
function testFormatTime(value) {
    try {
        if (value === undefined || value === null || isNaN(value)) {
            console.error(`❌ formatTime recibió un valor inválido: ${value}`);
            return '00:00:00';
        }
        
        // Convertir a formato hh:mm:ss
        const hours = Math.floor(value / 3600);
        const minutes = Math.floor((value % 3600) / 60);
        const seconds = Math.floor(value % 60);
        
        const result = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        console.log(`formatTime(${value}) => ${result}`);
        return result;
    } catch (error) {
        console.error('❌ Error en formatTime:', error);
        return '00:00:00';
    }
}

// Ejecutar pruebas
try {
    // Generar datos de prueba
    const testData = generarDatosTest(10); // 10 puntos para prueba
    
    // Probar la conversión
    const convertedData = testConvertToConfigurableFormat(testData);
    
    // Probar el formateo de tiempo
    console.log('\nProbando formateo de tiempo:');
    testFormatTime(0);             // Inicio
    testFormatTime(1800);          // 30 minutos
    testFormatTime(3600);          // 1 hora
    testFormatTime(5400);          // 90 minutos
    testFormatTime(NaN);           // Valor inválido
    testFormatTime('00:30:00');    // Tipo incorrecto
    
    // Resultado final
    console.log('\n=== DIAGNÓSTICO COMPLETADO ===');
    console.log(`Puntos generados: ${testData.length}`);
    console.log(`Puntos convertidos: ${convertedData.length}`);
    
    if (testData.length === convertedData.length) {
        console.log('✅ El número de puntos se mantiene durante la conversión');
    } else {
        console.error('❌ Se perdieron puntos durante la conversión');
    }
    
    console.log('\nSi ve problemas en la gráfica, asegúrese de que:');
    console.log('1. La propiedad "time" es numérica (segundos) y no una cadena');
    console.log('2. Todas las propiedades tienen valores válidos (no undefined/NaN)');
    console.log('3. El formato de tiempo en XAxis es adecuado para los valores numéricos');
} catch (error) {
    console.error('❌ Error en el diagnóstico:', error);
} 