type PepaCopy = {
  subtitle: string;
  open: string;
  close: string;
  clear: string;
  minimize: string;
  expand: string;
  history: string;
  welcome: string;
  intro: string;
  quick: string;
  you: string;
  loading: string;
  write: string;
  send: string;
  note: string;
  questions: string[];
  actions: { label: string; action: string }[];
};
const actions = [
  "Quiero ver mis facturas",
  "Cómo puedo hacer un pedido",
  "Cuál es el teléfono de contacto",
  "Cuál es vuestro horario",
];
const withActions = (labels: string[]) =>
  labels.map((label, index) => ({ label, action: actions[index] }));
const copy: Record<string, PepaCopy> = {
  es: {
    subtitle: "Asistente de Maripepa",
    open: "Abrir Pepa IA",
    close: "Cerrar Pepa IA",
    clear: "Limpiar conversación",
    minimize: "Minimizar conversación",
    expand: "Ampliar conversación",
    history: "Conversación con Pepa IA",
    welcome: "¿En qué te ayudo?",
    intro:
      "Pregúntame sobre productos, facturas o cómo contactar con nuestro equipo.",
    quick: "Por dónde empezar",
    you: "Tú",
    loading: "Preparando respuesta",
    write: "Tu mensaje",
    send: "Enviar mensaje",
    note: "Revisa la información importante con nuestro equipo.",
    questions: [
      "¿Qué productos distribuís?",
      "¿Cómo hago un pedido?",
      "¿Cuál es el horario?",
      "¿Cómo descargo facturas?",
    ],
    actions: withActions(["Facturas", "Pedidos", "Contacto", "Horarios"]),
  },
  en: {
    subtitle: "Maripepa assistant",
    open: "Open Pepa AI",
    close: "Close Pepa AI",
    clear: "Clear conversation",
    minimize: "Minimize conversation",
    expand: "Expand conversation",
    history: "Conversation with Pepa AI",
    welcome: "How can I help?",
    intro: "Ask about products, invoices or how to contact our team.",
    quick: "A place to start",
    you: "You",
    loading: "Preparing a reply",
    write: "Your message",
    send: "Send message",
    note: "Check important information with our team.",
    questions: [
      "Which products do you distribute?",
      "How do I place an order?",
      "What are your opening hours?",
      "How do I download invoices?",
    ],
    actions: withActions(["Invoices", "Orders", "Contact", "Opening hours"]),
  },
  de: {
    subtitle: "Assistent von Maripepa",
    open: "Pepa AI öffnen",
    close: "Pepa AI schließen",
    clear: "Unterhaltung löschen",
    minimize: "Unterhaltung minimieren",
    expand: "Unterhaltung erweitern",
    history: "Unterhaltung mit Pepa AI",
    welcome: "Wie kann ich Ihnen helfen?",
    intro:
      "Fragen Sie nach Produkten, Rechnungen oder dem Kontakt zu unserem Team.",
    quick: "Ein Einstieg",
    you: "Sie",
    loading: "Antwort wird vorbereitet",
    write: "Ihre Nachricht",
    send: "Nachricht senden",
    note: "Bestätigen Sie wichtige Informationen bei unserem Team.",
    questions: [
      "Welche Produkte vertreiben Sie?",
      "Wie kann ich bestellen?",
      "Wann haben Sie geöffnet?",
      "Wie lade ich Rechnungen herunter?",
    ],
    actions: withActions([
      "Rechnungen",
      "Bestellungen",
      "Kontakt",
      "Öffnungszeiten",
    ]),
  },
  it: {
    subtitle: "Assistente di Maripepa",
    open: "Apri Pepa AI",
    close: "Chiudi Pepa AI",
    clear: "Cancella conversazione",
    minimize: "Riduci conversazione",
    expand: "Espandi conversazione",
    history: "Conversazione con Pepa AI",
    welcome: "Come posso aiutarti?",
    intro:
      "Chiedimi dei prodotti, delle fatture o di come contattare il nostro team.",
    quick: "Da dove iniziare",
    you: "Tu",
    loading: "Preparazione della risposta",
    write: "Il tuo messaggio",
    send: "Invia messaggio",
    note: "Verifica le informazioni importanti con il nostro team.",
    questions: [
      "Quali prodotti distribuite?",
      "Come posso ordinare?",
      "Quali sono gli orari?",
      "Come scarico le fatture?",
    ],
    actions: withActions(["Fatture", "Ordini", "Contatti", "Orari"]),
  },
  zh: {
    subtitle: "Maripepa 助手",
    open: "打开 Pepa AI",
    close: "关闭 Pepa AI",
    clear: "清除对话",
    minimize: "最小化对话",
    expand: "展开对话",
    history: "与 Pepa AI 的对话",
    welcome: "有什么可以帮您？",
    intro: "您可以询问产品、发票或如何联系我们的团队。",
    quick: "从这里开始",
    you: "您",
    loading: "正在准备回复",
    write: "您的消息",
    send: "发送消息",
    note: "重要信息请向我们的团队确认。",
    questions: [
      "你们配送哪些产品？",
      "如何下单？",
      "营业时间是什么？",
      "如何下载发票？",
    ],
    actions: withActions(["发票", "订单", "联系", "营业时间"]),
  },
};
export function getPepaCopy(locale: string): PepaCopy {
  return copy[locale] ?? copy.es;
}
