# 📊 ESTRUCTURA DETALLADA: INFORME DE MEDIOS (POWER BI)
> Fuente de Datos Única: Vista SQL `JAVIER.V_MEDIOS_POWERBI`

## 🛒 Preparación de Datos (Power Query)
Antes de empezar, asegúrate de que estos campos tienen el tipo correcto:
- **Fechas**: `FECHA_ALTA`, `ANOBAJA`, `ANOINSTALACION` -> Tipo *Fecha* o *Número Entero* (según uso).
- **Geografía**: `PROVINCIA`, `POBLACION` -> Categoría de datos *Lugar/Ciudad*.
- **Métricas**: `FILTRO01`...etc (si contienen valores numéricos).

---

## 1. 🏠 Resumen General (Sheet: `MEDIOS general`)
**Objetivo**: Panorámica del parque de máquinas.

| Visual | Tipo de Gráfico | Campo (Eje/Leyenda) | Campo (Valor) | Filtros Visuales |
| :--- | :--- | :--- | :--- | :--- |
| **KPIs Principales** | Tarjeta (Card) | - | Recuento de `CODIGOMEDIO` | - |
| **Estado del Parque** | Gráfico Circular (Donut) | `ESTADOMEDIO` | Recuento de `CODIGOMEDIO` | - |
| **Distribución Tipo** | Gráfico de Barras | `CATEGORIA` | Recuento de `CODIGOMEDIO` | - |
| **Por Delegación** | Mapa o Barras | `PROVINCIA` o `DELEGACION` | Recuento de `CODIGOMEDIO` | - |

**Filtros de Página (Slicers)**:
- `ESTADOMEDIO` (Activo, Baja, Disponible...)
- `CATEGORIA` (Cafetera, Vitrina...)
- `CODIGO_RUTA_CLIENTE`

---

## 2. 💰 Análisis de Rentabilidad (Sheet: `medios importes ventas`)
**Objetivo**: Cruzar máquinas con clientes.

| Visual | Tipo | Columnas / Filas | Valores |
| :--- | :--- | :--- | :--- |
| **Matriz Detallada** | Matriz | Filas: `NOMBRE_CLIENTE`, `CODIGOMEDIO`<br>Columnas: `ANOFABRICACION` (Opcional) | Valores: Recuento `CODIGOMEDIO` |

*Nota: Para cruzar con Ventas (€), necesitarás hacer una relación en Power BI entre esta vista y tu tabla de Ventas usando `CODIGOCLIENTE`.*

---

## 3. 🟢 Control de Stock (Sheets: DISPONIBLES)
**Objetivo**: Gestión de almacén.

**Filtro Principal de Pestaña**: `ESTADOMEDIO` contiene "DISPONIBLE" o "ALMACEN".

| Visual | Campos utilizados |
| :--- | :--- |
| **Tabla de Stock** | `CODIGOMEDIO`, `DESCRIPCIONMEDIO`, `MARCA`, `NUMEROSERIE`, `UBICACION` (si existe en Observaciones) |
| **Stock por Marca** | Eje: `MARCA` | Valor: Recuento `CODIGOMEDIO` |
| **Antigüedad Stock** | Eje: `ANOFABRICACION` | Valor: Recuento `CODIGOMEDIO` |

---

## 4. 🔴 Control de Bajas (Sheet: `MEDIOS CTES BAJA`)
**Objetivo**: Auditoría de retiradas.

**Filtro Principal de Pestaña**: `ESTADOMEDIO` = "BAJA" o `ANOBAJA` = Año Actual.

| Visual | Campos utilizados |
| :--- | :--- |
| **Listado de Bajas** | `FECHA_BAJA` (Calculada con `ANOBAJA`/`MESBAJA`), `NOMBRE_CLIENTE`, `MOTIVOVENTA`, `DESCRIPCIONMEDIO` |
| **Motivos de Baja** | Eje: `MOTIVOVENTA` | Valor: Recuento `CODIGOMEDIO` |

---

## 5. ❄️ Vitrinas y Frío (Sheets: VITRINAS / FRAPE)
**Objetivo**: Maquinaria específica de frío.

**Filtro Principal**: `CATEGORIA` IN ("VITRINA", "FRAPE", "GRANIZADORA").

| Visual | Campos utilizados |
| :--- | :--- |
| **Mapa de Frío** | Ubicación: `POBLACION` | Tamaño: Recuento `CODIGOMEDIO` |
| **Detalle Técnico** | Tabla: `MODELO`, `NUMEROSERIE`, `ANOFABRICACION`, `ESTADOMEDIO` |

---

## 6. 📍 Análisis Nestlé (Sheet: `MEDIOS CONSUMO NESTLE`)
**Objetivo**: Auditoría de marca específica.

**Filtro Principal**: `DESCRIPCIONMEDIO` contiene "NESTLE" o "NESTLÉ".

| Visual | Campos utilizados |
| :--- | :--- |
| **Parque Nestlé** | Tarjeta: Recuento `CODIGOMEDIO` |
| **Modelos Nestlé** | Gráfico Barras: Eje `CODIGOMODELOMEDIO` |

---

## 📝 Diccionario de Campos Clave (Vista `JAVIER.V_MEDIOS_POWERBI`)

- **`CODIGOMEDIO`**: ID único de la máquina (Úsalo para recuentos).
- **`DESCRIPCION_MEDIO`**: Nombre INTELIGENTE (Prioriza descripción manual, si no existe usa la del modelo).
- **`ESTADOMEDIO`**: Estado calculado (BAJA, DISPONIBLE, ALMACEN, ACTIVO).
- **`CATEGORIA`**: Clasificación automática:
  - `CONGELADOR`
  - `VITRINA`
  - `FRAPE`
  - `HORNO`
  - `VEHICULO`
  - `CHATARRA`
  - `OTRO`
- **`NOMBRE_CLIENTE`**: Cliente donde está instalada.
- **`POBLACION` / `PROVINCIA`**: Para mapas.
- **`CODIGO_RUTA_CLIENTE`**: Ruta de reparto.
- **`ANO_BAJA_CALC`**: Año de baja (número entero).
- **`FECHA_ALTA`**: Fecha de alta formateada.
