import psycopg2

DB_CONFIG = {
    'host': 'localhost',
    'database': 'dobacksoft',
    'user': 'postgres',
    'password': 'cosigein',
    'port': 5432
}

def main():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    # Obtener todas las sesiones con sus vehículos
    cur.execute('''
        SELECT s.id, s."vehicleId", v.name, v."licensePlate", 
               COUNT(g.id) as gps_count, COUNT(c.id) as can_count, COUNT(st.id) as stability_count
        FROM "Session" s
        LEFT JOIN "Vehicle" v ON s."vehicleId" = v.id
        LEFT JOIN "GpsMeasurement" g ON s.id = g."sessionId"
        LEFT JOIN "CanMeasurement" c ON s.id = c."sessionId"
        LEFT JOIN "StabilityMeasurement" st ON s.id = st."sessionId"
        GROUP BY s.id, s."vehicleId", v.name, v."licensePlate"
        ORDER BY s."startTime" DESC
    ''')
    
    sessions = cur.fetchall()
    print('Sesiones en la base de datos:')
    for session_id, vehicle_id, vehicle_name, license_plate, gps_count, can_count, stability_count in sessions:
        print(f'Sesión: {session_id}')
        print(f'  Vehículo ID: {vehicle_id}')
        print(f'  Nombre: {vehicle_name}')
        print(f'  Matrícula: {license_plate}')
        print(f'  Datos: GPS={gps_count}, CAN={can_count}, ESTABILIDAD={stability_count}')
        print()
    
    # Obtener todos los vehículos
    cur.execute('SELECT id, name, "licensePlate" FROM "Vehicle"')
    vehicles = cur.fetchall()
    print('Vehículos disponibles:')
    for vehicle_id, name, license_plate in vehicles:
        print(f'ID: {vehicle_id}, Nombre: {name}, Matrícula: {license_plate}')
    
    cur.close()
    conn.close()

if __name__ == '__main__':
    main() 