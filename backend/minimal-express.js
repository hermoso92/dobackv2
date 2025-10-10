// Servidor Express mínimo
const express = require('express');

// Crear aplicación Express
const app = express();

// Ruta básica
app.get('/', (req, res) => {
  res.send('<html><body><h1>Express Minimal Server</h1></body></html>');
});

// Ruta JSON
app.get('/json', (req, res) => {
  res.json({ status: 'ok', message: 'Server working' });
});

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Puerto distinto para evitar conflictos
const PORT = 9998;

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Express minimal server running at http://localhost:${PORT}/`);
}); 