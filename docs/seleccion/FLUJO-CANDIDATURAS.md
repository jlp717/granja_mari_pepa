# Flujo de candidaturas

Documento de referencia del ciclo de vida de una candidatura, las transiciones
permitidas y las consecuencias de cada decisión.

## 1. Estados

| Estado | Significado | ¿Activo? | ¿Final? |
|---|---|---|---|
| `new` | Recibida, sin revisar | Sí | No |
| `review` | En revisión por RRHH | Sí | No |
| `interview` | En proceso de entrevista | Sí | No |
| `rejected` | Descartada por la empresa | No | **Sí** |
| `hired` | Seleccionada | Sí | **Sí** |

## 2. Transiciones permitidas

```
new ──────► review ──────► interview ──────► hired
 │            │               │
 ├──────────► interview       ├───────────► rejected
 ├──────────► rejected        │
 └──────────► hired           └───────────► hired
```

| Desde | Hacia | Permitido |
|---|---|---|
| `new` | `review`, `interview`, `rejected`, `hired` | Sí |
| `review` | `interview`, `rejected`, `hired` | Sí |
| `interview` | `rejected`, `hired` | Sí |
| `rejected` | cualquiera | **No** |
| `hired` | cualquiera | **No** |
| cualquiera | mismo estado (solo notas) | Sí |

Las decisiones finales (`rejected`, `hired`) no se pueden revertir desde la
interfaz ni desde la API. La validación vive en
`backend/app/services/adminService.js` (`APPLICATION_TRANSITIONS`); el frontend
solo replica la tabla para deshabilitar opciones.

La antigua ventana de corrección de 5 días hábiles queda **eliminada**: una
decisión final es definitiva desde el momento en que se confirma.

## 3. Consecuencias

### Rechazo (`rejected`)

- Correo al candidato con la plantilla `rejected`.
- Bloqueo de **20 días naturales** para cualquier nueva candidatura.
- El mensaje público indica la fecha exacta de reapertura.
- El CV se conserva mientras la candidatura esté activa; si RRHH la elimina,
  el PDF se borra del disco.

### Selección (`hired`)

- Correo al candidato con la plantilla `hired`.
- No puede aplicar a otras ofertas mientras la candidatura siga activa.
- No tiene bloqueo temporal: el bloqueo dura mientras el registro esté activo.

### Entrevista (`interview`)

- Correo al candidato con la plantilla `interview`.
- No puede aplicar a otra oferta mientras la candidatura siga activa.
- Sí puede avanzar a `hired` o `rejected`.

## 4. Reglas de entrada

Se comprueban antes de subir el CV (preflight) y otra vez en el servidor:

1. Una sola candidatura activa por email (`new`, `review`, `interview`, `hired`).
2. Tras un rechazo, 20 días naturales de espera.
3. La oferta debe existir y estar publicada.
4. Email normalizado a minúsculas.
5. Campo trampa anti-bot.

## 5. UX de confirmación

Antes de confirmar una decisión final:

- Modal con aviso de **acción inamovible**.
- Consecuencia concreta: bloqueo de 20 días o bloqueo por selección.
- Botón deshabilitado durante **3 segundos** con cuenta atrás visible.
- Sin doble envío: el botón queda deshabilitado mientras se guarda.
- El estado ya no se puede cambiar después; el selector queda bloqueado.

## 6. Decisiones de producto

| Pregunta | Decisión |
|---|---|
| ¿Decisión del cliente y del admin son equivalentes? | No existe decisión del candidato. Solo la empresa decide; el candidato únicamente puede aplicar o no. |
| ¿El bloqueo de 20 días es global o por oferta? | Global: tras un rechazo no puede aplicar a ninguna oferta durante 20 días. |
| ¿El bloqueo por seleccionado es permanente? | Mientras la candidatura esté activa. Si RRHH la elimina, el bloqueo desaparece. |
| ¿Existe un proceso excepcional para corregir? | No desde la aplicación. Una corrección excepcional requiere intervención directa en base de datos y queda auditada fuera del panel. |

## 7. Correos

Todos usan la misma plantilla base: cabecera con el logo real de Mari Pepa,
acento corporativo `#cf3700`, tipografía Georgia/Arial, pie legal y datos de
contacto. El logo va incrustado por CID (no depende de imágenes remotas).

| Correo | Remitente |
|---|---|
| Candidatura recibida | `cv.rrhh@maripepa.es` |
| Estados `new`, `review`, `interview`, `rejected`, `hired` | `cv.rrhh@maripepa.es` |
| Acuse del formulario de contacto | `noreply@mari-pepa.com` |
| Recuperación de contraseña y código de verificación | `noreply@mari-pepa.com` |
| Aviso interno de nueva candidatura | `cv.rrhh@maripepa.es` |

## 8. Referencias de código

- `backend/app/services/adminService.js`: transiciones, elegibilidad y bloqueos.
- `backend/app/controllers/adminController.js`: validación HTTP (`409 INVALID_TRANSITION`).
- `frontend/components/admin/admin-data.ts`: tabla de transiciones del panel.
- `frontend/components/admin/AdminApplications.tsx`: selector bloqueado, modal y cuenta atrás.
- `backend/app/services/emailService.js`: plantilla base y logo CID.
