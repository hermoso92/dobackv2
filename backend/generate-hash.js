// Script para generar hash de contraseña
const bcrypt = require('bcrypt');

const password = 'Cosigein25!';
const saltRounds = 10;

bcrypt.hash(password, saltRounds).then(hash => {
    console.log('Hash generado para la contraseña:', password);
    console.log(hash);
    
    // Verificar que el hash es correcto
    bcrypt.compare(password, hash).then(result => {
        console.log('Verificación de hash correcto:', result);
    });
}); 