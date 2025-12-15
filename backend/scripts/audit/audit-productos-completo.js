/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AUDITORÍA EXHAUSTIVA DE PRODUCTOS - NIVEL ENTERPRISE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Analiza en profundidad la estructura de productos en la base de datos:
 * - Productos activos vs bloqueados/eliminados
 * - Precios base, tarifas especiales y descuentos por cliente
 * - IVA y tipos impositivos
 * - Stock y disponibilidad
 * - Unidades de venta y embalaje
 * - Productos con precios anómalos (0.00001, negativos, etc.)
 * - Familias y categorías
 * - Historial de precios
 * 
 * @author Sistema de Auditoría de Productos
 * @version 1.0.0
 */

const odbcPool = require('../app/config/odbcConfig');
const logger = require('../app/utils/logger');
const fs = require('fs').promises;
const path = require('path');

class AuditoriaProductos {
  constructor() {
    this.resultados = {
      timestamp: new Date().toISOString(),
      estadisticas: {},
      problemas: [],
      recomendaciones: [],
      muestras: {}
    };
  }

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 1. ANÁLISIS DE PRODUCTOS ACTIVOS Y BLOQUEADOS
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  async analizarEstadoProductos(connection) {
    console.log('\n📦 ANALIZANDO ESTADO DE PRODUCTOS...\n');

    try {
      // Total de productos
      const totalQuery = `
        SELECT COUNT(*) AS TOTAL FROM DSEDAC.ART
      `;
      const total = await connection.query(totalQuery);

      // Productos activos (no bloqueados)
      const activosQuery = `
        SELECT COUNT(*) AS TOTAL 
        FROM DSEDAC.ART
        WHERE BLOQUEADOSN IS NULL OR BLOQUEADOSN = '' OR BLOQUEADOSN = 'N'
      `;
      const activos = await connection.query(activosQuery);

      // Productos bloqueados
      const bloqueadosQuery = `
        SELECT COUNT(*) AS TOTAL 
        FROM DSEDAC.ART
        WHERE BLOQUEADOSN = 'S' OR BLOQUEADOSN = 'Y'
      `;
      const bloqueados = await connection.query(bloqueadosQuery);

      // Productos sin familia
      const sinFamiliaQuery = `
        SELECT COUNT(*) AS TOTAL 
        FROM DSEDAC.ART
        WHERE CODIGOFAMILIA IS NULL OR TRIM(CODIGOFAMILIA) = ''
      `;
      const sinFamilia = await connection.query(sinFamiliaQuery);

      this.resultados.estadisticas.productos = {
        total: total[0].TOTAL,
        activos: activos[0].TOTAL,
        bloqueados: bloqueados[0].TOTAL,
        sinFamilia: sinFamilia[0].TOTAL,
        porcentajeActivos: ((activos[0].TOTAL / total[0].TOTAL) * 100).toFixed(2)
      };

      console.log(`✅ Total productos: ${total[0].TOTAL}`);
      console.log(`✅ Productos activos: ${activos[0].TOTAL} (${this.resultados.estadisticas.productos.porcentajeActivos}%)`);
      console.log(`⚠️  Productos bloqueados: ${bloqueados[0].TOTAL}`);
      console.log(`⚠️  Productos sin familia: ${sinFamilia[0].TOTAL}`);

      // Obtener muestra de productos bloqueados
      const muestraBloqueadosQuery = `
        SELECT 
          CODIGOARTICULO,
          DESCRIPCIONARTICULO,
          BLOQUEADOSN
        FROM DSEDAC.ART
        WHERE BLOQUEADOSN = 'S' OR BLOQUEADOSN = 'Y'
        FETCH FIRST 10 ROWS ONLY
      `;
      const muestraBloqueados = await connection.query(muestraBloqueadosQuery);
      this.resultados.muestras.productosBloqueados = muestraBloqueados;

      if (bloqueados[0].TOTAL > 0) {
        this.resultados.problemas.push({
          severidad: 'MEDIA',
          categoria: 'ESTADO_PRODUCTOS',
          mensaje: `${bloqueados[0].TOTAL} productos están bloqueados y no deberían mostrarse a clientes`,
          solucion: 'Filtrar productos con BLOQUEADOSN IS NULL OR BLOQUEADOSN = \'\' en todas las consultas'
        });
      }

    } catch (error) {
      console.error('❌ Error analizando estado de productos:', error);
      throw error;
    }
  }

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 2. ANÁLISIS DE PRECIOS Y TARIFAS
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  async analizarPrecios(connection) {
    console.log('\n💰 ANALIZANDO PRECIOS Y TARIFAS...\n');

    try {
      // Análisis de precios en LAC (Líneas de Albarán)
      const preciosQuery = `
        SELECT 
          COUNT(*) AS TOTAL_LINEAS,
          COUNT(DISTINCT CODIGOARTICULO) AS PRODUCTOS_UNICOS,
          COUNT(DISTINCT CODIGOCLIENTEFACTURA) AS CLIENTES_UNICOS,
          MIN(PRECIOVENTA) AS PRECIO_MIN,
          MAX(PRECIOVENTA) AS PRECIO_MAX,
          AVG(PRECIOVENTA) AS PRECIO_MEDIO,
          SUM(CASE WHEN PRECIOVENTA <= 0 THEN 1 ELSE 0 END) AS PRECIOS_CERO_NEGATIVOS,
          SUM(CASE WHEN PRECIOVENTA < 0.01 THEN 1 ELSE 0 END) AS PRECIOS_MUY_BAJOS,
          SUM(CASE WHEN PRECIOVENTA > 1000 THEN 1 ELSE 0 END) AS PRECIOS_MUY_ALTOS
        FROM DSEDAC.LAC
        WHERE PRECIOVENTA IS NOT NULL
      `;
      const precios = await connection.query(preciosQuery);
      const statsPrecios = precios[0];

      this.resultados.estadisticas.precios = {
        totalLineas: statsPrecios.TOTAL_LINEAS,
        productosUnicos: statsPrecios.PRODUCTOS_UNICOS,
        clientesUnicos: statsPrecios.CLIENTES_UNICOS,
        precioMinimo: parseFloat(statsPrecios.PRECIO_MIN || 0),
        precioMaximo: parseFloat(statsPrecios.PRECIO_MAX || 0),
        precioMedio: parseFloat(statsPrecios.PRECIO_MEDIO || 0),
        preciosCeroNegativos: statsPrecios.PRECIOS_CERO_NEGATIVOS,
        preciosMuyBajos: statsPrecios.PRECIOS_MUY_BAJOS,
        preciosMuyAltos: statsPrecios.PRECIOS_MUY_ALTOS
      };

      console.log(`✅ Líneas de albarán analizadas: ${statsPrecios.TOTAL_LINEAS}`);
      console.log(`✅ Productos únicos con precio: ${statsPrecios.PRODUCTOS_UNICOS}`);
      console.log(`✅ Precio medio: ${parseFloat(statsPrecios.PRECIO_MEDIO || 0).toFixed(2)}€`);
      console.log(`✅ Rango de precios: ${parseFloat(statsPrecios.PRECIO_MIN || 0).toFixed(2)}€ - ${parseFloat(statsPrecios.PRECIO_MAX || 0).toFixed(2)}€`);

      if (statsPrecios.PRECIOS_CERO_NEGATIVOS > 0) {
        console.log(`⚠️  Precios <= 0: ${statsPrecios.PRECIOS_CERO_NEGATIVOS}`);
        this.resultados.problemas.push({
          severidad: 'ALTA',
          categoria: 'PRECIOS_ANOMALOS',
          mensaje: `${statsPrecios.PRECIOS_CERO_NEGATIVOS} líneas tienen precio <= 0`,
          solucion: 'Filtrar productos con PRECIOVENTA > 0.01 para evitar mostrar precios anómalos'
        });
      }

      if (statsPrecios.PRECIOS_MUY_BAJOS > 0) {
        console.log(`⚠️  Precios < 0.01€: ${statsPrecios.PRECIOS_MUY_BAJOS}`);
        this.resultados.problemas.push({
          severidad: 'MEDIA',
          categoria: 'PRECIOS_ANOMALOS',
          mensaje: `${statsPrecios.PRECIOS_MUY_BAJOS} líneas tienen precio < 0.01€ (posibles revistas o items no vendibles)`,
          solucion: 'Considerar un umbral mínimo de precio (ej: 0.10€) para productos mostrados'
        });
      }

      // Obtener productos con precios muy bajos
      const preciosBajosQuery = `
        SELECT DISTINCT
          ART.CODIGOARTICULO,
          TRIM(ART.DESCRIPCIONARTICULO) AS DESCRIPCION,
          LAC.PRECIOVENTA,
          FAM.DESCRIPCIONFAMILIA
        FROM DSEDAC.LAC AS LAC
        INNER JOIN DSEDAC.ART AS ART 
          ON TRIM(LAC.CODIGOARTICULO) = TRIM(ART.CODIGOARTICULO)
        LEFT JOIN DSEDAC.FAM AS FAM 
          ON TRIM(ART.CODIGOFAMILIA) = TRIM(FAM.CODIGOFAMILIA)
        WHERE LAC.PRECIOVENTA < 0.01 AND LAC.PRECIOVENTA > 0
        ORDER BY LAC.PRECIOVENTA ASC
        FETCH FIRST 20 ROWS ONLY
      `;
      const preciosBajos = await connection.query(preciosBajosQuery);
      this.resultados.muestras.productosPreciosBajos = preciosBajos;

      if (preciosBajos.length > 0) {
        console.log(`\n📋 Muestra de productos con precios < 0.01€:`);
        preciosBajos.slice(0, 5).forEach(p => {
          console.log(`   - ${p.CODIGOARTICULO}: ${p.DESCRIPCION} - ${parseFloat(p.PRECIOVENTA).toFixed(5)}€ (${p.DESCRIPCIONFAMILIA || 'Sin familia'})`);
        });
      }

      // Análisis de tarifas especiales por cliente
      const tarifasQuery = `
        SELECT 
          COUNT(DISTINCT CODIGOCLIENTEFACTURA) AS CLIENTES_CON_TARIFA,
          COUNT(DISTINCT CODIGOARTICULO) AS PRODUCTOS_CON_TARIFA,
          SUM(CASE WHEN PRECIOVENTA < PRECIOTARIFA01 THEN 1 ELSE 0 END) AS DESCUENTOS_APLICADOS,
          AVG(CASE WHEN PRECIOTARIFA01 > 0 THEN ((PRECIOTARIFA01 - PRECIOVENTA) / PRECIOTARIFA01 * 100) ELSE 0 END) AS DESCUENTO_MEDIO
        FROM DSEDAC.LAC
        WHERE PRECIOVENTA IS NOT NULL 
          AND PRECIOTARIFACLIENTE IS NOT NULL
          AND PRECIOTARIFA01 > 0
      `;
      const tarifas = await connection.query(tarifasQuery);
      const statsTarifas = tarifas[0];

      this.resultados.estadisticas.tarifas = {
        clientesConTarifa: statsTarifas.CLIENTES_CON_TARIFA,
        productosConTarifa: statsTarifas.PRODUCTOS_CON_TARIFA,
        descuentosAplicados: statsTarifas.DESCUENTOS_APLICADOS,
        descuentoMedio: parseFloat(statsTarifas.DESCUENTO_MEDIO || 0).toFixed(2)
      };

      console.log(`\n✅ Clientes con tarifas especiales: ${statsTarifas.CLIENTES_CON_TARIFA}`);
      console.log(`✅ Productos con tarifas especiales: ${statsTarifas.PRODUCTOS_CON_TARIFA}`);
      console.log(`✅ Descuento medio aplicado: ${this.resultados.estadisticas.tarifas.descuentoMedio}%`);

    } catch (error) {
      console.error('❌ Error analizando precios:', error);
      throw error;
    }
  }

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 3. ANÁLISIS DE IVA Y TIPOS IMPOSITIVOS
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  async analizarIVA(connection) {
    console.log('\n📊 ANALIZANDO IVA Y TIPOS IMPOSITIVOS...\n');

    try {
      // Tipos de IVA configurados
      const tiposIVAQuery = `
        SELECT 
          CODIGOIVA,
          PORCENTAJEIVA
        FROM DSEDAC.TAB01
        WHERE PORCENTAJEIVA IS NOT NULL
        ORDER BY CODIGOIVA
      `;
      const tiposIVA = await connection.query(tiposIVAQuery);

      console.log(`✅ Tipos de IVA configurados: ${tiposIVA.length}`);
      tiposIVA.forEach(iva => {
        console.log(`   - Código ${iva.CODIGOIVA}: ${parseFloat(iva.PORCENTAJEIVA).toFixed(2)}%`);
      });

      this.resultados.estadisticas.iva = {
        tiposConfigurados: tiposIVA.length,
        tipos: tiposIVA.map(iva => ({
          codigo: iva.CODIGOIVA,
          porcentaje: parseFloat(iva.PORCENTAJEIVA)
        }))
      };

      // Distribución de productos por tipo de IVA
      const distribucionIVAQuery = `
        SELECT 
          ART.CODIGOIVA,
          TAB.PORCENTAJEIVA,
          COUNT(*) AS TOTAL_PRODUCTOS
        FROM DSEDAC.ART AS ART
        LEFT JOIN DSEDAC.TAB01 AS TAB 
          ON ART.CODIGOIVA = TAB.CODIGOIVA
        WHERE (ART.BLOQUEADOSN IS NULL OR ART.BLOQUEADOSN = '')
        GROUP BY ART.CODIGOIVA, TAB.PORCENTAJEIVA
        ORDER BY TOTAL_PRODUCTOS DESC
      `;
      const distribucion = await connection.query(distribucionIVAQuery);

      console.log(`\n✅ Distribución de productos por IVA:`);
      distribucion.forEach(dist => {
        console.log(`   - IVA ${dist.PORCENTAJEIVA ? parseFloat(dist.PORCENTAJEIVA).toFixed(2) : 'N/A'}% (Código ${dist.CODIGOIVA}): ${dist.TOTAL_PRODUCTOS} productos`);
      });

      this.resultados.estadisticas.iva.distribucion = distribucion;

      // Productos sin IVA configurado
      const sinIVAQuery = `
        SELECT COUNT(*) AS TOTAL
        FROM DSEDAC.ART
        WHERE (BLOQUEADOSN IS NULL OR BLOQUEADOSN = '')
          AND (CODIGOIVA IS NULL OR CODIGOIVA = 0)
      `;
      const sinIVA = await connection.query(sinIVAQuery);

      if (sinIVA[0].TOTAL > 0) {
        console.log(`⚠️  Productos sin IVA configurado: ${sinIVA[0].TOTAL}`);
        this.resultados.problemas.push({
          severidad: 'MEDIA',
          categoria: 'IVA',
          mensaje: `${sinIVA[0].TOTAL} productos no tienen IVA configurado`,
          solucion: 'Asignar código de IVA por defecto o revisar configuración fiscal'
        });
      }

    } catch (error) {
      console.error('❌ Error analizando IVA:', error);
      throw error;
    }
  }

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 4. ANÁLISIS DE UNIDADES DE VENTA Y EMBALAJE
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  async analizarUnidades(connection) {
    console.log('\n📦 ANALIZANDO UNIDADES DE VENTA Y EMBALAJE...\n');

    try {
      // Tipos de unidades de medida
      const unidadesMedidaQuery = `
        SELECT DISTINCT
          UNIDADMEDIDA,
          COUNT(*) AS TOTAL_PRODUCTOS
        FROM DSEDAC.ART
        WHERE (BLOQUEADOSN IS NULL OR BLOQUEADOSN = '')
        GROUP BY UNIDADMEDIDA
        ORDER BY TOTAL_PRODUCTOS DESC
      `;
      const unidadesMedida = await connection.query(unidadesMedidaQuery);

      console.log(`✅ Tipos de unidades de medida:`);
      unidadesMedida.forEach(um => {
        console.log(`   - ${um.UNIDADMEDIDA || 'N/A'}: ${um.TOTAL_PRODUCTOS} productos`);
      });

      this.resultados.estadisticas.unidades = {
        tiposUnidades: unidadesMedida.length,
        distribucion: unidadesMedida
      };

      // Estadísticas de embalaje
      const embalajeQuery = `
        SELECT 
          COUNT(*) AS TOTAL,
          AVG(UNIDADESCAJA) AS UNIDADES_CAJA_MEDIA,
          MIN(UNIDADESCAJA) AS UNIDADES_CAJA_MIN,
          MAX(UNIDADESCAJA) AS UNIDADES_CAJA_MAX,
          SUM(CASE WHEN UNIDADESCAJA IS NULL OR UNIDADESCAJA = 0 THEN 1 ELSE 0 END) AS SIN_UNIDADES_CAJA,
          AVG(PESO) AS PESO_MEDIO,
          SUM(CASE WHEN PESO IS NULL OR PESO = 0 THEN 1 ELSE 0 END) AS SIN_PESO
        FROM DSEDAC.ART
        WHERE (BLOQUEADOSN IS NULL OR BLOQUEADOSN = '')
      `;
      const embalaje = await connection.query(embalajeQuery);
      const statsEmbalaje = embalaje[0];

      this.resultados.estadisticas.embalaje = {
        unidadesCajaMedia: parseFloat(statsEmbalaje.UNIDADES_CAJA_MEDIA || 1).toFixed(2),
        unidadesCajaMin: statsEmbalaje.UNIDADES_CAJA_MIN || 0,
        unidadesCajaMax: statsEmbalaje.UNIDADES_CAJA_MAX || 0,
        sinUnidadesCaja: statsEmbalaje.SIN_UNIDADES_CAJA,
        pesoMedio: parseFloat(statsEmbalaje.PESO_MEDIO || 0).toFixed(3),
        sinPeso: statsEmbalaje.SIN_PESO
      };

      console.log(`\n✅ Unidades por caja (media): ${this.resultados.estadisticas.embalaje.unidadesCajaMedia}`);
      console.log(`✅ Peso medio: ${this.resultados.estadisticas.embalaje.pesoMedio} kg`);
      
      if (statsEmbalaje.SIN_UNIDADES_CAJA > 0) {
        console.log(`⚠️  Productos sin unidades/caja: ${statsEmbalaje.SIN_UNIDADES_CAJA}`);
      }

    } catch (error) {
      console.error('❌ Error analizando unidades:', error);
      throw error;
    }
  }

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 5. ANÁLISIS DE FAMILIAS Y CATEGORÍAS
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  async analizarFamilias(connection) {
    console.log('\n🏷️  ANALIZANDO FAMILIAS Y CATEGORÍAS...\n');

    try {
      // Total de familias
      const totalFamiliasQuery = `
        SELECT COUNT(*) AS TOTAL FROM DSEDAC.FAM
      `;
      const totalFamilias = await connection.query(totalFamiliasQuery);

      // Familias con productos activos
      const familiasActivasQuery = `
        SELECT 
          FAM.CODIGOFAMILIA,
          TRIM(FAM.DESCRIPCIONFAMILIA) AS DESCRIPCION,
          COUNT(ART.CODIGOARTICULO) AS TOTAL_PRODUCTOS
        FROM DSEDAC.FAM AS FAM
        LEFT JOIN DSEDAC.ART AS ART 
          ON TRIM(FAM.CODIGOFAMILIA) = TRIM(ART.CODIGOFAMILIA)
          AND (ART.BLOQUEADOSN IS NULL OR ART.BLOQUEADOSN = '')
        GROUP BY FAM.CODIGOFAMILIA, FAM.DESCRIPCIONFAMILIA
        HAVING COUNT(ART.CODIGOARTICULO) > 0
        ORDER BY TOTAL_PRODUCTOS DESC
      `;
      const familiasActivas = await connection.query(familiasActivasQuery);

      console.log(`✅ Total familias: ${totalFamilias[0].TOTAL}`);
      console.log(`✅ Familias con productos activos: ${familiasActivas.length}`);

      console.log(`\n📋 Top 15 familias por número de productos:`);
      familiasActivas.slice(0, 15).forEach((fam, idx) => {
        console.log(`   ${idx + 1}. ${fam.DESCRIPCION}: ${fam.TOTAL_PRODUCTOS} productos`);
      });

      this.resultados.estadisticas.familias = {
        totalFamilias: totalFamilias[0].TOTAL,
        familiasActivas: familiasActivas.length,
        topFamilias: familiasActivas.slice(0, 15)
      };

      // Familias vacías (sin productos activos)
      const familiasVaciasQuery = `
        SELECT COUNT(*) AS TOTAL
        FROM DSEDAC.FAM AS FAM
        WHERE NOT EXISTS (
          SELECT 1 FROM DSEDAC.ART AS ART
          WHERE TRIM(ART.CODIGOFAMILIA) = TRIM(FAM.CODIGOFAMILIA)
            AND (ART.BLOQUEADOSN IS NULL OR ART.BLOQUEADOSN = '')
        )
      `;
      const familiasVacias = await connection.query(familiasVaciasQuery);

      if (familiasVacias[0].TOTAL > 0) {
        console.log(`\n⚠️  Familias sin productos activos: ${familiasVacias[0].TOTAL}`);
      }

    } catch (error) {
      console.error('❌ Error analizando familias:', error);
      throw error;
    }
  }

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 6. GENERACIÓN DE RECOMENDACIONES
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  generarRecomendaciones() {
    console.log('\n💡 GENERANDO RECOMENDACIONES...\n');

    this.resultados.recomendaciones = [
      {
        prioridad: 'CRÍTICA',
        titulo: 'Filtrado de productos bloqueados',
        descripcion: 'Siempre filtrar productos con (BLOQUEADOSN IS NULL OR BLOQUEADOSN = \'\') en todas las consultas',
        implementacion: 'Agregar filtro en productsService.obtenerProductos() y obtenerProducto()'
      },
      {
        prioridad: 'CRÍTICA',
        titulo: 'Validación de precios mínimos',
        descripcion: 'No mostrar productos con precios <= 0.10€ (revistas, items no vendibles)',
        implementacion: 'Agregar filtro WHERE PRECIOVENTA > 0.10 en consultas de productos'
      },
      {
        prioridad: 'ALTA',
        titulo: 'Cálculo dinámico de precios por cliente',
        descripcion: 'Obtener precio personalizado desde LAC usando el último precio vendido al cliente',
        implementacion: 'Implementado en productsService con subconsultas optimizadas'
      },
      {
        prioridad: 'ALTA',
        titulo: 'Mostrar descuentos aplicados',
        descripcion: 'Cuando el precio del cliente < precio base, calcular y mostrar % descuento',
        implementacion: 'Agregar campo "porcentajeDescuento" en response de productos'
      },
      {
        prioridad: 'MEDIA',
        titulo: 'Cache de precios',
        descripcion: 'Cachear precios de productos por cliente durante 5-10 minutos',
        implementacion: 'Usar Redis o cache en memoria con TTL apropiado'
      },
      {
        prioridad: 'MEDIA',
        titulo: 'Información completa de IVA',
        descripcion: 'Incluir porcentaje de IVA en respuesta de productos',
        implementacion: 'JOIN con TAB01 para obtener PORCENTAJEIVA'
      },
      {
        prioridad: 'BAJA',
        titulo: 'Stock en tiempo real',
        descripcion: 'Si existe tabla de stock, integrar disponibilidad en respuesta',
        implementacion: 'Investigar tabla de stock (STK, ALM, o similar) y agregar JOIN'
      }
    ];

    this.resultados.recomendaciones.forEach((rec, idx) => {
      console.log(`${idx + 1}. [${rec.prioridad}] ${rec.titulo}`);
      console.log(`   ${rec.descripcion}`);
      console.log(`   → ${rec.implementacion}\n`);
    });
  }

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 7. GUARDADO DE RESULTADOS
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  async guardarResultados() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `AUDITORIA_PRODUCTOS_${timestamp}.json`;
    const filepath = path.join(__dirname, '..', 'logs', filename);

    try {
      await fs.writeFile(
        filepath,
        JSON.stringify(this.resultados, null, 2),
        'utf8'
      );

      console.log(`\n✅ Resultados guardados en: ${filepath}\n`);
    } catch (error) {
      console.error('❌ Error guardando resultados:', error);
    }
  }

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * EJECUCIÓN PRINCIPAL
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  async ejecutar() {
    const startTime = Date.now();
    let connection;

    try {
      console.log('\n═══════════════════════════════════════════════════════════════');
      console.log('   AUDITORÍA EXHAUSTIVA DE PRODUCTOS - GRANJA MARI PEPA');
      console.log('═══════════════════════════════════════════════════════════════\n');

      await odbcPool.initialize();
      connection = await odbcPool.acquire();

      // Ejecutar análisis
      await this.analizarEstadoProductos(connection);
      await this.analizarPrecios(connection);
      await this.analizarIVA(connection);
      await this.analizarUnidades(connection);
      await this.analizarFamilias(connection);
      this.generarRecomendaciones();

      // Guardar resultados
      await this.guardarResultados();

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log('═══════════════════════════════════════════════════════════════');
      console.log(`   AUDITORÍA COMPLETADA EN ${elapsed}s`);
      console.log(`   Problemas detectados: ${this.resultados.problemas.length}`);
      console.log(`   Recomendaciones: ${this.resultados.recomendaciones.length}`);
      console.log('═══════════════════════════════════════════════════════════════\n');

    } catch (error) {
      console.error('\n❌ ERROR DURANTE AUDITORÍA:', error);
      process.exit(1);
    } finally {
      if (connection) {
        await odbcPool.release(connection);
      }
      await odbcPool.close();
      process.exit(0);
    }
  }
}

// Ejecutar auditoría
if (require.main === module) {
  const auditoria = new AuditoriaProductos();
  auditoria.ejecutar();
}

module.exports = AuditoriaProductos;
