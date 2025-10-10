import requests
import json

def test_telemetry_endpoint():
    # Primero obtener el vehicleId correcto de la base de datos
    import psycopg2
    
    DB_CONFIG = {
        'host': 'localhost',
        'database': 'dobacksoft',
        'user': 'postgres',
        'password': 'cosigein',
        'port': 5432
    }
    
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    # Obtener el vehicleId de la sesión que tiene datos GPS
    cur.execute('''
        SELECT DISTINCT s."vehicleId", v.name, v."licensePlate"
        FROM "Session" s
        JOIN "Vehicle" v ON s."vehicleId" = v.id
        JOIN "GpsMeasurement" g ON s.id = g."sessionId"
        LIMIT 1
    ''')
    
    result = cur.fetchone()
    if not result:
        print("No se encontraron sesiones con datos GPS")
        return
    
    vehicle_id, vehicle_name, license_plate = result
    print(f"Vehículo encontrado: ID={vehicle_id}, Nombre={vehicle_name}, Matrícula={license_plate}")
    
    cur.close()
    conn.close()
    
    # Hacer petición al endpoint
    url = f"http://localhost:9998/api/telemetry/{vehicle_id}/sessions"
    print(f"\nHaciendo petición a: {url}")
    
    headers = {"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImE4MDcxOTQ0LTk4OWMtNDYyNy1iOGE3LTcxYWEwM2YyNDE4MCIsImVtYWlsIjoiYWRtaW5AY21hZHJpZC5jb20iLCJyb2xlIjoiQURNSU4iLCJvcmdhbml6YXRpb25JZCI6IjZjMmJkZmMzLTAxYzEtNGIyYy1iMGYwLWExMzY1NjNmYTVmMCIsImlhdCI6MTc1MjU0NzYyMSwiZXhwIjoxNzUyNjM0MDIxfQ.jPKs2kTBKpoT1DEFjqf3z0ytOUDRaeFXMnjz4MntZVA"}
    try:
        response = requests.get(url, headers=headers, timeout=10)
        print(f"Status code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Respuesta exitosa: {data.get('success', False)}")
            
            if data.get('success') and 'data' in data:
                sessions = data['data']
                print(f"Número de sesiones devueltas: {len(sessions)}")
                
                for i, session in enumerate(sessions):
                    print(f"\n--- Sesión {i+1} ---")
                    print(f"ID: {session.get('id')}")
                    print(f"VehicleId: {session.get('vehicleId')}")
                    print(f"StartTime: {session.get('startTime')}")
                    print(f"Status: {session.get('status')}")
                    
                    gps_data = session.get('gpsData', [])
                    print(f"GPS Data: {len(gps_data)} puntos")
                    
                    if gps_data:
                        print("Primeros 3 puntos GPS:")
                        for j, point in enumerate(gps_data[:3]):
                            print(f"  {j+1}. lat={point.get('latitude')}, lon={point.get('longitude')}, speed={point.get('speed')}")
                        
                        # Verificar si hay coordenadas válidas
                        valid_points = [p for p in gps_data if p.get('latitude') and p.get('longitude') and p.get('latitude') != 0 and p.get('longitude') != 0]
                        print(f"Puntos con coordenadas válidas: {len(valid_points)}/{len(gps_data)}")
                    else:
                        print("⚠️  NO HAY DATOS GPS EN ESTA SESIÓN")
                        
                    can_data = session.get('canData', [])
                    print(f"CAN Data: {len(can_data)} puntos")
            else:
                print("Respuesta no exitosa o sin datos")
                print(f"Contenido: {data}")
        else:
            print(f"Error HTTP: {response.status_code}")
            print(f"Contenido: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"Error de conexión: {e}")
    except json.JSONDecodeError as e:
        print(f"Error decodificando JSON: {e}")
        print(f"Contenido: {response.text}")

if __name__ == '__main__':
    test_telemetry_endpoint() 