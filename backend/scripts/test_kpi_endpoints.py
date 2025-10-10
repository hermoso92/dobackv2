"""
Script para probar los endpoints de KPIs.
Requiere que el servidor esté corriendo y haya datos procesados.
"""
import requests
from datetime import datetime, timedelta
import json
from backend.utils.logger import logger


BASE_URL = 'http://localhost:9998'
TOKEN = 'test_token'  # Usar token real de autenticación


def test_states_summary():
    """Prueba el endpoint de resumen de estados."""
    logger.info("\n=== Probando GET /api/kpis/states ===")
    
    # Calcular rango de fechas (última semana)
    end_date = datetime.now()
    start_date = end_date - timedelta(days=7)
    
    params = {
        'from': start_date.strftime('%Y-%m-%d'),
        'to': end_date.strftime('%Y-%m-%d'),
        'vehicleIds[]': ['DOBACK023']
    }
    
    headers = {
        'Authorization': f'Bearer {TOKEN}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.get(
            f'{BASE_URL}/api/kpis/states',
            params=params,
            headers=headers
        )
        
        logger.info(f"Status: {response.status_code}")
        
        if response.ok:
            data = response.json()
            logger.info(f"Respuesta exitosa:")
            logger.info(json.dumps(data, indent=2, ensure_ascii=False))
            
            # Mostrar estados
            if data.get('success') and data.get('data'):
                states_data = data['data']
                logger.info("\nEstados detectados:")
                for state in states_data.get('states', []):
                    logger.info(f"  {state['name']}: {state['duration_formatted']} ({state['count']} intervalos)")
                
                logger.info(f"\nTiempo total: {states_data.get('total_time_formatted', 'N/A')}")
                logger.info(f"Tiempo fuera parque: {states_data.get('time_outside_formatted', 'N/A')}")
        else:
            logger.error(f"Error: {response.text}")
            
    except Exception as e:
        logger.error(f"Error en la petición: {e}")


def test_activity_metrics():
    """Prueba el endpoint de métricas de actividad."""
    logger.info("\n=== Probando GET /api/kpis/activity ===")
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=7)
    
    params = {
        'from': start_date.strftime('%Y-%m-%d'),
        'to': end_date.strftime('%Y-%m-%d')
    }
    
    headers = {
        'Authorization': f'Bearer {TOKEN}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.get(
            f'{BASE_URL}/api/kpis/activity',
            params=params,
            headers=headers
        )
        
        logger.info(f"Status: {response.status_code}")
        
        if response.ok:
            data = response.json()
            logger.info(f"Respuesta exitosa:")
            logger.info(json.dumps(data, indent=2, ensure_ascii=False))
            
            if data.get('success') and data.get('data'):
                activity = data['data']
                logger.info("\nMétricas de actividad:")
                logger.info(f"  Kilómetros: {activity.get('km_total', 0)} km")
                logger.info(f"  Horas conducción: {activity.get('driving_hours_formatted', 'N/A')}")
                logger.info(f"  Rotativo ON: {activity.get('rotativo_on_percentage', 0)}%")
                logger.info(f"  Salidas emergencia: {activity.get('emergency_departures', 0)}")
        else:
            logger.error(f"Error: {response.text}")
            
    except Exception as e:
        logger.error(f"Error en la petición: {e}")


def test_stability_metrics():
    """Prueba el endpoint de métricas de estabilidad."""
    logger.info("\n=== Probando GET /api/kpis/stability ===")
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=7)
    
    params = {
        'from': start_date.strftime('%Y-%m-%d'),
        'to': end_date.strftime('%Y-%m-%d')
    }
    
    headers = {
        'Authorization': f'Bearer {TOKEN}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.get(
            f'{BASE_URL}/api/kpis/stability',
            params=params,
            headers=headers
        )
        
        logger.info(f"Status: {response.status_code}")
        
        if response.ok:
            data = response.json()
            logger.info(f"Respuesta exitosa:")
            logger.info(json.dumps(data, indent=2, ensure_ascii=False))
            
            if data.get('success') and data.get('data'):
                stability = data['data']
                logger.info("\nMétricas de estabilidad:")
                logger.info(f"  Total incidencias: {stability.get('total_incidents', 0)}")
                logger.info(f"  Graves: {stability.get('critical', 0)}")
                logger.info(f"  Moderadas: {stability.get('moderate', 0)}")
                logger.info(f"  Leves: {stability.get('light', 0)}")
        else:
            logger.error(f"Error: {response.text}")
            
    except Exception as e:
        logger.error(f"Error en la petición: {e}")


def test_complete_summary():
    """Prueba el endpoint de resumen completo."""
    logger.info("\n=== Probando GET /api/kpis/summary ===")
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=7)
    
    params = {
        'from': start_date.strftime('%Y-%m-%d'),
        'to': end_date.strftime('%Y-%m-%d'),
        'vehicleIds[]': ['DOBACK023', 'DOBACK027']
    }
    
    headers = {
        'Authorization': f'Bearer {TOKEN}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.get(
            f'{BASE_URL}/api/kpis/summary',
            params=params,
            headers=headers
        )
        
        logger.info(f"Status: {response.status_code}")
        
        if response.ok:
            data = response.json()
            logger.info(f"Respuesta exitosa:")
            logger.info(json.dumps(data, indent=2, ensure_ascii=False))
        else:
            logger.error(f"Error: {response.text}")
            
    except Exception as e:
        logger.error(f"Error en la petición: {e}")


def main():
    """Ejecuta todas las pruebas."""
    logger.info("=== Iniciando pruebas de endpoints KPIs ===")
    logger.info(f"Base URL: {BASE_URL}")
    
    test_states_summary()
    test_activity_metrics()
    test_stability_metrics()
    test_complete_summary()
    
    logger.info("\n=== Pruebas completadas ===")


if __name__ == '__main__':
    main()

