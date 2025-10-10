const fetch = require('node-fetch');

async function createSuperAdmin() {
    try {
        console.log('🚀 Creando usuario Super Admin...');
        
        const response = await fetch('http://localhost:9998/api/auth/create-superadmin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Éxito:', data.message);
            if (data.user) {
                console.log('👤 Usuario:', data.user);
            }
            if (data.credentials) {
                console.log('🔑 Credenciales:', data.credentials);
            }
        } else {
            console.error('❌ Error:', data.message);
        }
        
    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
        console.log('💡 Asegúrate de que el servidor backend esté corriendo en http://localhost:9998');
    }
}

createSuperAdmin(); 