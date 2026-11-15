#!/usr/bin/env python3
"""Genera muestras MP3 de las voces espanolas de Kokoro para comparar."""

import os
import subprocess

import numpy as np
import soundfile as sf
from kokoro import KPipeline

TEXT = (
    "Hola, soy Pepa, el asistente de Granja Maripepa. "
    "Puedo consultar tus pedidos, tus facturas y tus albaranes, y avisarte del reparto."
)
VOICES = ["ef_dora", "em_alex", "em_santa"]
OUT = "/tmp/voice-samples"

os.makedirs(OUT, exist_ok=True)
pipeline = KPipeline(lang_code="e")

for voice in VOICES:
    try:
        parts = [audio for _, _, audio in pipeline(TEXT, voice=voice, speed=1.0)]
        audio = np.concatenate(parts)
        wav_path = os.path.join(OUT, f"{voice}.wav")
        mp3_path = os.path.join(OUT, f"{voice}.mp3")
        sf.write(wav_path, audio, 24000, subtype="PCM_16")
        result = subprocess.run(
            ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", wav_path,
             "-codec:a", "libmp3lame", "-b:a", "64k", "-ac", "1", mp3_path],
            capture_output=True,
        )
        size = os.path.getsize(mp3_path) if os.path.exists(mp3_path) else 0
        print(f"{voice}: OK {round(len(audio) / 24000, 2)}s mp3={size}b")
    except Exception as exc:  # noqa: BLE001
        print(f"{voice}: FAIL {str(exc)[:90]}")
