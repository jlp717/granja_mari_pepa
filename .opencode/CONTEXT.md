# CONTEXT.md

## ALL ROUTES/PAGES
| Path | File | Title | Data source |
|------|------|-------|-------------|
| / | src/app/[locale]/page.tsx | Home | Static |
| /area-clientes | src/app/[locale]/area-clientes/page.tsx | Área de Clientes | Backend API |
| /area-clientes/login | src/app/[locale]/area-clientes/login/page.tsx | Iniciar Sesión | Backend API |
| /area-clientes/dashboard | src/app/[locale]/area-clientes/dashboard/page.tsx | Panel de Control | Backend API |
| /area-clientes/facturas | src/app/[locale]/area-clientes/facturas/page.tsx | Mis Facturas | Backend API |
| /area-clientes/productos | src/app/[locale]/area-clientes/productos/page.tsx | Productos | Backend API |
| /area-clientes/pedidos | src/app/[locale]/area-clientes/pedidos/page.tsx | Mis Pedidos | Backend API |
| /area-clientes/contacto | src/app/[locale]/area-clientes/contacto/page.tsx | Contacto | Backend API |
| /area-clientes/compartir | src/app/[locale]/area-clientes/compartir/page.tsx | Compartir Facturas | Backend API |
| /productos | src/app/[locale]/productos/page.tsx | Productos | Backend API |
| /productos/[categoria] | src/app/[locale]/productos/[categoria]/page.tsx | Categoría de Productos | Backend API |
| /productos/[categoria]/[producto] | src/app/[locale]/productos/[categoria]/[producto]/page.tsx | Detalle de Producto | Backend API |
| /contacto | src/app/[locale]/contacto/page.tsx | Contacto | Backend API |
| /catalogos | src/app/[locale]/catalogos/page.tsx | Catálogos | Static |
| /catalogos/[catalogo] | src/app/[locale]/catalogos/[catalogo]/page.tsx | Detalle de Catálogo | Static |
| /panamar | src/app/[locale]/panamar/page.tsx | PANAMAR | Backend API |
| /panamar/[subempresa]/[ejercicio]/[serie]/[terminal]/[numero] | src/app/[locale]/panamar/[subempresa]/[ejercicio]/[serie]/[terminal]/[numero]/page.tsx | Documento PANAMAR | Backend API |

## ALL COMPONENTS
| Component | Path | Visual Role | Data Source | Styling Method |
|-----------|------|-------------|-------------|---------------|
| Header | src/components/layout/Header.tsx | Site navigation and branding | Static + User Context | CSS Modules |
| Footer | src/components/layout/Footer.tsx | Site information and links | Static | CSS Modules |
| ProductCard | src/components/catalog/ProductCard.tsx | Display product information | Backend API | CSS Modules |
| ProductGrid | src/components/catalog/ProductGrid.tsx | Grid of product cards | Backend API | CSS Modules |
| LoginForm | src/components/auth/LoginForm.tsx | User authentication form | Backend API | CSS Modules |
| DashboardStats | src/components/customer/DashboardStats.tsx | Display client statistics | Backend API | CSS Modules |
| InvoiceList | src/components/customer/InvoiceList.tsx | List of client invoices | Backend API | CSS Modules |
| OrderHistory | src/components/customer/OrderHistory.tsx | Client order history | Backend API | CSS Modules |
| ContactForm | src/components/sections/ContactForm.tsx | Contact form | Backend API | CSS Modules |
| HeroSection | src/components/sections/HeroSection.tsx | Main hero section | Static | CSS Modules |
| ProductCategories | src/components/sections/ProductCategories.tsx | Product category navigation | Backend API | CSS Modules |
| ClientTestimonials | src/components/sections/ClientTestimonials.tsx | Client testimonials section | Static | CSS Modules |
| QualityAssurance | src/components/sections/QualityAssurance.tsx | Quality assurance badges | Static | CSS Modules |
| NewsletterSignup | src/components/sections/NewsletterSignup.tsx | Newsletter signup form | Backend API | CSS Modules |

## CONTENT TO PRESERVE (never change these)
- All page titles and meta descriptions
- Product and category names
- Company information (address, phone, email, schedule)
- Legal text
- Client names and contact information
- Product descriptions and specifications
- Pricing information

## BACKEND CONTRACTS — SACRED, NEVER MODIFY
🔒 login
   Method: POST
   Input: { username, password }
   Output: { token, user }
   Used by: src/components/auth/LoginForm.tsx

🔒 refreshToken
   Method: POST
   Input: { refreshToken }
   Output: { token }
   Used by: src/components/auth/AuthProvider.tsx

🔒 getDashboard
   Method: GET
   Input: { clientCode }
   Output: { stats, recentInvoices, recentOrders }
   Used by: src/components/customer/DashboardStats.tsx

🔒 getInvoices
   Method: GET
   Input: { clientCode }
   Output: [ { invoiceNumber, date, amount, status } ]
   Used by: src/components/customer/InvoiceList.tsx

🔒 getOrderHistory
   Method: GET
   Input: { clientCode }
   Output: [ { orderNumber, date, items, total } ]
   Used by: src/components/customer/OrderHistory.tsx

🔒 getProducts
   Method: GET
   Input: { category }
   Output: [ { id, name, description, price, image } ]
   Used by: src/components/catalog/ProductGrid.tsx

🔒 getProductCategories
   Method: GET
   Input: none
   Output: [ { id, name, description, image } ]
   Used by: src/components/sections/ProductCategories.tsx

🔒 submitContactForm
   Method: POST
   Input: { name, company, email, phone, message }
   Output: { success, message }
   Used by: src/components/sections/ContactForm.tsx

🔒 getPanamarDocuments
   Method: GET
   Input: { clientCode }
   Output: [ { documentId, date, amount, type } ]
   Used by: src/components/panamar/DocumentList.tsx

🔒 getPanamarDocument
   Method: GET
   Input: { documentId }
   Output: { documentData }
   Used by: src/components/panamar/DocumentViewer.tsx