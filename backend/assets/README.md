# Assets - Mari Pepa

Esta carpeta contiene los recursos estáticos necesarios para la generación de PDFs.

## Header Corporativo

Para que los PDFs de facturas y libro de IVA muestren el header corporativo de Mari Pepa con el logo y distribuidores, coloca aquí la imagen del header:

### Archivo requerido:
- **header.webp** o **header.png**

### Especificaciones:
- **Formato**: WEBP o PNG
- **Ancho recomendado**: 500-750 px para facturas, 750-800 px para libro IVA
- **Alto recomendado**: 80-120 px
- **Contenido**: Logo de Mari Pepa, distribuidores (Nestlé, Panamar, Grupo Topgel), información del almacén frigorífico

### Sin imagen header:
Si no se encuentra el archivo `header.webp` o `header.png`, se generará automáticamente un header de texto con:
- Nombre: Mari Pepa Food & Frozen
- Slogan: Congelados y refrigerados para hostelería
- Web: www.mari-pepa.com

## Instrucciones

1. Obtén la imagen del header corporativo actual
2. Guárdala en esta carpeta como `header.webp` o `header.png`
3. Reinicia el servidor backend
4. Los PDFs se generarán automáticamente con el header corporativo

## Convertir WEBP a PNG (opcional)

Si tienes el header en formato WEBP y prefieres PNG, ejecuta:

```powershell
cd backend\scripts\setup
.\convert-header.ps1
```

Este script convertirá `header.webp` a `header.png` automáticamente.
