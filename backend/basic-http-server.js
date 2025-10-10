const http = require('http');

// Crear un servidor HTTP básico sin Express ni ninguna dependencia
const server = http.createServer((req, res) => {
  console.log(`Solicitud recibida: ${req.method} ${req.url}`);
  
  // Establecer encabezados CORS básicos para evitar restricciones
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Manejar solicitudes OPTIONS para preflight CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Respuesta simple para todas las rutas
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(`
    <html>
      <head>
        <title>Servidor HTTP Básico</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #333; }
          pre { background: #f5f5f5; padding: 10px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1>Servidor HTTP Básico Funcionando!</h1>
        <p>Esta es una página servida por un servidor HTTP básico sin Express.</p>
        <p>Detalles de la solicitud:</p>
        <pre>
Método: ${req.method}
URL: ${req.url}
Headers: ${JSON.stringify(req.headers, null, 2)}
        </pre>
      </body>
    </html>
  `);
});

// Puerto diferente para evitar conflictos
const PORT = 3333;

// Iniciar servidor
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor HTTP básico ejecutándose en http://localhost:${PORT}`);
  console.log('Este servidor utiliza solo el módulo http de Node.js sin Express');
}); 