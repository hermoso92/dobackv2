
export const createSuperAdmin = async () => {
    try {
        console.log('🚀 Creando usuario Super Admin...');

        // Intentar con el endpoint correcto en /api/auth/create-superadmin
        let response;
        try {
            // Hacer petición directa sin el wrapper de api para evitar autenticación
            response = await fetch('http://localhost:9998/api/auth/create-superadmin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            response = { data };

        } catch (authError) {
            console.log('Error con endpoint auth:', authError.message);

            // Intentar con el endpoint directo como fallback
            try {
                response = await fetch('http://localhost:9998/create-superadmin', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({})
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                response = { data };
            } catch (directError) {
                throw new Error(`Ambos endpoints fallaron. Auth: ${authError.message}, Direct: ${directError.message}`);
            }
        }

        if (response.data.success) {
            console.log('✅ Éxito:', response.data.message);
            console.log('👤 Usuario:', response.data.user);
            if (response.data.credentials) {
                console.log('🔑 Credenciales:', response.data.credentials);
            }

            // Mostrar alerta con las credenciales
            alert(`✅ Usuario Super Admin creado exitosamente!

📧 Email: ${response.data.credentials?.email || 'superadmin@dobacksoft.com'}
🔑 Password: ${response.data.credentials?.password || 'superadmin123'}

Ahora puedes usar estas credenciales para iniciar sesión.`);

            return response.data;
        } else {
            console.error('❌ Error:', response.data.message);
            alert(`❌ Error: ${response.data.message}`);
            return null;
        }

    } catch (error: any) {
        console.error('❌ Error de conexión:', error);
        alert(`❌ Error de conexión: ${error.message}

💡 Asegúrate de que:
1. El servidor backend esté corriendo en http://localhost:9998
2. No haya problemas de CORS
3. La base de datos esté funcionando correctamente

📋 Query SQL manual:
INSERT INTO "User" (id, email, name, password, "organizationId", "createdAt", "updatedAt", role, status) 
VALUES (gen_random_uuid(), 'superadmin@dobacksoft.com', 'Super Administrador', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, NOW(), NOW(), 'ADMIN', 'ACTIVE') 
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, "updatedAt" = NOW();

Credenciales: superadmin@dobacksoft.com / superadmin123`);
        return null;
    }
};

// Exponer la función globalmente para poder usarla desde la consola del navegador
if (typeof window !== 'undefined') {
    (window as any).createSuperAdmin = createSuperAdmin;
    // Funciones disponibles en consola: createSuperAdmin()
} 