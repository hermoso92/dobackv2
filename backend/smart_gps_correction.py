#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Procesador inteligente que detecta automáticamente desfases de 2 horas en GPS
y solo aplica corrección cuando se detecta exactamente ese patrón.
"""

import os
import sys
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from complete_processor import DobackProcessor

class SmartGPSCorrectionProcessor:
    """
    Procesador que detecta automáticamente desfases de 2 horas en GPS
    y aplica corrección solo cuando se detecta el patrón exacto.
    """
    
    def __init__(self):
        self.base_processor = DobackProcessor()
        self.max_early_minutes = 10
        self.gps_offset_hours = 2  # Desfase a detectar
        self.tolerance_minutes = 1  # Tolerancia para detectar el desfase
        
    def scan_files(self):
        """Escanea todos los archivos."""
        self.base_processor.scan_files_and_find_sessions()
        
    def detect_gps_offset(self, vehicle: str) -> Dict[str, bool]:
        """
        Detecta automáticamente si los archivos GPS están desfasados 2 horas.
        
        Args:
            vehicle: Nombre del vehículo
            
        Returns:
            Diccionario con archivos GPS y si necesitan corrección
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
        
        gps_corrections = {}
        
        if 'GPS' not in files_by_type:
            return gps_corrections
            
        # Para cada archivo GPS, buscar archivos de otros tipos cercanos
        for gps_file in files_by_type['GPS']:
            gps_start = gps_file['start_time']
            gps_name = gps_file['name']
            
            # Buscar archivos de otros tipos que estén cerca temporalmente
            nearby_files = []
            
            for file_type in ['CAN', 'ESTABILIDAD', 'ROTATIVO']:
                if file_type not in files_by_type:
                    continue
                    
                for other_file in files_by_type[file_type]:
                    other_start = other_file['start_time']
                    
                    # Calcular diferencia temporal
                    time_diff = abs((gps_start - other_start).total_seconds() / 3600)  # en horas
                    
                    # Si están dentro de 3 horas, considerarlos cercanos
                    if time_diff <= 3:
                        nearby_files.append({
                            'type': file_type,
                            'file': other_file,
                            'time_diff_hours': time_diff
                        })
            
            # Analizar si hay un patrón de desfase de 2 horas
            needs_correction = self._analyze_offset_pattern(gps_start, nearby_files)
            gps_corrections[gps_name] = needs_correction
            
            print(f"GPS {gps_name}:")
            print(f"  Inicio: {gps_start}")
            print(f"  Archivos cercanos: {len(nearby_files)}")
            if nearby_files:
                for nearby in nearby_files:
                    print(f"    {nearby['type']}: {nearby['file']['name']} (diferencia: {nearby['time_diff_hours']:.2f}h)")
            print(f"  Necesita corrección: {needs_correction}")
            print()
        
        return gps_corrections
    
    def _analyze_offset_pattern(self, gps_start: datetime, nearby_files: List[Dict]) -> bool:
        """
        Analiza si hay un patrón de desfase de 2 horas.
        
        Args:
            gps_start: Inicio del archivo GPS
            nearby_files: Lista de archivos cercanos temporalmente
            
        Returns:
            True si se detecta el patrón de desfase de 2 horas
        """
        if not nearby_files:
            return False
        
        # Contar cuántos archivos están exactamente 2 horas después del GPS
        offset_count = 0
        total_nearby = len(nearby_files)
        
        for nearby in nearby_files:
            other_start = nearby['file']['start_time']
            time_diff_hours = (other_start - gps_start).total_seconds() / 3600
            
            # Verificar si está en el rango de 2 horas ± tolerancia
            if abs(time_diff_hours - self.gps_offset_hours) <= (self.tolerance_minutes / 60):
                offset_count += 1
        
        # Si al menos el 50% de los archivos cercanos siguen el patrón de 2 horas
        # y hay al menos 2 archivos cercanos, consideramos que hay desfase
        return offset_count >= 2 and (offset_count / total_nearby) >= 0.5
    
    def apply_smart_corrections(self, vehicle: str) -> Dict[str, datetime]:
        """
        Aplica correcciones inteligentes solo a los archivos GPS que lo necesiten.
        
        Args:
            vehicle: Nombre del vehículo
            
        Returns:
            Diccionario con archivos GPS corregidos
        """
        gps_corrections = self.detect_gps_offset(vehicle)
        corrected_times = {}
        
        # Aplicar correcciones solo a los archivos que lo necesiten
        for gps_name, needs_correction in gps_corrections.items():
            if needs_correction:
                # Encontrar el archivo GPS original
                for file_info in self.base_processor.all_files:
                    if file_info['vehicle'] == vehicle and file_info['name'] == gps_name:
                        # Aplicar corrección de +2 horas
                        corrected_start = file_info['start_time'] + timedelta(hours=self.gps_offset_hours)
                        corrected_end = file_info['end_time'] + timedelta(hours=self.gps_offset_hours)
                        
                        corrected_times[gps_name] = {
                            'original_start': file_info['start_time'],
                            'original_end': file_info['end_time'],
                            'corrected_start': corrected_start,
                            'corrected_end': corrected_end
                        }
                        
                        print(f"✅ CORREGIDO: {gps_name}")
                        print(f"  Original: {file_info['start_time']} - {file_info['end_time']}")
                        print(f"  Corregido: {corrected_start} - {corrected_end}")
                        print()
                        break
        
        return corrected_times
    
    def find_sessions_with_smart_correction(self, vehicle: str) -> List[Dict]:
        """
        Busca sesiones aplicando correcciones inteligentes al GPS.
        
        Args:
            vehicle: Nombre del vehículo
            
        Returns:
            Lista de sesiones encontradas
        """
        self.scan_files()
        
        # Aplicar correcciones inteligentes
        corrected_times = self.apply_smart_corrections(vehicle)
        
        # Crear una copia de los archivos con correcciones aplicadas
        corrected_files = []
        for file_info in self.base_processor.all_files:
            if file_info['vehicle'] == vehicle:
                corrected_file = file_info.copy()
                
                # Aplicar corrección si es necesario
                if file_info['type'] == 'GPS' and file_info['name'] in corrected_times:
                    corrected_file['start_time'] = corrected_times[file_info['name']]['corrected_start']
                    corrected_file['end_time'] = corrected_times[file_info['name']]['corrected_end']
                
                corrected_files.append(corrected_file)
        
        # Buscar sesiones con archivos corregidos
        return self._find_sessions_from_files(corrected_files)
    
    def _find_sessions_from_files(self, files: List[Dict]) -> List[Dict]:
        """
        Busca sesiones completas desde una lista de archivos.
        """
        # Agrupar por tipo
        files_by_type = {}
        for file_info in files:
            file_type = file_info['type']
            if file_type not in files_by_type:
                files_by_type[file_type] = []
            files_by_type[file_type].append(file_info)
        
        # Verificar que tenemos todos los tipos necesarios
        required_types = ['CAN', 'GPS', 'ESTABILIDAD', 'ROTATIVO']
        if not all(t in files_by_type for t in required_types):
            return []
        
        sessions = []
        
        # Usar CAN como referencia principal
        for can_file in files_by_type['CAN']:
            session = self._find_matching_session_smart(can_file, files_by_type)
            if session:
                sessions.append(session)
        
        return sessions
    
    def _find_matching_session_smart(self, can_file: Dict, files_by_type: Dict) -> Optional[Dict]:
        """
        Busca archivos de otros tipos que se solapen con el archivo CAN.
        """
        can_start = can_file.get('start_time')
        can_end = can_file.get('end_time')
        if not can_start or not can_end:
            return None
        
        session_files = {'CAN': can_file}
        
        for file_type in ['GPS', 'ESTABILIDAD', 'ROTATIVO']:
            if file_type not in files_by_type:
                return None
            
            best_match = None
            max_overlap = 0
            
            for file_info in files_by_type[file_type]:
                f_start = file_info.get('start_time')
                f_end = file_info.get('end_time')
                if not f_start or not f_end:
                    continue
                
                # Verificar que no empiece demasiado antes del CAN
                early_diff = (can_start - f_start).total_seconds() / 60.0
                if early_diff > self.max_early_minutes:
                    continue
                
                # Debe haber solapamiento real
                latest_start = max(can_start, f_start)
                earliest_end = min(can_end, f_end)
                overlap = (earliest_end - latest_start).total_seconds()
                
                if overlap > 0 and overlap > max_overlap:
                    max_overlap = overlap
                    best_match = file_info
            
            if best_match is None:
                return None
            
            session_files[file_type] = best_match
        
        # Calcular rango de la sesión
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
            'vehicle': can_file['vehicle']
        }
    
    def analyze_with_smart_correction(self, vehicle: str):
        """
        Analiza sesiones aplicando correcciones inteligentes al GPS.
        """
        print(f"\n{'='*80}")
        print(f"ANÁLISIS CON CORRECCIÓN INTELIGENTE GPS - {vehicle.upper()}")
        print(f"{'='*80}")
        
        # Detectar desfases primero
        print("\n1. DETECTANDO DESFASES GPS:")
        gps_corrections = self.detect_gps_offset(vehicle)
        
        # Aplicar correcciones y buscar sesiones
        print("\n2. APLICANDO CORRECCIONES:")
        sessions = self.find_sessions_with_smart_correction(vehicle)
        
        print(f"\n3. RESULTADOS:")
        print(f"Sesiones encontradas: {len(sessions)}")
        
        for i, session in enumerate(sessions, 1):
            print(f"\nSesión {i}:")
            print(f"  Rango: {session['start_time']} - {session['end_time']}")
            
            for file_type, file_info in session['files'].items():
                print(f"    {file_type}: {file_info['name']}")
                print(f"      Rango: {file_info['start_time']} - {file_info['end_time']}")

def main():
    """Función principal para probar el procesador con corrección inteligente."""
    processor = SmartGPSCorrectionProcessor()
    
    # Analizar doback022 con corrección inteligente
    processor.analyze_with_smart_correction('doback022')

if __name__ == "__main__":
    main() 