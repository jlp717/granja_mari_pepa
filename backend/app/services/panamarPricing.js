/**
 * Precio de cobro Panamar.
 * La tarifa de valoración sale del albarán: 84 en enero y 85 el resto,
 * hasta el 31/10/2026. Desde el 01/11/2026 la valoración es la tarifa 86.
 * Si hay precio real de venta > 0 y es menor, se usa ese.
 * Aplica a cualquier artículo: no hay excepciones por código.
 */

const TARIFA_ENERO = 84;
const TARIFA_RESTO = 85;
const TARIFA_DESDE_NOVIEMBRE_2026 = 86;
const TARIFA_VALORACION_DESDE_YMD = 20261101;

const TARIFAS_VALORACION_SQL = `${TARIFA_ENERO}, ${TARIFA_RESTO}, ${TARIFA_DESDE_NOVIEMBRE_2026}`;
const TARIFA_PANAMAR_SQL =
  'CASE WHEN (CAC.ANODOCUMENTO * 10000 + CAC.MESDOCUMENTO * 100 + CAC.DIADOCUMENTO) >= ' +
  TARIFA_VALORACION_DESDE_YMD +
  ' THEN ' + TARIFA_DESDE_NOVIEMBRE_2026 +
  ' WHEN CAC.MESDOCUMENTO = 1 THEN ' + TARIFA_ENERO +
  ' ELSE ' + TARIFA_RESTO +
  ' END';

function resolveCodigoTarifaValoracion({ year, month, day }) {
  const ymd = toNumber(year) * 10000 + toNumber(month) * 100 + toNumber(day);
  if (ymd >= TARIFA_VALORACION_DESDE_YMD) return TARIFA_DESDE_NOVIEMBRE_2026;
  return toNumber(month) === 1 ? TARIFA_ENERO : TARIFA_RESTO;
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function resolvePrecioCobro(precioTarifa, precioVenta) {
  const tarifa = toNumber(precioTarifa);
  const venta = toNumber(precioVenta);
  if (tarifa > 0 && venta > 0) {
    return Math.min(tarifa, venta);
  }
  return tarifa > 0 ? tarifa : venta;
}

function resolveImporteCobro({
  precioTarifa,
  precioVenta,
  cajas,
  unidades,
  descuento,
  importeVenta,
  tipoVenta
}) {
  const tipo = String(tipoVenta || '').trim().toUpperCase();
  const isSinCargo = tipo === 'SC';
  const tarifa = toNumber(precioTarifa);
  const precioCobro = resolvePrecioCobro(tarifa, precioVenta);
  const cantidadCobro = toNumber(cajas) > 0 ? toNumber(cajas) : toNumber(unidades);
  const importeCobro = isSinCargo
    ? 0
    : (tarifa > 0
        ? precioCobro * cantidadCobro * (1 - toNumber(descuento) / 100)
        : toNumber(importeVenta));

  return { precioCobro, importeCobro, isSinCargo, cantidadCobro };
}

module.exports = {
  resolvePrecioCobro,
  resolveImporteCobro,
  resolveCodigoTarifaValoracion,
  TARIFA_PANAMAR_SQL,
  TARIFAS_VALORACION_SQL
};
