# 📅 PLAN GUARDRAILS 30/60/90 DÍAS

**Objetivo:** Implementar y optimizar el sistema de Guardrails para proteger los invariantes críticos de DobackSoft permanentemente.

---

## 🎯 Días 1-30: FUNDAMENTOS (CRÍTICO)

**Meta:** Sistema de guardrails operativo + Corrección de violaciones existentes + CI bloqueante

### Semana 1-2: Setup & Violaciones Críticas

#### ✅ **COMPLETADO** (Día 1-3)
- [x] Setup sistema de guardrails
  - [x] Estructura de carpetas (`scripts/guardrails/`)
  - [x] Fitness functions por categoría (seguridad, arquitectura, performance, dominio)
  - [x] Scanners repo-wide (console.log, URLs, organizationId, component size)
  - [x] Auto-fix engine (console.log, hardcoded URLs)
  - [x] CI/CD pipeline (GitHub Actions)
  - [x] Pre-commit hook
  - [x] Scripts npm (`npm run guardrails`)
  - [x] Documentación completa

#### 🔲 **PENDIENTE** (Día 4-10)

**1. Instalar pre-commit hook** (Prioridad: ALTA)
```bash
npm run guardrails:install-hook
```

**2. Ejecutar scan inicial completo**
```bash
npm run guardrails:scan
```
- Documentar estado actual (baseline)
- Priorizar violaciones por severidad

**3. Corregir violaciones CRÍTICAS**
```bash
# Preview fixes
npm run guardrails:fix --dry-run

# Apply fixes
npm run guardrails:fix
```

Violaciones detectadas actualmente:
- 🔴 **69 console.log en backend**
- 🔴 **45 console.log en frontend**
- 🔴 **console.log en logger.ts** (ironía - el logger usa console!)

**Acción manual requerida:**
- Revisar auto-fixes aplicados
- Corregir `backend/src/utils/logger.ts` líneas 227-242 (loggerApp)
  - Opción A: Eliminar `loggerApp` (preferido)
  - Opción B: Agregar `// GUARDRAILS:SAFE` si es necesario
- Verificar queries sin `organizationId` (si detectadas)

**4. Validar fixes aplicados**
```bash
# Re-scan después de fixes
npm run guardrails:scan

# Ejecutar tests
npm test

# Verificar manualmente funcionalidad crítica
npm run guardrails:test
```

**5. Commit inicial de guardrails**
```bash
git add scripts/guardrails/ .github/workflows/guardrails.yml jest.config.guardrails.js
git commit -m "feat: Add guardrails system for architecture protection"
```

### Semana 3-4: CI/CD & Enforcement

**6. Activar CI bloqueante** (Prioridad: ALTA)
- Verificar workflow `.github/workflows/guardrails.yml`
- Hacer push a `develop` y validar
- Configurar branch protection rules:
  - Require status checks (guardrails-scan)
  - Require PR reviews antes de merge a main

**7. Comunicar a equipo**
- Sesión informativa: "Qué son los Guardrails y por qué"
- Cómo usar: scan local, auto-fix, bypass (--no-verify)
- Documentación: `scripts/guardrails/README.md`

**8. Monitorear primeras semanas**
- Revisar PRs bloqueadas por guardrails
- Ajustar reglas si hay falsos positivos
- Documentar excepciones legítimas

### 📊 KPIs Días 1-30

| Métrica | Objetivo | Estado |
|---------|----------|--------|
| Console.log violations | 0 | ⏳ 114 actuales |
| Hardcoded URLs | 0 | ⏳ Por medir |
| Queries sin organizationId | 0 | ⏳ Por medir |
| CI builds bloqueados | < 10% | ⏳ N/A |
| Pre-commit hook instalado | 100% devs | ⏳ 0% |

### ✅ Entregables Días 1-30

- [x] Sistema de guardrails funcional
- [x] CI/CD bloqueante configurado
- [x] Documentación completa
- [ ] Violaciones críticas corregidas (0 console.log, 0 hardcoded URLs)
- [ ] Pre-commit hook instalado en máquinas de desarrollo
- [ ] Equipo capacitado

---

## ⚡ Días 31-60: EXPANSIÓN

**Meta:** Fitness functions avanzadas + Optimización auto-fix + Métricas continuas

### Semana 5-6: Performance & Bundle Size

**9. Implementar checks de performance**
- Bundle size analyzer
- Lighthouse CI integration
- Component size enforcement (ya implementado)
- Detectar queries N+1 (ya implementado básicamente)

**10. Auto-fix avanzado**
- Fix imports optimization (tree-shaking)
- Fix component splitting (detectar + sugerir)
- Fix duplicate code (DRY violations)

### Semana 7-8: Dominio & Business Rules

**11. Validaciones de dominio**
- Roles: solo ADMIN/MANAGER
- Flujo: Subida → Procesamiento → Visualización → Exportación
- Comparadores: solo entre sesiones del mismo tipo
- Fechas: >= 2025-09-01
- GPS: coordenadas España (36-44°N, -10 a 5°E)
- Velocidad: <= 200 km/h

**12. Fitness functions específicas de StabilSafe**
- KPIs calculados correctamente
- Geocercas válidas (solo Rozas + Alcobendas)
- Módulos oficiales en menú
- PDF 1-clic disponible

### 📊 KPIs Días 31-60

| Métrica | Objetivo |
|---------|----------|
| Bundle size frontend | < 300 KB |
| Componentes > 300 líneas | 0 |
| Queries N+1 detectadas | 0 |
| Tests fitness functions | > 90% cobertura |
| Tiempo scan completo | < 30s |

### ✅ Entregables Días 31-60

- [ ] Performance checks operativos
- [ ] Auto-fix engine ampliado (3+ fixers)
- [ ] Validaciones de dominio completas
- [ ] Dashboard de métricas (básico)
- [ ] Reportes automáticos semanales

---

## 🚀 Días 61-90: OPTIMIZACIÓN

**Meta:** Dashboard de calidad + Reportes automáticos + Integración externa

### Semana 9-10: Dashboard & Observabilidad

**13. Dashboard de métricas de calidad**
- Visualización histórica de violaciones
- Tendencias por categoría
- Ranking de archivos problemáticos
- Tiempo de corrección promedio

**14. Alertas proactivas**
- Slack/email cuando aumentan violaciones
- Alerta si bundle size > threshold
- PR comments automáticos (ya implementado)

### Semana 11-12: Integraciones & Refinamiento

**15. Integración SonarQube / CodeClimate**
- Export métricas a plataforma externa
- Análisis de deuda técnica
- Security vulnerabilities

**16. Refinamiento continuo**
- Ajustar thresholds basado en datos reales
- Optimizar performance de scanners
- Documentar casos edge y excepciones

**17. Expansión de auto-fixes**
- Fix security issues (básicos)
- Fix accessibility issues
- Fix i18n missing translations

### 📊 KPIs Días 61-90

| Métrica | Objetivo |
|---------|----------|
| Violaciones por sprint | Tendencia descendente |
| Tiempo promedio de fix | < 1 hora |
| False positives | < 2% |
| Cobertura de auto-fix | > 70% violaciones |
| Adoption rate (pre-commit hook) | > 95% |

### ✅ Entregables Días 61-90

- [ ] Dashboard de calidad operativo
- [ ] Integración SonarQube/CodeClimate
- [ ] Alertas proactivas configuradas
- [ ] 10+ auto-fixers operativos
- [ ] Documentación de casos edge
- [ ] Plan de mantenimiento a largo plazo

---

## 🎯 PRIORIDADES POR IMPACTO/RIESGO

### 🔴 CRÍTICO (Hacer AHORA - Días 1-7)
1. **Instalar pre-commit hook** - Prevenir nuevas violaciones
2. **Corregir console.log existentes** - Seguridad (logs pueden exponer datos)
3. **Verificar organizationId** - Seguridad crítica (aislamiento)
4. **Activar CI bloqueante** - Enforcement automático

### 🟠 ALTO (Días 8-30)
1. **Corregir hardcoded URLs** - Mantenibilidad
2. **Validar tamaño de componentes** - Performance
3. **Capacitar equipo** - Adoption
4. **Monitorear primeros PRs** - Refinamiento

### 🟡 MEDIO (Días 31-60)
1. **Bundle size checks** - Performance
2. **Validaciones de dominio** - Correctitud
3. **Auto-fix avanzado** - Productividad
4. **Dashboard básico** - Visibilidad

### 🟢 BAJO (Días 61-90)
1. **Integraciones externas** - Nice to have
2. **Alertas proactivas** - Optimización
3. **Auto-fixes adicionales** - Productividad incremental

---

## 📈 MÉTRICAS DE ÉXITO

### Objetivo Final (Día 90)
- ✅ **0 violaciones críticas** en main
- ✅ **< 5 violaciones altas** en main
- ✅ **CI bloqueante** funcionando sin problemas
- ✅ **95%+ adoption** de pre-commit hook
- ✅ **70%+ auto-fix rate** para violaciones comunes
- ✅ **< 30s** tiempo de scan completo
- ✅ **Dashboard operativo** con métricas históricas

### ROI Esperado
- **-60% tiempo en code reviews** (menos issues manuales)
- **-80% violaciones arquitectónicas** nuevas
- **+40% confianza en calidad** del código
- **0 bugs de seguridad** por falta de organizationId

---

## 🛠️ ACCIONES INMEDIATAS (ESTA SEMANA)

```bash
# 1. Instalar hook
npm run guardrails:install-hook

# 2. Scan inicial
npm run guardrails:scan

# 3. Preview fixes
npm run guardrails:fix --dry-run

# 4. Aplicar fixes
npm run guardrails:fix

# 5. Corregir logger.ts manualmente
# Editar backend/src/utils/logger.ts (eliminar loggerApp o agregar // GUARDRAILS:SAFE)

# 6. Re-scan para verificar
npm run guardrails:scan

# 7. Commit
git add .
git commit -m "fix: Apply guardrails auto-fixes + remove console.log violations"

# 8. Push y validar CI
git push
```

---

## 📞 SOPORTE & PREGUNTAS

- 📖 Documentación: `scripts/guardrails/README.md`
- 🐛 Issues: GitHub Issues con tag `guardrails`
- 💬 Slack: #dobacksoft-quality (crear canal)

**Responsable:** Arquitecto de Guardrails  
**Revisión:** Semanal (primeros 30 días), Quincenal (después)

---

**ESTAS REGLAS SON OBLIGATORIAS Y NO NEGOCIABLES**  
**CUALQUIER VIOLACIÓN REQUIERE CORRECCIÓN INMEDIATA**

