/**
 * 👤 Crear Usuario Admin - DobackSoft
 * 
 * Crea un usuario administrador para testing
 * 
 * Uso: node scripts/testing/create-admin-user.js
 */

const https = require('https');
const http = require('http');

// Configuración
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:9998';

// Colores
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function print(message, color = colors.reset) {
    console.log(color + message + colors.reset);
}

function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const client = urlObj.protocol === 'https:' ? https : http;
        
        const req = client.request(url, options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        data: JSON.parse(data)
                    });
                } catch (error) {
                    resolve({
                        status: res.statusCode,
                        data: data
                    });
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

async function createAdminUser() {
    print('\n' + colors.cyan + '═'.repeat(70) + colors.reset);
    print(colors.cyan + colors.bright + '👤 CREAR USUARIO ADMIN' + colors.reset);
    print(colors.cyan + '═'.repeat(70) + colors.reset + '\n');
    
    try {
        // Verificar backend
        print(colors.blue + '1️⃣  Verificando backend...' + colors.reset);
        
        try {
            const healthCheck = await makeRequest(`${API_BASE_URL}/health`);
            
            if (healthCheck.status !== 200) {
                print(colors.red + '❌ Backend no disponible en ' + API_BASE_URL + colors.reset);
                print(colors.yellow + '\nAsegúrate de que el backend esté corriendo:' + colors.reset);
                print(colors.yellow + '   .\\iniciar.ps1' + colors.reset);
                return;
            }
            
            print(colors.green + '✅ Backend conectado' + colors.reset);
        } catch (error) {
            print(colors.red + '❌ Backend no disponible: ' + error.message + colors.reset);
            return;
        }
        
        // Intentar crear usuario admin
        print(colors.blue + '\n2️⃣  Creando usuario admin...' + colors.reset);
        
        const adminData = {
            email: 'admin@dobacksoft.com',
            password: 'admin123',
            name: 'Admin DobackSoft',
            role: 'ADMIN'
        };
        
        try {
            const response = await makeRequest(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(adminData)
            });
            
            if (response.status === 200 || response.status === 201) {
                print(colors.green + '\n✅ Usuario admin creado exitosamente!' + colors.reset);
                print(colors.green + '\nCredenciales:' + colors.reset);
                print(colors.bright + '   Email:' + colors.reset + '    admin@dobacksoft.com');
                print(colors.bright + '   Password:' + colors.reset + ' admin123');
                print(colors.bright + '   Rol:' + colors.reset + '      ADMIN');
                
                // Intentar login para verificar
                print(colors.blue + '\n3️⃣  Verificando login...' + colors.reset);
                
                const loginResponse = await makeRequest(`${API_BASE_URL}/api/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: adminData.email,
                        password: adminData.password
                    })
                });
                
                if (loginResponse.data.token) {
                    print(colors.green + '✅ Login exitoso!' + colors.reset);
                    print(colors.green + '   Token: ' + loginResponse.data.token.substring(0, 20) + '...' + colors.reset);
                } else {
                    print(colors.yellow + '⚠️  Login no pudo verificarse' + colors.reset);
                }
                
            } else if (response.status === 409 || response.status === 400) {
                print(colors.yellow + '\n⚠️  El usuario admin ya existe' + colors.reset);
                print(colors.yellow + '\nCredenciales actuales:' + colors.reset);
                print(colors.bright + '   Email:' + colors.reset + '    admin@dobacksoft.com');
                print(colors.bright + '   Password:' + colors.reset + ' admin123');
                
                // Intentar login
                print(colors.blue + '\n3️⃣  Verificando login...' + colors.reset);
                
                const loginResponse = await makeRequest(`${API_BASE_URL}/api/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: adminData.email,
                        password: adminData.password
                    })
                });
                
                if (loginResponse.data.token) {
                    print(colors.green + '✅ Login exitoso con usuario existente!' + colors.reset);
                } else {
                    print(colors.red + '❌ Login falló' + colors.reset);
                    print(colors.yellow + '\nPosibles causas:' + colors.reset);
                    print(colors.yellow + '   - La contraseña ha sido cambiada' + colors.reset);
                    print(colors.yellow + '   - El usuario está inactivo' + colors.reset);
                    print(colors.yellow + '\nSolución: Resetear usuario en base de datos' + colors.reset);
                }
            } else {
                print(colors.red + '❌ Error al crear usuario: ' + response.status + colors.reset);
                if (response.data) {
                    print(colors.red + '   ' + JSON.stringify(response.data) + colors.reset);
                }
            }
            
        } catch (error) {
            print(colors.red + '❌ Error: ' + error.message + colors.reset);
        }
        
        print('\n' + colors.cyan + '═'.repeat(70) + colors.reset + '\n');
        
        print(colors.bright + '📝 PRÓXIMOS PASOS:' + colors.reset);
        print('   1. Abrir navegador: http://localhost:5174');
        print('   2. Login con: admin@dobacksoft.com / admin123');
        print('   3. Ejecutar test completo: node scripts/testing/test-sistema-completo.js\n');
        
    } catch (error) {
        print(colors.red + '\n❌ Error fatal: ' + error.message + colors.reset + '\n');
    }
}

// Ejecutar
createAdminUser().catch(error => {
    console.error(colors.red + '\n❌ Error: ' + error.message + colors.reset + '\n');
    process.exit(1);
});

