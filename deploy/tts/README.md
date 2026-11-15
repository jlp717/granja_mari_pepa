# TTS local del chatbot (Kokoro-82M)

Servicio HTTP privado que sintetiza las respuestas del chatbot sin salir del
servidor: sin claves, sin cuotas y sin enviar texto de clientes a terceros.

## Componentes

| Pieza | Ruta / proceso |
|---|---|
| Servicio | `/home/gmp/tts/server.py` (escucha en `127.0.0.1:5100`) |
| Entorno Python | `/home/gmp/tts-venv` (torch CPU + kokoro + soundfile) |
| Modelo y voces | caché de HuggingFace (`~/.cache/huggingface`) |
| Proceso | pm2 `mari-pepa-tts` (guardado con `pm2 save`) |
| Puente Node | `POST /api/chatbot/speech` en `backend/app/controllers/chatbotController.js` |

Dependencias del sistema: `ffmpeg` y `espeak-ng` (APT).

## Voces

Se eligen por entorno al arrancar el servicio:

```
TTS_VOICE_ES=em_santa   # por defecto em_santa
TTS_VOICE_EN=af_heart
```

Cambiar de voz:

```
TTS_VOICE_ES=em_santa pm2 restart mari-pepa-tts --update-env
pm2 save
curl -s http://127.0.0.1:5100/health
```

La primera síntesis con una voz nueva descarga su fichero (~500 KB) y tarda
unos segundos; después queda en caché.

## Operación

- `GET /health` → `{status, voices, loaded}`.
- `POST /speech {text, locale}` → `audio/mpeg` (48 kbps mono) o `audio/wav`.
- Límite de 900 caracteres por petición y una síntesis concurrente (lock).
- Si el servicio cae, `/api/chatbot/speech` devuelve 503 y el navegador usa su
  voz local como respaldo; el chatbot sigue operativo.
- Memoria en régimen: ~1,3 GB. Reinicio típico: ~15 s (precarga español).

## Diagnóstico

```
pm2 logs mari-pepa-tts --lines 40
curl -s -X POST -H 'Content-Type: application/json' \
  -d '{"text":"Hola, soy Pepa","locale":"es"}' \
  http://127.0.0.1:5100/speech -o /tmp/voz.mp3 -w '%{http_code} %{size_download}\n'
```
