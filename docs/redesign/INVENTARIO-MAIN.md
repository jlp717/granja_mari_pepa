# Inventario Main V3

Base 592d3a8a531e919c68964fb2ec83d73625551c6f. 11 páginas, 2 especiales. Sin consultas DB, login ni llamadas de negocio.

|Ruta|Clasificación|Fuente|
|---|---|---|
|/[locale]/acerca|marketing|frontend/app/[locale]/acerca/page.tsx|
|/[locale]/area-clientes|transactional|frontend/app/[locale]/area-clientes/page.tsx|
|/[locale]/checkout|transactional|frontend/app/[locale]/checkout/page.tsx|
|/[locale]/contacto|marketing-form|frontend/app/[locale]/contacto/page.tsx|
|/[locale]/legal/privacidad|reading|frontend/app/[locale]/legal/privacidad/page.tsx|
|/[locale]/legal/terminos|reading|frontend/app/[locale]/legal/terminos/page.tsx|
|/[locale]/login-secure-example|transactional|frontend/app/[locale]/login-secure-example/page.tsx|
|/[locale]/lorca|marketing|frontend/app/[locale]/lorca/page.tsx|
|/[locale]/offline|state|frontend/app/[locale]/offline/page.tsx|
|/[locale]|marketing|frontend/app/[locale]/page.tsx|
|/[locale]/productos|transactional-gated|frontend/app/[locale]/productos/page.tsx|

Especiales: frontend/app/[locale]/layout.tsx, frontend/app/[locale]/not-found.tsx.

Catálogo público cerrado y API de productos vacía en Main. Checkout usa datos de muestra y timers; la adaptación autorizada será un borrador local veraz. Contacto usa timer sin envío. No hay empleo tracked. Facturas, Perfil, Favoritos y Panamar se mantienen; Dashboard/Pedidos no se reactivan.

Las55cláusulas legales son once valores de contenido por cinco locales. Sus títulos/intros se conservan aparte. Fuente SQL no es evidencia de consulta DB.
