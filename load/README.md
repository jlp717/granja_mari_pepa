# Pruebas de carga con Grafana k6

Los scripts viven en `load/k6/` y se ejecutan contra la web pública o staging.

## Requisitos

- k6 instalado (`k6 version`) o la imagen `grafana/k6`.
- Acceso a la URL objetivo.

## Humo de solo lectura

```bash
k6 run load/k6/public-smoke.js
```

Variables:

| Variable | Por defecto | Uso |
|---|---|---|
| `BASE_URL` | `https://www.mari-pepa.com` | Destino |
| `PAGES_VUS` | `8` | Usuarios simultáneos en páginas |
| `PAGES_DURATION` | `20s` | Duración del escenario de páginas |
| `API_ITERATIONS` | `10` | Iteraciones del escenario API |

Umbrales: errores < 1 %, p95 < 1,5 s.

## Validación de formularios (sin escribir)

```bash
k6 run load/k6/public-write.js
```

Comprueba que contacto y candidatura rechazan datos inválidos (`400`) sin crear filas ni enviar correo.

## Escritura real (solo pruebas)

```bash
ALLOW_WRITES=true TEST_TAG=k6 k6 run load/k6/public-write.js
```

Crea una candidatura y un PDF por iteración. Hay que borrar después las filas con `ACTIVE = 0`.

## Límites que no se deben saltar

- La API pública tiene **200 peticiones / 15 min por IP**. Un escenario masivo desde una sola IP acabará en `429`.
- DB2/AS400 es compartido con GMP. El pool del backend es de 10 conexiones; no se debe subir sin medir.
- Las pruebas de escritura masivas requieren una limpieza posterior y aprobación.
- Para una prueba de carga grande: ejecutar desde una IP autorizada, subir el límite de forma temporal y avisar a Javier.

## Interpretación

- `http_req_failed`: fallos de red o respuestas >= 400.
- `business_errors`: respuestas correctas a nivel HTTP pero con contenido inesperado.
- `http_req_duration`: latencia; se vigila el p95.
