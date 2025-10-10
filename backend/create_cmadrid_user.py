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

# Obtener ID de CMadrid
cur.execute('SELECT id FROM "Organization" WHERE name = %s', ('CMadrid',))
org_row = cur.fetchone()
if not org_row:
    print("❌ Organización CMadrid no encontrada")
    exit(1)

org_id = org_row[0]
print(f"✅ CMadrid org ID: {org_id}")

# Crear usuario
hashed = bcrypt.hashpw('admin123'.encode(), bcrypt.gensalt()).decode()
cur.execute('''
    INSERT INTO "User" (id, email, name, password, role, "organizationId", status, "createdAt", "updatedAt") 
    VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, %s, NOW(), NOW()) 
    ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password
''', ('test@cmadrid.com', 'Test CMadrid', hashed, 'ADMIN', org_id, 'ACTIVE'))

conn.commit()
print("✅ Usuario test@cmadrid.com creado/actualizado con password admin123") 