const source = "https://www.mari-pepa.com";
const organizationId = source + "/#organization";
const logo = {
  "@type": "ImageObject",
  url: source + "/kage/brand/logo-alpha.png",
};
const mapLorca =
  "https://maps.google.com/?q=Granja+Maripepa+Avd+Francisco+Jimeno+Sola+3+Lorca";

const addressLorca = {
  "@type": "PostalAddress",
  streetAddress: "Avenida Francisco Jimeno Sola, 3",
  addressLocality: "Lorca",
  addressRegion: "Murcia",
  postalCode: "30817",
  addressCountry: "ES",
};

const addressViator = {
  "@type": "PostalAddress",
  streetAddress: "Calle Sierra de Ronda, 26",
  addressLocality: "Viator",
  addressRegion: "Almería",
  postalCode: "04240",
  addressCountry: "ES",
};

// Coordenadas de calle (centroide de la vía) obtenidas de OpenStreetMap/Nominatim, ODbL.

const lorcaHours = [
  {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: "08:00",
    closes: "13:00",
  },
  {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: "16:00",
    closes: "19:00",
  },
];

const schemas = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": organizationId,
    name: "Granja Maripepa",
    legalName: "Granja Maripepa, S.L.",
    taxID: "B04008710",
    url: source,
    logo,
    image: source + "/og-maripepa.jpg",
    foundingDate: "1966",
    telephone: "+34968467514",
    email: "pedidos@granjamaripepa.com",
    address: addressLorca,
    areaServed: [
      { "@type": "AdministrativeArea", name: "Región de Murcia" },
      { "@type": "AdministrativeArea", name: "Provincia de Almería" },
      { "@type": "AdministrativeArea", name: "Provincia de Alicante" },
    ],
    knowsAbout: [
      "Distribución alimentaria HORECA",
      "Producto congelado",
      "Producto refrigerado",
      "Temperatura ambiente",
      "Panadería y repostería",
      "Grupo Topgel",
      "Nestlé Helados",
      "Panamar",
    ],
    brand: [
      { "@type": "Brand", name: "Grupo Topgel" },
      { "@type": "Brand", name: "Nestlé Helados" },
      { "@type": "Brand", name: "Panamar" },
    ],
    sameAs: [mapLorca],
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: "+34968467514",
        contactType: "sales",
        areaServed: "ES",
        availableLanguage: ["es", "en"],
      },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": source + "/#website",
    url: source,
    name: "Granja Maripepa",
    inLanguage: ["es", "en", "de", "it", "zh"],
    publisher: { "@id": organizationId },
  },
  {
    "@context": "https://schema.org",
    "@type": "WholesaleStore",
    "@id": source + "/#lorca",
    name: "Granja Maripepa · Sede Lorca",
    parentOrganization: { "@id": organizationId },
    url: source + "/es/lorca",
    telephone: "+34968467514",
    email: "pedidos@granjamaripepa.com",
    address: addressLorca,
    geo: {
      "@type": "GeoCoordinates",
      latitude: 37.6092,
      longitude: -1.763,
    },
    openingHoursSpecification: lorcaHours,
    areaServed: ["Región de Murcia", "Provincia de Almería"],
    sameAs: [mapLorca],
  },
  {
    "@context": "https://schema.org",
    "@type": "WholesaleStore",
    "@id": source + "/#viator",
    name: "Granja Maripepa · Delegación Viator",
    parentOrganization: { "@id": organizationId },
    url: source + "/es/contacto",
    telephone: "+34950973429",
    address: addressViator,
    geo: {
      "@type": "GeoCoordinates",
      latitude: 36.8794,
      longitude: -2.4197,
    },
    areaServed: ["Provincia de Almería", "Región de Murcia"],
  },
];

/** Only published, verifiable identity. No price, rating, certification,
 * search action or social account is inferred. */
export function JsonLdSchemas() {
  return (
    <>
      {schemas.map((schema) => (
        <script
          key={schema["@id"]}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}
export default JsonLdSchemas;
