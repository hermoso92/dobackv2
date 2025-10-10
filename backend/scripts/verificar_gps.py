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
    
    # Contar sesiones con datos GPS
    cur.execute('SELECT "sessionId", COUNT(*) FROM "GpsMeasurement" GROUP BY "sessionId"')
    sessions = cur.fetchall()
    print('Sesiones con datos GPS:')
    for session_id, count in sessions:
        print(f'Sesión {session_id}: {count} puntos')
    
    if sessions:
        session_id = sessions[0][0]  # Primera sesión
        print(f'\nVerificando datos de la sesión: {session_id}')
        
        # Verificar si hay coordenadas válidas
        cur.execute('''
            SELECT latitude, longitude, speed, timestamp 
            FROM "GpsMeasurement" 
            WHERE "sessionId" = %s 
            ORDER BY timestamp 
            LIMIT 10
        ''', (session_id,))
        
        points = cur.fetchall()
        print(f'\nPrimeros 10 puntos GPS de la sesión {session_id}:')
        for i, (lat, lon, speed, ts) in enumerate(points):
            print(f'{i+1}. lat={lat}, lon={lon}, speed={speed}, timestamp={ts}')
        
        # Contar puntos con coordenadas válidas
        cur.execute('''
            SELECT COUNT(*) FROM "GpsMeasurement" 
            WHERE "sessionId" = %s AND latitude != 0 AND longitude != 0
        ''', (session_id,))
        valid_count = cur.fetchone()[0]
        
        cur.execute('''
            SELECT COUNT(*) FROM "GpsMeasurement" 
            WHERE "sessionId" = %s
        ''', (session_id,))
        total_count = cur.fetchone()[0]
        
        print(f'\nResumen: {valid_count}/{total_count} puntos tienen coordenadas válidas (no cero)')
    
    cur.close()
    conn.close()

if __name__ == '__main__':
    main() 