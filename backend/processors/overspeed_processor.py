from typing import List, Dict, Optional
from sqlalchemy import text
from sqlalchemy.orm import Session
from geoalchemy2 import WKTElement  # ensure geoalchemy2 is installed
from shapely.geometry import Point
import math

# --------------------------------------------------
# Tabla stability_events
# id serial | session_id text | timestamp timestamptz | lat | lon | type | details jsonb
# Esta función garantiza que la tabla exista la primera vez que se instancia el procesador.

class OverspeedProcessor:
    """Detecta eventos de exceso de velocidad para una sesión.

    Requisito: tabla road_speed_limits(id serial, geom geography(LineString,4326), maxspeed int)
    y tabla stability_events con columnas id, session_id, timestamp, lat, lon, type, details JSON.
    """

    def __init__(self, db: Session, tolerance_kmh: int = 3, search_radius_m: int = 50):
        self.db = db
        self.tolerance = tolerance_kmh
        self.radius_m = search_radius_m
        self._ensure_table()

    def process(self, session_id: str):
        # 1. Obtener puntos GPS de la sesión
        gps_rows = self.db.execute(
            text("""
                SELECT "timestamp", latitude, longitude, speed
                FROM "GpsMeasurement"
                WHERE "sessionId" = :sid AND latitude IS NOT NULL AND longitude IS NOT NULL
            """),
            {"sid": session_id}
        ).fetchall()

        if not gps_rows:
            return 0

        inserted = 0
        for ts, lat, lon, speed_raw in gps_rows:
            if speed_raw is None:
                continue

            # El dispositivo registra en km/h, no convertir
            speed_kmh = speed_raw

            if speed_kmh < 5:   # ignorar sólo cuando el vehículo está casi parado ( <5 km/h )
                continue

            limit = self._nearest_speed_limit(lat, lon)
            if limit is None:
                # Sin límite detectado: omitir punto para evitar falsos positivos
                continue
            if speed_kmh > limit + self.tolerance:
                self._insert_event(session_id, ts, lat, lon, speed_kmh, limit)
                inserted += 1
        return inserted

    # --------------------------------------------------
    def _nearest_speed_limit(self, lat: float, lon: float) -> Optional[int]:
        # Intenta con radios crecientes hasta 200 m
        for radius in (self.radius_m, 100, 150, 200):
            res = self.db.execute(
                text("""
                    SELECT regexp_replace(maxspeed::text, '[^0-9]', '', 'g')::int AS speed_limit
                    FROM road_speed_limits
                    WHERE ST_DWithin(geom, ST_SetSRID(ST_MakePoint(:lon,:lat),4326)::geography, :radius)
                    ORDER BY ST_Distance(geom, ST_SetSRID(ST_MakePoint(:lon,:lat),4326)::geography)
                    LIMIT 1
                """),
                {"lon": lon, "lat": lat, "radius": radius}
            ).fetchone()
            if res and res.speed_limit:
                return int(res.speed_limit)
        # No se encontró límite en ninguno de los radios
        return None

    # --------------------------------------------------
    def _insert_event(self, session_id: str, ts: str, lat: float, lon: float, speed: float, limit: int):
        self.db.execute(
            text("""
                INSERT INTO stability_events
                (session_id, timestamp, lat, lon, type, details)
                VALUES (:sid, :ts, :lat, :lon, 'limite_superado_velocidad',
                        jsonb_build_object('velocidad_vehiculo', :speed, 'limite_via', :limit))
            """),
            {
                "sid": session_id,
                "ts": ts,
                "lat": lat,
                "lon": lon,
                "speed": round(speed, 1),
                "limit": limit
            }
        )
        self.db.commit()

    # --------------------------------------------------
    def _ensure_table(self):
        """Crea stability_events si aún no existe (sin FK para evitar problemas de tipos)."""
        self.db.execute(
            text("""
                CREATE TABLE IF NOT EXISTS stability_events (
                    id          SERIAL PRIMARY KEY,
                    session_id  TEXT NOT NULL,
                    timestamp   TIMESTAMPTZ NOT NULL,
                    lat         DOUBLE PRECISION NOT NULL,
                    lon         DOUBLE PRECISION NOT NULL,
                    type        TEXT NOT NULL,
                    details     JSONB
                );
                CREATE INDEX IF NOT EXISTS stability_events_session_idx ON stability_events(session_id);
                CREATE INDEX IF NOT EXISTS stability_events_time_idx    ON stability_events(timestamp);
            """)
        )
        self.db.commit() 