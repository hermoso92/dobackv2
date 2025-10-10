import psycopg2

conn = psycopg2.connect(
    host='localhost', 
    database='dobacksoft', 
    user='postgres', 
    password='cosigein', 
    port=5432
)
cur = conn.cursor()

# Actualizar nombre del vehículo a mayúsculas
cur.execute('UPDATE "Vehicle" SET name = %s WHERE name = %s', ('DOBACK022', 'doback022'))
rows_affected = cur.rowcount
conn.commit()

print(f'✅ Vehicle name updated to uppercase (rows affected: {rows_affected})')

# Verificar
cur.execute('SELECT name, "organizationId" FROM "Vehicle" WHERE name = %s', ('DOBACK022',))
result = cur.fetchone()
print(f'✅ Verification: {result}') 