// Minimal HTTP server
const http = require('http');
http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end('<html><body><h1>Test Server</h1></body></html>');
}).listen(9999, () => {
  console.log('Server running at http://localhost:9999/');
});
