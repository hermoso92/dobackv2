from typing import Dict, List, Optional
import pandas as pd
import numpy as np
from datetime import datetime
import matplotlib.pyplot as plt
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from sqlalchemy import text
from sqlalchemy.orm import Session

class PDFReportGenerator:
    def __init__(self, db_session: Session):
        self.session = db_session
        self.styles = getSampleStyleSheet()
        
    def generate_session_report(self, session_id: int, output_path: str) -> bool:
        """Genera un informe PDF completo para una sesión."""
        try:
            # 1. Obtener datos de la sesión
            session_data = self._get_session_data(session_id)
            metrics_data = self._get_metrics_data(session_id)
            events_data = self._get_events_data(session_id)
            
            # 2. Crear documento PDF
            doc = SimpleDocTemplate(
                output_path,
                pagesize=letter,
                rightMargin=72,
                leftMargin=72,
                topMargin=72,
                bottomMargin=72
            )
            
            # 3. Generar contenido
            content = []
            
            # Título
            content.extend(self._create_title(session_data))
            
            # Resumen
            content.extend(self._create_summary(session_data, metrics_data))
            
            # Gráficos
            content.extend(self._create_graphs(metrics_data))
            
            # Eventos
            content.extend(self._create_events_section(events_data))
            
            # Métricas detalladas
            content.extend(self._create_metrics_section(metrics_data))
            
            # 4. Generar PDF
            doc.build(content)
            
            return True
            
        except Exception as e:
            print(f"Error generando informe: {str(e)}")
            return False
    
    def _get_session_data(self, session_id: int) -> Dict:
        """Obtiene datos básicos de la sesión."""
        result = self.session.execute(
            text("""
                SELECT s.*, v.plate_number, v.model
                FROM stability_sessions s
                JOIN vehicles v ON s.vehicle_id = v.id
                WHERE s.id = :id
            """),
            {"id": session_id}
        ).fetchone()
        
        return dict(result)
    
    def _get_metrics_data(self, session_id: int) -> pd.DataFrame:
        """Obtiene métricas procesadas de la sesión."""
        return pd.read_sql(
            text("""
                SELECT * FROM processed_session_metrics 
                WHERE session_id = :id
                ORDER BY timestamp
            """),
            self.session.bind,
            params={"id": session_id}
        )
    
    def _get_events_data(self, session_id: int) -> List[Dict]:
        """Obtiene eventos detectados en la sesión."""
        result = self.session.execute(
            text("""
                SELECT e.*, r.name as rule_name, r.description as rule_description
                FROM detected_events e
                JOIN alarm_rules r ON e.rule_id = r.id
                WHERE e.session_id = :id
                ORDER BY e.timestamp
            """),
            {"id": session_id}
        ).fetchall()
        
        return [dict(row) for row in result]
    
    def _create_title(self, session_data: Dict) -> List:
        """Crea la sección de título del informe."""
        elements = []
        
        # Título principal
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            spaceAfter=30
        )
        elements.append(Paragraph(
            f"Informe de Sesión #{session_data['session_number']}",
            title_style
        ))
        
        # Información de la sesión
        info_style = ParagraphStyle(
            'InfoStyle',
            parent=self.styles['Normal'],
            fontSize=12,
            spaceAfter=12
        )
        
        elements.append(Paragraph(
            f"Vehículo: {session_data['plate_number']} ({session_data['model']})",
            info_style
        ))
        elements.append(Paragraph(
            f"Fecha: {session_data['session_timestamp'].strftime('%d/%m/%Y %H:%M:%S')}",
            info_style
        ))
        elements.append(Paragraph(
            f"Duración: {session_data['session_duration']} segundos",
            info_style
        ))
        
        elements.append(Spacer(1, 20))
        return elements
    
    def _create_summary(self, session_data: Dict, metrics_data: pd.DataFrame) -> List:
        """Crea la sección de resumen del informe."""
        elements = []
        
        # Título de sección
        elements.append(Paragraph("Resumen", self.styles['Heading2']))
        elements.append(Spacer(1, 12))
        
        # Calcular métricas resumen
        summary_data = [
            ["Métrica", "Valor"],
            ["Velocidad máxima", f"{metrics_data['velocity'].max():.1f} km/h"],
            ["Aceleración máxima", f"{metrics_data['acceleration'].max():.1f} m/s²"],
            ["Roll máximo", f"{metrics_data['roll'].max():.1f}°"],
            ["Pitch máximo", f"{metrics_data['pitch'].max():.1f}°"],
            ["Índice de estabilidad", f"{metrics_data['stability_index'].mean():.2f}"]
        ]
        
        # Crear tabla
        table = Table(summary_data, colWidths=[3*inch, 2*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 14),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        elements.append(table)
        elements.append(Spacer(1, 20))
        return elements
    
    def _create_graphs(self, metrics_data: pd.DataFrame) -> List:
        """Crea las gráficas del informe."""
        elements = []
        
        # Título de sección
        elements.append(Paragraph("Gráficas", self.styles['Heading2']))
        elements.append(Spacer(1, 12))
        
        # Crear gráficas
        graphs = [
            self._create_velocity_graph(metrics_data),
            self._create_stability_graph(metrics_data),
            self._create_acceleration_graph(metrics_data)
        ]
        
        # Añadir gráficas al documento
        for graph in graphs:
            elements.append(Image(graph, width=6*inch, height=3*inch))
            elements.append(Spacer(1, 12))
        
        return elements
    
    def _create_velocity_graph(self, data: pd.DataFrame) -> str:
        """Crea gráfica de velocidad."""
        plt.figure(figsize=(10, 5))
        plt.plot(data['timestamp'], data['velocity'])
        plt.title('Velocidad vs Tiempo')
        plt.xlabel('Tiempo')
        plt.ylabel('Velocidad (km/h)')
        plt.grid(True)
        
        # Guardar gráfica
        temp_path = 'temp_velocity.png'
        plt.savefig(temp_path)
        plt.close()
        
        return temp_path
    
    def _create_stability_graph(self, data: pd.DataFrame) -> str:
        """Crea gráfica de estabilidad."""
        plt.figure(figsize=(10, 5))
        plt.plot(data['timestamp'], data['roll'], label='Roll')
        plt.plot(data['timestamp'], data['pitch'], label='Pitch')
        plt.plot(data['timestamp'], data['yaw'], label='Yaw')
        plt.title('Ángulos de Estabilidad')
        plt.xlabel('Tiempo')
        plt.ylabel('Ángulo (grados)')
        plt.legend()
        plt.grid(True)
        
        # Guardar gráfica
        temp_path = 'temp_stability.png'
        plt.savefig(temp_path)
        plt.close()
        
        return temp_path
    
    def _create_acceleration_graph(self, data: pd.DataFrame) -> str:
        """Crea gráfica de aceleración."""
        plt.figure(figsize=(10, 5))
        plt.plot(data['timestamp'], data['lateral_acceleration'], label='Lateral')
        plt.plot(data['timestamp'], data['vertical_acceleration'], label='Vertical')
        plt.title('Aceleraciones')
        plt.xlabel('Tiempo')
        plt.ylabel('Aceleración (m/s²)')
        plt.legend()
        plt.grid(True)
        
        # Guardar gráfica
        temp_path = 'temp_acceleration.png'
        plt.savefig(temp_path)
        plt.close()
        
        return temp_path
    
    def _create_events_section(self, events_data: List[Dict]) -> List:
        """Crea la sección de eventos del informe."""
        elements = []
        
        # Título de sección
        elements.append(Paragraph("Eventos Detectados", self.styles['Heading2']))
        elements.append(Spacer(1, 12))
        
        if not events_data:
            elements.append(Paragraph("No se detectaron eventos.", self.styles['Normal']))
            return elements
        
        # Crear tabla de eventos
        event_data = [
            ["Timestamp", "Regla", "Descripción", "Severidad"]
        ]
        
        for event in events_data:
            event_data.append([
                event['timestamp'].strftime('%H:%M:%S'),
                event['rule_name'],
                event['rule_description'],
                event['severity']
            ])
        
        table = Table(event_data, colWidths=[1.5*inch, 2*inch, 2.5*inch, 1*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        elements.append(table)
        elements.append(Spacer(1, 20))
        return elements
    
    def _create_metrics_section(self, metrics_data: pd.DataFrame) -> List:
        """Crea la sección de métricas detalladas del informe."""
        elements = []
        
        # Título de sección
        elements.append(Paragraph("Métricas Detalladas", self.styles['Heading2']))
        elements.append(Spacer(1, 12))
        
        # Calcular estadísticas
        stats = metrics_data.describe()
        
        # Crear tabla de estadísticas
        stats_data = [["Métrica", "Min", "Max", "Media", "Std"]]
        
        for metric in ['velocity', 'acceleration', 'roll', 'pitch', 'yaw']:
            stats_data.append([
                metric.capitalize(),
                f"{stats[metric]['min']:.2f}",
                f"{stats[metric]['max']:.2f}",
                f"{stats[metric]['mean']:.2f}",
                f"{stats[metric]['std']:.2f}"
            ])
        
        table = Table(stats_data, colWidths=[2*inch, 1*inch, 1*inch, 1*inch, 1*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        elements.append(table)
        return elements 