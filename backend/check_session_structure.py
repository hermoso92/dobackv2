#!/usr/bin/env python3
"""
Script para consultar la estructura de la tabla Session
"""

import psycopg2
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

def check_session_structure():
    """Consultar la estructura de la tabla Session"""
    try:
        # Conectar a la base de datos
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            port=os.getenv('DB_PORT', '5432'),
            database=os.getenv('DB_NAME', 'dobacksoft'),
            user=os.getenv('DB_USER', 'postgres'),
            password=os.getenv('DB_PASSWORD', 'postgres')
        )
        
        cur = conn.cursor()
        
        # Consultar estructura de la tabla Session
        cur.execute("""
            SELECT column_name, is_nullable, data_type, column_default
            FROM information_schema.columns 
            WHERE table_name = 'Session' 
            ORDER BY ordinal_position;
        """)
        
        columns = cur.fetchall()
        
        print("Estructura de la tabla Session:")
        print("=" * 50)
        for col in columns:
            print(f"{col[0]}: {'NULL' if col[1] == 'YES' else 'NOT NULL'} ({col[2]}) - Default: {col[3]}")
        
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_session_structure() 