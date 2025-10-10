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

print("👥 Usuarios existentes en el sistema:")
print("=" * 60)

# Buscar todos los usuarios
cur.execute('SELECT email, name, role, "organizationId", "createdAt" FROM "User" ORDER BY email')
users = cur.fetchall()

for user in users:
    email, name, role, org_id, created = user
    print(f"📧 {email}")
    print(f"   👤 Nombre: {name}")
    print(f"   🔒 Rol: {role}")
    print(f"   🏢 Org ID: {org_id}")
    print(f"   📅 Creado: {created}")
    print()

print("🏢 Organizaciones existentes:")
print("=" * 60)

cur.execute('SELECT id, name FROM "Organization" ORDER BY name')
orgs = cur.fetchall()

for org in orgs:
    org_id, org_name = org
    print(f"🏢 {org_name}")
    print(f"   ID: {org_id}")
    
    # Contar usuarios en esta organización
    cur.execute('SELECT COUNT(*) FROM "User" WHERE "organizationId" = %s', (org_id,))
    user_count = cur.fetchone()[0]
    print(f"   👥 Usuarios: {user_count}")
    print()

conn.close() 