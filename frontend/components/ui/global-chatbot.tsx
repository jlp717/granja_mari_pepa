"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useId,
  useMemo,
} from "react";
import type { CSSProperties, FormEvent, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import {
  X,
  Send,
  RefreshCw,
  Minimize2,
  Maximize2,
  Mic,
  MicOff,
  Loader2,
  ArrowUpRight,
  Square,
  Headset,
  Pause,
  Play,
  Trash2,
  ShieldCheck,
  Headphones,
  Package,
  Boxes,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  Check,
  Copy,
  FileText,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { getPepaCopy } from "./pepa-copy";
import styles from "./global-chatbot.module.css";

type Source = { label: string; url: string };
type DeliveryResult = {
  success: boolean;
  channel?: string;
  status?: string;
  toMasked?: string;
  providerMessageId?: string;
  code?: string;
  message?: string;
  fallbackUrl?: string;
  redirected?: boolean;
};
type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  isError?: boolean;
  sources?: Source[];
  suggestions?: string[];
  attachments?: { label: string; url: string }[];
  wasVoice?: boolean;
  redacted?: boolean;
  send?: DeliveryResult;
};
type HistoryTurn = { role: "user" | "assistant"; content: string };
type SseEvent = Record<string, unknown>;

const HISTORY_KEY = "pepa:history";
const MEMORY_KEY = "pepa:memory";
const TOKEN_KEY = "pepa:token";
const MAX_HISTORY_TURNS = 8;

const newId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const VOICE_RATE = 16000;
const VOICE_CHUNK_SECONDS = 2.5;

function encodeWav(pcm: Int16Array, sampleRate: number): Blob {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  const write = (offset: number, text: string) => {
    for (let index = 0; index < text.length; index += 1) {
      view.setUint8(offset + index, text.charCodeAt(index));
    }
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + pcm.length * 2, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, pcm.length * 2, true);
  return new Blob([header, pcm.buffer], { type: "audio/wav" });
}

function toPcm16(input: Float32Array, sourceRate: number, targetRate = VOICE_RATE): Int16Array {
  const ratio = sourceRate > targetRate ? sourceRate / targetRate : 1;
  const length = Math.max(1, Math.floor(input.length / ratio));
  const output = new Int16Array(length);
  for (let index = 0; index < length; index += 1) {
    const start = Math.floor(index * ratio);
    const end = ratio > 1 ? Math.min(input.length, Math.floor((index + 1) * ratio)) : start + 1;
    let sum = 0;
    let count = 0;
    for (let cursor = start; cursor < end; cursor += 1) {
      sum += input[cursor];
      count += 1;
    }
    const sample = count ? sum / count : input[start] || 0;
    output[index] = Math.max(-1, Math.min(1, sample)) * 0x7fff;
  }
  return output;
}

function mergePcm(parts: Int16Array[]): Int16Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const merged = new Int16Array(total);
  let offset = 0;
  for (const part of parts) {
    merged.set(part, offset);
    offset += part.length;
  }
  return merged;
}

class HttpError extends Error {}

function toTurns(messages: ChatMessage[]): HistoryTurn[] {
  return messages
    .filter((message) => message.content.trim().length > 0 && !message.isError)
    .slice(-10)
    .map((message) => ({ role: message.role, content: message.content }));
}

// Un turno de usuario sin respuesta (p.ej. tras un 401 que abre el login) no
// debe viajar como contexto: el modelo lo interpretaria como la pregunta
// pendiente y responderia a esa en vez de a la actual.
function completeTurns(turns: HistoryTurn[]): HistoryTurn[] {
  const trimmed = [...turns];
  while (trimmed.length && trimmed[trimmed.length - 1].role === "user") {
    trimmed.pop();
  }
  return trimmed;
}

type VoiceLike = { name: string; lang: string; localService?: boolean };

// Elige la voz menos robotica disponible: prioriza voces neuronales/naturales
// (Edge y Windows modernos), luego las voces es-ES conocidas y deja Helena
// como ultimo recurso.
export function pickBestVoice<T extends VoiceLike>(voices: T[], locale: string): T | null {
  if (!voices.length) return null;
  const want = locale === "en" ? "en" : "es";
  const matching = voices.filter((voice) => voice.lang.toLowerCase().startsWith(want));
  const pool = matching.length ? matching : voices;
  const score = (voice: T, index: number) => {
    const name = voice.name.toLowerCase();
    let value = 0;
    if (/natural|neural|online|premium|enhanced/.test(name)) value += 100;
    if (/google/.test(name)) value += 60;
    if (want === "es" && /laura|pablo|monica|paulina|sabina|jorge|diego|marisol|ximena/.test(name)) {
      value += 40;
    }
    if (want === "es" && /helena/.test(name)) value += 5;
    if (voice.lang.toLowerCase() === (want === "en" ? "en-gb" : "es-es")) value += 25;
    if (voice.localService === false) value += 15;
    return value * 1000 - index;
  };
  return [...pool]
    .map((voice, index) => ({ voice, score: score(voice, index) }))
    .sort((left, right) => right.score - left.score)[0].voice;
}

// Trocea por frases para que Chrome no corte la locucion a los ~15 s y para
// que el ritmo tenga pausas naturales entre ideas.
export function chunkForSpeech(text: string, max = 190): string[] {
  const clean = String(text || "")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/[*_#>`]/g, "")
    .replace(/[•·]/g, ",")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean) return [];
  const sentences = clean.match(/[^.!?;:]+[.!?;:]*/g) || [clean];
  const chunks: string[] = [];
  let current = "";
  for (const raw of sentences) {
    const sentence = raw.trim();
    if (!sentence) continue;
    if (current && current.length + 1 + sentence.length > max) {
      chunks.push(current);
      current = sentence;
    } else {
      current = current ? `${current} ${sentence}` : sentence;
    }
  }
  if (current) chunks.push(current);
  return chunks.map((chunk) => (/[.!?]$/.test(chunk) ? chunk : `${chunk}.`));
}

function loadMessages(memory: boolean): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = (memory ? window.localStorage : window.sessionStorage).getItem(
      HISTORY_KEY,
    );
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is ChatMessage =>
          Boolean(item) &&
          typeof item === "object" &&
          ((item as ChatMessage).role === "user" ||
            (item as ChatMessage).role === "assistant") &&
          typeof (item as ChatMessage).content === "string",
      )
      .map((item) => ({ ...item, id: item.id || newId(), streaming: false }));
  } catch {
    return [];
  }
}

async function readSse(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: SseEvent) => void,
  signal?: AbortSignal,
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    if (signal?.aborted) {
      await reader.cancel().catch(() => undefined);
      return;
    }
    const { done, value } = await reader.read();
    if (done) break;
    if (signal?.aborted) {
      await reader.cancel().catch(() => undefined);
      return;
    }
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() || "";
    for (const part of parts) {
      if (signal?.aborted) {
        await reader.cancel().catch(() => undefined);
        return;
      }
      const line = part.trim();
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        onEvent(JSON.parse(payload) as SseEvent);
      } catch {
        /* fragmento incompleto */
      }
      await new Promise((resolve) => setTimeout(resolve, 8));
    }
  }
}

const LOGO_SOURCES = [
  "/brand/logo-maripepa.jpeg",
  "/images/logo.jpeg",
  "/kage/brand/logo-alpha.png",
];

function BrandMark() {
  const [index, setIndex] = useState(0);
  if (index >= LOGO_SOURCES.length) {
    return (
      <span className={styles.monogram} aria-hidden="true">
        MP
      </span>
    );
  }
  return (
    <img
      src={LOGO_SOURCES[index]}
      alt=""
      width={44}
      height={22}
      className={styles.brandImg}
      onError={() => setIndex((i) => i + 1)}
    />
  );
}

function deliveryText(send: DeliveryResult, locale: string): string {
  const channel = send.channel === "whatsapp" ? "WhatsApp" : "email";
  if (send.success) {
    return locale === "en"
      ? `Sent by ${channel} to ${send.toMasked ?? ""}${send.redirected ? " (test)" : ""}`
      : `Enviado por ${channel} a ${send.toMasked ?? ""}${send.redirected ? " (prueba)" : ""}`;
  }
  return locale === "en"
    ? `Not sent${send.code ? ` (${send.code})` : ""}`
    : `No enviado${send.code ? ` (${send.code})` : ""}`;
}

function MarkdownText({ content }: { content: string }) {
  const safeHref = (href: string) =>
    /^(https?:\/\/|\/|#|mailto:)/i.test(href.trim());
  const parse = (text: string): ReactNode[] => {
    const parts: ReactNode[] = [];
    const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(\[(.+?)\]\((.+?)\))/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
      if (match[1]) parts.push(<strong key={match.index}>{match[2]}</strong>);
      else if (match[3]) parts.push(<em key={match.index}>{match[4]}</em>);
      else if (match[5] && safeHref(match[7]))
        parts.push(
          <a key={match.index} href={match[7]} target="_blank" rel="noopener noreferrer">
            {match[6]}
          </a>,
        );
      else if (match[5]) parts.push(match[6]);
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) parts.push(text.slice(lastIndex));
    return parts.length ? parts : [text];
  };
  return (
    <>
      {content.split("\n").map((line, index, lines) => (
        <span key={index}>
          {parse(line)}
          {index < lines.length - 1 && <br />}
        </span>
      ))}
    </>
  );
}

export function GlobalChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authPrompt, setAuthPrompt] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [loginCode, setLoginCode] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [memoryEnabled, setMemoryEnabled] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const [handoff, setHandoff] = useState<{ reference: string; eta: string; notified?: boolean } | null>(null);
  const [handoffError, setHandoffError] = useState("");
  const [isHandoffLoading, setIsHandoffLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isRequestingMic, setIsRequestingMic] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [pendingTranscript, setPendingTranscript] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [micError, setMicError] = useState("");
  const [speech, setSpeech] = useState<{
    id: string;
    status: "loading" | "playing" | "paused";
    engine: "server" | "browser";
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [uncertaintyCount, setUncertaintyCount] = useState(0);

  const launcherRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const copy = getPepaCopy(useLocale());
  const t = useTranslations("chatbot");
  const locale = useLocale();
  const assistantName = locale === "es" ? "Pepa IA" : "Pepa AI";

  const messagesRef = useRef<ChatMessage[]>([]);
  const historyTurnsRef = useRef<HistoryTurn[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const requestSeqRef = useRef(0);
  const sendingRef = useRef(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const voiceUsedRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pcmAllRef = useRef<Int16Array[]>([]);
  const pendingSamplesRef = useRef<Int16Array[]>([]);
  const pendingCountRef = useRef(0);
  const partialTextRef = useRef("");
  const flushChainRef = useRef<Promise<void>>(Promise.resolve());
  const voiceRateRef = useRef(VOICE_RATE);
  const panelRef = useRef<HTMLElement | null>(null);
  const dragRef = useRef<{ dx: number; dy: number; width: number; height: number } | null>(null);
  const stickToBottomRef = useRef(true);
  const voiceCacheRef = useRef<SpeechSynthesisVoice[]>([]);
  const speechQueueRef = useRef<{ id: string; chunks: string[]; index: number; locale: string } | null>(null);
  const speechTimerRef = useRef<number | null>(null);
  const speechReqRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const ui = useMemo(
    () =>
      locale === "en"
        ? {
            capabilities: "What can I do for you?",
            cards: [
              { icon: Boxes, title: "Browse the catalogue", query: "What products do you distribute?" },
              { icon: Package, title: "Check my order", query: "I want to check the status of my order" },
              { icon: Headset, title: "Talk to a person", query: "__handoff__" },
            ],
            loginTitle: "Sign in to see your account",
            loginText: "Only your invoices, orders and balance are behind your customer code.",
            code: "Customer code",
            password: "Password",
            enter: "Sign in",
            loggingIn: "Checking…",
            logout: "Sign out",
            signedIn: "Signed in",
            redacted: "Personal data protected.",
            loginFailed: "We could not sign you in. Please try again.",
            whatsapp: "Open WhatsApp",
            copy: "Copy answer",
            copied: "Copied",
            stop: "Stop generating",
            regenerate: "Regenerate",
            retry: "Try again",
            sources: "Sources",
            downloads: "Downloads",
            listen: "Listen to the answer",
            pause: "Pause reading",
            resume: "Resume reading",
            preparing: "Preparing audio",
            stopListening: "Stop audio",
            memory: "Memory",
            memoryTitle: "Conversation memory",
            memoryOn: "Remember this conversation",
            memoryHint: "If you allow it, the chat will keep the context the next time you open it.",
            memoryCount: (count: number) => `${count} messages stored on this device.`,
            deleteMemory: "Delete history",
            handoff: "Talk to a person",
            handoffSend: "Sending your conversation…",
            handoffDone: "Request received",
            handoffEta: "Estimated reply:",
            handoffFallback: "Your request is saved. If it is urgent, call us:",
            handoffError: "I could not send the request. Call 639 77 86 56 and we will help you.",
            handoffReason: "The customer asked for a human agent from the assistant.",
            micDenied: "Microphone permission denied.",
            micHelp: "Open the padlock in the address bar and allow the microphone.",
            micNotFound: "No microphone was found. Connect one and try again.",
            micBusy: "The microphone is being used by another application. Close it and try again.",
            micEmpty: "I could not hear you. Tap the microphone and speak a little closer.",
            micTimeout: "The microphone did not respond. Check the browser permission and try again.",
            transcribeError: "I could not transcribe the audio. Check your connection and try again.",
            transcriptReview: "Transcript ready",
            acceptTranscript: "Use it",
            discardTranscript: "Discard",
            write: copy.write,
          }
        : {
            capabilities: "¿Qué puedo hacer por ti?",
            cards: [
              { icon: Boxes, title: "Consultar catálogo", query: "¿Qué productos distribuís?" },
              { icon: Package, title: "Estado de mi pedido", query: "Quiero consultar el estado de mi pedido" },
              { icon: Headset, title: "Hablar con soporte", query: "__handoff__" },
            ],
            loginTitle: "Entra para ver tu cuenta",
            loginText: "Tus facturas, pedidos y saldo están detrás de tu código de cliente.",
            code: "Código de cliente",
            password: "Contraseña",
            enter: "Entrar",
            loggingIn: "Comprobando…",
            logout: "Cerrar sesión",
            signedIn: "Sesión iniciada",
            redacted: "Datos personales protegidos.",
            loginFailed: "No se pudo iniciar sesión. Inténtalo de nuevo.",
            whatsapp: "Abrir WhatsApp",
            copy: "Copiar respuesta",
            copied: "Copiado",
            stop: "Detener generación",
            regenerate: "Regenerar",
            retry: "Reintentar",
            sources: "Fuentes",
            downloads: "Descargas",
            listen: "Escuchar respuesta",
            pause: "Pausar lectura",
            resume: "Reanudar lectura",
            preparing: "Preparando voz",
            stopListening: "Detener audio",
            memory: "Memoria",
            memoryTitle: "Memoria de la conversación",
            memoryOn: "Recordar esta conversación",
            memoryHint: "Si lo permites, el chat conservará el contexto la próxima vez que lo abras.",
            memoryCount: (count: number) => `${count} mensajes guardados en este dispositivo.`,
            deleteMemory: "Borrar historial",
            handoff: "Hablar con una persona",
            handoffSend: "Enviando tu conversación…",
            handoffDone: "Solicitud recibida",
            handoffEta: "Respuesta estimada:",
            handoffFallback: "Tu solicitud queda registrada. Si es urgente, llámanos:",
            handoffError: "No he podido enviar la solicitud. Llama al 639 77 86 56 y te ayudamos.",
            handoffReason: "El cliente pide atención humana desde el asistente.",
            micDenied: "Permiso de micrófono denegado.",
            micHelp: "Abre el candado de la barra de direcciones y permite el micrófono.",
            micNotFound: "No se ha encontrado ningún micrófono. Conecta uno y vuelve a intentarlo.",
            micBusy: "El micrófono está siendo usado por otra aplicación. Ciérrala y vuelve a intentarlo.",
            micEmpty: "No te he oído. Pulsa el micrófono y habla un poco más cerca.",
            micTimeout: "El micrófono no ha respondido. Revisa el permiso del navegador e inténtalo otra vez.",
            transcribeError: "No he podido transcribir el audio. Revisa tu conexión e inténtalo otra vez.",
            transcriptReview: "Transcripción lista",
            acceptTranscript: "Usarla",
            discardTranscript: "Descartar",
            write: copy.write,
          },
    [locale, copy.write],
  );

  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(
      hour >= 6 && hour < 12
        ? t("greetingMorning")
        : hour >= 12 && hour < 20
          ? t("greetingAfternoon")
          : t("greetingEvening"),
    );
  }, [t]);

  const commit = useCallback(
    (updater: (previous: ChatMessage[]) => ChatMessage[]) => {
      messagesRef.current = updater(messagesRef.current);
      setMessages(messagesRef.current);
    },
    [],
  );

  const updateMessage = useCallback(
    (id: string, patch: Partial<ChatMessage>) => {
      commit((previous) =>
        previous.map((message) =>
          message.id === id ? { ...message, ...patch } : message,
        ),
      );
    },
    [commit],
  );

  useEffect(() => {
    const memory = window.localStorage.getItem(MEMORY_KEY) === "1";
    setMemoryEnabled(memory);
    const stored = loadMessages(memory);
    if (stored.length) {
      messagesRef.current = stored;
      setMessages(stored);
      historyTurnsRef.current = toTurns(stored);
    }
    const token = window.sessionStorage.getItem(TOKEN_KEY);
    if (token) setAuthToken(token);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || isGenerating) return;
    const payload = JSON.stringify(messages.filter((message) => !message.streaming));
    window.sessionStorage.setItem(HISTORY_KEY, payload);
    if (memoryEnabled) window.localStorage.setItem(HISTORY_KEY, payload);
  }, [messages, memoryEnabled, isGenerating]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || !stickToBottomRef.current) return;
    container.scrollTop = container.scrollHeight;
  }, [messages]);

  const handleMessagesScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    stickToBottomRef.current =
      container.scrollHeight - container.scrollTop - container.clientHeight < 96;
  }, []);

  useEffect(() => {
    if (!showLogin && !handoff && !handoffError) return;
    stickToBottomRef.current = true;
    const container = messagesContainerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [handoff, handoffError, showLogin]);

  useEffect(() => {
    if (!isOpen || isMinimized) return;
    inputRef.current?.focus({ preventScroll: true });
  }, [isOpen, isMinimized]);

  useEffect(() => {
    const element = inputRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 132)}px`;
  }, [input]);

  useEffect(() => {
    if (showLogin) codeRef.current?.focus({ preventScroll: true });
  }, [showLogin]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const load = () => {
      voiceCacheRef.current = window.speechSynthesis.getVoices();
    };
    load();
    window.speechSynthesis.addEventListener?.("voiceschanged", load);
    return () => {
      window.speechSynthesis.removeEventListener?.("voiceschanged", load);
    };
  }, []);

  const stopSpeech = useCallback(() => {
    speechReqRef.current += 1;
    speechQueueRef.current = null;
    if (speechTimerRef.current) {
      window.clearTimeout(speechTimerRef.current);
      speechTimerRef.current = null;
    }
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.src = "";
      } catch {
        /* audio ya detenido */
      }
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    try {
      window.speechSynthesis?.cancel();
    } catch {
      /* sin sintesis de voz */
    }
    setSpeech(null);
  }, []);

  const closePanel = useCallback(() => {
    stopSpeech();
    setIsOpen(false);
    window.dispatchEvent(
      new CustomEvent("kage:overlay-close", { detail: { id: "pepa" } }),
    );
    launcherRef.current?.focus();
  }, [stopSpeech]);

  const openPanel = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
    window.dispatchEvent(
      new CustomEvent("kage:overlay-open", { detail: { id: "pepa" } }),
    );
  }, []);

  useEffect(() => {
    const onOverlay = (event: Event) => {
      if ((event as CustomEvent<{ id?: string }>).detail?.id !== "pepa")
        setIsOpen(false);
    };
    const onOpen = () => openPanel();
    const onKey = (event: KeyboardEvent) => {
      if (isOpen && event.key === "Escape" && !event.defaultPrevented) {
        event.preventDefault();
        closePanel();
      }
    };
    window.addEventListener("kage:overlay-open", onOverlay);
    window.addEventListener("kage:open-pepa", onOpen);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("kage:overlay-open", onOverlay);
      window.removeEventListener("kage:open-pepa", onOpen);
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen, closePanel, openPanel]);

  useEffect(
    () => () => {
      try {
        processorRef.current?.disconnect();
      } catch {
        /* ya desconectado */
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      try {
        void audioCtxRef.current?.close();
      } catch {
        /* ya cerrado */
      }
      try {
        window.speechSynthesis?.cancel();
      } catch {
        /* sin sintesis de voz */
      }
    },
    [],
  );

  const runRequest = useCallback(
    async (rawText: string, options?: { echoUser?: boolean; token?: string | null }) => {
      const text = rawText.trim();
      if (!text || sendingRef.current) return;

      // Una respuesta nueva no debe solaparse con la locucion anterior.
      stopSpeech();
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const seq = ++requestSeqRef.current;
      sendingRef.current = true;
      const history = completeTurns(
        historyTurnsRef.current.slice(-MAX_HISTORY_TURNS),
      );
      const wasVoice = voiceUsedRef.current;
      voiceUsedRef.current = false;

      if (options?.echoUser !== false) {
        commit((previous) => [
          ...previous,
          { id: newId(), role: "user", content: text, wasVoice },
        ]);
        historyTurnsRef.current = [
          ...history,
          { role: "user" as const, content: text },
        ].slice(-MAX_HISTORY_TURNS);
      }

      const assistantId = newId();
      commit((previous) => [
        ...previous,
        { id: assistantId, role: "assistant", content: "", streaming: true, wasVoice },
      ]);
      setIsGenerating(true);
      setMicError("");
      setHandoff(null);
      stickToBottomRef.current = true;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      const token = options?.token !== undefined ? options.token : authToken;
      if (token) headers.Authorization = `Bearer ${token}`;

      try {
        const response = await fetch("/api/chatbot/stream", {
          method: "POST",
          headers,
          credentials: "same-origin",
          body: JSON.stringify({ message: text, history, locale }),
          signal: controller.signal,
        });

        if (response.status === 401) {
          const payload = (await response.json().catch(() => null)) as
            | { message?: string }
            | null;
          commit((previous) => previous.filter((message) => message.id !== assistantId));
          setAuthPrompt(text);
          setLoginError(payload?.message || "");
          setShowLogin(true);
          return;
        }

        if (!response.ok || !response.body) {
          const payload = (await response.json().catch(() => null)) as
            | { message?: string; retryAfter?: number }
            | null;
          const wait = Math.min(90, Math.ceil(Number(payload?.retryAfter) || 0));
          const retryHint =
            wait > 0
              ? locale === "en"
                ? ` Try again in ${wait}s.`
                : ` Reinténtalo en ${wait} s.`
              : "";
          throw new HttpError(
            `${payload?.message || t("connectionError")}${retryHint}`,
          );
        }

        let accumulated = "";
        let completed = false;

        await readSse(response.body, (event) => {
          if (typeof event.delta === "string") {
            accumulated += event.delta;
            updateMessage(assistantId, { content: accumulated, streaming: true });
          }
          if (event.done === true) {
            completed = true;
            const reply =
              typeof event.reply === "string" && event.reply
                ? event.reply
                : accumulated;
            const sources = Array.isArray(event.sources)
              ? (event.sources as Source[]).filter(
                  (source) =>
                    source &&
                    typeof source.label === "string" &&
                    typeof source.url === "string",
                )
              : [];
            const suggestions = Array.isArray(event.suggestions)
              ? (event.suggestions as unknown[]).filter(
                  (item): item is string => typeof item === "string",
                )
              : [];
            const attachments = (Array.isArray(event.attachments)
              ? event.attachments
              : []
            ).filter(
              (item): item is { label: string; url: string } => {
                if (!item || typeof item !== "object") return false;
                const candidate = item as { label?: unknown; url?: unknown };
                return (
                  typeof candidate.label === "string" &&
                  typeof candidate.url === "string" &&
                  (candidate.url.startsWith("/") ||
                    candidate.url.startsWith("https://"))
                );
              },
            );
            updateMessage(assistantId, {
              content: reply,
              streaming: false,
              sources,
              suggestions,
              attachments,
              redacted: event.redacted === true,
              send:
                event.send && typeof event.send === "object"
                  ? (event.send as DeliveryResult)
                  : undefined,
            });
            historyTurnsRef.current = [
              ...historyTurnsRef.current,
              { role: "assistant" as const, content: reply },
            ].slice(-MAX_HISTORY_TURNS);
            if (/(no tengo|no lo s[ée]|no estoy seguro|no dispongo)/i.test(reply))
              setUncertaintyCount((count) => count + 1);
          }
          if (event.error && typeof event.error === "object") {
            const detail = event.error as { message?: string };
            completed = true;
            updateMessage(assistantId, {
              content: detail.message || "No he podido completar la respuesta.",
              streaming: false,
              isError: true,
            });
          }
          if (event.aborted === true) {
            completed = true;
            updateMessage(assistantId, { streaming: false });
          }
        }, controller.signal);

        if (!completed) updateMessage(assistantId, { streaming: false });
      } catch (error) {
        if (controller.signal.aborted) {
          updateMessage(assistantId, { streaming: false });
        } else {
          updateMessage(assistantId, {
            content:
              error instanceof HttpError
                ? error.message
                : t("connectionError"),
            streaming: false,
            isError: true,
          });
        }
      } finally {
        if (requestSeqRef.current === seq) {
          sendingRef.current = false;
          setIsGenerating(false);
        }
      }
    },
    [authToken, commit, locale, stopSpeech, t, updateMessage],
  );

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    sendingRef.current = false;
    setIsGenerating(false);
  }, []);

  const sendMessage = useCallback(
    (rawText?: string, viaVoice = false) => {
      const text = (rawText ?? input).trim();
      if (!text || isGenerating || sendingRef.current) return;
      setInput("");
      setShowLogin(false);
      voiceUsedRef.current = viaVoice || voiceUsedRef.current;
      void runRequest(text, { echoUser: true });
    },
    [input, isGenerating, runRequest],
  );

  const regenerate = useCallback(() => {
    if (sendingRef.current) return;
    const list = messagesRef.current;
    const lastAssistant = [...list].reverse().find((message) => message.role === "assistant");
    if (!lastAssistant) return;
    const index = list.findIndex((message) => message.id === lastAssistant.id);
    const userMessage = [...list.slice(0, index)]
      .reverse()
      .find((message) => message.role === "user");
    if (!userMessage) return;

    commit((previous) => previous.filter((message) => message.id !== lastAssistant.id));
    const trimmed = [...historyTurnsRef.current];
    while (trimmed.length && trimmed[trimmed.length - 1].role === "assistant")
      trimmed.pop();
    historyTurnsRef.current = trimmed;
    void runRequest(userMessage.content, { echoUser: false });
  }, [commit, runRequest]);

  const clearChat = useCallback(() => {
    abortRef.current?.abort();
    commit(() => []);
    historyTurnsRef.current = [];
    setInput("");
    setIsGenerating(false);
    setShowLogin(false);
    setAuthPrompt(null);
    setHandoff(null);
    setUncertaintyCount(0);
    stopSpeech();
    window.sessionStorage.removeItem(HISTORY_KEY);
    window.localStorage.removeItem(HISTORY_KEY);
  }, [commit, stopSpeech]);

  const toggleMemory = useCallback(() => {
    const next = !memoryEnabled;
    setMemoryEnabled(next);
    if (next) {
      window.localStorage.setItem(MEMORY_KEY, "1");
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(messagesRef.current));
    } else {
      window.localStorage.removeItem(MEMORY_KEY);
      window.localStorage.removeItem(HISTORY_KEY);
    }
  }, [memoryEnabled]);

  const deleteMemory = useCallback(() => {
    window.localStorage.removeItem(HISTORY_KEY);
    window.localStorage.removeItem(MEMORY_KEY);
    window.sessionStorage.removeItem(HISTORY_KEY);
    setMemoryEnabled(false);
    commit(() => []);
    historyTurnsRef.current = [];
    setShowMemory(false);
  }, [commit]);

  const signOut = useCallback(() => {
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(HISTORY_KEY);
    window.localStorage.removeItem(HISTORY_KEY);
    setAuthToken(null);
    setShowLogin(false);
    setAuthPrompt(null);
    setHandoff(null);
    stopSpeech();
    commit(() => []);
    historyTurnsRef.current = [];
  }, [commit, stopSpeech]);

  const submitLogin = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      if (isLoggingIn) return;
      setLoginError("");
      setIsLoggingIn(true);
      try {
        const csrfResponse = await fetch("/api/csrf-token", {
          credentials: "same-origin",
        });
        const csrf = (await csrfResponse.json().catch(() => null)) as
          | { token?: string }
          | null;
        const response = await fetch("/api/auth/secure/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(csrf?.token ? { "X-CSRF-Token": csrf.token } : {}),
          },
          credentials: "same-origin",
          body: JSON.stringify({
            customerCode: loginCode.trim(),
            password: loginPassword,
          }),
        });
        const data = (await response.json().catch(() => null)) as
          | { success?: boolean; accessToken?: string; message?: string }
          | null;
        if (!response.ok || !data?.success || !data.accessToken) {
          setLoginError(data?.message || ui.loginFailed);
          return;
        }
        window.sessionStorage.setItem(TOKEN_KEY, data.accessToken);
        setAuthToken(data.accessToken);
        setLoginPassword("");
        setShowLogin(false);
        const pending = authPrompt;
        setAuthPrompt(null);
        if (pending) {
          const turns = historyTurnsRef.current;
          const last = turns[turns.length - 1];
          if (last && last.role === "user" && last.content === pending) {
            historyTurnsRef.current = turns.slice(0, -1);
          }
          voiceUsedRef.current = false;
          void runRequest(pending, {
            echoUser: false,
            token: data.accessToken,
          });
        }
      } catch {
        setLoginError(ui.loginFailed);
      } finally {
        setIsLoggingIn(false);
      }
    },
    [authPrompt, isLoggingIn, loginCode, loginPassword, runRequest, ui.loginFailed],
  );

  const requestHandoff = useCallback(async () => {
    if (isHandoffLoading) return;
    setIsHandoffLoading(true);
    setHandoffError("");
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (authToken) headers.Authorization = `Bearer ${authToken}`;
      const response = await fetch("/api/chatbot/stream", {
        method: "POST",
        headers,
        credentials: "same-origin",
        body: JSON.stringify({
          handoff: true,
          reason: ui.handoffReason,
          history: historyTurnsRef.current,
          locale,
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | { handoff?: { reference?: string; eta?: string; notified?: boolean } }
        | null;
      if (!response.ok || !data?.handoff?.reference) throw new Error("handoff");
      setHandoff({
        reference: data.handoff.reference,
        eta: data.handoff.eta || (locale === "en" ? "under 24 working hours" : "menos de 24 h laborables"),
        notified: data.handoff.notified,
      });
    } catch {
      setHandoffError(ui.handoffError);
    } finally {
      setIsHandoffLoading(false);
    }
  }, [authToken, isHandoffLoading, locale, ui.handoffError, ui.handoffReason]);

  const speakWithBrowser = useCallback(
    (message: ChatMessage) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      const chunks = chunkForSpeech(message.content);
      if (!chunks.length) return;
      window.speechSynthesis.cancel();
      if (speechTimerRef.current) {
        window.clearTimeout(speechTimerRef.current);
        speechTimerRef.current = null;
      }
      const queue = { id: message.id, chunks, index: 0, locale };
      speechQueueRef.current = queue;
      setSpeech({ id: message.id, status: "playing", engine: "browser" });

      const next = () => {
        const active = speechQueueRef.current;
        if (!active || active.id !== message.id) return;
        if (active.index >= active.chunks.length) {
          speechQueueRef.current = null;
          setSpeech(null);
          return;
        }
        const chunk = active.chunks[active.index];
        active.index += 1;
        const utterance = new SpeechSynthesisUtterance(chunk);
        const voice = pickBestVoice(voiceCacheRef.current, locale);
        if (voice) {
          utterance.voice = voice;
          utterance.lang = voice.lang;
        } else {
          utterance.lang = locale === "en" ? "en-GB" : "es-ES";
        }
        // Las voces neuronales ya vienen bien ritmadas; las SAPI suenan
        // apresuradas y metalicas, asi que se leen algo mas despacio.
        const natural = voice
          ? /natural|neural|online|premium|enhanced|google/i.test(voice.name)
          : false;
        utterance.rate = natural ? 1 : 0.95;
        utterance.pitch = 1;
        utterance.onend = () => {
          const after = speechQueueRef.current;
          if (!after || after.id !== message.id) return;
          speechTimerRef.current = window.setTimeout(next, 150);
        };
        utterance.onerror = () => {
          const after = speechQueueRef.current;
          if (!after || after.id !== message.id) return;
          speechQueueRef.current = null;
          setSpeech(null);
        };
        window.speechSynthesis.speak(utterance);
      };

      // Chrome descarta la primera locucion si se encola justo tras cancel().
      speechTimerRef.current = window.setTimeout(next, 80);
    },
    [locale],
  );

  const startSpeech = useCallback(
    async (message: ChatMessage) => {
      stopSpeech();
      if (typeof window === "undefined") return;
      const req = speechReqRef.current;
      const text = message.content.slice(0, 900);
      setSpeech({ id: message.id, status: "loading", engine: "server" });
      try {
        const response = await fetch("/api/chatbot/speech", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ text, locale }),
          signal: AbortSignal.timeout(60000),
        });
        if (!response.ok) throw new Error("tts");
        const blob = await response.blob();
        if (req !== speechReqRef.current) return;
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        audioUrlRef.current = url;
        audio.onended = () => {
          if (audioRef.current === audio) stopSpeech();
        };
        audio.onerror = () => {
          if (audioRef.current !== audio) return;
          stopSpeech();
          speakWithBrowser(message);
        };
        await audio.play();
        if (req !== speechReqRef.current) return;
        setSpeech({ id: message.id, status: "playing", engine: "server" });
      } catch {
        if (req !== speechReqRef.current) return;
        if (audioRef.current) return;
        speakWithBrowser(message);
      }
    },
    [locale, speakWithBrowser, stopSpeech],
  );

  const toggleSpeech = useCallback(
    (message: ChatMessage) => {
      if (!speech || speech.id !== message.id) {
        void startSpeech(message);
        return;
      }
      if (speech.status === "loading") return;
      const nextStatus = speech.status === "playing" ? "paused" : "playing";
      if (speech.engine === "server" && audioRef.current) {
        if (nextStatus === "paused") audioRef.current.pause();
        else void audioRef.current.play().catch(() => undefined);
      } else if (speech.status === "playing") {
        window.speechSynthesis.pause();
      } else {
        window.speechSynthesis.resume();
      }
      setSpeech({ ...speech, status: nextStatus });
    },
    [speech, startSpeech],
  );

  const copyMessage = useCallback(async (message: ChatMessage) => {
    const plain = message.content
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .trim();
    try {
      await navigator.clipboard.writeText(plain);
      setCopiedId(message.id);
      window.setTimeout(
        () => setCopiedId((current) => (current === message.id ? null : current)),
        1600,
      );
    } catch {
      /* portapapeles no disponible */
    }
  }, []);

  const transcribeChunk = useCallback(async (blob: Blob) => {
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result || ""));
      reader.readAsDataURL(blob);
    });
    try {
      const response = await fetch("/api/chatbot/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          audio: base64,
          mimeType: blob.type,
          language: locale === "en" ? "en" : "es",
        }),
        signal: AbortSignal.timeout(60000),
      });
      if (!response.ok) return { ok: false, text: "" };
      const data = (await response.json().catch(() => null)) as
        | { text?: string }
        | null;
      return { ok: true, text: data?.text?.trim() || "" };
    } catch {
      return { ok: false, text: "" };
    }
  }, [locale]);

  const flushVoiceChunk = useCallback(() => {
    if (!pendingCountRef.current) return;
    const merged = mergePcm(pendingSamplesRef.current);
    pendingSamplesRef.current = [];
    pendingCountRef.current = 0;
    const blob = encodeWav(merged, voiceRateRef.current);
    flushChainRef.current = flushChainRef.current
      .then(() => transcribeChunk(blob))
      .then((result) => {
        const clean = String(result.text || "").replace(/\s+/g, " ").trim();
        if (!clean) return;
        partialTextRef.current = `${partialTextRef.current} ${clean}`.trim();
        setInput(partialTextRef.current);
      })
      .catch(() => undefined);
  }, [transcribeChunk]);

  const stopVoiceInput = useCallback(async () => {
    const processor = processorRef.current;
    processorRef.current = null;
    if (processor) {
      try {
        processor.disconnect();
      } catch {
        /* ya desconectado */
      }
      processor.onaudioprocess = null;
    }
    const context = audioCtxRef.current;
    audioCtxRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsListening(false);
    if (!processor && !context) return;

    flushVoiceChunk();
    await flushChainRef.current.catch(() => undefined);
    if (context) {
      try {
        await context.close();
      } catch {
        /* ya cerrado */
      }
    }

    const merged = mergePcm(pcmAllRef.current);
    pcmAllRef.current = [];
    if (merged.length < voiceRateRef.current * 0.4) {
      setInput("");
      setMicError(ui.micEmpty);
      return;
    }

    setIsTranscribing(true);
    const finalResult = await transcribeChunk(encodeWav(merged, voiceRateRef.current));
    setIsTranscribing(false);

    const text = String(finalResult.text || partialTextRef.current || "")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) {
      setInput("");
      setMicError(finalResult.ok ? ui.micEmpty : ui.transcribeError);
      return;
    }
    setInput(text);
    setPendingTranscript(text);
    inputRef.current?.focus({ preventScroll: true });
  }, [flushVoiceChunk, transcribeChunk, ui.micEmpty, ui.transcribeError]);

  const startVoiceInput = useCallback(async () => {
    if (audioCtxRef.current || isTranscribing) return;
    partialTextRef.current = "";
    pcmAllRef.current = [];
    pendingSamplesRef.current = [];
    pendingCountRef.current = 0;
    flushChainRef.current = Promise.resolve();
    voiceUsedRef.current = true;
    setPendingTranscript(null);
    setMicError("");
    setInput("");

    let stream: MediaStream;
    let request: Promise<MediaStream> | null = null;
    let timer: number | undefined;
    setIsRequestingMic(true);
    try {
      request = navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      stream = await Promise.race([
        request,
        new Promise<never>((_resolve, reject) => {
          timer = window.setTimeout(
            () => reject(new DOMException("Mic timeout", "TimeoutError")),
            12000,
          );
        }),
      ]);
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      if (name === "TimeoutError" && request) {
        // Si el permiso se concede tarde, cerramos el micro igualmente.
        void request
          .then((late) => late.getTracks().forEach((track) => track.stop()))
          .catch(() => undefined);
      }
      const message =
        name === "NotAllowedError" || name === "SecurityError"
          ? `${ui.micDenied} ${ui.micHelp}`
          : name === "TimeoutError"
            ? ui.micTimeout
            : name === "NotFoundError" || name === "OverconstrainedError"
              ? ui.micNotFound
              : name === "NotReadableError"
                ? ui.micBusy
                : `${t("voiceNotSupported")}${name ? ` (${name})` : ""}`;
      setMicError(message);
      return;
    } finally {
      if (timer) window.clearTimeout(timer);
      setIsRequestingMic(false);
    }

    streamRef.current = stream;
    let context: AudioContext;
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioContextClass) throw new Error("NO_AUDIO_CONTEXT");
      context = new AudioContextClass({ sampleRate: VOICE_RATE });
    } catch {
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setMicError(t("voiceNotSupported"));
      return;
    }

    try {
      await context.resume();
    } catch {
      /* algunos navegadores ya esta activo */
    }
    voiceRateRef.current =
      context.sampleRate > 0 ? Math.min(context.sampleRate, VOICE_RATE) : VOICE_RATE;

    const source = context.createMediaStreamSource(stream);
    const processor = context.createScriptProcessor(4096, 1, 1);
    const mute = context.createGain();
    mute.gain.value = 0;

    processor.onaudioprocess = (event) => {
      const input = event.inputBuffer.getChannelData(0);
      const pcm = toPcm16(input, context.sampleRate, voiceRateRef.current);
      pcmAllRef.current.push(pcm);
      pendingSamplesRef.current.push(pcm);
      pendingCountRef.current += pcm.length;
      if (pendingCountRef.current >= voiceRateRef.current * VOICE_CHUNK_SECONDS) {
        flushVoiceChunk();
      }
    };

    source.connect(processor);
    processor.connect(mute);
    mute.connect(context.destination);

    audioCtxRef.current = context;
    processorRef.current = processor;
    setIsListening(true);
  }, [
    t,
    isTranscribing,
    flushVoiceChunk,
    ui.micDenied,
    ui.micHelp,
    ui.micNotFound,
    ui.micBusy,
    ui.micTimeout,
  ]);

  const acceptTranscript = useCallback(() => {
    setPendingTranscript(null);
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  const discardTranscript = useCallback(() => {
    setPendingTranscript(null);
    setInput("");
    setMicError("");
    voiceUsedRef.current = false;
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("pepa:pos");
      if (!raw) return;
      const parsed = JSON.parse(raw) as { x?: number; y?: number };
      if (typeof parsed.x === "number" && typeof parsed.y === "number") {
        setDragPos({ x: parsed.x, y: parsed.y });
      }
    } catch {
      /* posicion no disponible */
    }
  }, []);

  const handleDragStart = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const target = event.target as HTMLElement | null;
    if (target && target.closest("button, a, input, textarea")) return;
    if (window.matchMedia("(max-width: 520px)").matches) return;
    const panel = panelRef.current;
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    dragRef.current = {
      dx: event.clientX - rect.left,
      dy: event.clientY - rect.top,
      width: rect.width,
      height: rect.height,
    };
    setDragging(true);
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* captura no disponible */
    }
  }, []);

  const handleDragMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (!dragRef.current) return;
    const { dx, dy, width, height } = dragRef.current;
    const maxX = Math.max(8, window.innerWidth - width - 8);
    const maxY = Math.max(8, window.innerHeight - height - 8);
    const x = Math.min(Math.max(8, event.clientX - dx), maxX);
    const y = Math.min(Math.max(8, event.clientY - dy), maxY);
    setDragPos({ x, y });
  }, []);

  const handleDragEnd = useCallback(() => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setDragging(false);
    setDragPos((current) => {
      if (current) {
        try {
          window.localStorage.setItem("pepa:pos", JSON.stringify(current));
        } catch {
          /* almacenamiento no disponible */
        }
      }
      return current;
    });
  }, []);

  const handleCapability = (query: string) => {
    if (query === "__handoff__") {
      void requestHandoff();
      return;
    }
    void sendMessage(query);
  };

  const lastIndex = messages.length - 1;
  const announcedReply = [...messages]
    .reverse()
    .find(
      (message) =>
        message.role === "assistant" &&
        !message.streaming &&
        message.content.trim().length > 0,
    );
  const showHandoffChip =
    !handoff &&
    !isGenerating &&
    (uncertaintyCount >= 2 ||
      messages.filter((message) => message.role === "user").length >= 2);

  return (
    <div className={styles.widget} data-kage-pepa data-kage-pepa-open={isOpen || undefined}>
      {isOpen && (
        <section
          id={panelId}
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-labelledby={`${panelId}-title`}
          className={styles.panel}
          data-minimized={isMinimized}
          data-dragged={dragPos ? "true" : undefined}
          data-dragging={dragging || undefined}
          data-fx="assistant-panel"
          style={
            dragPos
              ? ({
                  "--pepa-x": `${dragPos.x}px`,
                  "--pepa-y": `${dragPos.y}px`,
                } as CSSProperties)
              : undefined
          }
        >
          <header
            className={styles.header}
            onPointerDown={handleDragStart}
            onPointerMove={handleDragMove}
            onPointerUp={handleDragEnd}
            onPointerCancel={handleDragEnd}
          >
            <div className={styles.identity}>
              <span className={styles.brandMark} aria-hidden="true">
                <BrandMark />
              </span>
              <div>
                <h2 id={`${panelId}-title`}>{assistantName}</h2>
                {!isMinimized && (
                  <p>
                    {authToken ? (
                      <span className={styles.authTag}>
                        <ShieldCheck aria-hidden="true" /> {ui.signedIn}
                      </span>
                    ) : (
                      copy.subtitle
                    )}
                  </p>
                )}
              </div>
            </div>
            <div className={styles.tools}>
              {authToken && !isMinimized && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={signOut}
                  aria-label={ui.logout}
                  title={ui.logout}
                >
                  <KeyRound aria-hidden="true" />
                </Button>
              )}
              {!isMinimized && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => void requestHandoff()}
                  disabled={isHandoffLoading}
                  aria-label={ui.handoff}
                  title={ui.handoff}
                >
                  <Headset aria-hidden="true" />
                </Button>
              )}
              {!isMinimized && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowMemory((value) => !value)}
                  aria-label={ui.memory}
                  title={ui.memory}
                  aria-expanded={showMemory}
                  aria-pressed={memoryEnabled}
                >
                  <ShieldCheck aria-hidden="true" />
                </Button>
              )}
              {!isMinimized && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={clearChat}
                  aria-label={copy.clear}
                  title={copy.clear}
                  className={styles.clearTool}
                >
                  <RefreshCw aria-hidden="true" />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsMinimized((value) => !value)}
                aria-label={isMinimized ? copy.expand : copy.minimize}
                title={isMinimized ? copy.expand : copy.minimize}
              >
                {isMinimized ? <Maximize2 aria-hidden="true" /> : <Minimize2 aria-hidden="true" />}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={closePanel}
                aria-label={copy.close}
                title={copy.close}
              >
                <X aria-hidden="true" />
              </Button>
            </div>
          </header>

          {!isMinimized && (
            <>
              {showMemory && (
                <section className={styles.memoryPanel} aria-label={ui.memoryTitle}>
                  <div>
                    <p className={styles.kicker}>{ui.memoryTitle}</p>
                    <p>{ui.memoryCount(messages.length)}</p>
                    <p className={styles.memoryHint}>{ui.memoryHint}</p>
                  </div>
                  <div className={styles.memoryActions}>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={memoryEnabled}
                      className={styles.switch}
                      onClick={toggleMemory}
                    >
                      <span aria-hidden="true" data-on={memoryEnabled} />
                      {ui.memoryOn}
                    </button>
                    <button type="button" className={styles.memoryDelete} onClick={deleteMemory}>
                      <Trash2 aria-hidden="true" /> {ui.deleteMemory}
                    </button>
                  </div>
                </section>
              )}

              <p className={styles.srOnly} role="status" aria-live="polite">
                {announcedReply
                  ? `${assistantName}: ${announcedReply.content.slice(0, 600)}`
                  : ""}
              </p>

              <div
                ref={messagesContainerRef}
                className={styles.messages}
                role="log"
                aria-label={copy.history}
                aria-live="off"
                aria-busy={isGenerating}
                onScroll={handleMessagesScroll}
              >
                {messages.length === 0 && (
                  <div className={styles.welcome}>
                    <p className={styles.kicker}>{greeting}</p>
                    <h3>{copy.welcome}</h3>
                    <p>{copy.intro}</p>
                    <p className={styles.kicker}>{ui.capabilities}</p>
                    <div className={styles.capabilities}>
                      {ui.cards.map((card) => {
                        const Icon = card.icon;
                        return (
                          <button
                            type="button"
                            key={card.title}
                            onClick={() => handleCapability(card.query)}
                          >
                            <Icon aria-hidden="true" />
                            <span>{card.title}</span>
                            <ArrowUpRight aria-hidden="true" />
                          </button>
                        );
                      })}
                    </div>
                    <div className={styles.questions}>
                      {copy.questions.map((question) => (
                        <button
                          type="button"
                          key={question}
                          onClick={() => {
                            setInput(question);
                            inputRef.current?.focus({ preventScroll: true });
                          }}
                        >
                          {question}
                          <ArrowUpRight aria-hidden="true" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((message, index) => (
                  <article
                    key={message.id}
                    className={styles.message}
                    data-role={message.role}
                    data-error={message.isError || undefined}
                    role={message.isError ? "alert" : undefined}
                  >
                    <p className={styles.speaker}>
                      {message.role === "user" ? copy.you : assistantName}
                    </p>
                    <p className={styles.messageText}>
                      <MarkdownText content={message.content} />
                      {message.streaming && <span className={styles.caret} aria-hidden="true" />}
                    </p>

                    {message.isError && (
                      <div className={styles.errorCard}>
                        <AlertTriangle aria-hidden="true" />
                        <button type="button" onClick={regenerate}>
                          {ui.retry}
                        </button>
                      </div>
                    )}

                    {message.role === "assistant" && message.redacted && (
                      <p className={styles.redactedNote}>
                        <ShieldCheck aria-hidden="true" /> {ui.redacted}
                      </p>
                    )}

                    {message.role === "assistant" && message.attachments && message.attachments.length > 0 && (
                      <div className={styles.attachments} role="group" aria-label={ui.downloads}>
                        {message.attachments.map((attachment, attachmentIndex) => (
                          <a
                            key={`${attachment.url}-${attachmentIndex}`}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                          >
                            <FileText aria-hidden="true" />
                            {attachment.label}
                          </a>
                        ))}
                      </div>
                    )}

                    {message.role === "assistant" && message.sources && message.sources.length > 0 && (
                      <div className={styles.sources} role="group" aria-label={ui.sources}>
                        {message.sources.map((source, sourceIndex) => (
                          <a key={`${source.url}-${sourceIndex}`} href={source.url}>
                            [{sourceIndex + 1}] {source.label}
                          </a>
                        ))}
                      </div>
                    )}

                    {message.role === "assistant" && message.send && (
                      <div className={styles.delivery} data-ok={message.send.success ? "true" : "false"}>
                        {message.send.success ? (
                          <CheckCircle2 aria-hidden="true" />
                        ) : (
                          <AlertTriangle aria-hidden="true" />
                        )}
                        <span>
                          {deliveryText(message.send, locale)}
                        </span>
                        {message.send.fallbackUrl && (
                          <a
                            href={message.send.fallbackUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {ui.whatsapp}
                          </a>
                        )}
                      </div>
                    )}

                    {message.role === "assistant" &&
                      message.suggestions &&
                      message.suggestions.length > 0 &&
                      index === lastIndex &&
                      !message.streaming && (
                        <div className={styles.suggestions}>
                          {message.suggestions.map((suggestion) => (
                            <button
                              type="button"
                              key={suggestion}
                              onClick={() => void sendMessage(suggestion)}
                            >
                              {suggestion}
                              <ArrowUpRight aria-hidden="true" />
                            </button>
                          ))}
                        </div>
                      )}

                    {message.role === "assistant" && !message.streaming && !message.isError && (
                      <div className={styles.messageTools}>
                        <button
                          type="button"
                          onClick={regenerate}
                          aria-label={ui.regenerate}
                          className={styles.iconButton}
                        >
                          <RefreshCw aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void copyMessage(message)}
                          aria-label={copiedId === message.id ? ui.copied : ui.copy}
                          className={styles.iconButton}
                          data-copied={copiedId === message.id || undefined}
                        >
                          {copiedId === message.id ? (
                            <Check aria-hidden="true" />
                          ) : (
                            <Copy aria-hidden="true" />
                          )}
                        </button>
                        {speech && speech.id === message.id ? (
                          <>
                            <button
                              type="button"
                              onClick={() => toggleSpeech(message)}
                              aria-label={
                                speech.status === "loading"
                                  ? ui.preparing
                                  : speech.status === "playing"
                                    ? ui.pause
                                    : ui.resume
                              }
                              className={styles.iconButton}
                              aria-pressed="true"
                              disabled={speech.status === "loading"}
                            >
                              {speech.status === "loading" ? (
                                <Loader2 aria-hidden="true" className={styles.spin} />
                              ) : speech.status === "playing" ? (
                                <Pause aria-hidden="true" />
                              ) : (
                                <Play aria-hidden="true" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={stopSpeech}
                              aria-label={ui.stopListening}
                              className={styles.iconButton}
                            >
                              <Square aria-hidden="true" />
                            </button>
                            <span
                              className={styles.equalizer}
                              data-playing={speech.status === "playing" || undefined}
                              aria-hidden="true"
                            >
                              <i />
                              <i />
                              <i />
                            </span>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => toggleSpeech(message)}
                            aria-label={ui.listen}
                            className={styles.iconButton}
                          >
                            <Headphones aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    )}
                  </article>
                ))}

                {isGenerating && messages[lastIndex]?.content === "" && (
                  <p className={styles.loading} role="status">
                    <span className={styles.dots} aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </span>
                    {copy.loading}
                  </p>
                )}

                {showHandoffChip && (
                  <button
                    type="button"
                    className={styles.handoffChip}
                    onClick={() => void requestHandoff()}
                    disabled={isHandoffLoading}
                  >
                    <Headset aria-hidden="true" />
                    {isHandoffLoading ? ui.handoffSend : ui.handoff}
                  </button>
                )}

                {handoff && (
                  <div className={styles.handoffCard} role="status">
                    <CheckCircle2 aria-hidden="true" />
                    <div>
                      <p className={styles.kicker}>{ui.handoffDone}</p>
                      <p>
                        {ui.handoffEta} <strong>{handoff.eta}</strong>
                      </p>
                      <p className={styles.handoffRef}>#{handoff.reference}</p>
                      {handoff.notified === false && (
                        <p className={styles.handoffNote}>
                          {ui.handoffFallback}{" "}
                          <a href="tel:+34639778656">639 77 86 56</a>
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {handoffError && (
                  <p className={styles.micError} role="alert">
                    {handoffError}
                  </p>
                )}

                {showLogin && (
                  <form className={styles.loginCard} onSubmit={submitLogin} aria-label={ui.loginTitle}>
                    <p className={styles.kicker}>{ui.loginTitle}</p>
                    <p className={styles.loginHint}>{ui.loginText}</p>
                    <label htmlFor={`${panelId}-code`}>{ui.code}</label>
                    <input
                      ref={codeRef}
                      id={`${panelId}-code`}
                      value={loginCode}
                      onChange={(event) => setLoginCode(event.target.value)}
                      inputMode="numeric"
                      autoComplete="username"
                      maxLength={10}
                      required
                    />
                    <label htmlFor={`${panelId}-password`}>{ui.password}</label>
                    <input
                      id={`${panelId}-password`}
                      type="password"
                      value={loginPassword}
                      onChange={(event) => setLoginPassword(event.target.value)}
                      autoComplete="current-password"
                      required
                    />
                    {loginError && <p className={styles.loginError}>{loginError}</p>}
                    <button type="submit" disabled={isLoggingIn}>
                      {isLoggingIn ? ui.loggingIn : ui.enter}
                    </button>
                  </form>
                )}
              </div>

              <footer className={styles.composer}>
                {micError && (
                  <p className={styles.micError} role="alert">
                    {micError}{" "}
                    <a
                      href="https://support.google.com/chrome/answer/2693767"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {ui.micHelp}
                    </a>
                  </p>
                )}
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    sendMessage();
                  }}
                >
                  <label className={styles.srOnly} htmlFor={`${panelId}-input`}>
                    {copy.write}
                  </label>
                  <textarea
                    id={`${panelId}-input`}
                    ref={inputRef}
                    className={styles.textarea}
                    value={input}
                    rows={1}
                    data-listening={isListening || isTranscribing || undefined}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder={
                      isListening || isTranscribing
                        ? t("voiceListening")
                        : t("placeholder")
                    }
                    aria-describedby={`${panelId}-note`}
                  />
                  <button
                    type="button"
                    className={styles.control}
                    data-listening={isListening || isTranscribing || undefined}
                    onClick={isListening ? stopVoiceInput : startVoiceInput}
                    disabled={isGenerating || isTranscribing || isRequestingMic}
                    aria-label={t("voiceInput")}
                    title={t("voiceInput")}
                    data-tooltip={t("voiceInput")}
                    aria-pressed={isListening}
                    aria-busy={isTranscribing || isRequestingMic || undefined}
                  >
                    {isRequestingMic ? (
                      <Loader2 aria-hidden="true" className={styles.spin} />
                    ) : isListening ? (
                      <MicOff aria-hidden="true" />
                    ) : (
                      <Mic aria-hidden="true" />
                    )}
                    {isListening && <span className={styles.recDot} aria-hidden="true" />}
                  </button>
                  {isGenerating ? (
                    <button
                      type="button"
                      className={styles.control}
                      onClick={stopGeneration}
                      aria-label={ui.stop}
                      title={ui.stop}
                      data-tooltip={ui.stop}
                    >
                      <Square aria-hidden="true" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className={styles.control}
                      disabled={!input.trim()}
                      aria-label={copy.send}
                      title={copy.send}
                      data-tooltip={copy.send}
                    >
                      <Send aria-hidden="true" />
                    </button>
                  )}
                </form>
                {pendingTranscript && (
                  <div className={styles.reviewBar} role="group" aria-label={ui.transcriptReview}>
                    <span>{ui.transcriptReview}</span>
                    <button type="button" onClick={acceptTranscript}>
                      <Check aria-hidden="true" /> {ui.acceptTranscript}
                    </button>
                    <button type="button" onClick={discardTranscript}>
                      <X aria-hidden="true" /> {ui.discardTranscript}
                    </button>
                  </div>
                )}
                <div className={styles.underbar}>
                  <p className={styles.note} id={`${panelId}-note`}>
                    {copy.note}
                  </p>
                </div>
              </footer>
            </>
          )}
        </section>
      )}
      <button
        ref={launcherRef}
        type="button"
        className={styles.launcher}
        data-kage-pepa-launcher
        aria-controls={panelId}
        aria-expanded={isOpen}
        aria-label={isOpen ? copy.close : copy.open}
        onClick={isOpen ? closePanel : openPanel}
      >
        <span>{assistantName}</span>
        {isOpen ? <X aria-hidden="true" /> : <ArrowUpRight aria-hidden="true" />}
      </button>
    </div>
  );
}

export default GlobalChatbot;
