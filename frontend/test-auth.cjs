const axios = require('axios');

async function testLogin() {
    try {
        console.log('Iniciando prueba de login...');
        
        // Credenciales de prueba
        const credentials = {
            email: 'admin@cosigein.com',
            password: 'admin123'
        };

        console.log('Intentando login con:', { email: credentials.email });
        
        // Intentar login
        const response = await axios.post('http://localhost:9998/api/auth/login', credentials);
        
        console.log('Login exitoso:', {
            userId: response.data.data.user.id,
            email: response.data.data.user.email,
            role: response.data.data.user.role,
            tokenLength: response.data.data.access_token.length
        });

        // Verificar token
        const tokenResponse = await axios.get('http://localhost:9998/api/auth/verify', {
            headers: {
                'Authorization': `Bearer ${response.data.data.access_token}`
            }
        });
        console.log('Token verificado:', tokenResponse.data);

        // Obtener usuario actual
        const userResponse = await axios.get('http://localhost:9998/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${response.data.data.access_token}`
            }
        });
        console.log('Usuario actual:', userResponse.data);

    } catch (error) {
        console.error('Error en prueba de login:', error.response?.data || error.message);
    }
}

// Ejecutar prueba
testLogin(); 