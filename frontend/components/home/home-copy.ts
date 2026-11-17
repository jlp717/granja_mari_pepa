import type { Locale } from "@/i18n";

export interface HomeEditorialCopy {
  hero: {
    eyebrow: string;
    title: string;
    lead: string;
    primary: string;
    secondary: string;
    caption: string;
  };
  stats: readonly { value: string; label: string }[];
  origin: {
    kicker: string;
    title: string;
    lead: string;
    points: readonly { title: string; text: string }[];
  };
  system: {
    kicker: string;
    title: string;
    lead: string;
    steps: readonly { index: string; title: string; text: string }[];
    action: string;
  };
  range: {
    kicker: string;
    title: string;
    lead: string;
    families: readonly { name: string; href: string }[];
    action: string;
  };
  magazines: {
    kicker: string;
    title: string;
    lead: string;
    action: string;
  };
  sites: {
    kicker: string;
    title: string;
    lead: string;
    lorca: { name: string; address: string; maps: string };
    viator: { name: string; address: string; maps: string };
  };
  closing: {
    kicker: string;
    title: string;
    lead: string;
    action: string;
  };
}

const es: HomeEditorialCopy = {
  hero: {
    eyebrow: "Maripepa · Lorca, 1966",
    title: "Lo que llega a tu cocina empieza en Lorca.",
    lead: "Distribuimos producto congelado, refrigerado y de temperatura ambiente para hostelería, catering y colectividades en Murcia y Almería.",
    primary: "Ver la gama",
    secondary: "Hablar con el equipo",
    caption: "La nave de Lorca. Polígono Saprelorca.",
  },
  stats: [
    { value: "1966", label: "Año de fundación" },
    { value: "02", label: "Sedes: Murcia y Almería" },
    { value: "03", label: "Temperaturas: congelado, refrigerado y ambiente" },
  ],
  origin: {
    kicker: "01 · Origen",
    title:
      "Una empresa con dos sedes. La misma forma de trabajar.",
    lead: "Nacimos en el sureste y crecimos con la hostelería de Murcia y Almería. Hoy coordinamos dos almacenes para que producto, pedido y ruta hablen el mismo idioma.",
    points: [
      {
        title: "La sede principal",
        text: "La nave de Saprelorca concentra almacén, preparación y salida de pedidos. Es el punto de partida de cada ruta.",
      },
      {
        title: "Dos sedes",
        text: "Murcia y Almería comparten almacén, rutas y atención al cliente. Dos puntos de salida coordinados.",
      },
      {
        title: "Tres temperaturas",
        text: "Congelado, refrigerado y temperatura ambiente conviven en la operación diaria. Cada familia tiene su forma de conservarse y servirse.",
      },
    ],
  },
  system: {
    kicker: "02 · Capacidad",
    title: "Tres temperaturas, un solo pedido.",
    lead: "Congelado, refrigerado y ambiente conviven en la misma operación. 5.000 m³ de frío, más de 1.500 referencias y dos puntos de salida para que la cocina no se pare.",
    steps: [
      {
        index: "01",
        title: "5.000 m³",
        text: "Capacidad frigorífica en la sede de Saprelorca. Congelado y refrigerado en el mismo circuito de preparación.",
      },
      {
        index: "02",
        title: "+1.500",
        text: "Referencias en siete familias, de productos del mar a salsas y preparados.",
      },
      {
        index: "03",
        title: "Dos sedes",
        text: "Las dos sedes comparten almacén, rutas y atención. Dos puntos de salida para Murcia, Almería y Alicante.",
      },
      {
        index: "04",
        title: "24–48 h",
        text: "Plazo habitual de entrega. Se confirma por pedido y zona antes de salir.",
      },
    ],
    action: "Consultar disponibilidad",
  },
  range: {
    kicker: "03 · La gama",
    title: "Siete familias. Una conversación concreta.",
    lead: "Productos del mar, carnes, precocinados, repostería, panadería, refrigerados y salsas. Empieza por lo que preparas y lleva esa necesidad a la conversación comercial.",
    families: [
      { name: "Productos del mar", href: "/productos?category=mar" },
      { name: "Carnes", href: "/productos?category=carne" },
      { name: "Precocinados", href: "/productos?category=precocinados" },
      { name: "Repostería", href: "/productos?category=reposteria" },
      { name: "Panadería", href: "/productos?category=panaderia" },
      { name: "Refrigerados", href: "/productos?category=refrigerados" },
      { name: "Salsas y preparados", href: "/productos?category=salsas" },
    ],
    action: "Ver todas las familias",
  },
  magazines: {
    kicker: "04 · Hemeroteca",
    title: "Las revistas de la casa.",
    lead: "Cada edición reúne producto, campaña y propuestas para carta. Ábrela en el visor y recorre las páginas como una presentación.",
    action: "Ver todas las revistas",
  },
  sites: {
    kicker: "05 · Sedes",
    title: "Dos sedes, el mismo equipo.",
    lead: "La sede principal está en Lorca. La delegación de Viator acerca la operación a Almería. Ambas comparten el mismo criterio de producto y servicio.",
    lorca: {
      name: "Lorca · Murcia",
      address: "Av. Francisco Jimeno Sola, 3 · Pol. Saprelorca",
      maps: "https://maps.google.com/?q=Maripepa+Avd+Francisco+Jimeno+Sola+3+Lorca",
    },
    viator: {
      name: "Viator · Almería",
      address: "C/ Sierra de Ronda, 26 · Pol. La Juaida",
      maps: "https://maps.google.com/?q=Calle+Sierra+de+Ronda+26+Viator+Almeria",
    },
  },
  closing: {
    kicker: "06 · Hablemos",
    title: "Tu próxima carta empieza con una conversación.",
    lead: "Cuéntanos qué preparas, qué familias te interesan y dónde está tu establecimiento. El equipo te orienta sobre producto, formatos y entrega.",
    action: "Contactar con el equipo",
  },
};

const en: HomeEditorialCopy = {
  hero: {
    eyebrow: "Maripepa · Lorca, 1966",
    title: "What reaches your kitchen starts in Lorca.",
    lead: "We distribute frozen, chilled and ambient products for hospitality, catering and collectivities across Murcia and Almería.",
    primary: "Explore the range",
    secondary: "Talk to the team",
    caption: "The Lorca site. Saprelorca industrial park.",
  },
  stats: [
    { value: "1966", label: "Year founded" },
    { value: "02", label: "Sites: Murcia and Almería" },
    { value: "03", label: "Temperatures: frozen, chilled and ambient" },
  ],
  origin: {
    kicker: "01 · Origin",
    title: "A company with two sites. One way of working.",
    lead: "We were born in the south-east and grew with hospitality in Murcia and Almería. Today two warehouses coordinate so product, order and route speak the same language.",
    points: [
      {
        title: "The main site",
        text: "The Saprelorca facility brings together warehouse, preparation and dispatch. It is the starting point of every route.",
      },
      {
        title: "Two sites",
        text: "Murcia and Almería share warehouse, routes and customer service. Two coordinated departure points.",
      },
      {
        title: "Three temperatures",
        text: "Frozen, chilled and ambient products live together in the daily operation. Each family has its own way of being stored and served.",
      },
    ],
  },
  system: {
    kicker: "02 · Capacity",
    title: "Three temperatures, one single order.",
    lead: "Frozen, chilled and ambient share the same operation. 5,000 m³ of cold storage, more than 1,500 references and two departure points so the kitchen never stops.",
    steps: [
      {
        index: "01",
        title: "5,000 m³",
        text: "Cold-storage capacity at the Saprelorca site. Frozen and chilled in the same preparation circuit.",
      },
      {
        index: "02",
        title: "+1,500",
        text: "References across seven families, from seafood to sauces and prepared dishes.",
      },
      {
        index: "03",
        title: "Two sites",
        text: "Both sites share warehouse, routes and customer service. Two departure points for Murcia, Almería and Alicante.",
      },
      {
        index: "04",
        title: "24–48 h",
        text: "Usual delivery time. Confirmed per order and area before departure.",
      },
    ],
    action: "Check availability",
  },
  range: {
    kicker: "03 · The range",
    title: "Seven families. One concrete conversation.",
    lead: "Seafood, meat, prepared dishes, pastry, bakery, chilled products and sauces. Start from what you cook and take that need into the commercial conversation.",
    families: [
      { name: "Seafood", href: "/productos?category=mar" },
      { name: "Meat", href: "/productos?category=carne" },
      { name: "Prepared dishes", href: "/productos?category=precocinados" },
      { name: "Pastry", href: "/productos?category=reposteria" },
      { name: "Bakery", href: "/productos?category=panaderia" },
      { name: "Chilled products", href: "/productos?category=refrigerados" },
      { name: "Sauces & preparations", href: "/productos?category=salsas" },
    ],
    action: "See all families",
  },
  magazines: {
    kicker: "04 · Archive",
    title: "The house magazines.",
    lead: "Each edition brings together product, campaign and menu ideas. Open it in the viewer and move through the pages like a presentation.",
    action: "See all magazines",
  },
  sites: {
    kicker: "05 · Sites",
    title: "Two sites, one team.",
    lead: "The main site is in Lorca. The Viator branch brings the operation closer to Almería. Both share the same approach to product and service.",
    lorca: {
      name: "Lorca · Murcia",
      address: "Av. Francisco Jimeno Sola, 3 · Saprelorca industrial park",
      maps: "https://maps.google.com/?q=Maripepa+Avd+Francisco+Jimeno+Sola+3+Lorca",
    },
    viator: {
      name: "Viator · Almería",
      address: "C/ Sierra de Ronda, 26 · La Juaida industrial park",
      maps: "https://maps.google.com/?q=Calle+Sierra+de+Ronda+26+Viator+Almeria",
    },
  },
  closing: {
    kicker: "06 · Let's talk",
    title: "Your next menu starts with a conversation.",
    lead: "Tell us what you cook, which families interest you and where your venue is. The team will guide you on product, formats and delivery.",
    action: "Contact the team",
  },
};

export function getHomeEditorialCopy(
  locale: Locale | string,
): HomeEditorialCopy {
  return locale === "es" ? es : en;
}
