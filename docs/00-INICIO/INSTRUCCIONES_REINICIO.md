# 🔄 INSTRUCCIONES DE REINICIO DEL BACKEND

## ⚠️ SITUACIÓN ACTUAL

El backend está corriendo con código antiguo que tiene errores. He hecho las siguientes correcciones:

1. ✅ **Singleton de Prisma corregido** - eliminado loop infinito de desconexiones
2. ✅ **Conexión explícita de Prisma** - ahora se conecta al inicializar
3. ✅ **Usuario SYSTEM creado en BD** - con IDs fijos para procesamiento automático
4. ✅ **Backend compilado** - código TypeScript transpilado correctamente

## 🚀 PASOS PARA REINICIAR

### Opción 1: Reinicio Completo del Sistema (RECOMENDADO)

1. **Cierra las ventanas del backend y frontend** (las que abrió `iniciar.ps1`)
2. **Ejecuta desde la raíz del proyecto:**
   ```powershell
   .\iniciar.ps1
   ```

Esto reiniciará todo el sistema limpiamente.

### Opción 2: Solo Reiniciar Backend

Si solo quieres reiniciar el backend:

1. **Cierra la ventana del backend** (la que muestra los logs)
2. **Desde la raíz del proyecto, ejecuta:**
   ```powershell
   cd backend
   npm run dev
   ```

## ✅ VERIFICACIÓN POST-REINICIO

Después del reinicio, verifica en los logs del backend que aparezca:

```
info: [PrismaClient] Prisma Client singleton inicializado
```

**Y NO debe aparecer:**
- ❌ Loop infinito de "Prisma desconectado exitosamente"
- ❌ "Engine is not yet connected"
- ❌ "Foreign keys inválidas: Usuario inválido"

Si los logs se ven limpios, entonces ya puedes ejecutar el test:

```powershell
.\test-upload-system.ps1
```

## 📊 RESULTADO ESPERADO

El test debería mostrar:
- ✅ Backend respondiendo
- ✅ Base de datos limpia
- ✅ Procesamiento completado (93 archivos)
- ✅ DOBACK024 - 30/09/2025: **2 sesiones** (esperado: 2)
- ✅ **[EXITO] Sistema funciona correctamente!**

---

**🎯 PRÓXIMO COMANDO:** Reinicia el backend con `.\iniciar.ps1` o solo el backend con `cd backend; npm run dev`

