'use client';

import Script from 'next/script';

/**
 * ====================================================================
 * 🔍 JSON-LD Schema.org - SEO Structured Data
 * ====================================================================
 * Datos estructurados para mejorar SEO y Rich Results en Google
 */

// Schema de la Organización
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://www.mari-pepa.com/#organization',
  name: 'Granja Mari Pepa',
  alternateName: 'Granja Maripepa S.L.',
  url: 'https://www.mari-pepa.com',
  logo: {
    '@type': 'ImageObject',
    url: 'https://www.mari-pepa.com/images/logo.jpeg',
    width: 512,
    height: 512,
  },
  image: 'https://www.mari-pepa.com/og-image.jpg',
  description: 'Distribución de productos alimentarios de alta calidad para el sector HORECA. Especialistas en congelados, refrigerados y productos de ambiente desde 1966.',
  foundingDate: '1966',
  founders: [
    {
      '@type': 'Person',
      name: 'Fundadores de Granja Mari Pepa',
    },
  ],
  address: [
    {
      '@type': 'PostalAddress',
      streetAddress: 'Pol. Industrial Saprelorca, Avd. Francisco Jimeno Sola, 3',
      addressLocality: 'Lorca',
      addressRegion: 'Murcia',
      postalCode: '30817',
      addressCountry: 'ES',
    },

  ],
  contactPoint: [
    {
      '@type': 'ContactPoint',
      telephone: '+34-968-46-75-14',
      contactType: 'customer service',
      areaServed: ['ES-MU', 'ES-AL', 'ES-A'],
      availableLanguage: 'Spanish',
      hoursAvailable: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:00',
        closes: '19:00',
      },
    },
    {
      '@type': 'ContactPoint',
      telephone: '+34-950-97-34-29',
      contactType: 'sales',
      areaServed: 'ES-AL',
      availableLanguage: 'Spanish',
    },
  ],
  email: 'pedidos@mari-pepa.com',
  sameAs: [
    'https://www.facebook.com/granjamaripepa',
    'https://www.instagram.com/granjamaripepa',
  ],
  parentOrganization: {
    '@type': 'Organization',
    name: 'Grupo Topgel',
  },
  areaServed: [
    {
      '@type': 'State',
      name: 'Murcia',
      '@id': 'https://www.wikidata.org/wiki/Q5765',
    },

    {
      '@type': 'State',
      name: 'Alicante',
      '@id': 'https://www.wikidata.org/wiki/Q5765',
    },
  ],
  knowsAbout: [
    'Distribución alimentaria',
    'Productos congelados',
    'HORECA',
    'Hostelería',
    'Restauración',
    'Catering',
  ],
};

// Schema del negocio local (Murcia)
const localBusinessSchemaMurcia = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': 'https://www.mari-pepa.com/#murcia',
  name: 'Granja Mari Pepa - Sede Central Murcia',
  image: 'https://www.mari-pepa.com/og-image.jpg',
  url: 'https://www.mari-pepa.com',
  telephone: '+34-968-46-75-14',
  email: 'pedidos@mari-pepa.com',
  priceRange: '€€',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Pol. Industrial Saprelorca, Avd. Francisco Jimeno Sola, 3',
    addressLocality: 'Lorca',
    addressRegion: 'Murcia',
    postalCode: '30817',
    addressCountry: 'ES',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 37.6711,
    longitude: -1.7009,
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '08:00',
      closes: '13:00',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '16:00',
      closes: '19:00',
    },
  ],
  sameAs: organizationSchema.sameAs,
  parentOrganization: {
    '@id': 'https://www.mari-pepa.com/#organization',
  },
};



// Schema del sitio web
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': 'https://www.mari-pepa.com/#website',
  url: 'https://www.mari-pepa.com',
  name: 'Granja Mari Pepa',
  description: 'Portal de clientes de Granja Mari Pepa - Distribución alimentaria HORECA',
  publisher: {
    '@id': 'https://www.mari-pepa.com/#organization',
  },
  inLanguage: 'es-ES',
};

// Schema de FAQs
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '¿Qué productos distribuye Granja Mari Pepa?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Distribuimos más de 1.500 referencias de productos en tres temperaturas: congelados (pescados, mariscos, carnes, precocinados, repostería), refrigerados (lácteos, charcutería, pastelería) y ambiente (conservas, aceites, bebidas).',
      },
    },
    {
      '@type': 'Question',
      name: '¿En qué zonas realiza entregas Granja Mari Pepa?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Realizamos entregas en toda la Región de Murcia y sur de la provincia de Alicante, con entrega en 24-48 horas garantizando la cadena de frío.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cómo puedo hacerme cliente de Granja Mari Pepa?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Puede solicitar una visita comercial sin compromiso llamando al 968 46 75 14. Un asesor le visitará para presentar el catálogo y condiciones. Los pedidos se entregan en 24-48 horas.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cuál es el horario de atención al cliente?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Nuestro horario de atención es de lunes a viernes, de 8:00 a 13:00 y de 16:00 a 19:00.',
      },
    },
  ],
};

/**
 * Componente que inyecta todos los schemas JSON-LD
 */
export function JsonLdSchemas() {
  return (
    <>
      <Script
        id="organization-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <Script
        id="local-business-murcia-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchemaMurcia),
        }}
      />

      <Script
        id="website-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />
      <Script
        id="faq-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />
    </>
  );
}

/**
 * Schema de Breadcrumbs dinámico
 */
export function BreadcrumbSchema({ items }: { items: { name: string; url: string }[] }) {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <Script
      id="breadcrumb-schema"
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(breadcrumbSchema),
      }}
    />
  );
}

export default JsonLdSchemas;
