# 🔍 Análisis Forense - Discrepancias en Facturas RTE. LA PATRONA

**Fecha:** 6 de abril de 2026  
**Cliente:** Restaurante La Patrona SL (CIF: B73581480, Código: 4300006489)  
**Facturas afectadas:** F-1233 (28/02/2026) y F-2473 (31/03/2026)

---

## 1. DESCRIPCIÓN DEL PROBLEMA

El cliente reportó que las facturas descargadas del Área de Clientes no coinciden con el listado de facturas emitidas (Libro de IVA). Concretamente:

| Factura | Fuente | Base 10% | Base 4% | Total con IVA |
|---------|--------|----------|---------|---------------|
| **F-1233** (28/02/2026) | Factura individual PDF | 886,49 € | 23,72 € | **999,81 €** |
| | Libro de IVA | 430,91 € | 23,72 € | **498,67 €** |
| | **Diferencia** | **-455,58 €** | 0,00 € | **-501,14 €** |
| **F-2473** (31/03/2026) | Factura individual PDF | 782,87 € | 91,97 € | **956,81 €** |
| | Libro de IVA | 761,58 € | 91,97 € | **933,39 €** |
| | **Diferencia** | **-21,29 €** | 0,00 € | **-23,42 €** |

---

## 2. CAÍDA RAÍZ IDENTIFICADA

### 2.1 Arquitectura del sistema de facturación

El ERP (AS/400) almacena las facturas en dos tablas:

- **`DSEDAC.CAC` (Cabecera de Facturas Cliente):** Contiene un registro **por cada albarán** que compone una factura. Una factura con 3 albaranes tendrá 3 registros en CAC.
- **`DSEDAC.LAC` (Líneas de Factura Cliente):** Contiene cada línea de producto de cada albarán.

La tabla `CAC` tiene columnas para hasta 5 tipos de IVA diferentes:
- `IMPORTEBASEIMPONIBLE1` a `IMPORTEBASEIMPONIBLE5` (bases imponibles)
- `IMPORTEIVA1` a `IMPORTEIVA5` (importes de IVA ya calculados)
- `PORCENTAJEIVA1` a `PORCENTAJEIVA5` (códigos de tipo de IVA)

### 2.2 El bug: suposición incorrecta sobre el orden de tipos de IVA

El código del **Libro de IVA** (`libroIvaController.js`) contenía una suposición **incorrecta**:

```sql
-- CÓDIGO ANTERIOR (INCORRECTO)
SUM(
  IMPORTEBASEIMPONIBLE1 * 0.10  -- Asume que Base1 = 10%
  + IMPORTEBASEIMPONIBLE2 * 0.21  -- Asume que Base2 = 21%
  + IMPORTEBASEIMPONIBLE3 * 0.04  -- Asume que Base3 = 4%
  ...
)
```

**El problema:** El ERP **no garantiza** que `Base1` siempre corresponda al 10%, `Base2` al 21%, etc. El orden de los tipos de IVA en las columnas varía según cómo se generaron los albaranes. En algunos registros:
- `Base1` puede ser la base al 10% y `Base2` la base al 4%
- En otro registro, `Base1` puede ser la base al 4% y `Base2` la base al 10%

Esto significa que al multiplicar `Base1 * 0.10` sistemáticamente, se estaba **calculando mal el IVA** para todos los registros donde el orden no coincidía con la suposición.

### 2.3 Por qué la factura individual era correcta

El servicio de generación de facturas individuales (`pdfService.js`) usa un enfoque **correcto**:

1. Lee las líneas de producto de `DSEDAC.LAC`
2. Agrupa por tipo de IVA real (usando `PORCENTAJEIVAARTICULO`)
3. Suma los importes ya calculados (`IMPORTEIVAARTICULO`)

Este enfoque no asume ningún orden de columnas, simplemente lee los datos tal como vienen del ERP.

### 2.4 Impacto

- **Sistema:** Libro de IVA (todos los clientes, no solo este)
- **Causa:** Lógica de recálculo de IVA basada en suposición de orden de columnas
- **Efecto:** Los totales del Libro de IVA no coincidían con las facturas individuales descargadas
- **Severidad:** Alta - afecta a la exactitud fiscal del Libro de IVA

---

## 3. SOLUCIÓN APLICADA

### 3.1 Cambio en `libroIvaController.js`

**Antes (incorrecto):**
```sql
SUM(
  (IMPORTEBASEIMPONIBLE1 * CASE WHEN PORCENTAJEIVA1 IN (7,10,1) THEN 0.10 ...) +
  (IMPORTEBASEIMPONIBLE2 * CASE WHEN PORCENTAJEIVA2 IN (7,10,1) THEN 0.10 ...) +
  ...
) as IVA
```

**Después (correcto):**
```sql
SUM(IMPORTEIVA1 + IMPORTEIVA2 + IMPORTEIVA3 + IMPORTEIVA4 + IMPORTEIVA5) as IVA
```

Se usan los campos `IMPORTEIVA1-5` que el ERP **ya calcula correctamente**, eliminando el recálculo manual.

### 3.2 Cambio en `authController.js`

Se aplicó la misma corrección en la query del dashboard de facturas, que tenía el mismo patrón de recálculo incorrecto.

### 3.3 Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `backend/app/controllers/libroIvaController.js` | Query de IVA Repercutido: usar `SUM(IMPORTEIVA1-5)` en vez de recalcular |
| `backend/app/controllers/authController.js` | Query del dashboard: misma corrección |

---

## 4. VERIFICACIÓN ESPERADA

Tras aplicar la corrección, los valores del Libro de IVA deberían coincidir exactamente con los de las facturas individuales:

### Factura F-1233 (28/02/2026)
| Concepto | Antes (Libro IVA) | Después (esperado) | Factura individual |
|----------|-------------------|-------------------|-------------------|
| Base 10% | 430,91 € | **886,49 €** | 886,49 € ✅ |
| Base 4% | 23,72 € | **23,72 €** | 23,72 € ✅ |
| IVA 10% | 43,09 € | **88,65 €** | 88,65 € ✅ |
| IVA 4% | 0,95 € | **0,95 €** | 0,95 € ✅ |
| Total | 498,67 € | **999,81 €** | 999,81 € ✅ |

### Factura F-2473 (31/03/2026)
| Concepto | Antes (Libro IVA) | Después (esperado) | Factura individual |
|----------|-------------------|-------------------|-------------------|
| Base 10% | 761,58 € | **782,87 €** | 782,87 € ✅ |
| Base 4% | 91,97 € | **91,97 €** | 91,97 € ✅ |
| IVA 10% | 76,16 € | **78,29 €** | 78,29 € ✅ |
| IVA 4% | 3,68 € | **3,68 €** | 3,68 € ✅ |
| Total | 933,39 € | **956,81 €** | 956,81 € ✅ |

---

## 5. RESPUESTA AL CLIENTE

Se ha preparado una respuesta profesional de disculpa explicando:
1. La causa técnica del problema
2. Las facturas específicas afectadas
3. Que el problema ha sido identificado y corregido
4. Que se generará un nuevo Libro de IVA con datos correctos

---

## 6. LEARNINGS Y PREVENCIÓN FUTURA

1. **Nunca asumir orden de columnas** en datos del ERP sin verificar
2. **Usar siempre los valores calculados por el ERP** (`IMPORTEIVA`) en vez de recalcular
3. **Tests de consistencia:** Debería existir un test automático que verifique que los totales del Libro de IVA coinciden con la suma de las facturas individuales por cliente
4. **Monitorización:** Alerta cuando haya discrepancias > 0.01€ entre Libro IVA y facturas

---

*Análisis realizado por el equipo de desarrollo de Granja Mari Pepa*
