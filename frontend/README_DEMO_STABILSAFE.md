# 🚀 DobackSoft V2 - FRONTEND DEMO
Fecha de Presentación: Miércoles 7 de Mayo 2025

## 👤 Credenciales de Acceso
- **Usuario:** Cosigein
- **Contraseña:** Cosigein25!
- **Empresa:** Bomberos de la Comunidad de Madrid
- **Rol:** Admin

## 🎨 Estructura Visual
### 1. Panel de Control
- 4 métricas clave visibles
- Acciones rápidas:
  - Añadir vehículo
  - Subir datos
  - Comparar
  - Generar informe PDF

### 2. Estabilidad
- Selector de vehículo y sesión
- Gráficas:
  - LTR (Load Transfer Ratio)
  - DRS (Dynamic Rollover Score)
  - SSF (Static Stability Factor)
- Eventos críticos:
  - 🔴 LTR < 1.0
  - 🟡 G lateral > 0.6
  - 🟠 DRS alto
- Comparador visual entre sesiones

### 3. Telemetría
- Visualización CAN y GPS sincronizada
- Mapa interactivo (Leaflet):
  - Trayectoria GPS
  - Eventos marcados con color
  - Tooltip con velocidad y variables
- Comparador CAN/GPS por sesión
- Alarmas configurables por variable CAN

### 4. Estabilidad Inteligente (IA)
- Resumen visual generado por IA
- Detección de patrones entre sesiones
- Análisis cruzado:
  - Estabilidad
  - CAN
  - GPS
- Botón "Generar informe PDF"

### 5. Base de Conocimiento
- Biblioteca de documentos
- Subida de PDFs
- Categorías:
  - Estabilidad
  - Seguridad
  - Mecánica

### 6. Administración
- Gestión de:
  - Usuarios
  - Empresas
  - Vehículos
- Configuración de reglas

### 7. Perfil Usuario
- Actividad y preferencias
- Cerrar sesión

## 🗺️ Proyección GPS Madrid
- Centro: 40.4168° N, 3.7038° W
- Zonas principales:
  - Sol
  - Gran Vía
  - Retiro
- Rutas urbanas realistas

## 🎯 Condiciones Técnicas
- No scroll vertical (excepto login/docs)
- Todos los módulos visibles
- Navegación fluida
- Diseño responsive

## ⚙️ Tecnologías Frontend
- React 18+
- TypeScript 5+
- Material-UI 5+
- Recharts
- Leaflet
- React Router 6+

## 🚀 Inicio Rápido
```bash
# Instalar dependencias
npm install

# Iniciar en desarrollo
npm run dev
```

## 📝 Notas Importantes
- Mantener coherencia visual
- Verificar todos los componentes
- Respetar diseño responsivo
- No modificar login existente 