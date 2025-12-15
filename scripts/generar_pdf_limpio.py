#!/usr/bin/env python3
"""
Script para generar PDF limpio sin encabezados ni pies de página del navegador
"""

import sys

try:
    import weasyprint
    from weasyprint import HTML, CSS
    print("WeasyPrint disponible")
    
    # Generar PDF limpio
    html_path = r'c:\Users\Javier\Desktop\Repositorios\granja_mari_pepa\comparativa_servidor_vps.html'
    pdf_path = r'c:\Users\Javier\Desktop\Repositorios\granja_mari_pepa\comparativa_servidor_vps.pdf'
    
    # CSS adicional para mejorar la impresión
    extra_css = CSS(string='''
        @page {
            margin: 2cm;
            size: A4;
            @bottom-center {
                content: counter(page);
                font-size: 10pt;
                color: #666;
            }
        }
        
        body {
            font-size: 10pt;
        }
        
        .header {
            padding: 30px 40px !important;
        }
        
        .content {
            padding: 20px 30px !important;
        }
        
        .section {
            page-break-inside: avoid;
        }
        
        .comparison-grid {
            page-break-inside: avoid;
        }
        
        .cost-table {
            font-size: 9pt;
        }
    ''')
    
    HTML(filename=html_path).write_pdf(pdf_path, stylesheets=[extra_css])
    print(f"✅ PDF generado exitosamente: {pdf_path}")
    
except ImportError:
    print("WeasyPrint no está instalado. Intentando con alternativa...")
    
    try:
        # Alternativa: usar pdfkit (wkhtmltopdf)
        import pdfkit
        
        html_path = r'c:\Users\Javier\Desktop\Repositorios\granja_mari_pepa\comparativa_servidor_vps.html'
        pdf_path = r'c:\Users\Javier\Desktop\Repositorios\granja_mari_pepa\comparativa_servidor_vps.pdf'
        
        options = {
            'page-size': 'A4',
            'margin-top': '20mm',
            'margin-right': '20mm',
            'margin-bottom': '20mm',
            'margin-left': '20mm',
            'encoding': "UTF-8",
            'no-outline': None,
            'enable-local-file-access': None,
            'print-media-type': None,
            'no-stop-slow-scripts': None,
            'disable-smart-shrinking': None,
            # Eliminar encabezados y pies de página
            'header-html': None,
            'footer-html': None,
            'header-spacing': 0,
            'footer-spacing': 0,
        }
        
        pdfkit.from_file(html_path, pdf_path, options=options)
        print(f"✅ PDF generado exitosamente con pdfkit: {pdf_path}")
        
    except ImportError:
        print("❌ No se encontraron bibliotecas para generar PDF")
        print("Instalando WeasyPrint...")
        import subprocess
        subprocess.run(['pip', 'install', 'weasyprint'], check=True)
        print("Por favor, ejecuta el script de nuevo")
