import argparse
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Permite importar processors.* aunque se ejecute desde /backend/scripts
import sys
from pathlib import Path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(ROOT_DIR))

from processors.overspeed_processor import OverspeedProcessor  # noqa: E402


def build_engine(dsn: str):
    return create_engine(dsn, pool_pre_ping=True)


def get_session_ids(db, specific_ids=None):
    if specific_ids:
        return specific_ids
    return [row[0] for row in db.execute(text('SELECT id FROM "Session"'))]


def main():
    parser = argparse.ArgumentParser(
        description="Genera eventos 'limite_superado_velocidad' usando OverspeedProcessor"
    )
    parser.add_argument(
        "--dsn",
        help="Cadena de conexión, ej. postgresql://user:pass@localhost:5432/dobacksoft. Si se omite se usa la variable DATABASE_URL",
    )
    parser.add_argument(
        "--session",
        nargs="*",
        help="Uno o varios UUID de sesión a procesar. Si se omite, procesa todas las sesiones."
    )
    args = parser.parse_args()

    dsn = args.dsn or os.getenv("DATABASE_URL")
    if not dsn:
        print("ERROR: Debes indicar --dsn o configurar la variable de entorno DATABASE_URL")
        return

    engine = build_engine(dsn)
    SessionLocal = sessionmaker(bind=engine)

    db = SessionLocal()

    session_ids = get_session_ids(db, args.session)
    print(f"Sesiones a procesar: {len(session_ids)}")

    proc = OverspeedProcessor(db)
    total_inserted = 0
    for sid in session_ids:
        try:
            inserted = proc.process(sid)
            print(f"  - {sid}: {inserted} eventos")
            total_inserted += inserted
        except Exception as e:
            print(f"  - {sid}: ERROR -> {e}")

    print("Eventos totales insertados:", total_inserted)


if __name__ == "__main__":
    main() 