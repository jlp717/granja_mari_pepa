/**
 * DB GUARD - lista blanca de herramientas de cuenta
 * =================================================
 * El modelo openai/gpt-oss-120b NO recibe nunca la posibilidad de escribir
 * SQL. Solo puede invocar estas funciones con argumentos validados. El codigo
 * de cliente se toma del JWT verificado, jamas del modelo.
 *
 * Cada ejecucion entra en un contexto read-only de sqlGuard. odbcConfig
 * valida el SQL y ejecuta SET TRANSACTION READ ONLY antes de cada consulta.
 */

const sqlGuard = require('./sqlGuard');
const databaseService = require('../services/databaseService');
const odbcPool = require('../config/odbcConfig');
const { parseInvoiceReference } = require('../services/invoiceReference');
const logger = require('../utils/logger');

const TOOL_DEFINITIONS = Object.freeze([
  {
    type: 'function',
    function: {
      name: 'consultar_resumen_cuenta',
      description:
        'Resumen de la cuenta del cliente autenticado: numero de facturas, total facturado, gasto del mes en curso, gasto de los ultimos 12 meses, totales por ano, importe pendiente, ultimas facturas y ranking de productos mas comprados (unidades, importe y numero de pedidos). Usala para "cuanto he gastado", "cuanto llevo este mes", "que productos compro mas", "mi producto estrella", "que tengo pendiente". No requiere argumentos.',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'consultar_factura',
      description:
        'Devuelve el detalle de una factura concreta del cliente autenticado. Acepta el número o una referencia como 1234, F-1234, F/1234/2025, 2025-1234. También permite buscar por mes y ejercicio.',
      parameters: {
        type: 'object',
        properties: {
          numero: {
            type: 'string',
            description: 'Número o referencia de factura: 1234, F-1234, F/1234/2025, 2025-1234.',
          },
          serie: {
            type: 'string',
            description: 'Serie de la factura. Por defecto F.',
          },
          ejercicio: {
            type: 'integer',
            description: 'Año de la factura.',
          },
          mes: {
            type: 'integer',
            description: 'Mes 1-12 para buscar facturas por fecha.',
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'consultar_pedidos',
      description:
        'Pedidos del cliente autenticado (lineas de pedido del ERP), con serie, numero, ejercicio, fecha, importe y numero de lineas. Usala para "mis pedidos", "mi ultimo pedido", "que pedi en enero", "cuantos pedidos tengo". No requiere argumentos.',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 20,
            description: 'Numero de pedidos a devolver, por defecto 8.',
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'consultar_detalle_pedido',
      description:
        'Lineas de un pedido concreto: articulo, descripcion, unidades, precio, descuento e importe. Usala cuando pidan "que lleva mi pedido", "detalle del pedido 982" o "que articulos pedi".',
      parameters: {
        type: 'object',
        properties: {
          serie: {
            type: 'string',
            description: 'Serie del pedido, por ejemplo P.',
          },
          numero: {
            type: 'integer',
            description: 'Numero de pedido.',
          },
          ejercicio: {
            type: 'integer',
            description: 'Ano del pedido.',
          },
          subempresa: {
            type: 'integer',
            description: 'Subempresa del pedido, solo si se conoce.',
          },
          terminal: {
            type: 'integer',
            description: 'Terminal del pedido, solo si se conoce.',
          },
        },
        required: ['serie', 'numero', 'ejercicio'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'consultar_albaranes',
      description:
        'Albaranes del cliente autenticado con importe y situacion. Usala si preguntan por albaranes o entregas, no por pedidos.',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 20,
            description: 'Numero de albaranes a devolver, por defecto 8.',
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'consultar_perfil',
      description:
        'Ficha del cliente autenticado en el ERP: nombre, nombre comercial, direccion de entrega, poblacion, provincia, ruta de reparto y fecha de alta. Usala para "cual es mi direccion", "mi ruta", "desde cuando soy cliente", "mis datos". No requiere argumentos.',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'buscar_producto',
      description:
        'Busca en el catalogo de Granja Maripepa por palabra del nombre o la descripcion. Devuelve codigo, nombre, descripcion ampliada, familia y marca. No devuelve precios. Usala para "que es X", "teneis X", "que productos de pescado hay", "buscame bogavante", "que marca es".',
      parameters: {
        type: 'object',
        properties: {
          texto: {
            type: 'string',
            description: 'Palabra o frase a buscar en el nombre o la descripcion del articulo.',
          },
          familia: {
            type: 'string',
            description: 'Codigo de familia para filtrar, solo si se conoce.',
          },
          limite: {
            type: 'integer',
            minimum: 1,
            maximum: 20,
            description: 'Numero de articulos a devolver, por defecto 8.',
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'listar_familias',
      description:
        'Lista las familias del catalogo (congelado, masas, ahumados, etc.) con el numero de articulos de cada una. Usala para "que categorias teneis", "que familias de producto hay". No requiere argumentos.',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'consultar_vencimientos',
      description:
        'Vencimientos de pago pendientes del cliente autenticado, ordenados por fecha, con factura, importe y dias que faltan. Usala para "cuando tengo que pagar", "que vence este mes", "que tengo pendiente de pago", "proximo vencimiento". No requiere argumentos.',
      parameters: {
        type: 'object',
        properties: {
          limite: {
            type: 'integer',
            minimum: 1,
            maximum: 20,
            description: 'Numero de vencimientos a devolver, por defecto 8.',
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'consultar_detalle_albaran',
      description:
        'Lineas de un albaran concreto del cliente: articulo, descripcion, unidades, precio, descuento e importe. Usala para "que lleva el albaran 1234", "detalle del albaran P-1234", "que me entregasteis". Necesita numero y ejercicio; la serie es opcional (por defecto P).',
      parameters: {
        type: 'object',
        properties: {
          serie: {
            type: 'string',
            description: 'Serie del albaran, por ejemplo P.',
          },
          numero: {
            type: 'integer',
            description: 'Numero de albaran.',
          },
          ejercicio: {
            type: 'integer',
            description: 'Ano del albaran.',
          },
        },
        required: ['numero', 'ejercicio'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'consultar_compras_articulo',
      description:
        'Historial de compras del cliente de un articulo concreto (por codigo o por texto de la descripcion): unidades, importe, numero de entregas y ultima compra. Usala para "cuanto bogavante he comprado", "cuando pedi X por ultima vez", "mi historial de X".',
      parameters: {
        type: 'object',
        properties: {
          texto: {
            type: 'string',
            description: 'Codigo o palabra de la descripcion del articulo.',
          },
          ejercicio: {
            type: 'integer',
            description: 'Ano concreto; si se omite, ultimos tres ejercicios.',
          },
        },
        required: ['texto'],
        additionalProperties: false,
      },
    },
  },
]);

function requireClientCode(user) {
  const code = user && (user.codigoCliente || user.customerCode);
  if (!code) {
    const error = new Error('AUTH_REQUIRED');
    error.code = 'AUTH_REQUIRED';
    throw error;
  }
  return String(code).trim();
}

function money(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(2) : '0.00';
}

async function consultarResumenCuenta(user) {
  const codigoCliente = requireClientCode(user);
  const currentYear = new Date().getFullYear();

  const [summary, byYear, invoices, products, currentInvoices] = await Promise.all([
    databaseService.getClientSummary(codigoCliente, currentYear),
    databaseService.getClientSummaryByYear(codigoCliente),
    databaseService.getInvoices(codigoCliente, 8, 0, null),
    databaseService.getClientProducts(codigoCliente, 5),
    databaseService.getInvoices(codigoCliente, 200, 0, null),
  ]);

  const monthly = new Map();
  for (const invoice of currentInvoices || []) {
    const parts = String(invoice.FECHA || '').split('/');
    const month = Number(parts[1]);
    const year = Number(parts[2]) || currentYear;
    if (!month) continue;
    const key = `${year}-${month}`;
    const current = monthly.get(key) || { ano: year, mes: month, total: 0 };
    current.total += Number(invoice.TOTAL) || 0;
    monthly.set(key, current);
  }
  const gastoMensual = [...monthly.values()]
    .sort((a, b) => a.ano - b.ano || a.mes - b.mes)
    .slice(-12)
    .map((item) => ({ ...item, total: money(item.total) }));
  const currentMonth = new Date().getMonth() + 1;
  const totalEsteMes =
    gastoMensual.find(
      (item) => item.ano === currentYear && item.mes === currentMonth,
    )?.total || '0.00';

  const pendiente = (byYear || []).reduce(
    (sum, row) => sum + (Number(row.IMPORTEPENDIENTE) || 0),
    0,
  );

  return {
    cliente: (user && user.nombre) || 'Cliente',
    ejercicio: currentYear,
    totalFacturas: Number((summary && summary.TOTALFACTURAS) || 0),
    totalFacturado: money(summary && summary.TOTALFACTURADO),
    totalEsteMes,
    baseImponible: money(summary && summary.TOTALBASE),
    iva: money(summary && summary.TOTALIVA),
    pendiente: money(pendiente),
    moneda: 'EUR',
    gastoMensual,
    porAno: (byYear || []).map((row) => ({
      ano: Number(row.YEAR),
      facturas: Number(row.TOTAL) || 0,
      pagadas: Number(row.PAGADAS) || 0,
      pendientes: Number(row.PENDIENTES) || 0,
      total: money(
        (Number(row.TOTALPAGADAS) || 0) + (Number(row.TOTALPENDIENTES) || 0),
      ),
      totalPagado: money(row.TOTALPAGADAS),
      totalPendiente: money(row.IMPORTEPENDIENTE),
    })),
    ultimasFacturas: (invoices || []).slice(0, 8).map((factura) => ({
      serie: factura.SERIE,
      numero: factura.NUMERO,
      ejercicio: factura.EJERCICIO,
      fecha: factura.FECHA,
      total: money(factura.TOTAL),
      pendiente: money(factura.PENDIENTE),
      estado: factura.ESTADO,
    })),
    topProductos: (products || []).slice(0, 5).map((item) => ({
      nombre: item.DESCRIPCION,
      unidades: item.CANTIDADTOTAL,
      total: money(item.IMPORTETOTAL),
      pedidos: item.NUMEROPEDIDOS,
    })),
  };
}

async function consultarPedidos(user, args) {
  const codigoCliente = requireClientCode(user);
  const limit = Math.max(1, Math.min(20, Number((args && args.limit) || 8)));
  const rows = await databaseService.getClientOrdersFromLines(codigoCliente, limit);
  return {
    total: (rows || []).length,
    pedidos: (rows || []).map((order) => ({
      serie: order.SERIE,
      numero: order.NUMERO,
      ejercicio: order.EJERCICIO,
      fecha: `${String(order.DIA).padStart(2, '0')}/${String(order.MES).padStart(2, '0')}/${order.ANO}`,
      total: money(order.TOTAL),
      lineas: Number(order.LINEAS) || 0,
      subempresa: order.SUBEMPRESA,
      terminal: order.TERMINAL,
    })),
  };
}

async function consultarDetallePedido(user, args) {
  const codigoCliente = requireClientCode(user);
  const rows = await databaseService.getOrderDetail(codigoCliente, args || {});
  if (rows === null) {
    return {
      encontrado: false,
      mensaje: 'Necesito la serie, el numero y el ejercicio del pedido.',
    };
  }
  return {
    encontrado: (rows || []).length > 0,
    totalLineas: (rows || []).length,
    lineas: (rows || []).map((line) => ({
      articulo: line.ARTICULO,
      descripcion: String(line.DESCRIPCION || '').trim(),
      unidades: Number(line.UNIDADES) || 0,
      precio: money(line.PRECIO),
      descuento: Number(line.DESCUENTO) || 0,
      importe: money(line.IMPORTE),
    })),
    mensaje:
      (rows || []).length > 0
        ? `${rows.length} linea(s) en ese pedido.`
        : 'No encuentro ese pedido. Revisa serie, numero y ejercicio.',
  };
}

async function consultarAlbaranes(user, args) {
  const codigoCliente = requireClientCode(user);
  const limit = Math.max(1, Math.min(20, Number((args && args.limit) || 8)));
  const rows = await databaseService.getClientOrders(codigoCliente, limit);
  return {
    total: (rows || []).length,
    albaranes: (rows || []).map((order) => ({
      serie: order.SERIE,
      numero: order.NUMERO,
      ejercicio: order.EJERCICIO,
      total: money(order.TOTAL),
      situacion: order.SITUACION,
      tipo: order.TIPO,
    })),
  };
}

async function consultarPerfil(user) {
  const codigoCliente = requireClientCode(user);
  const profile = await databaseService.getClientProfile(codigoCliente);
  if (!profile) {
    return { encontrado: false, mensaje: 'No encuentro tu ficha de cliente.' };
  }
  const alta =
    profile.DIAALTA && profile.MESALTA && profile.ANOALTA
      ? `${String(profile.DIAALTA).padStart(2, '0')}/${String(profile.MESALTA).padStart(2, '0')}/${profile.ANOALTA}`
      : null;
  return {
    encontrado: true,
    nombre: profile.NOMBRE,
    nombreComercial:
      profile.ALTERNATIVO && profile.ALTERNATIVO !== profile.NOMBRE
        ? profile.ALTERNATIVO
        : null,
    direccion: profile.DIRECCION || null,
    poblacion: profile.POBLACION || null,
    provincia: profile.PROVINCIA || null,
    ruta: profile.RUTA || null,
    alta,
    mensaje: 'Datos de tu ficha de cliente.',
  };
}

async function consultarFactura(user, args) {
  const codigoCliente = requireClientCode(user);
  const rawReference = String(
    (args && (args.numero || args.codigo || args.referencia)) || '',
  ).trim();
  const ref = parseInvoiceReference(rawReference);
  const serie = String((args && args.serie) || ref.serie || 'F').trim().toUpperCase();
  const requestedYear = Number((args && args.ejercicio) || ref.ejercicio) || null;

  if (
    !requestedYear &&
    !(args && args.serie) &&
    rawReference.replace(/\D/g, '') === codigoCliente
  ) {
    return {
      encontrada: false,
      mensaje:
        'Ese es tu código de cliente, no el número de factura. Dime el número o referencia de la factura (por ejemplo 1234, F-1234 o F/1234/2025).',
    };
  }

  if (!ref.numero && args && args.mes) {
    const month = String(Number(args.mes)).padStart(2, '0');
    const invoices = await databaseService.getInvoices(
      codigoCliente,
      200,
      0,
      requestedYear,
    );
    const filtered = invoices
      .filter((invoice) => String(invoice.FECHA || '').split('/')[1] === month)
      .sort((a, b) => Number(b.EJERCICIO) - Number(a.EJERCICIO));
    const years = [...new Set(filtered.map((invoice) => Number(invoice.EJERCICIO)))];
    return {
      encontrada: filtered.length > 0,
      busqueda: { mes: Number(args.mes), ejercicio: requestedYear || 'ultimos anos' },
      facturas: filtered.slice(0, 8).map((invoice) => ({
        serie: invoice.SERIE,
        numero: invoice.NUMERO,
        ejercicio: invoice.EJERCICIO,
        fecha: invoice.FECHA,
        total: money(invoice.TOTAL),
        pendiente: money(invoice.PENDIENTE),
        estado: invoice.ESTADO,
      })),
      mensaje:
        filtered.length > 0
          ? `${filtered.length} factura(s) encontradas en ese mes${years.length ? ` (${years.join(', ')})` : ''}.`
          : 'No hay facturas en ese mes.',
    };
  }

  if (!ref.numero) {
    return {
      encontrada: false,
      mensaje:
        'Necesito el número o referencia de la factura (por ejemplo 1234, F-1234 o F/1234/2025) o el mes y ejercicio.',
    };
  }

  const currentYear = new Date().getFullYear();
  const years = [
    ...new Set(
      [requestedYear, currentYear, currentYear - 1, currentYear - 2].filter(Boolean),
    ),
  ];

  for (const ejercicio of years) {
    try {
      const detail = await databaseService.getInvoiceDetail(
        serie,
        Number(ref.numero),
        ejercicio,
        codigoCliente,
      );

      if (detail && detail.header) {
        const owner = String(detail.header.CODIGOCLIENTEFACTURA || '').trim();
        if (owner && owner !== codigoCliente) {
          // Aunque el ERP permita acceso por NIF compartido, el chatbot solo
          // entrega facturas del codigo de cliente de la sesion.
          break;
        }
        return {
          encontrada: true,
          serie: detail.header.SERIEFACTURA,
          numero: ref.numero,
          ejercicio: detail.header.EJERCICIOFACTURA,
          fecha: `${detail.header.DIAFACTURA}/${detail.header.MESFACTURA}/${detail.header.ANOFACTURA}`,
          base: money(detail.header.BASEFACTURA),
          iva: money(detail.header.IVAFACTURA),
          total: money(detail.header.TOTALFACTURA),
          productos: (detail.lines || []).slice(0, 12).map((line) => ({
            descripcion: line.DESCRIPCIONARTICULO,
            cantidad: line.CANTIDADARTICULO,
            importe: line.IMPORTENETOARTICULO,
          })),
          vencimientos: (detail.payments || []).map((payment) => ({
            fecha: payment.FECHAVENCIMIENTO,
            importe: payment.IMPORTEVENCIMIENTO,
            pendiente: payment.PENDIENTE,
          })),
        };
      }
    } catch {
      // getInvoiceDetail valida propiedad y lanza "Factura no encontrada".
    }
  }

  return {
    encontrada: false,
    serie,
    numero: ref.numero,
    mensaje: 'No existe o no pertenece a su cuenta',
  };
}

async function buscarProducto(_user, args) {
  const rows = await databaseService.searchCatalog({
    text: args && args.texto,
    family: args && args.familia,
    limit: args && args.limite,
  });
  if (!rows.length) {
    return {
      total: 0,
      productos: [],
      mensaje:
        'No encuentro articulos con ese criterio. Prueba con otra palabra o pide las familias disponibles.',
    };
  }
  return {
    total: rows.length,
    productos: rows.map((row) => ({
      codigo: row.CODIGO,
      nombre: row.NOMBRE,
      detalle: row.DETALLE || null,
      familia: row.FAMILIA_DESCRIPCION || row.FAMILIA || null,
      marca: row.MARCA_DESCRIPCION || row.MARCA || null,
      unidad: row.UNIDAD || null,
    })),
    aviso: 'Sin precios ni condiciones: no estan disponibles en el catalogo publico.',
  };
}

async function listarFamilias() {
  const rows = await databaseService.listCatalogFamilies(12);
  return {
    total: rows.length,
    familias: rows.map((row) => ({
      codigo: row.FAMILIA,
      nombre: row.DESCRIPCION || row.FAMILIA,
      articulos: Number(row.ARTICULOS) || 0,
    })),
  };
}

async function consultarVencimientos(user, args) {
  const codigoCliente = requireClientCode(user);
  const limit = Math.max(1, Math.min(20, Number((args && args.limite) || 8)));
  const rows = await odbcPool.query(
    `SELECT
       NUMERODOCUMENTO AS NUMERO,
       EJERCICIODOCUMENTO AS EJERCICIO,
       DIAVENCIMIENTO,
       MESVENCIMIENTO,
       ANOVENCIMIENTO,
       IMPORTEVENCIMIENTO,
       IMPORTEPENDIENTE
     FROM DSEDAC.CVC
     WHERE TRIM(CODIGOCLIENTEFACTURA) = ?
       AND COALESCE(ANULADOSN, 'N') <> 'S'
       AND COALESCE(IMPORTEPENDIENTE, 0) > 0
     ORDER BY ANOVENCIMIENTO, MESVENCIMIENTO, DIAVENCIMIENTO
     FETCH FIRST ${limit} ROWS ONLY`,
    [codigoCliente],
  );

  const today = new Date();
  const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const vencimientos = (rows || []).map((row) => {
    const fecha = `${String(row.DIAVENCIMIENTO).padStart(2, '0')}/${String(row.MESVENCIMIENTO).padStart(2, '0')}/${row.ANOVENCIMIENTO}`;
    const due = new Date(
      Number(row.ANOVENCIMIENTO),
      Number(row.MESVENCIMIENTO) - 1,
      Number(row.DIAVENCIMIENTO),
    );
    const dias = Math.round((due.getTime() - midnight.getTime()) / 86400000);
    return {
      factura: `F-${row.NUMERO}/${row.EJERCICIO}`,
      fecha,
      dias,
      vencido: dias < 0,
      importe: money(row.IMPORTEVENCIMIENTO),
      pendiente: money(row.IMPORTEPENDIENTE),
    };
  });

  return {
    total: vencimientos.length,
    pendienteTotal: money(
      (rows || []).reduce((sum, row) => sum + (Number(row.IMPORTEPENDIENTE) || 0), 0),
    ),
    vencimientos,
    mensaje: vencimientos.length
      ? 'Vencimientos pendientes de tu cuenta, del mas proximo al mas lejano.'
      : 'No tienes vencimientos pendientes.',
  };
}

async function consultarDetalleAlbaran(user, args) {
  const codigoCliente = requireClientCode(user);
  const numero = Number(args && args.numero);
  const ejercicio = Number(args && args.ejercicio);
  const serie = String((args && args.serie) || 'P').trim().toUpperCase();
  if (!Number.isFinite(numero) || !Number.isFinite(ejercicio)) {
    return {
      encontrado: false,
      mensaje: 'Necesito el numero y el ejercicio del albaran.',
    };
  }

  const rows = await odbcPool.query(
    `SELECT
       TRIM(CODIGOARTICULO) AS ARTICULO,
       DESCRIPCION,
       CANTIDADUNIDADES,
       PRECIOVENTA,
       PORCENTAJEDESCUENTO,
       IMPORTEVENTA
     FROM DSEDAC.LAC
     WHERE TRIM(CODIGOCLIENTEALBARAN) = ?
       AND TRIM(SERIEALBARAN) = ?
       AND NUMEROALBARAN = ?
       AND EJERCICIOALBARAN = ?
     ORDER BY SECUENCIA
     FETCH FIRST 100 ROWS ONLY`,
    [codigoCliente, serie, numero, ejercicio],
  );

  return {
    encontrado: (rows || []).length > 0,
    serie,
    numero,
    ejercicio,
    totalLineas: (rows || []).length,
    lineas: (rows || []).map((line) => ({
      articulo: line.ARTICULO,
      descripcion: String(line.DESCRIPCION || '').trim(),
      unidades: Number(line.CANTIDADUNIDADES) || 0,
      precio: money(line.PRECIOVENTA),
      descuento: Number(line.PORCENTAJEDESCUENTO) || 0,
      importe: money(line.IMPORTEVENTA),
    })),
    mensaje: (rows || []).length
      ? `${rows.length} linea(s) en ese albaran.`
      : 'No encuentro ese albaran en tu cuenta. Revisa serie, numero y ejercicio.',
  };
}

async function consultarComprasArticulo(user, args) {
  const codigoCliente = requireClientCode(user);
  const texto = String((args && args.texto) || '').trim();
  if (texto.length < 2) {
    return { total: 0, mensaje: 'Dime el articulo o una palabra de su descripcion.' };
  }
  const ejercicio = Number(args && args.ejercicio) || null;
  const pattern = `%${texto.toUpperCase()}%`;
  const params = [codigoCliente, pattern, pattern];
  let yearFilter = '';
  if (ejercicio) {
    yearFilter = ' AND EJERCICIOALBARAN = ?';
    params.push(ejercicio);
  } else {
    yearFilter = ' AND EJERCICIOALBARAN >= YEAR(CURRENT_DATE) - 3';
  }

  const rows = await odbcPool.query(
    `SELECT
       TRIM(CODIGOARTICULO) AS ARTICULO,
       DESCRIPCION,
       SUM(ABS(CANTIDADUNIDADES)) AS UNIDADES,
       SUM(ABS(IMPORTEVENTA)) AS IMPORTE,
       COUNT(DISTINCT NUMEROALBARAN) AS ENTREGAS,
       MAX(ANODOCUMENTO * 10000 + MESDOCUMENTO * 100 + DIADOCUMENTO) AS ULTIMA
     FROM DSEDAC.LAC
     WHERE TRIM(CODIGOCLIENTEALBARAN) = ?
       AND (UPPER(TRIM(CODIGOARTICULO)) LIKE ? OR UPPER(DESCRIPCION) LIKE ?)
       ${yearFilter}
     GROUP BY CODIGOARTICULO, DESCRIPCION
     ORDER BY IMPORTE DESC
     FETCH FIRST 8 ROWS ONLY`,
    params,
  );

  const articulos = (rows || []).map((row) => {
    const last = String(row.ULTIMA || '');
    const ultimaCompra =
      last.length === 8
        ? `${last.slice(6, 8)}/${last.slice(4, 6)}/${last.slice(0, 4)}`
        : null;
    return {
      codigo: row.ARTICULO,
      nombre: String(row.DESCRIPCION || '').trim(),
      unidades: Number(row.UNIDADES) || 0,
      importe: money(row.IMPORTE),
      entregas: Number(row.ENTREGAS) || 0,
      ultimaCompra,
    };
  });

  return {
    total: articulos.length,
    ejercicio: ejercicio || 'ultimos 3 anos',
    articulos,
    mensaje: articulos.length
      ? 'Historial de compras de ese articulo.'
      : 'No encuentro compras de ese articulo en tu cuenta.',
  };
}

const HANDLERS = Object.freeze({
  consultar_resumen_cuenta: consultarResumenCuenta,
  consultar_factura: consultarFactura,
  consultar_pedidos: consultarPedidos,
  consultar_detalle_pedido: consultarDetallePedido,
  consultar_albaranes: consultarAlbaranes,
  consultar_detalle_albaran: consultarDetalleAlbaran,
  consultar_vencimientos: consultarVencimientos,
  consultar_compras_articulo: consultarComprasArticulo,
  consultar_perfil: consultarPerfil,
  buscar_producto: buscarProducto,
  listar_familias: listarFamilias,
});

const PUBLIC_TOOLS = Object.freeze(new Set(['buscar_producto', 'listar_familias']));

function assertToolName(name) {
  if (
    typeof name !== 'string' ||
    !Object.prototype.hasOwnProperty.call(HANDLERS, name)
  ) {
    const error = new Error('TOOL_NOT_ALLOWED');
    error.code = 'TOOL_NOT_ALLOWED';
    throw error;
  }
  return name;
}

function toSafeJson(value) {
  return JSON.parse(
    JSON.stringify(value, (_key, item) =>
      typeof item === 'bigint' ? Number(item) : item,
    ),
  );
}

/**
 * Ejecuta una herramienta de la lista blanca en contexto read-only.
 * @param {string} name
 * @param {object} args
 * @param {{codigoCliente?: string, nombre?: string}} user
 */
async function executeTool(name, args, user) {
  const tool = assertToolName(name);
  const isPublic = PUBLIC_TOOLS.has(tool);
  const codigoCliente = isPublic
    ? String(
        (user && (user.codigoCliente || user.customerCode)) || 'publico',
      ).trim()
    : requireClientCode(user);

  const result = await sqlGuard.runWithReadOnly(
    { tool, codigoCliente },
    () => HANDLERS[tool](user, args || {}),
  );

  logger.info('DB_GUARD_READ_ONLY_TOOL', { tool, codigoCliente });
  return toSafeJson(result);
}

module.exports = {
  TOOL_DEFINITIONS,
  TOOL_NAMES: Object.freeze(Object.keys(HANDLERS)),
  PUBLIC_TOOL_NAMES: Object.freeze([...PUBLIC_TOOLS]),
  executeTool,
};
