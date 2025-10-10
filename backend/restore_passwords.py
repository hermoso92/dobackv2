import psycopg2
import bcrypt

# Conectar a BD
conn = psycopg2.connect(
    host='localhost', 
    database='dobacksoft', 
    user='postgres', 
    password='cosigein', 
    port=5432
)
cur = conn.cursor()

# Contraseñas comunes a restaurar
password_updates = [
    {'email': 'admin@cmadrid.com', 'password': '123456'},
    {'email': 'admin@doback.local', 'password': 'admin'},
    {'email': 'admin@dobacksoft.com', 'password': 'admin'},
    {'email': 'carga@dobacksoft.local', 'password': 'carga123'},
    {'email': 'superadmin@dobacksoft.com', 'password': 'superadmin123'},
    {'email': 'admin', 'password': 'admin'}
]

print("🔐 Restaurando contraseñas comunes...")
print("=" * 50)

for user_data in password_updates:
    email = user_data['email']
    password = user_data['password']
    
    # Verificar si el usuario existe
    cur.execute('SELECT id, name FROM "User" WHERE email = %s', (email,))
    user = cur.fetchone()
    
    if user:
        user_id, name = user
        
        # Hash de la nueva contraseña
        hashed_password = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        
        # Actualizar contraseña
        cur.execute('UPDATE "User" SET password = %s WHERE email = %s', (hashed_password, email))
        
        print(f"✅ {email} ({name})")
        print(f"   📧 Email: {email}")
        print(f"   🔑 Password: {password}")
        print()
    else:
        print(f"❌ Usuario no encontrado: {email}")

# Confirmar cambios
conn.commit()
print("💾 Cambios guardados en la base de datos")
print()
print("🎯 Usuarios listos para login:")
print("   admin@cmadrid.com / 123456")
print("   admin@doback.local / admin") 
print("   carga@dobacksoft.local / carga123")
print("   superadmin@dobacksoft.com / superadmin123")

conn.close() 