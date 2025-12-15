import os
import subprocess
import sys

def generar_pdf_con_pyppeteer():
    """Genera PDF usando pyppeteer (Chromium sin encabezados)"""
    try:
        from pyppeteer import launch
        import asyncio
        
        async def main():
            browser = await launch()
            page = await browser.newPage()
            html_path = r'file:///C:/Users/Javier/Desktop/Repositorios/granja_mari_pepa/comparativa_servidor_vps.html'
            await page.goto(html_path, {'waitUntil': 'networkidle2'})
            
            # Generar PDF sin encabezados ni pies de página
            await page.pdf({
                'path': r'c:\Users\Javier\Desktop\Repositorios\granja_mari_pepa\comparativa_servidor_vps.pdf',
                'format': 'A4',
                'printBackground': True,
                'margin': {
                    'top': '20mm',
                    'right': '15mm',
                    'bottom': '20mm',
                    'left': '15mm'
                },
                'displayHeaderFooter': False
            })
            
            await browser.close()
            print("✅ PDF generado exitosamente con pyppeteer")
        
        asyncio.get_event_loop().run_until_complete(main())
        return True
        
    except ImportError:
        print("pyppeteer no está instalado")
        return False

def generar_pdf_con_playwright():
    """Genera PDF usando Playwright"""
    try:
        from playwright.sync_api import sync_playwright
        
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()
            html_path = r'file:///C:/Users/Javier/Desktop/Repositorios/granja_mari_pepa/comparativa_servidor_vps.html'
            page.goto(html_path)
            
            page.pdf(
                path=r'c:\Users\Javier\Desktop\Repositorios\granja_mari_pepa\comparativa_servidor_vps.pdf',
                format='A4',
                print_background=True,
                margin={
                    'top': '20mm',
                    'right': '15mm',
                    'bottom': '20mm',
                    'left': '15mm'
                },
                display_header_footer=False
            )
            
            browser.close()
            print("✅ PDF generado exitosamente con Playwright")
        return True
        
    except ImportError:
        print("Playwright no está instalado")
        return False

# Intentar con diferentes métodos
print("Intentando generar PDF limpio...")

if generar_pdf_con_playwright():
    sys.exit(0)
elif generar_pdf_con_pyppeteer():
    sys.exit(0)
else:
    print("\n❌ No se pudo generar el PDF")
    print("Instalando Playwright...")
    subprocess.run([sys.executable, '-m', 'pip', 'install', 'playwright'], check=True)
    subprocess.run([sys.executable, '-m', 'playwright', 'install', 'chromium'], check=True)
    print("\n✅ Playwright instalado. Por favor, ejecuta el script de nuevo.")
