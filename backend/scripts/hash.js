const bcrypt = require('bcrypt');

const password = 'admin123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds)
  .then(hash => {
    console.log('HASH:', hash);
  })
  .catch(err => {
    console.error('Error al generar hash:', err);
  }); 