import io
import sys

BASE = "/var/www/mari-pepa"


def read(path):
    with io.open(path, "r", encoding="utf-8") as handle:
        return handle.read()


def write(path, content):
    with io.open(path, "w", encoding="utf-8", newline="") as handle:
        handle.write(content)


def patch_server():
    path = BASE + "/backend/server.js"
    source = read(path)
    if "/api/chatbot/speech" in source:
        return "server.js: already patched"
    needle = "app.post('/api/chatbot/transcribe', optionalAuth, generalLimiter, chatbotController.transcribeAudio);"
    if needle not in source:
        return "server.js: anchor not found"
    replacement = needle + "\napp.post('/api/chatbot/speech', optionalAuth, generalLimiter, chatbotController.speakText);"
    write(path, source.replace(needle, replacement, 1))
    return "server.js: patched"


def patch_fortress():
    path = BASE + "/backend/app/middleware/securityFortress.js"
    source = read(path)
    if "/api/chatbot/speech" in source:
        return "securityFortress.js: already patched"
    needle = "'/api/chatbot/transcribe' // Transcripción de voz del chatbot"
    if needle not in source:
        return "securityFortress.js: anchor not found"
    replacement = (
        "'/api/chatbot/transcribe', // Transcripción de voz del chatbot\n"
        "    '/api/chatbot/speech' // Lectura en voz alta (TTS local)"
    )
    write(path, source.replace(needle, replacement, 1))
    return "securityFortress.js: patched"


if __name__ == "__main__":
    print(patch_server())
    print(patch_fortress())
    sys.exit(0)
