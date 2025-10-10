const http = require('http');

// Crear servidor súper simple
http.createServer((req, res) => {
  console.log(`[${new Date().toISOString()}] Recibida solicitud: ${req.method} ${req.url}`);
  
  // Respuesta simple para todas las rutas
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(`
    <html>
      <body>
        <h1>Servidor de emergencia funcionando</h1>
        <p>Esta página confirma que el servidor HTTP está operativo en el puerto 8080.</p>
        <p>Método: ${req.method}</p>
        <p>URL: ${req.url}</p>
      </body>
    </html>
  `);
}).listen(8080, '0.0.0.0', () => {
  console.log('Servidor de emergencia ejecutándose en http://localhost:8080');
}); 