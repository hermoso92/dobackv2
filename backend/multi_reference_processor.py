#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Procesador multi-referencia que prueba todas las combinaciones posibles
usando cada tipo de archivo como punto de partida.
"""

import os
import sys
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from complete_processor import DobackProcessor

class MultiReferenceProcessor:
    """
    Procesador que busca sesiones usando cada tipo de archivo como referencia.
    """
    
    def __init__(self):
        self.base_processor = DobackProcessor()
        self.max_early_minutes = 10  # Máximo 10 minutos antes de la referencia
        
    def scan_files(self):
        """Escanea todos los archivos."""
        self.base_processor.scan_files_and_find_sessions()
        
    def find_sessions_by_reference(self, vehicle: str, reference_type: str) -> List[Dict]:
        """
        Busca sesiones usando un tipo específico como referencia.
        
        Args:
            vehicle: Nombre del vehículo
            reference_type: Tipo de archivo a usar como referencia (CAN, GPS, ESTABILIDAD, ROTATIVO)
            
        Returns:
            Lista de sesiones encontradas
        """
        # Filtrar archivos del vehículo
        vehicle_files = [f for f in self.base_processor.all_files if f['vehicle'] == vehicle]
        
        # Agrupar por tipo
        files_by_type = {}
        for file_info in vehicle_files:
            file_type = file_info['type']
            if file_type not in files_by_type:
                files_by_type[file_type] = []
            files_by_type[file_type].append(file_info)
        
        if reference_type not in files_by_type:
            return []
        
        sessions = []
        reference_files = files_by_type[reference_type]
        
        for ref_file in reference_files:
            session = self._find_matching_session_multi_ref(ref_file, files_by_type, reference_type)
            if session:
                sessions.append(session)
        
        return sessions
    
    def _find_matching_session_multi_ref(self, ref_file: Dict, files_by_type: Dict, ref_type: str) -> Optional[Dict]:
        """
        Busca archivos de otros tipos que se solapen con el archivo de referencia.
        """
        ref_start = ref_file.get('start_time')
        ref_end = ref_file.get('end_time')
        if not ref_start or not ref_end:
            return None
        
        session_files = {ref_type: ref_file}
        required_types = ['CAN', 'GPS', 'ESTABILIDAD', 'ROTATIVO']
        
        for file_type in required_types:
            if file_type == ref_type:
                continue  # Ya tenemos este tipo
                
            if file_type not in files_by_type:
                return None
            
            best_match = None
            max_overlap = 0
            
            for file_info in files_by_type[file_type]:
                f_start = file_info.get('start_time')
                f_end = file_info.get('end_time')
                if not f_start or not f_end:
                    continue
                
                # Verificar que no empiece demasiado antes de la referencia
                early_diff = (ref_start - f_start).total_seconds() / 60.0
                if early_diff > self.max_early_minutes:
                    continue
                
                # Debe haber solapamiento real
                latest_start = max(ref_start, f_start)
                earliest_end = min(ref_end, f_end)
                overlap = (earliest_end - latest_start).total_seconds()
                
                if overlap > 0 and overlap > max_overlap:
                    max_overlap = overlap
                    best_match = file_info
            
            if best_match is None:
                return None
            
            session_files[file_type] = best_match
        
        # Calcular rango de la sesión como intersección
        all_starts = [f['start_time'] for f in session_files.values()]
        all_ends = [f['end_time'] for f in session_files.values()]
        session_start = max(all_starts)
        session_end = min(all_ends)
        
        if session_start >= session_end:
            return None
        
        return {
            'files': session_files,
            'start_time': session_start,
            'end_time': session_end,
            'reference_type': ref_type,
            'vehicle': ref_file['vehicle']
        }
    
    def find_all_possible_sessions(self, vehicle: str) -> Dict[str, List[Dict]]:
        """
        Busca todas las sesiones posibles usando cada tipo como referencia.
        
        Args:
            vehicle: Nombre del vehículo
            
        Returns:
            Diccionario con sesiones encontradas por tipo de referencia
        """
        self.scan_files()
        
        all_sessions = {}
        reference_types = ['CAN', 'GPS', 'ESTABILIDAD', 'ROTATIVO']
        
        for ref_type in reference_types:
            sessions = self.find_sessions_by_reference(vehicle, ref_type)
            all_sessions[ref_type] = sessions
            
        return all_sessions
    
    def analyze_sessions(self, vehicle: str):
        """
        Analiza y muestra todas las sesiones posibles encontradas.
        """
        print(f"\n{'='*80}")
        print(f"ANÁLISIS MULTI-REFERENCIA - {vehicle.upper()}")
        print(f"{'='*80}")
        
        all_sessions = self.find_all_possible_sessions(vehicle)
        
        total_sessions = sum(len(sessions) for sessions in all_sessions.values())
        print(f"\nTotal de sesiones encontradas: {total_sessions}")
        
        # Mostrar sesiones por tipo de referencia
        for ref_type, sessions in all_sessions.items():
            print(f"\n--- REFERENCIA: {ref_type} ({len(sessions)} sesiones) ---")
            
            for i, session in enumerate(sessions, 1):
                print(f"\nSesión {i}:")
                print(f"  Rango: {session['start_time']} - {session['end_time']}")
                print(f"  Referencia: {ref_type}")
                
                # Mostrar archivos y sus rangos
                for file_type, file_info in session['files'].items():
                    ref_file = session['files'][session['reference_type']]
                    time_diff = abs((file_info['start_time'] - ref_file['start_time']).total_seconds() / 60)
                    
                    print(f"    {file_type}: {file_info['name']}")
                    print(f"      Rango: {file_info['start_time']} - {file_info['end_time']}")
                    print(f"      Diferencia: {time_diff:.1f} min")
        
        # Análisis de solapamientos
        print(f"\n{'='*80}")
        print("ANÁLISIS DE SOLAPAMIENTOS")
        print(f"{'='*80}")
        
        # Encontrar sesiones únicas (por rango temporal)
        unique_sessions = self._find_unique_sessions(all_sessions)
        
        print(f"\nSesiones únicas encontradas: {len(unique_sessions)}")
        for i, session in enumerate(unique_sessions, 1):
            print(f"\nSesión única {i}:")
            print(f"  Rango: {session['start_time']} - {session['end_time']}")
            print(f"  Referencias que la detectan: {session['detected_by']}")
            
            for file_type, file_info in session['files'].items():
                print(f"    {file_type}: {file_info['name']}")
    
    def _find_unique_sessions(self, all_sessions: Dict[str, List[Dict]]) -> List[Dict]:
        """
        Encuentra sesiones únicas basándose en el rango temporal.
        """
        unique_sessions = []
        
        for ref_type, sessions in all_sessions.items():
            for session in sessions:
                # Buscar si ya existe una sesión similar
                found = False
                for existing in unique_sessions:
                    # Considerar sesiones similares si se solapan significativamente
                    overlap_start = max(session['start_time'], existing['start_time'])
                    overlap_end = min(session['end_time'], existing['end_time'])
                    overlap = (overlap_end - overlap_start).total_seconds()
                    
                    if overlap > 300:  # 5 minutos de solapamiento mínimo
                        existing['detected_by'].append(ref_type)
                        found = True
                        break
                
                if not found:
                    session_copy = session.copy()
                    session_copy['detected_by'] = [ref_type]
                    unique_sessions.append(session_copy)
        
        return unique_sessions

def main():
    """Función principal para probar el procesador multi-referencia."""
    processor = MultiReferenceProcessor()
    
    # Analizar doback022
    processor.analyze_sessions('doback022')

if __name__ == "__main__":
    main() 