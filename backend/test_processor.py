#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Tests unitarios para el procesador Doback Soft
"""

import unittest
import tempfile
import os
from datetime import datetime, timedelta
from complete_processor import DobackProcessor


class TestDobackProcessor(unittest.TestCase):
    """Tests unitarios para el procesador Doback Soft."""
    
    def setUp(self):
        """Configuración inicial para cada test."""
        self.processor = DobackProcessor()
    
    def test_extract_date_from_filename(self):
        """Test para extraer fecha desde nombre de archivo."""
        # Test con formato válido
        filename = "CAN_DOBACKdoback022_2025-01-08_001.txt"
        date = self.processor.extract_date_from_filename(filename)
        self.assertIsNotNone(date)
        self.assertEqual(date.year, 2025)
        self.assertEqual(date.month, 1)
        self.assertEqual(date.day, 8)
        
        # Test con formato inválido
        filename_invalid = "archivo_invalido.txt"
        date_invalid = self.processor.extract_date_from_filename(filename_invalid)
        self.assertIsNone(date_invalid)
    
    def test_get_file_type(self):
        """Test para identificar tipo de archivo."""
        # Test archivos CAN
        self.assertEqual(self.processor._get_file_type("CAN_DOBACKdoback022_2025-01-08_001.txt"), "CAN")
        self.assertEqual(self.processor._get_file_type("CAN_DOBACKdoback022_2025-01-08_001_TRADUCIDO.csv"), "CAN")
        
        # Test archivos GPS
        self.assertEqual(self.processor._get_file_type("GPS_DOBACKdoback022_2025-01-08_001.txt"), "GPS")
        
        # Test archivos de estabilidad
        self.assertEqual(self.processor._get_file_type("ESTABILIDAD_DOBACKdoback022_2025-01-08_001.txt"), "ESTABILIDAD")
        
        # Test archivos rotativo
        self.assertEqual(self.processor._get_file_type("ROTATIVO_DOBACKdoback022_2025-01-08_001.txt"), "ROTATIVO")
        
        # Test archivo desconocido
        self.assertEqual(self.processor._get_file_type("archivo_desconocido.txt"), "UNKNOWN")
    
    def test_extract_vehicle_name(self):
        """Test para extraer nombre del vehículo."""
        # Test con formato válido
        file_path = "/path/to/data/CMadrid/doback022/CAN/CAN_DOBACKdoback022_2025-01-08_001.txt"
        vehicle = self.processor._extract_vehicle_name(file_path)
        self.assertEqual(vehicle, "doback022")
        
        # Test con formato inválido
        file_path_invalid = "/path/to/invalid/file.txt"
        vehicle_invalid = self.processor._extract_vehicle_name(file_path_invalid)
        self.assertEqual(vehicle_invalid, "unknown")
    
    def test_parse_timestamp(self):
        """Test para parsear timestamps."""
        # Test formato YYYY-MM-DD HH:MM:SS
        timestamp1 = "2025-01-08 12:30:45"
        dt1 = self.processor._parse_timestamp(timestamp1)
        self.assertEqual(dt1.year, 2025)
        self.assertEqual(dt1.month, 1)
        self.assertEqual(dt1.day, 8)
        self.assertEqual(dt1.hour, 12)
        self.assertEqual(dt1.minute, 30)
        self.assertEqual(dt1.second, 45)
        
        # Test formato DD/MM/YYYY HH:MM:SS AM/PM
        timestamp2 = "08/01/2025 12:30:45PM"
        dt2 = self.processor._parse_timestamp(timestamp2)
        self.assertEqual(dt2.year, 2025)
        self.assertEqual(dt2.month, 1)
        self.assertEqual(dt2.day, 8)
        self.assertEqual(dt2.hour, 12)
        self.assertEqual(dt2.minute, 30)
        self.assertEqual(dt2.second, 45)
        
        # Test formato inválido
        timestamp_invalid = "formato_invalido"
        dt_invalid = self.processor._parse_timestamp(timestamp_invalid)
        self.assertEqual(dt_invalid, datetime.min)
    
    def test_validate_gps_coordinates(self):
        """Test para validar coordenadas GPS."""
        # Coordenadas válidas
        self.assertTrue(self.processor._validate_gps_coordinates(40.4168, -3.7038))  # Madrid
        self.assertTrue(self.processor._validate_gps_coordinates(0, 0))  # Ecuador, Meridiano de Greenwich
        
        # Coordenadas inválidas
        self.assertFalse(self.processor._validate_gps_coordinates(91, 0))  # Latitud > 90
        self.assertFalse(self.processor._validate_gps_coordinates(-91, 0))  # Latitud < -90
        self.assertFalse(self.processor._validate_gps_coordinates(0, 181))  # Longitud > 180
        self.assertFalse(self.processor._validate_gps_coordinates(0, -181))  # Longitud < -180
    
    def test_validate_stability_data(self):
        """Test para validar datos de estabilidad."""
        # Datos válidos
        valid_data = {
            'ax': 1.5, 'ay': -0.8, 'az': 9.8,
            'gx': 0.1, 'gy': 0.2, 'gz': 0.3,
            'roll': 2.5, 'pitch': -1.2, 'yaw': 45.0,
            'si': 0.25
        }
        self.assertTrue(self.processor._validate_stability_data(valid_data))
        
        # Datos inválidos - valores fuera de rango
        invalid_data = {
            'ax': 100, 'ay': -0.8, 'az': 9.8,
            'gx': 0.1, 'gy': 0.2, 'gz': 0.3,
            'roll': 2.5, 'pitch': -1.2, 'yaw': 45.0,
            'si': 0.25
        }
        self.assertFalse(self.processor._validate_stability_data(invalid_data))
        
        # Datos inválidos - SI fuera de rango
        invalid_si_data = {
            'ax': 1.5, 'ay': -0.8, 'az': 9.8,
            'gx': 0.1, 'gy': 0.2, 'gz': 0.3,
            'roll': 2.5, 'pitch': -1.2, 'yaw': 45.0,
            'si': 1.5  # > 1
        }
        self.assertFalse(self.processor._validate_stability_data(invalid_si_data))
    
    def test_detect_gps_offset(self):
        """Test para detectar desfase GPS."""
        # Crear datos de prueba
        test_files = [
            {
                'name': 'GPS_DOBACKdoback022_2025-01-08_001.txt',
                'date': datetime(2025, 1, 8, 10, 0, 0),
                'path': '/test/path/gps.txt'
            },
            {
                'name': 'CAN_DOBACKdoback022_2025-01-08_001.txt',
                'date': datetime(2025, 1, 8, 12, 0, 0),  # 2 horas después
                'path': '/test/path/can.txt'
            }
        ]
        
        # Simular detección de desfase
        offset_result = self.processor._analyze_offset_pattern(
            datetime(2025, 1, 8, 10, 0, 0), test_files
        )
        self.assertIsInstance(offset_result, bool)
    
    def test_madrid_bounds_validation(self):
        """Test para validar límites de Madrid."""
        # Coordenadas dentro de Madrid
        madrid_lat, madrid_lon = 40.4168, -3.7038
        self.assertTrue(
            self.processor._is_within_madrid_bounds(madrid_lat, madrid_lon)
        )
        
        # Coordenadas fuera de Madrid
        outside_lat, outside_lon = 41.3851, 2.1734  # Barcelona
        self.assertFalse(
            self.processor._is_within_madrid_bounds(outside_lat, outside_lon)
        )


if __name__ == '__main__':
    # Ejecutar tests
    unittest.main(verbosity=2) 