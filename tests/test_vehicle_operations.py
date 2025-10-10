#!/usr/bin/env python
"""
Script para probar operaciones con vehículos y sesiones de estabilidad
usando la base de datos SQLite creada por create_test_db.py.
"""

import os
import sys
import logging
import sqlite3
from datetime import datetime, timedelta
import json
import random

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger('test_vehicle_operations')

# Ruta de la base de datos
DB_PATH = 'test_DobackSoft.db'

def connect_db():
    """Conecta a la base de datos SQLite"""
    if not os.path.exists(DB_PATH):
        logger.error(f"La base de datos {DB_PATH} no existe. Por favor, ejecute create_test_db.py primero.")
        sys.exit(1)
    
    return sqlite3.connect(DB_PATH)

def create_vehicle(conn, name, plate, company_id, fleet_id=None, model=None, year=None):
    """Crea un nuevo vehículo en la base de datos"""
    logger.info(f"Creando vehículo: {name} ({plate})")
    
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO vehicles (name, plate, company_id, fleet_id, model, year, created_at, updated_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (name, plate, company_id, fleet_id, model, year, datetime.now(), datetime.now()))
    
    vehicle_id = cursor.lastrowid
    conn.commit()
    
    logger.info(f"✓ Vehículo creado con ID: {vehicle_id}")
    return vehicle_id

def get_vehicle(conn, vehicle_id):
    """Obtiene información de un vehículo por su ID"""
    logger.info(f"Obteniendo información del vehículo ID: {vehicle_id}")
    
    cursor = conn.cursor()
    cursor.execute("""
    SELECT id, name, plate, company_id, fleet_id, model, year, status, description 
    FROM vehicles 
    WHERE id = ?
    """, (vehicle_id,))
    
    vehicle = cursor.fetchone()
    if vehicle:
        vehicle_dict = {
            'id': vehicle[0],
            'name': vehicle[1],
            'plate': vehicle[2],
            'company_id': vehicle[3],
            'fleet_id': vehicle[4],
            'model': vehicle[5],
            'year': vehicle[6],
            'status': vehicle[7],
            'description': vehicle[8]
        }
        logger.info(f"✓ Vehículo encontrado: {vehicle_dict['name']}")
        return vehicle_dict
    else:
        logger.warning(f"✗ Vehículo con ID {vehicle_id} no encontrado")
        return None

def update_vehicle(conn, vehicle_id, **kwargs):
    """Actualiza información de un vehículo"""
    logger.info(f"Actualizando vehículo ID: {vehicle_id}")
    
    # Construir consulta dinámica
    fields = []
    values = []
    
    for key, value in kwargs.items():
        if key in ['name', 'plate', 'model', 'year', 'status', 'description']:
            fields.append(f"{key} = ?")
            values.append(value)
    
    if not fields:
        logger.warning("No hay campos válidos para actualizar")
        return False
    
    fields.append("updated_at = ?")
    values.append(datetime.now())
    
    # Añadir vehicle_id al final
    values.append(vehicle_id)
    
    query = f"UPDATE vehicles SET {', '.join(fields)} WHERE id = ?"
    
    cursor = conn.cursor()
    cursor.execute(query, values)
    conn.commit()
    
    if cursor.rowcount > 0:
        logger.info(f"✓ Vehículo ID {vehicle_id} actualizado")
        return True
    else:
        logger.warning(f"✗ No se pudo actualizar el vehículo ID {vehicle_id}")
        return False

def delete_vehicle(conn, vehicle_id):
    """Elimina un vehículo de la base de datos"""
    logger.info(f"Eliminando vehículo ID: {vehicle_id}")
    
    cursor = conn.cursor()
    cursor.execute("DELETE FROM vehicles WHERE id = ?", (vehicle_id,))
    conn.commit()
    
    if cursor.rowcount > 0:
        logger.info(f"✓ Vehículo ID {vehicle_id} eliminado")
        return True
    else:
        logger.warning(f"✗ No se pudo eliminar el vehículo ID {vehicle_id}")
        return False

def create_stability_session(conn, vehicle_id, user_id, start_time, end_time=None, status='pending'):
    """Crea una nueva sesión de estabilidad"""
    logger.info(f"Creando sesión de estabilidad para vehículo ID: {vehicle_id}")
    
    if end_time is None:
        end_time = start_time + timedelta(hours=1)
    
    file_path = f"/uploads/stability/{vehicle_id}_{start_time.strftime('%Y%m%d_%H%M%S')}.csv"
    
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO stability_sessions 
    (vehicle_id, user_id, start_time, end_time, file_path, status, 
     created_at, updated_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (vehicle_id, user_id, start_time, end_time, file_path, status, 
          datetime.now(), datetime.now()))
    
    session_id = cursor.lastrowid
    conn.commit()
    
    logger.info(f"✓ Sesión de estabilidad creada con ID: {session_id}")
    return session_id

def add_stability_data(conn, session_id, vehicle_id, num_points=20):
    """Añade datos de estabilidad a una sesión"""
    logger.info(f"Añadiendo {num_points} puntos de datos a la sesión ID: {session_id}")
    
    # Obtener información de la sesión
    cursor = conn.cursor()
    cursor.execute("""
    SELECT start_time, end_time FROM stability_sessions WHERE id = ?
    """, (session_id,))
    
    session = cursor.fetchone()
    if not session:
        logger.error(f"✗ Sesión ID {session_id} no encontrada")
        return False
    
    start_time = datetime.fromisoformat(session[0])
    end_time = datetime.fromisoformat(session[1])
    duration = (end_time - start_time).total_seconds()
    
    # Crear datos de estabilidad
    for i in range(num_points):
        # Calcular timestamp en función de la posición
        timestamp = start_time + timedelta(seconds=(duration / num_points) * i)
        
        # Generar valores aleatorios realistas
        roll_angle = random.uniform(-10, 10)
        pitch_angle = random.uniform(-5, 5)
        yaw_rate = random.uniform(-5, 5)
        lat_accel = random.uniform(-0.8, 0.8)
        long_accel = random.uniform(-0.6, 0.6)
        vert_accel = random.uniform(-0.5, 0.5)
        
        # Crear índice de estabilidad en función de los valores
        components = [
            abs(roll_angle) / 30 * 0.3,
            abs(pitch_angle) / 15 * 0.3,
            abs(lat_accel) / 1.0 * 0.2,
            abs(long_accel) / 1.0 * 0.1,
            abs(vert_accel) / 1.0 * 0.1
        ]
        stability_index = sum(components)
        
        # Determinar nivel de riesgo
        if stability_index >= 0.8:
            risk_level = "CRITICAL"
        elif stability_index >= 0.6:
            risk_level = "HIGH"
        elif stability_index >= 0.4:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"
        
        # Crear raw_data como JSON
        raw_data = json.dumps({
            'imu_data': {
                'acc_x': long_accel,
                'acc_y': lat_accel,
                'acc_z': vert_accel,
                'gyr_x': roll_angle / 10,
                'gyr_y': pitch_angle / 10,
                'gyr_z': yaw_rate / 10
            },
            'source': 'test_script'
        })
        
        # Insertar en la base de datos
        cursor.execute("""
        INSERT INTO stability_data 
        (stability_session_id, vehicle_id, timestamp, roll_angle, pitch_angle, yaw_rate,
         lateral_acceleration, longitudinal_acceleration, vertical_acceleration,
         stability_index, risk_level, raw_data, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (session_id, vehicle_id, timestamp, roll_angle, pitch_angle, yaw_rate,
              lat_accel, long_accel, vert_accel, stability_index, risk_level, raw_data,
              datetime.now(), datetime.now()))
    
    # Actualizar estadísticas de la sesión
    cursor.execute("""
    SELECT 
        MAX(stability_index) as max_idx,
        AVG(stability_index) as avg_idx,
        MIN(stability_index) as min_idx,
        COUNT(*) as total,
        SUM(CASE WHEN risk_level = 'CRITICAL' THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN risk_level = 'HIGH' THEN 1 ELSE 0 END) as high,
        SUM(CASE WHEN risk_level = 'MEDIUM' THEN 1 ELSE 0 END) as medium,
        SUM(CASE WHEN risk_level = 'LOW' THEN 1 ELSE 0 END) as low
    FROM stability_data
    WHERE stability_session_id = ?
    """, (session_id,))
    
    stats = cursor.fetchone()
    
    # Actualizar la sesión con las estadísticas
    cursor.execute("""
    UPDATE stability_sessions SET
        max_stability_index = ?,
        avg_stability_index = ?,
        min_stability_index = ?,
        total_events = ?,
        critical_events = ?,
        high_risk_events = ?,
        medium_risk_events = ?,
        low_risk_events = ?,
        status = ?,
        updated_at = ?
    WHERE id = ?
    """, (stats[0], stats[1], stats[2], stats[3], stats[4], stats[5], stats[6], stats[7],
          'completed', datetime.now(), session_id))
    
    conn.commit()
    logger.info(f"✓ {num_points} puntos de datos añadidos y estadísticas actualizadas")
    return True

def get_stability_session_data(conn, session_id):
    """Obtiene datos de una sesión de estabilidad"""
    logger.info(f"Obteniendo datos de la sesión de estabilidad ID: {session_id}")
    
    cursor = conn.cursor()
    
    # Obtener información de la sesión
    cursor.execute("""
    SELECT id, vehicle_id, user_id, start_time, end_time, status,
           max_stability_index, avg_stability_index, min_stability_index,
           total_events, critical_events, high_risk_events, medium_risk_events, low_risk_events
    FROM stability_sessions
    WHERE id = ?
    """, (session_id,))
    
    session = cursor.fetchone()
    if not session:
        logger.warning(f"✗ Sesión ID {session_id} no encontrada")
        return None
    
    session_dict = {
        'id': session[0],
        'vehicle_id': session[1],
        'user_id': session[2],
        'start_time': session[3],
        'end_time': session[4],
        'status': session[5],
        'max_stability_index': session[6],
        'avg_stability_index': session[7],
        'min_stability_index': session[8],
        'total_events': session[9],
        'critical_events': session[10],
        'high_risk_events': session[11],
        'medium_risk_events': session[12],
        'low_risk_events': session[13]
    }
    
    # Obtener datos de estabilidad
    cursor.execute("""
    SELECT id, timestamp, roll_angle, pitch_angle, stability_index, risk_level
    FROM stability_data
    WHERE stability_session_id = ?
    ORDER BY timestamp
    """, (session_id,))
    
    data_points = cursor.fetchall()
    
    stability_data = []
    for point in data_points:
        stability_data.append({
            'id': point[0],
            'timestamp': point[1],
            'roll_angle': point[2],
            'pitch_angle': point[3],
            'stability_index': point[4],
            'risk_level': point[5]
        })
    
    session_dict['stability_data'] = stability_data
    
    logger.info(f"✓ Obtenidos {len(stability_data)} puntos de datos para la sesión")
    return session_dict

def main():
    """Función principal"""
    try:
        # Conectar a la base de datos
        conn = connect_db()
        logger.info("Conexión a la base de datos establecida")
        
        # Obtener el ID de la primera compañía
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM companies LIMIT 1")
        company_id = cursor.fetchone()[0]
        
        # Obtener el ID de la primera flota
        cursor.execute("SELECT id FROM fleets LIMIT 1")
        fleet_id = cursor.fetchone()[0]
        
        # Obtener el ID del primer usuario
        cursor.execute("SELECT id FROM users LIMIT 1")
        user_id = cursor.fetchone()[0]
        
        # Probar operaciones CRUD de vehículos
        logger.info("=" * 50)
        logger.info("PRUEBA DE OPERACIONES CRUD DE VEHÍCULOS")
        logger.info("=" * 50)
        
        vehicle_id = create_vehicle(
            conn, 
            f"Test Vehicle {datetime.now().strftime('%H%M%S')}", 
            f"TEST-{datetime.now().strftime('%H%M%S')}", 
            company_id, 
            fleet_id, 
            "Test Model", 
            2023
        )
        
        vehicle = get_vehicle(conn, vehicle_id)
        print(f"Vehículo creado: {vehicle}")
        
        update_vehicle(conn, vehicle_id, name="Updated Vehicle Name", status="maintenance")
        
        vehicle = get_vehicle(conn, vehicle_id)
        print(f"Vehículo actualizado: {vehicle}")
        
        # Probar operaciones de sesiones de estabilidad
        logger.info("=" * 50)
        logger.info("PRUEBA DE OPERACIONES DE SESIONES DE ESTABILIDAD")
        logger.info("=" * 50)
        
        # Crear sesión de estabilidad
        start_time = datetime.now() - timedelta(hours=2)
        end_time = datetime.now() - timedelta(hours=1)
        
        session_id = create_stability_session(
            conn, vehicle_id, user_id, start_time, end_time
        )
        
        # Añadir datos de estabilidad
        add_stability_data(conn, session_id, vehicle_id, num_points=20)
        
        # Obtener datos de la sesión
        session_data = get_stability_session_data(conn, session_id)
        print(f"Sesión de estabilidad: ID={session_data['id']}, Vehículo={session_data['vehicle_id']}")
        print(f"Índices de estabilidad: Max={session_data['max_stability_index']:.2f}, Avg={session_data['avg_stability_index']:.2f}, Min={session_data['min_stability_index']:.2f}")
        print(f"Eventos: Total={session_data['total_events']}, Críticos={session_data['critical_events']}, Altos={session_data['high_risk_events']}, Medios={session_data['medium_risk_events']}, Bajos={session_data['low_risk_events']}")
        
        # Limpieza (opcional, comentar si se quieren mantener los datos)
        # delete_vehicle(conn, vehicle_id)
        
        # Cerrar conexión
        conn.close()
        logger.info("Pruebas completadas exitosamente")
        
    except sqlite3.Error as e:
        logger.error(f"Error de SQLite: {e}")
    except Exception as e:
        logger.error(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main() 