/**
 * Precio de cobro Panamar.
 * Tarifa 84/85 por defecto; si hay precio real de venta > 0 y es menor, se usa ese.
 * Aplica a cualquier artículo: no hay excepciones por código.
 */

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
  resolveImporteCobro
};
