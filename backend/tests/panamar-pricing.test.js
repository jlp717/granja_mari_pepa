/**
 * TESTS: precio de cobro Panamar (tarifa vs venta real)
 */

const fs = require('fs');
const path = require('path');
const {
  resolvePrecioCobro,
  resolveImporteCobro,
  resolveCodigoTarifaValoracion,
  TARIFA_PANAMAR_SQL,
  TARIFAS_VALORACION_SQL
} = require('../app/services/panamarPricing');

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

describe('PANAMAR valuation tariff from 2026-11-01', () => {
  it('keeps January sales before the cutoff on tariff 84', () => {
    expect(resolveCodigoTarifaValoracion({ year: 2026, month: 1, day: 15 })).toBe(84);
    expect(resolveCodigoTarifaValoracion({ year: 2025, month: 1, day: 1 })).toBe(84);
  });

  it('keeps the other months before the cutoff on tariff 85', () => {
    expect(resolveCodigoTarifaValoracion({ year: 2026, month: 2, day: 1 })).toBe(85);
    expect(resolveCodigoTarifaValoracion({ year: 2026, month: 10, day: 31 })).toBe(85);
  });

  it('uses tariff 86 from 1 November 2026 inclusive, including later Januaries', () => {
    expect(resolveCodigoTarifaValoracion({ year: 2026, month: 11, day: 1 })).toBe(86);
    expect(resolveCodigoTarifaValoracion({ year: 2026, month: 12, day: 31 })).toBe(86);
    expect(resolveCodigoTarifaValoracion({ year: 2027, month: 1, day: 1 })).toBe(86);
  });

  it('builds the invoice SQL with the same cutoff and still loads tariffs 84, 85 and 86', () => {
    expect(TARIFA_PANAMAR_SQL).toBe(
      'CASE WHEN (CAC.ANODOCUMENTO * 10000 + CAC.MESDOCUMENTO * 100 + CAC.DIADOCUMENTO) >= 20261101 THEN 86 WHEN CAC.MESDOCUMENTO = 1 THEN 84 ELSE 85 END'
    );
    expect(TARIFAS_VALORACION_SQL).toBe('84, 85, 86');
  });

  it('wires that SQL into the live Panamar invoice query', () => {
    const serviceSource = fs.readFileSync(
      path.join(__dirname, '../app/services/panamarService.js'),
      'utf8'
    );

    expect(serviceSource).toContain('${TARIFA_PANAMAR_SQL}');
    expect(serviceSource).toContain('IN (${TARIFAS_VALORACION_SQL})');
    expect(serviceSource).not.toMatch(/CODIGOTARIFA IN \(84,\s*85\)/);
    expect(serviceSource).not.toContain('CASE WHEN CAC.MESDOCUMENTO = 1 THEN 84 ELSE 85 END');
  });
});
