#!/usr/bin/env python3
"""
Script para analizar las mejores sesiones y encontrar las 6 sesiones óptimas
"""

import json
from collections import defaultdict
from typing import Dict, List, Any

def analyze_best_sessions():
    """Analiza las mejores sesiones y encuentra las 6 sesiones óptimas"""
    
    # Cargar el reporte
    with open('parejas_analysis_report.json', 'r', encoding='utf-8') as f:
        report = json.load(f)
    
    print("🔍 ANÁLISIS DE LAS MEJORES SESIONES")
    print("="*60)
    print(f"Total de sesiones encontradas: {report['total_sessions_found']}")
    
    # Agrupar sesiones por archivo CAN
    sessions_by_can = defaultdict(list)
    
    for session in report['sessions']:
        can_file = session['files']['CAN']
        sessions_by_can[can_file].append(session)
    
    print(f"\n📊 Sesiones agrupadas por archivo CAN:")
    for can_file, sessions in sessions_by_can.items():
        print(f"  {can_file}: {len(sessions)} sesiones posibles")
    
    # Encontrar las mejores sesiones para cada CAN
    best_sessions = []
    
    for can_file, sessions in sessions_by_can.items():
        # Ordenar por score (mejor primero)
        sessions.sort(key=lambda x: x['score'], reverse=True)
        
        # Tomar la mejor sesión para este CAN
        best_session = sessions[0]
        best_sessions.append(best_session)
        
        print(f"\n🏆 MEJOR SESIÓN para {can_file}:")
        print(f"  Score: {best_session['score']:.3f}")
        print(f"  Fecha: {best_session['date']}")
        print(f"  Hora CAN: {best_session['start_time']}")
        print(f"  Archivos:")
        print(f"    CAN: {best_session['files']['CAN']}")
        print(f"    GPS: {best_session['files']['GPS']} (diferencia: {best_session['time_diffs']['gps_diff']:.1f} min)")
        print(f"    ESTABILIDAD: {best_session['files']['ESTABILIDAD']} (diferencia: {best_session['time_diffs']['estabilidad_diff']:.1f} min)")
        print(f"    ROTATIVO: {best_session['files']['ROTATIVO']} (diferencia: {best_session['time_diffs']['rotativo_diff']:.1f} min)")
    
    # Ordenar las mejores sesiones por score
    best_sessions.sort(key=lambda x: x['score'], reverse=True)
    
    print(f"\n🎯 LAS 6 MEJORES SESIONES (una por cada archivo CAN):")
    print("="*60)
    
    for i, session in enumerate(best_sessions, 1):
        print(f"\n{i}. CAN: {session['files']['CAN']}")
        print(f"   Score: {session['score']:.3f}")
        print(f"   Fecha: {session['date']}")
        print(f"   Hora: {session['start_time']}")
        print(f"   Diferencias temporales:")
        print(f"     GPS: {session['time_diffs']['gps_diff']:.1f} min")
        print(f"     ESTABILIDAD: {session['time_diffs']['estabilidad_diff']:.1f} min")
        print(f"     ROTATIVO: {session['time_diffs']['rotativo_diff']:.1f} min")
        print(f"   Archivos completos:")
        print(f"     CAN: {session['files']['CAN']}")
        print(f"     GPS: {session['files']['GPS']}")
        print(f"     ESTABILIDAD: {session['files']['ESTABILIDAD']}")
        print(f"     ROTATIVO: {session['files']['ROTATIVO']}")
    
    # Guardar las 6 mejores sesiones
    best_sessions_report = {
        'timestamp': report['timestamp'],
        'total_sessions_analyzed': report['total_sessions_found'],
        'best_sessions_count': len(best_sessions),
        'best_sessions': []
    }
    
    for i, session in enumerate(best_sessions, 1):
        session_info = {
            'rank': i,
            'can_file': session['files']['CAN'],
            'score': session['score'],
            'date': session['date'],
            'start_time': session['start_time'],
            'time_diffs': session['time_diffs'],
            'files': session['files']
        }
        best_sessions_report['best_sessions'].append(session_info)
    
    # Guardar reporte de mejores sesiones
    with open('best_sessions_report.json', 'w', encoding='utf-8') as f:
        json.dump(best_sessions_report, f, indent=2, default=str)
    
    print(f"\n✅ Reporte de mejores sesiones guardado en: best_sessions_report.json")
    
    # Estadísticas
    print(f"\n📈 ESTADÍSTICAS:")
    print(f"  Total de sesiones analizadas: {report['total_sessions_found']}")
    print(f"  Mejores sesiones encontradas: {len(best_sessions)}")
    print(f"  Score promedio: {sum(s['score'] for s in best_sessions) / len(best_sessions):.3f}")
    print(f"  Score máximo: {max(s['score'] for s in best_sessions):.3f}")
    print(f"  Score mínimo: {min(s['score'] for s in best_sessions):.3f}")
    
    # Verificar si tenemos las 6 sesiones
    if len(best_sessions) == 6:
        print(f"\n🎉 ¡ÉXITO! Se encontraron las 6 sesiones completas para DOBACK022")
    else:
        print(f"\n⚠️  Se encontraron {len(best_sessions)} sesiones de las 6 esperadas")

def main():
    """Función principal"""
    analyze_best_sessions()

if __name__ == "__main__":
    main() 