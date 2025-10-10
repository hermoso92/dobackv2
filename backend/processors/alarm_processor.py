from typing import Dict, List
import pandas as pd
from sqlalchemy import text
from sqlalchemy.orm import Session

class AlarmProcessor:
    def __init__(self, db_session: Session):
        self.session = db_session
        
    def process_alarms(self, session_id: int):
        """Procesa las alarmas para una sesión específica."""
        try:
            # 1. Obtener reglas activas
            rules = self._get_active_rules()
            
            # 2. Obtener métricas procesadas
            metrics = self._get_session_metrics(session_id)
            
            # 3. Aplicar cada regla
            for rule in rules:
                self._apply_rule(rule, metrics, session_id)
                
        except Exception as e:
            print(f"Error procesando alarmas: {str(e)}")
    
    def _get_active_rules(self) -> List[Dict]:
        """Obtiene las reglas de alarma activas."""
        result = self.session.execute(
            text("""
                SELECT * FROM alarm_rules 
                WHERE is_active = true
                ORDER BY priority DESC
            """)
        ).fetchall()
        
        return [dict(row) for row in result]
    
    def _get_session_metrics(self, session_id: int) -> pd.DataFrame:
        """Obtiene las métricas procesadas de la sesión."""
        return pd.read_sql(
            text("""
                SELECT * FROM processed_session_metrics 
                WHERE session_id = :id
                ORDER BY timestamp
            """),
            self.session.bind,
            params={"id": session_id}
        )
    
    def _apply_rule(self, rule: Dict, metrics: pd.DataFrame, session_id: int):
        """Aplica una regla específica a las métricas."""
        try:
            # Evaluar condición
            condition_met = self._evaluate_condition(rule["condition"], metrics)
            
            if condition_met:
                # Crear evento de alarma
                self._create_alarm_event(rule, session_id)
                
        except Exception as e:
            print(f"Error aplicando regla {rule['id']}: {str(e)}")
    
    def _evaluate_condition(self, condition: str, metrics: pd.DataFrame) -> bool:
        """Evalúa una condición sobre las métricas."""
        try:
            # Convertir condición a expresión evaluable
            condition = condition.replace("AND", "&").replace("OR", "|")
            
            # Evaluar condición
            result = eval(condition)
            
            # Si es una serie, verificar si hay algún True
            if isinstance(result, pd.Series):
                return result.any()
            
            return bool(result)
            
        except Exception as e:
            print(f"Error evaluando condición: {str(e)}")
            return False
    
    def _create_alarm_event(self, rule: Dict, session_id: int):
        """Crea un evento de alarma en la base de datos."""
        try:
            self.session.execute(
                text("""
                    INSERT INTO alarm_events 
                    (rule_id, session_id, severity, description, created_at)
                    VALUES (:rule_id, :session_id, :severity, :description, CURRENT_TIMESTAMP)
                """),
                {
                    "rule_id": rule["id"],
                    "session_id": session_id,
                    "severity": rule["severity"],
                    "description": rule["description"]
                }
            )
            self.session.commit()
            
        except Exception as e:
            print(f"Error creando evento de alarma: {str(e)}")
            self.session.rollback() 