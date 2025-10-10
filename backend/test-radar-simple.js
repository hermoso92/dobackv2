/**
 * TEST SIMPLE DE RADAR.COM
 * Verificar que las keys están configuradas
 */

require('dotenv').config({ path: './config.env' });

console.log('\n🔑 VERIFICANDO CONFIGURACIÓN DE RADAR.COM\n');

console.log('RADAR_SECRET_KEY:', process.env.RADAR_SECRET_KEY ? 
    `${process.env.RADAR_SECRET_KEY.substring(0, 20)}...` : 
    '❌ NO CONFIGURADA');

console.log('RADAR_PUBLISHABLE_KEY:', process.env.RADAR_PUBLISHABLE_KEY ? 
    `${process.env.RADAR_PUBLISHABLE_KEY.substring(0, 20)}...` : 
    '❌ NO CONFIGURADA');

console.log('RADAR_BASE_URL:', process.env.RADAR_BASE_URL || '❌ NO CONFIGURADA');

console.log('\n' + '='.repeat(60));

if (!process.env.RADAR_SECRET_KEY || process.env.RADAR_SECRET_KEY === 'your-radar-secret-key') {
    console.log('❌ RADAR_SECRET_KEY no está configurada correctamente');
    console.log('   Configura en backend/config.env línea 30\n');
} else {
    console.log('✅ Radar.com configurado correctamente');
    console.log('\n💡 Ahora puedes:');
    console.log('   1. Reiniciar con .\\iniciar.ps1');
    console.log('   2. keyCalculator usará Radar.com');
    console.log('   3. Ve a https://radar.com/dashboard/usage para ver uso\n');
}

