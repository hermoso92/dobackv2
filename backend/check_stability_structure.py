import psycopg2
from psycopg2.extras import RealDictCursor

def check_stability_structure():
    try:
        # Conectar a la base de datos
        conn = psycopg2.connect(
            host='localhost',
            database='dobacksoft',
            user='postgres',
            password='cosigein',
            cursor_factory=RealDictCursor
        )
        
        cur = conn.cursor()
        
        # Obtener estructura de la tabla
        cur.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'StabilityMeasurement'
            ORDER BY ordinal_position
        """)
        
        columns = cur.fetchall()
        
        print("=== ESTRUCTURA DE LA TABLA StabilityMeasurement ===")
        print()
        for col in columns:
            nullable = "NULL" if col['is_nullable'] == 'YES' else "NOT NULL"
            default = f" DEFAULT {col['column_default']}" if col['column_default'] else ""
            print(f"  {col['column_name']}: {col['data_type']} {nullable}{default}")
        
        # Obtener un ejemplo de registro
        cur.execute("""
            SELECT * FROM "StabilityMeasurement" 
            LIMIT 1
        """)
        
        example = cur.fetchone()
        
        if example:
            print(f"\n=== EJEMPLO DE REGISTRO ===")
            print()
            for key, value in example.items():
                print(f"  {key}: {value}")
        else:
            print("\n❌ No hay registros en la tabla StabilityMeasurement")
        
        # Contar registros totales
        cur.execute("SELECT COUNT(*) as total FROM \"StabilityMeasurement\"")
        count = cur.fetchone()
        print(f"\n📊 Total de registros: {count['total']}")
        
        # Verificar sesiones con mediciones de estabilidad
        cur.execute("""
            SELECT s.id, s."startTime", s."endTime", 
                   o.name as empresa, v.name as vehiculo,
                   COUNT(sm.id) as mediciones
            FROM "Session" s
            JOIN "Organization" o ON s."organizationId" = o.id
            JOIN "Vehicle" v ON s."vehicleId" = v.id
            LEFT JOIN "StabilityMeasurement" sm ON s.id = sm."sessionId"
            GROUP BY s.id, s."startTime", s."endTime", o.name, v.name
            HAVING COUNT(sm.id) > 0
            ORDER BY s."createdAt" DESC
            LIMIT 5
        """)
        
        sessions = cur.fetchall()
        
        print(f"\n=== SESIONES CON MEDICIONES DE ESTABILIDAD ===")
        for session in sessions:
            print(f"  Sesión {session['id'][:8]}... - {session['empresa']}/{session['vehiculo']}")
            print(f"    Fecha: {session['startTime']} - {session['endTime']}")
            print(f"    Mediciones: {session['mediciones']}")
            print()
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    check_stability_structure() 