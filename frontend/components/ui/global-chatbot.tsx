'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  X,
  Send,
  RefreshCw,
  Sparkles,
  Minimize2,
  Maximize2,
  User,
  Phone,
  Mail,
  Clock,
  Package,
  FileText,
  MapPin,
  TrendingUp,
  ChevronRight,
  Zap,
  Mic,
  MicOff
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import apiClient from '@/lib/apiClient'; // 🔐 Cliente seguro para auth


interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  isStreaming?: boolean;
  suggestions?: string[];
  attachments?: { label: string; url: string }[];
}

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  action: string;
  color: string;
}

// Componente para renderizar Markdown simple (negrita, cursiva, enlaces)
const MarkdownText = ({ content }: { content: string }) => {
  // Procesar markdown simple
  const parseMarkdown = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    // Regex para negrita **texto**, cursiva *texto*, y enlaces [texto](url)
    const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(\[(.+?)\]\((.+?)\))/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Añadir texto antes del match
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      if (match[1]) {
        // Negrita **texto**
        parts.push(<strong key={match.index} className="font-bold text-emerald-700">{match[2]}</strong>);
      } else if (match[3]) {
        // Cursiva *texto*
        parts.push(<em key={match.index} className="italic">{match[4]}</em>);
      } else if (match[5]) {
        // Enlace [texto](url)
        parts.push(
          <a
            key={match.index}
            href={match[7]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 underline hover:text-emerald-800 transition-colors"
          >
            {match[6]}
          </a>
        );
      }

      lastIndex = match.index + match[0].length;
    }

    // Añadir texto restante
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : [text];
  };

  // Dividir por líneas para preservar saltos de línea
  const lines = content.split('\n');

  return (
    <>
      {lines.map((line, lineIndex) => (
        <span key={lineIndex}>
          {parseMarkdown(line)}
          {lineIndex < lines.length - 1 && <br />}
        </span>
      ))}
    </>
  );
};

// Hook para efecto de streaming de texto basado en tiempo (no afectado por cambio de pestaña)
const useStreamingText = (
  fullText: string,
  isStreaming: boolean,
  onComplete?: () => void
) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const durationRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isStreaming) {
      setDisplayedText(fullText);
      setIsComplete(true);
      return;
    }

    setDisplayedText('');
    setIsComplete(false);
    startTimeRef.current = Date.now();

    // Calcular duración estimada: 20ms por caracter aprox, máx 3 seg
    durationRef.current = Math.min(fullText.length * 20, 3000);

    const animate = () => {
      const now = Date.now();
      const elapsed = now - (startTimeRef.current || now);
      const progress = Math.min(elapsed / durationRef.current, 1);

      const charIndex = Math.floor(progress * fullText.length);
      setDisplayedText(fullText.slice(0, charIndex));

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayedText(fullText);
        setIsComplete(true);
        onComplete?.();
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [fullText, isStreaming, onComplete]);

  return { displayedText, isComplete };
};

// Componente para mensaje con streaming
const StreamingMessage = ({
  content,
  isStreaming,
  onStreamComplete
}: {
  content: string;
  isStreaming: boolean;
  onStreamComplete?: () => void;
}) => {
  const { displayedText, isComplete } = useStreamingText(content, isStreaming, onStreamComplete);

  return (
    <div className="relative">
      <p className="text-sm whitespace-pre-wrap leading-relaxed">
        <MarkdownText content={displayedText} />
        {/* Cursor parpadeante mientras escribe */}
        {isStreaming && !isComplete && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="inline-block w-0.5 h-4 ml-0.5 bg-emerald-500 align-text-bottom"
          />
        )}
      </p>
    </div>
  );
};

// Estilos para hacer scroll
const scrollToBottom = (element: HTMLDivElement | null) => {
  if (element) {
    element.scrollTop = element.scrollHeight;
  }
};

// Hook para obtener saludo según hora del día
const useTimeBasedGreeting = () => {
  return useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return { greeting: 'Buenos días', period: 'mañana' };
    if (hour >= 12 && hour < 20) return { greeting: 'Buenas tardes', period: 'tarde' };
    return { greeting: 'Buenas noches', period: 'noche' };
  }, []);
};

// Componente de acciones rápidas
const QuickActions = ({ onAction }: { onAction: (action: string) => void }) => {
  const actions: QuickAction[] = [
    { icon: <FileText className="w-4 h-4" />, label: 'Mis facturas', action: 'Quiero ver mis facturas', color: 'from-blue-500 to-blue-600' },
    { icon: <Package className="w-4 h-4" />, label: 'Hacer pedido', action: 'Cómo puedo hacer un pedido', color: 'from-emerald-500 to-teal-600' },
    { icon: <Phone className="w-4 h-4" />, label: 'Contacto', action: 'Cuál es el teléfono de contacto', color: 'from-purple-500 to-purple-600' },
    { icon: <Clock className="w-4 h-4" />, label: 'Horarios', action: 'Cuál es vuestro horario', color: 'from-amber-500 to-orange-500' },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 mt-3">
      {actions.map((action, index) => (
        <motion.button
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onAction(action.action)}
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r ${action.color} text-white text-xs font-medium shadow-lg hover:shadow-xl transition-all`}
        >
          {action.icon}
          <span>{action.label}</span>
        </motion.button>
      ))}
    </div>
  );
};

// Componente de sugerencias contextuales
const ContextualSuggestions = ({
  suggestions,
  onSelect
}: {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 space-y-1.5"
    >
      <p className="text-xs text-gray-500 flex items-center gap-1">
        <Zap className="w-3 h-3" />
        Quizás te interese:
      </p>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((suggestion, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(suggestion)}
            className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 text-xs text-gray-700 hover:border-emerald-400 hover:text-emerald-700 hover:from-emerald-50 hover:to-teal-50 transition-all flex items-center gap-1"
          >
            <ChevronRight className="w-3 h-3" />
            {suggestion}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export function GlobalChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentlyStreamingId, setCurrentlyStreamingId] = useState<number | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // i18n hooks
  const t = useTranslations('chatbot');
  const locale = useLocale();

  // Greeting based on time and locale
  const { greeting } = useMemo(() => {
    const hour = new Date().getHours();
    if (locale === 'en') {
      if (hour >= 6 && hour < 12) return { greeting: t('greetingMorning') };
      if (hour >= 12 && hour < 20) return { greeting: t('greetingAfternoon') };
      return { greeting: t('greetingEvening') };
    }
    if (hour >= 6 && hour < 12) return { greeting: t('greetingMorning') };
    if (hour >= 12 && hour < 20) return { greeting: t('greetingAfternoon') };
    return { greeting: t('greetingEvening') };
  }, [locale, t]);


  // Auto-scroll cuando hay nuevos mensajes o durante streaming
  useEffect(() => {
    scrollToBottom(messagesContainerRef.current);
  }, [messages, currentlyStreamingId]);

  // Focus en el input cuando se abre
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const handleStreamComplete = useCallback(() => {
    setCurrentlyStreamingId(null);
  }, []);

  // Función para generar sugerencias basadas en el contexto
  const generateSuggestions = useCallback((response: string): string[] => {
    const lowerResponse = response.toLowerCase();

    if (lowerResponse.includes('factura')) {
      return ['Ver mi última factura', 'Descargar facturas en PDF', 'Problema con una factura'];
    }
    if (lowerResponse.includes('pedido') || lowerResponse.includes('comprar')) {
      return ['Ver catálogo de productos', 'Tiempo de entrega', 'Formas de pago'];
    }
    if (lowerResponse.includes('producto') || lowerResponse.includes('catálogo')) {
      return ['Productos congelados', 'Productos refrigerados', 'Marcas disponibles'];
    }
    if (lowerResponse.includes('contacto') || lowerResponse.includes('teléfono')) {
      return ['Horario de atención', 'Delegación en Lorca', 'Email para pedidos'];
    }
    if (lowerResponse.includes('entrega') || lowerResponse.includes('reparto')) {
      return ['Zona de cobertura', 'Modificar una entrega', 'Cadena de frío'];
    }

    return [];
  }, []);

  const sendMessage = async (messageText?: string) => {
    const userMessage = (messageText || input).trim();
    if (!userMessage || isLoading) return;

    setInput('');
    setShowQuickActions(false);
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: new Date() }]);
    setIsLoading(true);

    try {
      // Usar apiClient para asegurar envío de Cookies HttpOnly y CSRF token
      // Esto permite que el backend reconozca al usuario autenticado (req.user)
      const response = await apiClient.post('/api/chatbot', {
        message: userMessage,
        history: messages.slice(-6),
        conversationId: undefined, // Let backend generate or manage sessions
        locale: locale // Send user's language for bilingual responses
      });


      const data = response.data;

      if (data.success && data.response) {
        const newMessageIndex = messages.length + 1; // +1 por el mensaje del usuario
        const suggestions = generateSuggestions(data.response);
        // Detectar enlaces de descarga en la respuesta
        const linkRegex = /(\/api\/compartir\/descargar\/[\w-_]+)/i;
        const match = data.response.match(linkRegex);
        const attachments = match ? [{ label: 'Descargar factura', url: match[1] }] : [];
        setCurrentlyStreamingId(newMessageIndex);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          isStreaming: true,
          suggestions,
          // @ts-ignore - Attachments para descargar
          attachments
        }]);
      } else {
        throw new Error('Respuesta inválida');
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: t('connectionError'),
        timestamp: new Date(),
        isStreaming: false
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setInput('');
    setCurrentlyStreamingId(null);
    setShowQuickActions(true);
  };

  // Voice input functions
  const startVoiceInput = useCallback(() => {
    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Voice not supported
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: t('voiceNotSupported'),
        timestamp: new Date(),
        isStreaming: false
      }]);
      return;
    }

    try {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = locale === 'en' ? 'en-US' : 'es-ES';
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        inputRef.current?.focus();
      };

      recognitionRef.current.start();
    } catch {
      setIsListening(false);
    }
  }, [locale, t]);

  const stopVoiceInput = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const handleQuickAction = useCallback((action: string) => {
    sendMessage(action);
  }, []);

  const handleSuggestionSelect = useCallback((suggestion: string) => {
    sendMessage(suggestion);
  }, []);


  const quickQuestions = [
    '¿Qué productos distribuís?',
    '¿Cómo hago un pedido?',
    '¿Cuál es el horario?',
    '¿Cómo descargo facturas?',
  ];

  return (
    <>
      {/* Chatbot Container */}
      <motion.div
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.3, type: "spring" }}
      >
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`mb-4 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col ${isMinimized
                ? 'w-64 sm:w-72 h-14'
                : 'w-[calc(100vw-32px)] sm:w-[380px] md:w-[400px] h-[calc(100vh-120px)] sm:h-[500px] md:h-[550px] max-h-[600px]'
                }`}
            >
              {/* Header */}
              <div
                className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-4 py-3 flex items-center justify-between cursor-pointer"
                onClick={() => isMinimized && setIsMinimized(false)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                      Pepa
                      <span className="text-[10px] font-normal bg-white/20 px-1.5 py-0.5 rounded-full">IA</span>
                    </h3>
                    {!isMinimized && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-[11px] text-white/80">Asistente Virtual</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {!isMinimized && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); clearChat(); }}
                        className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10"
                        title="Limpiar chat"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); setIsMinimized(true); }}
                        className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10"
                        title="Minimizar"
                      >
                        <Minimize2 className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                  {isMinimized && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); setIsMinimized(false); }}
                      className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10"
                      title="Maximizar"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                    className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {!isMinimized && (
                <>
                  {/* Messages Area */}
                  <div
                    ref={messagesContainerRef}
                    className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white"
                  >
                    {messages.length === 0 && (
                      <div className="text-center py-4">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", duration: 0.5 }}
                          className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center shadow-lg"
                        >
                          <Bot className="w-8 h-8 text-emerald-600" />
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <h4 className="font-bold text-gray-800 mb-1">{greeting}, soy Pepa</h4>
                          <p className="text-sm text-gray-500 mb-4 px-4">
                            Tu asistente virtual de Granja Mari Pepa. Estoy aquí para ayudarte con productos, pedidos, facturas o cualquier duda.
                          </p>
                        </motion.div>

                        {showQuickActions && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="px-2"
                          >
                            <p className="text-xs text-gray-400 mb-2 flex items-center justify-center gap-1">
                              <Zap className="w-3 h-3" />
                              Acciones rápidas
                            </p>
                            <QuickActions onAction={handleQuickAction} />

                            <div className="mt-4 pt-3 border-t border-gray-100">
                              <p className="text-xs text-gray-400 mb-2">O pregúntame directamente:</p>
                              <div className="space-y-1.5">
                                {quickQuestions.map((q, i) => (
                                  <motion.button
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 + i * 0.05 }}
                                    whileHover={{ scale: 1.02, x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                      setInput(q);
                                      inputRef.current?.focus();
                                    }}
                                    className="block w-full text-left px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm text-gray-700 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 transition-all shadow-sm"
                                  >
                                    {q}
                                  </motion.button>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    )}

                    {messages.map((msg, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex items-end gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                          {/* Avatar */}
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${msg.role === 'user'
                            ? 'bg-blue-600'
                            : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                            }`}>
                            {msg.role === 'user'
                              ? <User className="w-3.5 h-3.5 text-white" />
                              : <Bot className="w-3.5 h-3.5 text-white" />
                            }
                          </div>

                          {/* Message Bubble */}
                          <div className="flex flex-col">
                            <div className={`rounded-2xl px-3.5 py-2.5 ${msg.role === 'user'
                              ? 'bg-blue-600 text-white rounded-br-md'
                              : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm'
                              }`}>
                              {msg.role === 'assistant' ? (
                                <StreamingMessage
                                  content={msg.content}
                                  isStreaming={Boolean(msg.isStreaming) && currentlyStreamingId === index}
                                  onStreamComplete={handleStreamComplete}
                                />
                              ) : (
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                              )}
                            </div>

                            {/* Sugerencias contextuales para mensajes del asistente */}
                            {msg.role === 'assistant' && msg.attachments && msg.attachments.length > 0 && (
                              <div className="mt-2 flex gap-2">
                                {msg.attachments.map((att: any, aidx: number) => (
                                  <button
                                    key={aidx}
                                    onClick={async (e) => {
                                      e.preventDefault();
                                      try {
                                        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                                        // Abrir nueva pestaña para descargar
                                        const fullUrl = `${API_URL}${att.url}`;
                                        window.open(fullUrl, '_blank', 'noopener');
                                      } catch (err) {
                                        console.error('Error descargando archivo', err);
                                      }
                                    }}
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-medium hover:bg-emerald-100 transition-all"
                                  >
                                    <FileText className="w-4 h-4" />
                                    {att.label}
                                  </button>
                                ))}
                              </div>
                            )}

                            {msg.role === 'assistant' &&
                              msg.suggestions &&
                              msg.suggestions.length > 0 &&
                              index === messages.length - 1 &&
                              currentlyStreamingId === null && (
                                <ContextualSuggestions
                                  suggestions={msg.suggestions}
                                  onSelect={handleSuggestionSelect}
                                />
                              )}
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                      >
                        <div className="flex items-end gap-2">
                          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                            <Bot className="w-3.5 h-3.5 text-white" />
                          </div>
                          <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-gray-500 mr-2">Pensando</span>
                              <div className="flex gap-1">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Area */}
                  <div className="p-3 border-t border-gray-100 bg-white">
                    <form
                      onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                      className="flex gap-2"
                    >
                      <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isListening ? t('voiceListening') : t('placeholder')}
                        className={`flex-1 h-10 rounded-xl border-gray-200 focus:border-emerald-400 focus:ring-emerald-100 text-sm ${isListening ? 'border-red-400 bg-red-50' : ''}`}
                        disabled={isLoading || currentlyStreamingId !== null}
                      />
                      {/* Voice Input Button */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={isListening ? stopVoiceInput : startVoiceInput}
                        disabled={isLoading || currentlyStreamingId !== null}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-lg ${isListening
                            ? 'bg-red-500 text-white animate-pulse hover:bg-red-600'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                          }`}
                        aria-label={t('voiceInput')}
                      >
                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        disabled={!input.trim() || isLoading || currentlyStreamingId !== null}
                        className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
                      >
                        <Send className="w-4 h-4" />
                      </motion.button>
                    </form>
                    <div className="flex items-center justify-between mt-2 px-1">
                      <p className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {t('poweredBy')}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {t('since')}
                      </p>
                    </div>
                  </div>

                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white transition-all relative overflow-hidden group ${isOpen
            ? 'bg-gray-700 hover:bg-gray-800'
            : 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 hover:shadow-emerald-500/40'
            }`}
        >
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="w-6 h-6 relative z-10" />
              </motion.div>
            ) : (
              <motion.div
                key="bot"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Bot className="w-6 h-6 relative z-10" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Notification dot */}
          {!isOpen && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute top-0 right-0 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white shadow-lg"
            />
          )}
        </motion.button>
      </motion.div>
    </>
  );
}

export default GlobalChatbot;
