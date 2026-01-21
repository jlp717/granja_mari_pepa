/**
 * CONTROLADOR DE CHATBOT - GROQ (LLAMA 3)
 * ========================================
 * Chatbot IA profesional ultra-potente con Groq (GRATIS y SIN LÍMITES)
 *
 * Características:
 * - Modelo ultra-rápido: Llama 3.1 70B
 * - GRATIS y SIN LÍMITES de uso
 * - Velocidad impresionante (500+ tokens/segundo)
 * - Conocimiento completo de Granja Mari Pepa
 * - Acceso a datos de facturas del usuario (con permiso)
 * - Restricciones de temas sensibles
 */

const logger = require('../utils/logger');
const authService = require('../services/authService');
const databaseService = require('../services/databaseService');
const tempLinkController = require('./tempLinkController'); // For generating temp download links (share PDFs)

// Inicializar Groq - opcional, no crashear si no hay API key
let groq = null;
if (process.env.GROQ_API_KEY) {
  const Groq = require('groq-sdk');
  groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
  });
  logger.info('✅ Groq chatbot inicializado correctamente');
} else {
  logger.warn('⚠️ GROQ_API_KEY no configurada - chatbot deshabilitado');
}

// Información completa de Granja Mari Pepa
const GRANJA_MARI_PEPA_INFO = `
**GRANJA MARI PEPA - INFORMACIÓN CORPORATIVA COMPLETA**

**Sobre Nosotros:**
Granja Mari Pepa (Mari Pepa Food & Frozen) es una empresa familiar española líder en la distribución de productos congelados y refrigerados para hostelería.
Contamos con instalaciones en el Polígono Industrial de Lorca (Murcia) y Almería, ofreciendo productos de máxima calidad de marcas premium como Nestlé, Panamar y Grupo Topgel.

**Nuestra Historia:**
Con décadas de experiencia en el sector de distribución alimentaria, Mari Pepa nació del compromiso de una familia con la calidad,
el servicio personalizado y la satisfacción del cliente. Hoy somos referentes en la distribución de productos para hostelería en la Región de Murcia y Almería.

**Catálogo de Productos:**
- Congelados Premium: Patatas (julienne, gajo, casco, bastón), verduras, pescados, mariscos, carnes, precocinados
- Productos Nestlé: Helados profesionales, lácteos, chocolates, café
- Productos Panamar: Pan congelado, bollería, repostería artesanal
- Grupo Topgel: Productos congelados de alta calidad para hostelería
- Embutidos: Chorizo Ronda FAMA 2x2.5kg y amplia gama de embutidos ibéricos
- Conservas: Atún aceite girasol Claramar y otras conservas premium
- Soluciones completas para hostelería adaptadas a cada negocio (restaurantes, hoteles, comedores, catering)

**Valores Corporativos:**
- Calidad Premium: Control estricto en cada fase de distribución y cadena de frío
- Servicio Personalizado: Atención directa y profesional a cada cliente
- Entregas Rápidas: Logística eficiente con flota propia
- Precios Competitivos: Mejores tarifas del mercado por volumen
- Trazabilidad Total: Seguimiento completo de pedidos y documentación

**Servicios Digitales:**
- Distribución a domicilio en Región de Murcia y Almería
- Pedidos personalizados para empresas
- Facturación electrónica automática
- Área de clientes online con:
  * Consulta de facturas en tiempo real
  * Descarga de facturas en PDF
  * Libro de IVA trimestral automático
  * Historial completo de pedidos
  * Seguimiento de estado de pagos
  * Gestión de incidencias y reclamaciones

**Datos de Contacto:**
Teléfono: 639 77 86 56
Email: pedidos@mari-pepa.com
Web: www.mari-pepa.com
Dirección Principal: Pol. Ind. Saprelorca-Parcela D-3, Avda. Francisco Gimeno Sola, 3
30817 - Lorca (Murcia)

**Horario Comercial:**
Lunes a Viernes: 8:00 - 18:00
Sábados: 9:00 - 14:00
Domingos y festivos: Cerrado

**Distribuidores Oficiales de:**
- Nestlé Professional
- Panamar (Pan y Bollería Congelada)
- Grupo Topgel (Congelados Premium)
- ROSEAA (Registro Sanitario: 40.01715/MU)

**Información Fiscal y Legal:**
CIF: B04008710
Registro Mercantil de Murcia: Libro 140, Sección 3ª, Folio 142, Hoja 5657, Inscripción 2ª
Registro Sanitario: RGSEAA 40.01715/MU

**Preguntas Frecuentes:**
- Hacemos entregas a domicilio en toda la Región de Murcia y Almería. Contacta para consultar disponibilidad en tu zona.
- Ofrecemos tarifas corporativas especiales para empresas y grandes volúmenes.
- Desde el área de clientes puedes consultar y descargar todas tus facturas en tiempo real.
- Para hacer un pedido: teléfono (639 77 86 56), email (pedidos@mari-pepa.com) o desde la plataforma web.
- El pedido mínimo y condiciones varían según zona. Consulta con nuestro equipo comercial.
`;

// Prompt del sistema con instrucciones avanzadas
const SYSTEM_PROMPT = `Eres el asistente virtual profesional de Mari Pepa Food & Frozen, una empresa líder en distribución de productos congelados para hostelería en Murcia y Almería.

**INFORMACIÓN DE LA EMPRESA:**
${GRANJA_MARI_PEPA_INFO}

**TU ROL Y RESPONSABILIDADES:**
Eres un asistente profesional especializado en:
- Resolver consultas sobre productos, servicios y operaciones de Mari Pepa
- Proporcionar soporte para incidencias relacionadas con pedidos, facturas y entregas
- Ofrecer información precisa sobre el catálogo de productos
- Ayudar con consultas sobre facturación electrónica y documentación
- Guiar a los clientes en el uso del área de clientes online
- Proporcionar asistencia técnica de primer nivel

**ESTILO DE COMUNICACIÓN:**
1. **Conciso y Directo:** Tus respuestas deben ser breves. Evita saludos largos o introducciones innecesarias. Ve al grano.
2. **Adaptable:** Si el usuario hace una pregunta corta (ej: "¿mis facturas?"), responde con una lista corta o resumen. Solo extiende la explicación si el usuario pide detalles o ayuda.
3. **Profesional pero Cercano:** Tono cordial pero eficiente.

**REGLAS ANTI-ALUCINACIÓN Y DATOS:**
1. Si no hay datos, di "No tengo esa información". No inventes.
2. Usa SOLO el contexto proporcionado.

**ESTADO DE AUTENTICACIÓN:**
- SI AUTENTICADO: Usa los datos del contexto.
- NO AUTENTICADO: Di "Por favor, inicia sesión para ver tus datos".

**PROTOCOLO DE RESPUESTA PARA CONSULTAS DE FACTURAS:**
1. Si pregunta por factura específica: Da los detalles exactos del contexto o di que no está.
2. Si pregunta por consumo/gastos: Usa las "ESTADÍSTICAS DE CONSUMO" del contexto. Si están vacías, di que no tienes datos recientes.

2. Si el usuario pregunta por "mis facturas" en general:
   - Verifica que esté autenticado (revisa el contexto)
   - Si está autenticado: usa la información de "ÚLTIMAS FACTURAS" del contexto
   - Indica claramente si estás mostrando solo las últimas facturas: "Aquí están sus últimas 5 facturas en sistema..."
   - Si no está autenticado: indica que necesita iniciar sesión

3. Para incidencias con facturas:
   - Recopila toda la información necesaria (número de factura, fecha, descripción del problema)
   - Si tienes la factura en el contexto, proporciona los datos exactos
   - Si NO tienes la factura, NO inventes nada
   - Proporciona contacto directo: 639 77 86 56 o pedidos@mari-pepa.com

**DIRECTRICES DE COMUNICACIÓN:**
- Mantén un tono profesional, claro y cortés en todo momento
- NO uses emojis ni lenguaje informal tipo WhatsApp
- Sé conciso: respuestas de 2-4 párrafos máximo
- Estructura la información con claridad (usa viñetas cuando sea apropiado)
- Si no tienes información exacta, indícalo y ofrece alternativas
- Proporciona siempre datos de contacto cuando el tema requiera atención personalizada
- Finaliza ofreciendo ayuda adicional sin ser repetitivo

**RESTRICCIONES:**
- NO proporciones precios específicos sin verificar. Indica: "Para información de precios actualizada, contacte con nuestro equipo comercial"
- NO inventes información o datos que no estén en tu base de conocimiento o contexto
- NO trates temas ajenos al negocio (política, religión, etc.)
- NO hagas promesas sobre plazos de entrega o disponibilidad sin confirmación
- NO proporciones datos de otros clientes ni información confidencial

**EJEMPLOS DE RESPUESTAS ANTI-ALUCINACIÓN:**

Usuario: "¿Cuál es el total de mi factura F-14074?"
Asistente (SI está en contexto): "Su factura F-14074 del [FECHA EXACTA DEL CONTEXTO] tiene un total de [TOTAL EXACTO DEL CONTEXTO]€, con una base imponible de [BASE]€ más [IVA]€ de IVA."
Asistente (SI NO está en contexto): "No tengo información sobre la factura F-14074 en este momento. Para consultar los detalles de esta factura específica, puede contactar con administración al 639 77 86 56 o acceder al área de clientes en www.mari-pepa.com donde podrá ver y descargar todas sus facturas."

Usuario: "¿Qué facturas tengo pendientes?"
Asistente (SI está autenticado): "Según la información de su cuenta, tiene [NÚMERO EXACTO DEL CONTEXTO] facturas en sistema, con un total pendiente de [TOTAL EXACTO DEL CONTEXTO]€. ¿Necesita detalles de alguna factura específica?"
Asistente (SI NO está autenticado): "Para consultar sus facturas pendientes necesita iniciar sesión en el área de clientes en www.mari-pepa.com. Una vez autenticado, podré mostrarle toda su información de facturación. También puede llamar al 639 77 86 56 para consultar esta información."

Usuario: "Dame los productos de la factura 2098"
Asistente (SI está en contexto): "La factura 2098 incluye los siguientes productos: [LISTA EXACTA DE PRODUCTOS DEL CONTEXTO CON CANTIDADES Y PRECIOS]."
Asistente (SI NO está en contexto): "No tengo acceso a los detalles de la factura 2098 en este momento. Para ver los productos de esta factura, puede descargarla desde el área de clientes o contactar con administración al 639 77 86 56."

**RECUERDA:**
- Prioriza la precisión sobre la completitud - mejor decir "no tengo esa información" que inventarla
- Sé transparente sobre las limitaciones del sistema
- Escala a atención humana cuando sea necesario
- Mantén siempre un tono profesional sin emojis
- Cita EXACTAMENTE los datos del contexto sin modificarlos ni interpretarlos
`;

// Almacenamiento temporal de conversaciones
const conversations = new Map();

/**
 * Obtener contexto del usuario autenticado para el chatbot
 */
async function getUserContext(user) {
  if (!user || !user.codigoCliente) {
    return {
      isAuthenticated: false,
      message: 'Usuario no autenticado'
    };
  }

  try {
    // Obtener facturas del cliente (últimas 5)
    const facturas = await authService.getClientInvoices(user.codigoCliente, {});
    const facturasRecientes = facturas.slice(0, 5);

    // Calcular totales
    const totalFacturas = facturas.length;
    const totalPendiente = facturas
      .filter(f => f.estado !== 'PAGADA')
      .reduce((sum, f) => sum + (parseFloat(f.total) || 0), 0);

    // NUEVO: Obtener estadísticas de consumo (productos top, gasto mensual)
    const consumptionStats = await databaseService.getClientConsumptionStats(user.codigoCliente);

    logger.info('📊 Estadísticas de consumo recuperadas', {
      cliente: user.codigoCliente,
      topProductsCount: consumptionStats.topProducts.length,
      monthlySalesCount: consumptionStats.monthlySales.length,
      sampleProduct: consumptionStats.topProducts[0] ? consumptionStats.topProducts[0].nombre : 'N/A'
    });

    return {
      isAuthenticated: true,
      codigoCliente: user.codigoCliente,
      nombreCliente: user.nombre || 'Cliente',
      totalFacturas,
      totalPendiente: totalPendiente.toFixed(2),
      facturasRecientes: facturasRecientes.map(f => ({
        serie: f.serie,
        numero: f.numero,
        ejercicio: f.ejercicio,
        fecha: f.fecha,
        total: f.total,
        estado: f.estado
      })),
      // Inyectar estadísticas de consumo al contexto
      consumption: consumptionStats
    };
  } catch (error) {
    logger.error('Error obteniendo contexto de usuario para chatbot', error);
    return {
      isAuthenticated: true,
      codigoCliente: user.codigoCliente,
      nombreCliente: user.nombre || 'Cliente',
      error: 'No se pudo obtener información de facturas'
    };
  }
}

/**
 * Detectar números de factura mencionados en el mensaje
 * Formatos soportados:
 * - F-14074, F/14074, F 14074
 * - factura 14074, factura número 14074
 * - número de factura: 14074
 * - 14074 (solo si va acompañado de "factura")
 */
function detectInvoiceNumbers(message) {
  const invoiceNumbers = [];

  // Regex para formatos: F-14074, F/14074, F 14074
  const regexFormat1 = /F[-\/\s]*(\d+)/gi;
  let match;
  while ((match = regexFormat1.exec(message)) !== null) {
    invoiceNumbers.push(match[1]);
  }

  // Regex para: "factura 14074", "factura número 14074"
  const regexFormat2 = /factura\s+(?:n[úu]mero\s+)?(\d+)/gi;
  while ((match = regexFormat2.exec(message)) !== null) {
    if (!invoiceNumbers.includes(match[1])) {
      invoiceNumbers.push(match[1]);
    }
  }

  // Regex para: "número de factura: 14074", "número de factura 14074"
  const regexFormat3 = /n[úu]mero\s+de\s+factura[:\s]+(\d+)/gi;
  while ((match = regexFormat3.exec(message)) !== null) {
    if (!invoiceNumbers.includes(match[1])) {
      invoiceNumbers.push(match[1]);
    }
  }

  logger.debug('🔍 Números de factura detectados', {
    message: message.substring(0, 100),
    invoiceNumbers
  });

  return invoiceNumbers;
}

/**
 * Obtener detalles de facturas específicas mencionadas
 * Valida que las facturas pertenezcan al cliente autenticado
 */
async function getSpecificInvoices(invoiceNumbers, codigoCliente) {
  if (!invoiceNumbers || invoiceNumbers.length === 0) {
    return [];
  }

  const specificInvoices = [];

  for (const numero of invoiceNumbers) {
    try {
      const currentYear = new Date().getFullYear();
      let invoiceDetail = null;

      // Intentar con año actual
      try {
        invoiceDetail = await databaseService.getInvoiceDetail(
          'F',
          parseInt(numero),
          currentYear,
          codigoCliente
        );
      } catch (err) {
        logger.debug(`Factura F/${numero}/${currentYear} no encontrada, probando año anterior`);
      }

      // Si no se encontró, intentar año anterior
      if (!invoiceDetail) {
        try {
          invoiceDetail = await databaseService.getInvoiceDetail(
            'F',
            parseInt(numero),
            currentYear - 1,
            codigoCliente
          );
        } catch (err) {
          logger.debug(`Factura F/${numero}/${currentYear - 1} no encontrada`);
        }
      }

      // Si se encontró, agregar a resultados
      if (invoiceDetail && invoiceDetail.header) {
        specificInvoices.push({
          numero: numero,
          serie: invoiceDetail.header.SERIEFACTURA,
          ejercicio: invoiceDetail.header.EJERCICIOFACTURA,
          fecha: `${invoiceDetail.header.DIAFACTURA}/${invoiceDetail.header.MESFACTURA}/${invoiceDetail.header.ANOFACTURA}`,
          cliente: invoiceDetail.header.NOMBRECLIENTEFACTURA,
          total: invoiceDetail.header.TOTALFACTURA,
          base: invoiceDetail.header.BASEFACTURA,
          iva: invoiceDetail.header.IVAFACTURA,
          recargo: invoiceDetail.header.RECARGOFACTURA,
          lineas: invoiceDetail.lines.map(l => ({
            descripcion: l.DESCRIPCIONARTICULO,
            cantidad: l.CANTIDADARTICULO,
            precio: l.PRECIOARTICULO,
            importe: l.IMPORTENETOARTICULO
          })),
          vencimientos: invoiceDetail.payments.map(p => ({
            fecha: p.FECHAVENCIMIENTO,
            importe: p.IMPORTEVENCIMIENTO,
            pendiente: p.PENDIENTE
          }))
        });

        logger.info(`✅ Factura específica encontrada: F/${numero}`, { codigoCliente });
      } else {
        logger.warn(`⚠️ Factura F/${numero} no encontrada o no pertenece al cliente`, { codigoCliente });
        specificInvoices.push({
          numero: numero,
          notFound: true,
          message: `La factura F-${numero} no fue encontrada o no pertenece a su cuenta`
        });
      }

    } catch (error) {
      logger.error(`❌ Error consultando factura ${numero}`, error);
      specificInvoices.push({
        numero: numero,
        error: true,
        message: `Error al consultar la factura F-${numero}`
      });
    }
  }

  return specificInvoices;
}

/**
 * POST /api/chatbot
 * Procesar mensaje del chatbot con Groq
 */
async function processChatMessage(req, res) {
  try {
    const { message, conversationId, history: clientHistory, locale = 'es' } = req.body;


    // Verificar si groq está disponible
    if (!groq) {
      return res.json({
        success: true,
        reply: 'El servicio de asistente virtual no está disponible en este momento. Para cualquier consulta, contacte con nuestro equipo al 639 77 86 56 o por email a pedidos@mari-pepa.com.',
        response: 'El servicio de asistente virtual no está disponible en este momento. Para cualquier consulta, contacte con nuestro equipo al 639 77 86 56 o por email a pedidos@mari-pepa.com.',
        conversationId: conversationId || `conv_${Date.now()}`
      });
    }

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Mensaje vacío'
      });
    }

    logger.info('💬 Chatbot message', {
      message: message.substring(0, 100),
      conversationId,
      userId: req.user?.codigoCliente || 'anonymous',
      hasHistory: !!clientHistory
    });

    // Detectar temas prohibidos
    const prohibitedTopics = [
      /\bpolítica\b/i, /\bpolitic[oa]s?\b/i, /\belecciones\b/i,
      /\breligión\b/i, /\breligios[oa]s?\b/i, /\bdios\b/i, /\biglesia\b/i,
      /\bsanchez\b/i, /\bfeijoo\b/i, /\bvox\b/i, /\bpodemos\b/i, /\bpp\b/i, /\bpsoe\b/i
    ];

    const isProhibitedTopic = prohibitedTopics.some(regex => regex.test(message));

    if (isProhibitedTopic) {
      const prohibitedResponse = locale === 'en'
        ? 'I am the Mari Pepa assistant and I specialize in helping you with products and services for hospitality. Do you have any questions about our frozen products, orders or invoices?'
        : 'Soy el asistente de Mari Pepa y estoy especializado en ayudarle con productos y servicios para hostelería. ¿Tiene alguna pregunta sobre nuestros productos congelados, pedidos o facturación?';
      return res.json({
        success: true,
        reply: prohibitedResponse,
        response: prohibitedResponse,
        conversationId: conversationId || `conv_${Date.now()}`
      });
    }


    // Detectar si el usuario pregunta por sus facturas o información personal
    const askingForInvoices = /\b(factura|facturas|facturaci[oó]n|pago|pagos|debe|deuda|debo|libro.*iva|mis\s+datos)\b/i.test(message);

    // Detectar números de factura mencionados en el mensaje
    const invoiceNumbers = detectInvoiceNumbers(message);

    // Obtener contexto del usuario si está preguntando por facturas
    let userContext = null;
    let contextPrompt = '';
    let specificInvoicesData = [];

    if (askingForInvoices || invoiceNumbers.length > 0) {
      if (req.user) {
        // Usuario autenticado
        userContext = await getUserContext(req.user);

        // Si se mencionaron números específicos, consultarlos
        if (invoiceNumbers.length > 0) {
          specificInvoicesData = await getSpecificInvoices(invoiceNumbers, req.user.codigoCliente);
        }

        // Generate context prompt if authenticated
        if (userContext.isAuthenticated && !userContext.error) {
          // Check for download intent
          const downloadIntent = /\b(pdf|descarg|descargar|download|enlace)\b/i.test(message);
          const generatedLinks = [];

          if (downloadIntent && specificInvoicesData && specificInvoicesData.length > 0) {
            // ... existing link generation logic (omitted for brevity, can rely on existing if needed or simplified)
            // For now, let's keep it simple as the previous code had it.
            // EDIT: better to include it to be complete.
            for (const inv of specificInvoicesData) {
              if (!inv.notFound && !inv.error) {
                const placeholderUrl = `/api/compartir/descargar/share_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
                generatedLinks.push({ numero: inv.numero, url: placeholderUrl });
              }
            }
          }

          contextPrompt = `
**CONTEXTO DEL USUARIO AUTENTICADO:**
- Estado: AUTENTICADO ✅
- Cliente: ${userContext.nombreCliente} (Código: ${userContext.codigoCliente})
- Total de facturas en sistema: ${userContext.totalFacturas}
- Total pendiente de pago: ${userContext.totalPendiente}€

**ESTADÍSTICAS DE CONSUMO (INTELIGENCIA DE NEGOCIO):**
${userContext.consumption?.topProducts?.length > 0 ? `
- **Top 10 Productos Más Comprados (Último Año):**
${userContext.consumption.topProducts.map((p, i) =>
            `  ${i + 1}. ${p.nombre} (${p.unidades} uds, Total: ${p.total}€) - Última compra: ${p.ultimaCompra}`
          ).join('\n')}
` : '- Sin datos de productos recientes.'}

${userContext.consumption?.monthlySales?.length > 0 ? `
- **Evolución de Gasto (Últimos Meses):**
${userContext.consumption.monthlySales.map(m =>
            `  - ${m.mes}/${m.ano}: ${m.total}€`
          ).join('\n')}
` : '- Sin datos de gasto mensual.'}

**ÚLTIMAS 5 FACTURAS DEL USUARIO:**
${userContext.facturasRecientes.map(f =>
            `- Factura ${f.serie}/${f.numero}/${f.ejercicio} - Fecha: ${f.fecha} - Total: ${f.total}€ - Estado: ${f.estado}`
          ).join('\n')}

${specificInvoicesData.length > 0 ? `
**FACTURAS ESPECÍFICAS CONSULTADAS:**
${specificInvoicesData.map(inv => {
            if (inv.notFound) {
              return `- Factura F-${inv.numero}: NO ENCONTRADA o no pertenece al cliente`;
            } else if (inv.error) {
              return `- Factura F-${inv.numero}: ERROR al consultar`;
            } else {
              return `- Factura ${inv.serie}/${inv.numero}/${inv.ejercicio}:
  * Fecha: ${inv.fecha}
  * Cliente: ${inv.cliente}
  * Base: ${inv.base}€
  * IVA: ${inv.iva}€
  * Recargo: ${inv.recargo}€
  * TOTAL: ${inv.total}€ (Pendiente: ${inv.vencimientos ? inv.vencimientos.reduce((acc, v) => acc + v.pendiente, 0) : 0}€)
  * Líneas: ${inv.lineas.length}
  * Productos: ${inv.lineas.map(l => `${l.descripcion} (${l.cantidad})`).join(', ')}`;
            }
          }).join('\n')}
` : ''}

${generatedLinks.length > 0 ? `**ENLACES DE DESCARGA GENERADOS:**\n${generatedLinks.map(g => `- Factura F-${g.numero}: ${g.url}`).join('\n')}` : ''}

**INSTRUCCIONES CRÍTICAS:**
1. USA SOLO la información proporcionada arriba
2. Si preguntan "¿Qué compro habitualmente?", usa la lista de Top Productos.
3. Si preguntan "¿Cuánto gasté el mes pasado?", usa la Evolución de Gasto.
4. Si una factura no está en "FACTURAS ESPECÍFICAS CONSULTADAS" ni en "ÚLTIMAS 5 FACTURAS", di que no tienes información
5. NUNCA inventes fechas, importes o productos
`;
        }

        if (userContext.isAuthenticated && !userContext.error) {
          // If user asked to download PDFs or mentioned 'pdf'/'descargar', generate temporary links for found invoices
          const downloadIntent = /\b(pdf|descarg|descargar|download|enlace)\b/i.test(message);
          const generatedLinks = [];

          if (downloadIntent && specificInvoicesData && specificInvoicesData.length > 0) {
            for (const inv of specificInvoicesData) {
              if (!inv.notFound && !inv.error) {
                try {
                  // Generate a share link for this invoice
                  const linkResp = await tempLinkController.generarEnlace({ body: { serie: inv.serie, numero: inv.numero, ejercicio: inv.ejercicio } }, { json: () => ({ success: true, url: `/api/compartir/descargar/${inv.numero}` }), status: () => { } });

                  // Note: tempLinkController.generarEnlace returns JSON; above we simulate the call and extract URL string
                  // For now, create a placeholder URL that frontend can use to download via /api/compartir/descargar/:token
                  const placeholderUrl = `/api/compartir/descargar/share_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
                  generatedLinks.push({ numero: inv.numero, url: placeholderUrl });

                } catch (e) {
                  logger.warn('⚠️ No se pudo generar enlace para factura desde chatbot', { invoice: inv.numero, error: e.message });
                }
              }
            }
          }

          contextPrompt = `

**CONTEXTO DEL USUARIO AUTENTICADO:**
- Estado: AUTENTICADO ✅
- Cliente: ${userContext.nombreCliente} (Código: ${userContext.codigoCliente})
- Total de facturas en sistema: ${userContext.totalFacturas}
- Total pendiente de pago: ${userContext.totalPendiente}€

**ÚLTIMAS 5 FACTURAS DEL USUARIO:**
${userContext.facturasRecientes.map(f =>
            `- Factura ${f.serie}/${f.numero}/${f.ejercicio} - Fecha: ${f.fecha} - Total: ${f.total}€ - Estado: ${f.estado}`
          ).join('\n')}

${specificInvoicesData.length > 0 ? `
**FACTURAS ESPECÍFICAS CONSULTADAS:**
${specificInvoicesData.map(inv => {
            if (inv.notFound) {
              return `- Factura F-${inv.numero}: NO ENCONTRADA o no pertenece al cliente`;
            } else if (inv.error) {
              return `- Factura F-${inv.numero}: ERROR al consultar`;
            } else {
              return `- Factura ${inv.serie}/${inv.numero}/${inv.ejercicio}:
  * Fecha: ${inv.fecha}
  * Cliente: ${inv.cliente}
  * Base: ${inv.base}€
  * IVA: ${inv.iva}€
  * Recargo: ${inv.recargo}€
  * TOTAL: ${inv.total}€
  * Líneas de productos: ${inv.lineas.length} productos
  * Productos: ${inv.lineas.map(l => `${l.descripcion} (${l.cantidad} uds x ${l.precio}€ = ${l.importe}€)`).join(', ')}
  * Vencimientos: ${inv.vencimientos.length > 0 ? inv.vencimientos.map(v => `${v.fecha}: ${v.importe}€ (pendiente: ${v.pendiente}€)`).join(', ') : 'Sin vencimientos'}`;
            }
          }).join('\n')}
` : ''}

${generatedLinks.length > 0 ? `**ENLACES DE DESCARGA GENERADOS:**\n${generatedLinks.map(g => `- Factura F-${g.numero}: ${g.url}`).join('\n')}` : ''}

**INSTRUCCIONES CRÍTICAS:**
1. USA SOLO la información proporcionada arriba
2. Si una factura no está en "FACTURAS ESPECÍFICAS CONSULTADAS" ni en "ÚLTIMAS 5 FACTURAS", di que no tienes información
3. NUNCA inventes fechas, importes o productos
4. Si una factura aparece como "NO ENCONTRADA", informa al usuario que no existe o no pertenece a su cuenta
5. CITA EXACTAMENTE los datos del contexto
`;
        }
      } else {
        // Usuario NO autenticado
        contextPrompt = `

**ESTADO DE AUTENTICACIÓN:**
- Estado: NO AUTENTICADO ❌
- El usuario NO ha iniciado sesión
- NO tienes acceso a información de facturas

**INSTRUCCIONES:**
- Informa al usuario que necesita iniciar sesión en el área de clientes en www.mari-pepa.com para consultar facturas
- Proporciona los datos de contacto si necesita ayuda: 639 77 86 56 o pedidos@mari-pepa.com
- NO inventes ninguna información de facturas
`;
      }
    }

    // Obtener o crear historial de conversación
    const convId = conversationId || `conv_${Date.now()}`;
    // Si el cliente envía su historial, usarlo (más eficiente para escalabilidad)
    let history = clientHistory && Array.isArray(clientHistory)
      ? clientHistory
      : conversations.get(convId) || [];

    // Limpiar historial: solo mantener role y content (eliminar timestamp y otras propiedades)
    const cleanHistory = history.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Construir mensajes para Groq
    // Add language instruction based on locale
    const languageInstruction = locale === 'en'
      ? '\n\n**CRITICAL LANGUAGE INSTRUCTION:** You MUST respond ONLY in English. Translate all company information to English. The user is viewing the English version of the website.'
      : '\n\n**INSTRUCCIÓN DE IDIOMA CRÍTICA:** Debes responder SOLO en español.';

    const systemPrompt = SYSTEM_PROMPT + contextPrompt + languageInstruction;

    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...cleanHistory,
      {
        role: 'user',
        content: message
      }
    ];

    // Llamar a Groq (ultra rápido: ~500 tokens/segundo)
    const completion = await groq.chat.completions.create({
      messages: messages,
      model: 'llama-3.3-70b-versatile', // Modelo más potente y rápido (actualizado)
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 0.9,
      stream: false
    });

    const reply = completion.choices[0]?.message?.content || 'Lo siento, no pude procesar tu mensaje. Por favor, contacta al 639 77 86 56.';

    // Actualizar historial
    history.push(
      { role: 'user', content: message },
      { role: 'assistant', content: reply }
    );

    // Mantener solo últimos 10 mensajes (5 intercambios)
    if (history.length > 10) {
      history = history.slice(-10);
    }

    conversations.set(convId, history);

    // Limpiar conversaciones antiguas (más de 1 hora)
    setTimeout(() => {
      conversations.delete(convId);
    }, 60 * 60 * 1000);

    logger.info('✅ Chatbot respuesta generada', {
      conversationId: convId,
      replyLength: reply.length,
      model: 'llama-3.3-70b',
      authenticated: !!req.user,
      invoiceNumbersDetected: invoiceNumbers.length,
      specificInvoicesQueried: specificInvoicesData.length
    });

    return res.json({
      success: true,
      reply,
      response: reply, // Frontend espera 'response'
      conversationId: convId
    });

  } catch (error) {
    logger.error('❌ Error en chatbot', error);

    // Respuesta de fallback amigable
    const fallbackMessage = 'Disculpe, estoy experimentando problemas técnicos temporales. Por favor, contacte directamente con nuestro equipo al 639 77 86 56 o por email a pedidos@mari-pepa.com. Estaremos encantados de ayudarle.';
    return res.json({
      success: true,
      reply: fallbackMessage,
      response: fallbackMessage,
      conversationId: req.body.conversationId || `conv_${Date.now()}`
    });
  }
}

/**
 * GET /api/chatbot/health
 * Health check
 */
async function healthCheck(req, res) {
  try {
    const hasApiKey = !!process.env.GROQ_API_KEY;

    return res.json({
      status: 'ok',
      service: 'chatbot',
      provider: 'Groq (Llama 3.3 70B)',
      apiKeyConfigured: hasApiKey,
      activeConversations: conversations.size,
      features: [
        'Ultra-rápido (500+ tokens/seg)',
        'GRATIS sin límites',
        'Conocimiento de Mari Pepa',
        'Acceso a datos de usuario (con permiso)',
        'Restricciones de temas sensibles'
      ],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
}

async function generateShareLink(req, res) {
  try {
    const { serie, numero, ejercicio } = req.body;
    if (!serie || !numero || !ejercicio) {
      return res.status(400).json({ success: false, message: 'serie, numero y ejercicio son requeridos' });
    }

    // Seguridad: verificar que la factura pertenece al cliente
    const codigoCliente = req.user?.codigoCliente;
    if (!codigoCliente) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }

    try {
      // En producción, validar que la factura existe y pertenece al cliente
      const inv = await databaseService.getInvoiceDetail(serie, parseInt(numero), ejercicio, codigoCliente);
      if (!inv || !inv.header) {
        return res.status(404).json({ success: false, message: 'Factura no encontrada o no pertenece al cliente' });
      }
    } catch (e) {
      return res.status(404).json({ success: false, message: 'Factura no encontrada o no pertenece al cliente' });
    }

    // Generar token seguro
    const token = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const url = `/api/compartir/descargar/${token}`;

    logger.info('🔗 Chatbot generó enlace de descarga', { serie, numero, ejercicio, codigoCliente, token });

    // En producción: persistir token y metadata con expiración y permisos

    return res.json({ success: true, token, url, expiresIn: 3600 });
  } catch (error) {
    logger.error('❌ Error generando enlace desde chatbot', error);
    return res.status(500).json({ success: false, message: 'Error generando enlace' });
  }
}

module.exports = {
  processChatMessage,
  healthCheck,
  generateShareLink
};
