from locust import HttpUser, task, between
import random

class DobackSoftUser(HttpUser):
    wait_time = between(1, 5)
    
    def on_start(self):
        """Iniciar sesión al comenzar la prueba."""
        self.client.post("/login", {
            "username": "test_user",
            "password": "test_password"
        })

    @task(3)
    def view_dashboard(self):
        """Ver el dashboard."""
        self.client.get("/dashboard")

    @task(2)
    def view_telemetry(self):
        """Ver la página de telemetría."""
        self.client.get("/telemetry")

    @task(2)
    def view_stability(self):
        """Ver la página de estabilidad."""
        self.client.get("/stability")

    @task(1)
    def view_reports(self):
        """Ver la página de reportes."""
        self.client.get("/reports")

    @task(1)
    def generate_report(self):
        """Generar un reporte."""
        self.client.post("/api/reports/generate", {
            "start_date": "2024-01-01",
            "end_date": "2024-12-31",
            "report_type": random.choice(["daily", "weekly", "monthly"])
        })

    @task(2)
    def get_telemetry_data(self):
        """Obtener datos de telemetría."""
        self.client.get("/api/telemetry/data", params={
            "vehicle_id": random.randint(1, 10),
            "start_time": "2024-01-01T00:00:00Z",
            "end_time": "2024-12-31T23:59:59Z"
        })

    @task(1)
    def get_stability_analysis(self):
        """Obtener análisis de estabilidad."""
        self.client.get("/api/stability/analysis", params={
            "vehicle_id": random.randint(1, 10),
            "date": "2024-01-01"
        })

    @task(1)
    def get_alerts(self):
        """Obtener alertas."""
        self.client.get("/api/alerts", params={
            "status": random.choice(["active", "resolved"]),
            "severity": random.choice(["high", "medium", "low"])
        })

    @task(1)
    def update_alert_status(self):
        """Actualizar estado de alerta."""
        self.client.put(f"/api/alerts/{random.randint(1, 100)}/status", json={
            "status": "resolved",
            "resolution_notes": "Test resolution"
        })

    @task(1)
    def get_vehicle_stats(self):
        """Obtener estadísticas de vehículo."""
        self.client.get(f"/api/vehicles/{random.randint(1, 10)}/stats")

    @task(1)
    def get_user_profile(self):
        """Obtener perfil de usuario."""
        self.client.get("/api/user/profile")

    @task(1)
    def update_user_settings(self):
        """Actualizar configuración de usuario."""
        self.client.put("/api/user/settings", json={
            "notifications_enabled": random.choice([True, False]),
            "theme": random.choice(["light", "dark"]),
            "language": random.choice(["es", "en"])
        }) 