# 🚀 DobackSoft V2 - DEMO TÉCNICA
Fecha de Presentación: Miércoles 7 de Mayo 2025

## 👤 Credenciales de Acceso
- **Usuario:** Cosigein
- **Contraseña:** Cosigein25!
- **Empresa:** Bomberos de la Comunidad de Madrid
- **Rol:** Admin

## 📁 Estructura de Datos
### Ubicación
```
/uploads/05042025/
├── 0005_ESTABILIDAD_DOBACK003_05-03-2025.txt
├── 0005_CAN_DOBACK003_05-03-2025.csv
└── 0005_GPS_DOBACK003_05-03-2025.csv
```

### Formato de Cabecera
```
TIPO;FECHA_HORA;ID_DISPOSITIVO;ID_EMPRESA;Nº_SESION
Ejemplo: CAN;05/03/2025 09:32:12AM;DOBACK003;5;2
```

## 🌍 Proyección GPS Madrid
Los datos GPS se proyectan sobre el callejero real de Madrid:
- Centro: 40.4168° N, 3.7038° W
- Zonas principales: Sol, Gran Vía, Retiro
- Rutas urbanas realistas con curvas y calles reales

## 🎯 Eventos Críticos
### Estabilidad
- 🔴 LTR < 1.0
- 🟡 G lateral > 0.6
- 🟠 DRS alto

### Telemetría
- Velocidad excesiva
- Frenadas bruscas
- Giros bruscos

## 📊 Módulos Principales
1. **Panel de Control**
   - Métricas clave
   - Acciones rápidas

2. **Estabilidad**
   - Gráficas LTR/DRS/SSF
   - Eventos críticos
   - Comparador de sesiones

3. **Telemetría**
   - Visualización CAN/GPS
   - Mapa interactivo
   - Alarmas configurables

4. **IA y Análisis**
   - Detección de patrones
   - Informes automáticos
   - Análisis cruzado

5. **Base de Conocimiento**
   - Documentación técnica
   - Categorías especializadas

6. **Administración**
   - Gestión de usuarios
   - Configuración del sistema

## ⚙️ Requisitos Técnicos
- Node.js 18+
- PostgreSQL 14+
- React 18+
- TypeScript 5+

## 🚀 Inicio Rápido
```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Iniciar en desarrollo
npm run dev
```

## 📝 Notas Importantes
- No modificar estructura de archivos existentes
- Mantener coherencia en datos simulados
- Respetar formato de cabeceras
- Verificar visualización completa 