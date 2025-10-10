import psycopg2

DB_CONFIG = {
    'host': 'localhost',
    'database': 'dobacksoft',
    'user': 'postgres',
    'password': 'cosigein',
    'port': 5432
}

tablas = [
    'StabilityMeasurement',
    'GpsMeasurement',
    'RotativoMeasurement',
    'CanMeasurement'
]

col_session = '"sessionId"'  # Columna con mayúscula I

def main():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    sesiones_por_tabla = {}
    for tabla in tablas:
        try:
            cur.execute(f'SELECT COUNT(*), COUNT(DISTINCT {col_session}) FROM "{tabla}"')
            total, sesiones = cur.fetchone()
            print(f'{tabla}: {total} puntos, {sesiones} sesiones')
            cur.execute(f'SELECT DISTINCT {col_session} FROM "{tabla}"')
            sesiones_ids = [row[0] for row in cur.fetchall()]
            sesiones_por_tabla[tabla] = set(sesiones_ids)
        except Exception as e:
            print(f'Error en {tabla}: {e}')
    # Mostrar coincidencias de sesiones
    print('\nCoincidencia de sessionId entre tipos:')
    for t1 in tablas:
        for t2 in tablas:
            if t1 != t2 and t1 in sesiones_por_tabla and t2 in sesiones_por_tabla:
                comunes = sesiones_por_tabla[t1] & sesiones_por_tabla[t2]
                print(f'{t1} ∩ {t2}: {len(comunes)} sesiones comunes')
    cur.close()
    conn.close()

if __name__ == '__main__':
    main() 