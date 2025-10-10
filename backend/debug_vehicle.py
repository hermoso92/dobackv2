import psycopg2

conn = psycopg2.connect(
    host='localhost', 
    database='dobacksoft', 
    user='postgres', 
    password='cosigein', 
    port=5432
)
cur = conn.cursor()

# Verificar vehículo doback022 (minúsculas)
cur.execute('SELECT name, "organizationId" FROM "Vehicle" WHERE name = %s', ('doback022',))
vehicle_result = cur.fetchone()
print('Vehicle doback022:', vehicle_result)

# Verificar usuario test@cmadrid.com
cur.execute('SELECT id, email, "organizationId", role, status FROM "User" WHERE email = %s', ('test@cmadrid.com',))
user_result = cur.fetchone()
print('User test@cmadrid.com:', user_result)

# Verificar si las organizationId coinciden
if vehicle_result and user_result:
    vehicle_org = vehicle_result[1]
    user_org = user_result[2]
    print(f'Vehicle org: {vehicle_org}')
    print(f'User org: {user_org}')
    print(f'Match: {vehicle_org == user_org}')

# Ver todos los usuarios de CMadrid
cmadrid_org_id = '6c2bdfc3-01c1-4b2c-b0f0-a136563fa5f0'
cur.execute('SELECT email, role, status FROM "User" WHERE "organizationId" = %s', (cmadrid_org_id,))
users = cur.fetchall()
print('Usuarios en CMadrid:', users) 