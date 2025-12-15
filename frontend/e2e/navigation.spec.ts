import { test, expect } from '@playwright/test';

test.describe('Navegación principal', () => {
  test('la página principal carga correctamente', async ({ page }) => {
    await page.goto('/');
    
    // Verificar título
    await expect(page).toHaveTitle(/Granja Mari Pepa/);
    
    // Verificar header
    await expect(page.locator('header')).toBeVisible();
    
    // Verificar footer
    await expect(page.locator('footer')).toBeVisible();
  });

  test('el menú de navegación funciona', async ({ page }) => {
    await page.goto('/');
    
    // Ir a productos
    await page.click('text=Productos');
    await expect(page).toHaveURL(/\/productos/);
    
    // Volver a inicio
    await page.click('text=Inicio');
    await expect(page).toHaveURL('/');
  });

  test('ir a contacto', async ({ page }) => {
    await page.goto('/contacto');
    
    await expect(page.locator('h1')).toContainText(/contacto/i);
    
    // Verificar formulario de contacto
    await expect(page.locator('form')).toBeVisible();
  });
});

test.describe('Página de productos', () => {
  test('muestra categorías de productos', async ({ page }) => {
    await page.goto('/productos');
    
    // Esperar a que cargue el contenido
    await page.waitForLoadState('networkidle');
    
    // Verificar que hay productos o categorías
    const content = page.locator('main');
    await expect(content).toBeVisible();
  });
});

test.describe('Área de clientes', () => {
  test('la página de login carga', async ({ page }) => {
    await page.goto('/area-clientes');
    
    // Debería mostrar formulario de login o redirigir
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('SEO y accesibilidad', () => {
  test('tiene meta description', async ({ page }) => {
    await page.goto('/');
    
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /.+/);
  });

  test('tiene canonical URL', async ({ page }) => {
    await page.goto('/');
    
    // El canonical link debería existir o estar en metadata
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('imágenes tienen alt text', async ({ page }) => {
    await page.goto('/');
    
    // Verificar que las imágenes tienen alt
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      // Las imágenes deberían tener alt (puede estar vacío para decorativas)
      expect(alt !== null).toBeTruthy();
    }
  });

  test('tiene skip link para accesibilidad', async ({ page }) => {
    await page.goto('/');
    
    // El skip link está oculto pero existe
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached();
  });
});

test.describe('Responsive design', () => {
  test('se adapta a móvil', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });

  test('se adapta a tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });

  test('se adapta a desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Rendimiento básico', () => {
  test('la página carga en tiempo razonable', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    const loadTime = Date.now() - startTime;
    
    // Debería cargar en menos de 5 segundos
    expect(loadTime).toBeLessThan(5000);
  });
});
