export const createTestOrganization = async () => {
    try {
        console.log('🏢 Creando organización de prueba...');

        const response = await fetch('http://localhost:9998/api/auth/create-test-organization', {
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

        if (data.success) {
            console.log('✅ Éxito:', data.message);
            console.log('🏢 Organización:', data.organization);
            console.log('👥 Usuarios:', data.users);
            console.log('🚗 Vehículos:', data.vehicles);
            console.log('🧪 Instrucciones de prueba:', data.testInstructions);

            // Mostrar alerta con las credenciales
            alert(`✅ Organización de prueba creada exitosamente!

🏢 Organización: ${data.organization.name}

👥 USUARIOS CREADOS:
${data.users.map((user: any) => `📧 ${user.email} / ${user.password} (${user.role})`).join('\n')}

🚗 VEHÍCULOS CREADOS:
${data.vehicles.map((vehicle: any) => `🚙 ${vehicle.name} - ${vehicle.licensePlate}`).join('\n')}

🧪 PARA PROBAR SCOPING MULTI-ORGANIZACIÓN:
1. Inicia sesión con: ${data.testInstructions.loginAs}
2. Verifica que solo ves: ${data.testInstructions.shouldOnlySee}
3. Compara con: ${data.testInstructions.compareWith}

¡Ahora puedes probar que cada usuario solo ve los datos de su organización!`);

            return data;
        } else {
            console.error('❌ Error:', data.message);
            alert(`❌ Error: ${data.message}`);
            return null;
        }

    } catch (error: any) {
        console.error('❌ Error de conexión:', error);
        alert(`❌ Error de conexión: ${error.message}

💡 Asegúrate de que:
1. El servidor backend esté corriendo en http://localhost:9998
2. No haya problemas de CORS
3. La base de datos esté funcionando correctamente`);
        return null;
    }
};

// Exponer la función globalmente para poder usarla desde la consola del navegador
if (typeof window !== 'undefined') {
    (window as any).createTestOrganization = createTestOrganization;
    // Funciones disponibles en consola: createTestOrganization()
} 