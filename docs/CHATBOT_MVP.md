Chatbot MVP - Granja Mari Pepa

Resumen:
- Chatbot integrado con Groq (Llama) con reglas NLU para facturas.
- Detección de números de factura y consulta de facturas específicas.
- Generación de enlaces temporales para descarga de PDFs desde el chat.
- Widget de frontend `GlobalChatbot` con streaming y sugerencias.
- Seguridad: endpoints protegidos con JWT (`requireAuth`) y auditoría (`auditDataAccess`).

Configuración y pruebas rápidas:

1. Variables de entorno recomendadas:
   - `GROQ_API_KEY` - clave para Groq (opcional en desarrollo; se usa clave embebida de fallback)
   - `JWT_SECRET` - secreto para firmar tokens de JWT

2. Instalar dependencias y arrancar servidores:

```bash
cd backend
npm install
npm run dev
# En otra terminal
cd frontend
npm install
npm run dev
```

3. Health checks:
- Chatbot: `GET /api/chatbot/health`

4. Test rápido (requiere servidor en `http://localhost:5000`):
- Ejecutar script de pruebas: `node backend/tests/test-chatbot-mejorado.js`

Notas de seguridad:
- La generación de enlaces actualmente crea tokens y URLs temporales en memoria (placeholder). En producción se debe persistir el token con expiración, restringir accesos y auditar descargas.
- El endpoint `/api/chatbot/generar-enlace` requiere autenticación y audita el acceso.

Siguientes pasos recomendados:
- Persistir tokens de descarga con expiración y permisos en DB.
- Implementar envío de enlaces por email/WhatsApp cuando el cliente lo solicite.
- Añadir pruebas E2E que simulen login y descarga de PDFs.
- Mejorar NLU con entrenamiento (si se desea), manteniendo reglas anti-alucinación.
