const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:9998',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '/api'
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log('Proxy request:', {
          method: req.method,
          url: req.url,
          target: 'http://localhost:9998'
        });
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('Proxy response:', {
          status: proxyRes.statusCode,
          url: req.url
        });
      }
    })
  );
}; 