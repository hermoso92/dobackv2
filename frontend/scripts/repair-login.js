import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = 'http://localhost:9998';
const TEST_CREDENTIALS = {
    email: 'admin@example.com',
    password: 'admin123'
};

async function checkBackend() {
    try {
        const response = await axios.get(`${API_URL}/health`);
        console.log('✅ Backend está respondiendo');
        return true;
    } catch (error) {
        console.error('❌ Backend no está respondiendo:', error.message);
        return false;
    }
}

async function checkFrontendConfig() {
    const configPath = path.join(__dirname, '../vite.config.ts');
    try {
        const config = await fs.promises.readFile(configPath, 'utf8');
        if (!config.includes('proxy')) {
            console.log('❌ Configuración de proxy no encontrada en vite.config.ts');
            return false;
        }
        console.log('✅ Configuración de frontend correcta');
        return true;
    } catch (error) {
        console.error('❌ Error al leer la configuración:', error.message);
        return false;
    }
}

async function checkAuthContext() {
    const contextPath = path.join(__dirname, '../src/contexts/AuthContext.tsx');
    try {
        const context = await fs.promises.readFile(contextPath, 'utf8');
        if (!context.includes('useAuth')) {
            console.log('❌ AuthContext no está correctamente configurado');
            return false;
        }
        console.log('✅ AuthContext está correctamente configurado');
        return true;
    } catch (error) {
        console.error('❌ Error al verificar AuthContext:', error.message);
        return false;
    }
}

async function attemptLogin() {
    try {
        const response = await axios.post(`${API_URL}/api/v1/auth/login`, TEST_CREDENTIALS);
        console.log('✅ Login exitoso');
        return response.data;
    } catch (error) {
        console.error('❌ Error en el login:', error.response?.data?.message || error.message);
        return null;
    }
}

async function repairFrontendConfig() {
    const configPath = path.join(__dirname, '../vite.config.ts');
    const newConfig = `import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:9998',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});`;

    try {
        await fs.promises.writeFile(configPath, newConfig);
        console.log('✅ Configuración de frontend reparada');
        return true;
    } catch (error) {
        console.error('❌ Error al reparar la configuración:', error.message);
        return false;
    }
}

async function repairAuthContext() {
    const contextPath = path.join(__dirname, '../src/contexts/AuthContext.tsx');
    const newContext = `import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../config/axios';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      api.defaults.headers.common['Authorization'] = \`Bearer \${token}\`;
      setIsAuthenticated(true);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const response = await api.post('/api/v1/auth/login', { email, password });
      const { accessToken, user } = response.data;

      localStorage.setItem('accessToken', accessToken);
      api.defaults.headers.common['Authorization'] = \`Bearer \${accessToken}\`;
      setUser(user);
      setIsAuthenticated(true);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
      setLoading(false);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    delete api.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, error, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export default AuthContext;`;

    try {
        await fs.promises.writeFile(contextPath, newContext);
        console.log('✅ AuthContext reparado');
        return true;
    } catch (error) {
        console.error('❌ Error al reparar AuthContext:', error.message);
        return false;
    }
}

async function main() {
    console.log('🔍 Iniciando diagnóstico del sistema de login...\n');

    // Verificar backend
    const backendOk = await checkBackend();
    if (!backendOk) {
        console.log('\n⚠️ El backend no está respondiendo. Por favor, asegúrate de que esté en ejecución.');
        process.exit(1);
    }

    // Verificar y reparar configuración de frontend
    const frontendConfigOk = await checkFrontendConfig();
    if (!frontendConfigOk) {
        console.log('\n❌ La configuración del frontend necesita reparación.');
        process.exit(1);
    }

    // Verificar AuthContext
    const authContextOk = await checkAuthContext();
    if (!authContextOk) {
        console.log('\n❌ El AuthContext necesita reparación.');
        process.exit(1);
    }

    // Intentar login
    console.log('\n🔑 Intentando login...');
    const loginResult = await attemptLogin();

    if (loginResult) {
        console.log('\n✅ Sistema de login funcionando correctamente');
        console.log('Token:', loginResult.accessToken);
        process.exit(0);
    } else {
        console.log('\n❌ No se pudo completar el login. Por favor, verifica las credenciales y la conexión.');
        process.exit(1);
    }
}

main().catch(error => {
    console.error('Error inesperado:', error);
    process.exit(1);
}); 