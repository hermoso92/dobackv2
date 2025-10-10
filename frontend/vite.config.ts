import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Resolver conflictos de styled-components
      'styled-components': '@emotion/styled',
      // Resolver conflictos específicos de Popper
      '@mui/material/Popper': '@mui/material/Popper',
    },
  },
  optimizeDeps: {
    include: [
      '@emotion/styled',
      '@emotion/react',
      '@mui/material/styles',
      '@mui/material/Popper',
      '@mui/material/Tooltip',
      '@mui/material/Menu',
      '@tanstack/react-query',
      'chart.js',
      'react-dom/client',
      'react-helmet-async',
      'react-redux',
      'react-router-dom',
      'chartjs-plugin-zoom',
      'react-hot-toast',
      '@reduxjs/toolkit',
      '@emotion/cache',
      'i18next',
      'i18next-http-backend',
      'react-i18next',
      '@mui/material/CssBaseline',
      '@mui/material',
      'axios',
      '@ant-design/plots',
      'antd',
      'formik',
      'yup',
      '@mui/icons-material',
      'react-leaflet',
      'file-saver',
      'jspdf',
      'jspdf-autotable',
      'papaparse',
      'react-window',
      'xlsx',
      'react-dropzone',
      'leaflet',
      'd3'
    ],
    exclude: [
      'chunk-N6MYFXC3',
      'chunk-KQG6F5ME'
    ],
    force: true,
  },
  define: {
    global: 'globalThis',
    // Configurar styled-components para Material-UI
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  server: {
    host: 'localhost',
    port: 5174,
    strictPort: true,
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    },
    proxy: {
      '/api': {
        target: 'http://localhost:9998',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      '/sesion': {
        target: 'http://localhost:9998',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      '/ws': {
        target: 'ws://localhost:9998',
        ws: true,
        secure: false,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ws/, '')
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      external: [],
      output: {
        globals: {
          'styled-components': 'styled',
        },
      },
    },
  }
});