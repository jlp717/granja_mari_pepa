#!/usr/bin/env python3
"""Servicio TTS local para el chatbot de Mari Pepa.

Motor: Kokoro-82M (Apache-2.0), inferencia en CPU, sin claves ni servicios
externos. Escucha solo en 127.0.0.1:5100 y devuelve MP3 mono 48 kbps
(fallback WAV si ffmpeg no esta disponible).

Uso:
  ~/tts-venv/bin/python ~/tts/server.py
"""

import io
import json
import os
import subprocess
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import numpy as np
import soundfile as sf
from kokoro import KPipeline

HOST = "127.0.0.1"
PORT = 5100
MAX_CHARS = 900
SAMPLE_RATE = 24000
VOICES = {
    "es": (os.environ.get("TTS_VOICE_ES", "em_santa"), "e"),
    "en": (os.environ.get("TTS_VOICE_EN", "af_heart"), "a"),
}

_pipelines = {}
_pipeline_lock = threading.Lock()
_synth_lock = threading.Lock()


def pipeline_for(locale):
    _, lang = VOICES.get(locale, VOICES["es"])
    with _pipeline_lock:
        if lang not in _pipelines:
            _pipelines[lang] = KPipeline(lang_code=lang)
        return _pipelines[lang]


def to_mp3(wav_bytes):
    try:
        result = subprocess.run(
            [
                "ffmpeg", "-hide_banner", "-loglevel", "error",
                "-i", "pipe:0", "-f", "mp3", "-codec:a", "libmp3lame",
                "-b:a", "48k", "-ac", "1", "pipe:1",
            ],
            input=wav_bytes,
            capture_output=True,
            timeout=20,
        )
    except Exception:
        return None
    if result.returncode == 0 and len(result.stdout) > 1000:
        return result.stdout
    return None


def synthesise(text, locale):
    pipeline = pipeline_for(locale)
    voice, _ = VOICES.get(locale, VOICES["es"])
    with _synth_lock:
        parts = [audio for _, _, audio in pipeline(text, voice=voice, speed=1.0)]
    audio = np.concatenate(parts) if parts else np.zeros(SAMPLE_RATE // 10, dtype="float32")
    buffer = io.BytesIO()
    sf.write(buffer, audio, SAMPLE_RATE, format="WAV", subtype="PCM_16")
    wav_bytes = buffer.getvalue()
    mp3 = to_mp3(wav_bytes)
    if mp3:
        return mp3, "audio/mpeg"
    return wav_bytes, "audio/wav"


class Handler(BaseHTTPRequestHandler):
    server_version = "maripepa-tts/1.0"

    def do_GET(self):  # noqa: N802
        if self.path == "/health":
            return self._json(
                200,
                {
                    "status": "ok",
                    "voices": {locale: voice for locale, (voice, _) in VOICES.items()},
                    "loaded": sorted(_pipelines),
                },
            )
        return self._json(404, {"error": "not found"})

    def do_POST(self):  # noqa: N802
        if self.path != "/speech":
            return self._json(404, {"error": "not found"})
        try:
            length = int(self.headers.get("content-length") or 0)
            if length <= 0 or length > 20000:
                return self._json(413, {"error": "payload too large"})
            payload = json.loads(self.rfile.read(length) or b"{}")
            text = " ".join(str(payload.get("text") or "").split())[:MAX_CHARS].strip()
            locale = "en" if str(payload.get("locale")) == "en" else "es"
            if len(text) < 2:
                return self._json(400, {"error": "text required"})
            body, mime = synthesise(text, locale)
            self.send_response(200)
            self.send_header("Content-Type", mime)
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except Exception as exc:  # pragma: no cover - servicio auxiliar
            self._json(500, {"error": str(exc)[:160]})

    def _json(self, code, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    pipeline_for("es")
    print(f"tts ready on http://{HOST}:{PORT}", flush=True)
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
