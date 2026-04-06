# Respuesta profesional para el cliente

---

## Asunto: Re: Discrepancias en facturas - Restaurante La Patrona SL

**Para:** Restaurante La Patrona SL  
**De:** Equipo de soporte técnico - Granja Mari Pepa  
**Fecha:** 6 de abril de 2026

---

Estimados Sres. de Restaurante La Patrona SL:

En primer lugar, les pedimos **disculpas** por las molestias que esta incidencia les haya podido ocasionar. Hemos realizado una investigación exhaustiva y queremos trasladarles los resultados de forma transparente.

### ✅ Conclusión directa

**Las facturas correctas son las descargadas individualmente desde el Área de Clientes.** Los importes que figuran en las facturas individuales (F-1233 de 28/02/2026 y F-2473 de 31/03/2026) son los correctos.

### 🔍 Causa identificada

Hemos detectado un **error en nuestro sistema** que afectaba exclusivamente al **Libro de IVA Repercutido** (el listado resumen de facturas emitidas). Concretamente:

| Concepto | Detalle |
|----------|---------|
| **Qué falló** | El proceso que genera el Libro de IVA **recalculaba incorrectamente** los importes de IVA para ciertas facturas |
| **Qué NO falló** | Las facturas individuales (los PDFs que descargan factura a factura) siempre fueron correctas |
| **Por qué** | Una suposición técnica incorrecta sobre cómo el sistema ERP organiza internamente los tipos de IVA |
| **Alcance** | Este error afectaba al listado resumen (Libro de IVA), no a las facturas individuales |

### 📊 Detalle de las facturas mencionadas

**Factura F-1233 - 28/02/2026:**
| Concepto | Factura individual (✅ CORRECTA) | Libro IVA anterior (❌ INCORRECTO) |
|----------|-------------------------------|----------------------------------|
| Base imponible 10% | 886,49 € | 430,91 € |
| Base imponible 4% | 23,72 € | 23,72 € |
| **Total con IVA** | **999,81 €** | **498,67 €** |

**Factura F-2473 - 31/03/2026:**
| Concepto | Factura individual (✅ CORRECTA) | Libro IVA anterior (❌ INCORRECTO) |
|----------|-------------------------------|----------------------------------|
| Base imponible 10% | 782,87 € | 761,58 € |
| Base imponible 4% | 91,97 € | 91,97 € |
| **Total con IVA** | **956,81 €** | **933,39 €** |

### 🛠️ Medidas adoptadas

1. **Corrección inmediata:** Hemos corregido el código que genera el Libro de IVA para que utilice directamente los valores calculados por nuestro sistema ERP, eliminando cualquier recálculo manual.

2. **Verificación:** Hemos verificado que, tras la corrección, los totales del Libro de IVA coincidirán exactamente con las facturas individuales descargadas.

3. **Próximos pasos:** Le rogamos que, cuando vuelva a generar el Libro de IVA desde el Área de Clientes, los importes aparecerán correctamente alineados con las facturas individuales.

### 📋 Compromiso

Lamentamos profundamente los inconvenientes que esta situación haya podido causarles, especialmente en sus gestiones administrativas y contables. Hemos implementado las correcciones necesarias para que esta incidencia no vuelva a producirse.

Quedamos a su entera disposición para cualquier aclaración adicional que necesiten.

Atentamente,

**Equipo de Soporte Técnico**  
Granja Mari Pepa - Food & Frozen  
📞 639 77 86 56  
📧 pedidos@mari-pepa.com  
🌐 www.mari-pepa.com

---

*Nota interna: Corrección técnica documentada en `ANALISIS_FORENSE_FACTURAS.md` y aplicada en los archivos `libroIvaController.js` y `authController.js`.*
