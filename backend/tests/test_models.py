"""
Pruebas de modelos.

Este script verifica las relaciones y funcionalidades básicas
de los modelos del sistema.
"""

import pytest
from datetime import datetime, timedelta
from backend.models import (
    Company, Fleet, Vehicle, StabilitySession,
    CANData, GPSData, StabilityData, InterpolatedData
)
from backend.database import db

def test_company_creation():
    """Prueba la creación de una compañía y sus relaciones."""
    company = Company(
        name="Test Company",
        description="Test Description",
        settings={"test": "value"},
        alarm_rules={"rule1": "value1"},
        notification_config={"email": "test@test.com"}
    )
    db.session.add(company)
    db.session.commit()
    
    assert company.id is not None
    assert company.name == "Test Company"
    assert company.is_active is True
    assert len(company.fleets) == 0

def test_fleet_creation():
    """Prueba la creación de una flota y su relación con la compañía."""
    company = Company(name="Test Company")
    db.session.add(company)
    db.session.commit()
    
    fleet = Fleet(
        name="Test Fleet",
        description="Test Fleet Description",
        company_id=company.id,
        settings={"fleet_setting": "value"}
    )
    db.session.add(fleet)
    db.session.commit()
    
    assert fleet.id is not None
    assert fleet.company_id == company.id
    assert len(company.fleets) == 1
    assert company.fleets[0].name == "Test Fleet"

def test_vehicle_creation():
    """Prueba la creación de un vehículo y su relación con la flota."""
    company = Company(name="Test Company")
    db.session.add(company)
    db.session.commit()
    
    fleet = Fleet(name="Test Fleet", company_id=company.id)
    db.session.add(fleet)
    db.session.commit()
    
    vehicle = Vehicle(
        name="Test Vehicle",
        plate_number="TEST123",
        fleet_id=fleet.id,
        vehicle_type="Truck",
        manufacturer="Test Manufacturer",
        model="Test Model",
        year=2023
    )
    db.session.add(vehicle)
    db.session.commit()
    
    assert vehicle.id is not None
    assert vehicle.fleet_id == fleet.id
    assert len(fleet.vehicles) == 1
    assert fleet.vehicles[0].name == "Test Vehicle"

def test_session_creation():
    """Prueba la creación de una sesión y su relación con el vehículo."""
    company = Company(name="Test Company")
    db.session.add(company)
    db.session.commit()
    
    fleet = Fleet(name="Test Fleet", company_id=company.id)
    db.session.add(fleet)
    db.session.commit()
    
    vehicle = Vehicle(
        name="Test Vehicle",
        plate_number="TEST123",
        fleet_id=fleet.id
    )
    db.session.add(vehicle)
    db.session.commit()
    
    session = StabilitySession(
        vehicle_id=vehicle.id,
        session_number=1,
        session_timestamp=datetime.utcnow(),
        session_duration=3600,
        session_type="test",
        session_status="active"
    )
    db.session.add(session)
    db.session.commit()
    
    assert session.id is not None
    assert session.vehicle_id == vehicle.id
    assert len(vehicle.sessions) == 1
    assert vehicle.sessions[0].session_number == 1

def test_data_creation():
    """Prueba la creación de datos CAN, GPS y de estabilidad."""
    # Crear estructura básica
    company = Company(name="Test Company")
    db.session.add(company)
    db.session.commit()
    
    fleet = Fleet(name="Test Fleet", company_id=company.id)
    db.session.add(fleet)
    db.session.commit()
    
    vehicle = Vehicle(
        name="Test Vehicle",
        plate_number="TEST123",
        fleet_id=fleet.id
    )
    db.session.add(vehicle)
    db.session.commit()
    
    session = StabilitySession(
        vehicle_id=vehicle.id,
        session_number=1,
        session_timestamp=datetime.utcnow(),
        session_duration=3600,
        session_type="test",
        session_status="active"
    )
    db.session.add(session)
    db.session.commit()
    
    # Crear datos CAN
    can_data = CANData(
        session_id=session.id,
        timestamp=datetime.utcnow(),
        engine_rpm=1000.0,
        vehicle_speed=50.0,
        throttle_position=25.0
    )
    db.session.add(can_data)
    
    # Crear datos GPS
    gps_data = GPSData(
        session_id=session.id,
        timestamp=datetime.utcnow(),
        latitude=37.7749,
        longitude=-122.4194,
        altitude=100.0,
        speed=50.0
    )
    db.session.add(gps_data)
    
    # Crear datos de estabilidad
    stability_data = StabilityData(
        session_id=session.id,
        timestamp=datetime.utcnow(),
        roll=0.1,
        pitch=0.2,
        yaw=0.3,
        lateral_acceleration=0.5,
        longitudinal_acceleration=0.6,
        vertical_acceleration=9.8
    )
    db.session.add(stability_data)
    
    db.session.commit()
    
    assert can_data.id is not None
    assert gps_data.id is not None
    assert stability_data.id is not None
    assert len(session.can_data) == 1
    assert len(session.gps_data) == 1
    assert len(session.stability_data) == 1

def test_interpolated_data():
    """Prueba la creación de datos interpolados."""
    # Crear estructura básica
    company = Company(name="Test Company")
    db.session.add(company)
    db.session.commit()
    
    fleet = Fleet(name="Test Fleet", company_id=company.id)
    db.session.add(fleet)
    db.session.commit()
    
    vehicle = Vehicle(
        name="Test Vehicle",
        plate_number="TEST123",
        fleet_id=fleet.id
    )
    db.session.add(vehicle)
    db.session.commit()
    
    session = StabilitySession(
        vehicle_id=vehicle.id,
        session_number=1,
        session_timestamp=datetime.utcnow(),
        session_duration=3600,
        session_type="test",
        session_status="active"
    )
    db.session.add(session)
    db.session.commit()
    
    # Crear datos interpolados
    interpolated_data = InterpolatedData(
        session_id=session.id,
        timestamp=datetime.utcnow(),
        speed=50.0,
        roll=0.1,
        pitch=0.2,
        yaw=0.3,
        lateral_acceleration=0.5,
        longitudinal_acceleration=0.6,
        vertical_acceleration=9.8,
        stability_score=0.8,
        risk_level="low"
    )
    db.session.add(interpolated_data)
    db.session.commit()
    
    assert interpolated_data.id is not None
    assert len(session.interpolated_data) == 1
    assert session.interpolated_data[0].stability_score == 0.8
    assert session.interpolated_data[0].risk_level == "low" 