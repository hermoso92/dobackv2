const express = require('express');

console.log('🔍 DIAGNÓSTICO DEL ROUTER\n');

// Simular el problema
const app = express();

// Middleware básico
app.use(express.json());

// Crear un router simple
const router = express.Router();

// Intentar usar middleware en el router
try {
    console.log('1. Probando router.use() con middleware válido...');
    router.use((req, res, next) => {
        console.log('Middleware ejecutado');
        next();
    });
    console.log('✅ router.use() con middleware válido funciona\n');
} catch (error) {
    console.log('❌ Error con middleware válido:', error.message);
}

// Intentar usar middleware inválido
try {
    console.log('2. Probando router.use() con middleware inválido...');
    router.use(null);
    console.log('❌ No debería llegar aquí');
} catch (error) {
    console.log('✅ Error capturado correctamente:', error.message);
}

// Intentar usar middleware undefined
try {
    console.log('3. Probando router.use() con middleware undefined...');
    router.use(undefined);
    console.log('❌ No debería llegar aquí');
} catch (error) {
    console.log('✅ Error capturado correctamente:', error.message);
}

console.log('\n🎯 CONCLUSIÓN:');
console.log('El problema está en que se está pasando un middleware inválido a router.use()');
console.log('Posiblemente el controlador no está inicializado correctamente'); 