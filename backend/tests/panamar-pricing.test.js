/**
 * TESTS: precio de cobro Panamar (tarifa vs venta real)
 */

const { resolvePrecioCobro, resolveImporteCobro } = require('../app/services/panamarPricing');

describe('PANAMAR pricing', () => {
  const round2 = (n) => Math.round((n || 0) * 100) / 100;

  it('uses tarifa when it is lower than precioVenta', () => {
    const { precioCobro, importeCobro, cantidadCobro } = resolveImporteCobro({
      precioTarifa: 25.82,
      precioVenta: 30.00,
      cajas: 3,
      unidades: 15,
      descuento: 0,
      importeVenta: 90,
      tipoVenta: 'CC'
    });

    expect(precioCobro).toBe(25.82);
    expect(cantidadCobro).toBe(3);
    expect(round2(importeCobro)).toBe(77.46);
  });

  it('uses precioVenta when it is lower than tarifa', () => {
    const { precioCobro, importeCobro } = resolveImporteCobro({
      precioTarifa: 37.71,
      precioVenta: 20.88,
      cajas: 1,
      unidades: 1,
      descuento: 0,
      importeVenta: 20.88,
      tipoVenta: 'CC'
    });

    expect(precioCobro).toBe(20.88);
    expect(round2(importeCobro)).toBe(20.88);
  });

  it('keeps tarifa when precioVenta is 0', () => {
    expect(resolvePrecioCobro(37.71, 0)).toBe(37.71);
  });

  it('falls back to precioVenta when tarifa is 0', () => {
    const { precioCobro, importeCobro } = resolveImporteCobro({
      precioTarifa: 0,
      precioVenta: 1.50,
      cajas: 1,
      unidades: 10,
      descuento: 0,
      importeVenta: 15.00,
      tipoVenta: 'CC'
    });

    expect(precioCobro).toBe(1.50);
    expect(importeCobro).toBe(15.00);
  });

  it('uses unidades when cajas is 0', () => {
    const { cantidadCobro, importeCobro } = resolveImporteCobro({
      precioTarifa: 10.00,
      precioVenta: 12.00,
      cajas: 0,
      unidades: 5.4,
      descuento: 0,
      importeVenta: 64.80,
      tipoVenta: 'CC'
    });

    expect(cantidadCobro).toBe(5.4);
    expect(round2(importeCobro)).toBe(54.00);
  });

  it('applies line discount on the chosen unit price', () => {
    const { precioCobro, importeCobro } = resolveImporteCobro({
      precioTarifa: 27.10,
      precioVenta: 40.00,
      cajas: 3,
      unidades: 3,
      descuento: 40,
      importeVenta: 72,
      tipoVenta: 'CC'
    });

    expect(precioCobro).toBe(27.10);
    expect(round2(importeCobro)).toBe(48.78);
  });

  it('zeros importe for SC lines while keeping the chosen unit price', () => {
    const { precioCobro, importeCobro, isSinCargo } = resolveImporteCobro({
      precioTarifa: 49.25,
      precioVenta: 49.25,
      cajas: 2,
      unidades: 2,
      descuento: 40,
      importeVenta: 0,
      tipoVenta: 'SC'
    });

    expect(isSinCargo).toBe(true);
    expect(precioCobro).toBe(49.25);
    expect(importeCobro).toBe(0);
  });
});
