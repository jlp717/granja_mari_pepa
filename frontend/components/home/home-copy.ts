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
    eyebrow: "Granja Maripepa · Lorca, 1966",
    title: "Lo que llega a tu cocina empieza en Lorca.",
    lead: "Distribuimos producto congelado, refrigerado y de temperatura ambiente para hostelería, catering y colectividades en Murcia y Almería.",
    primary: "Ver la gama",
    secondary: "Hablar con el equipo",
    caption: "La nave de Lorca. Polígono Saprelorca.",
  },
  stats: [
    { value: "1966", label: "Origen en Lorca" },
    { value: "02", label: "Sedes: Lorca y Viator" },
    { value: "03", label: "Temperaturas: congelado, refrigerado y ambiente" },
  ],
  origin: {
    kicker: "01 · Origen",
    title: "Una empresa fundada en 1966. Dos sedes. La misma forma de trabajar.",
    lead: "Nacimos en Lorca y crecimos con la hostelería del sureste. Hoy coordinamos Lorca y Viator para que producto, pedido y ruta hablen el mismo idioma.",
    points: [
      {
        title: "Lorca, 1966",
        text: "La empresa nace en Lorca y mantiene allí su sede principal. La nave, el almacén y el equipo son el punto de partida de cada pedido.",
      },
      {
        title: "Dos sedes",
        text: "Lorca (Murcia) y Viator (Almería) comparten almacén, rutas y atención al cliente. Un mismo equipo, dos puntos de salida.",
      },
      {
        title: "Tres temperaturas",
        text: "Congelado, refrigerado y temperatura ambiente conviven en la operación diaria. Cada familia tiene su forma de conservarse y servirse.",
      },
    ],
  },
  system: {
    kicker: "02 · Cómo trabajamos",
    title: "El pedido entra. La ruta sale. Tu cocina sigue.",
    lead: "No vendemos una caja: organizamos producto, preparación y entrega para que el servicio de tu establecimiento no se pare.",
    steps: [
      {
        index: "01",
        title: "Consulta",
        text: "Cuéntanos qué familia necesitas, para qué servicio y en qué localidad. La conversación empieza por tu cocina, no por un código.",
      },
      {
        index: "02",
        title: "Preparación",
        text: "El pedido se prepara en cámara y se organiza por ruta. El almacén de Lorca coordina la salida con la delegación de Viator.",
      },
      {
        index: "03",
        title: "Ruta",
        text: "La entrega se ajusta a la zona y al horario del establecimiento. El equipo confirma la organización antes de salir.",
      },
      {
        index: "04",
        title: "Entrega",
        text: "Albarán, firma de entrega y seguimiento de incidencias. Lo que ocurre en la puerta también forma parte del servicio.",
      },
    ],
    action: "Consultar mi zona",
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
      maps: "https://maps.google.com/?q=Granja+Maripepa+Avd+Francisco+Jimeno+Sola+3+Lorca",
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
    eyebrow: "Granja Maripepa · Lorca, 1966",
    title: "What reaches your kitchen starts in Lorca.",
    lead: "We distribute frozen, chilled and ambient products for hospitality, catering and collectivities across Murcia and Almería.",
    primary: "Explore the range",
    secondary: "Talk to the team",
    caption: "The Lorca site. Saprelorca industrial park.",
  },
  stats: [
    { value: "1966", label: "Founded in Lorca" },
    { value: "02", label: "Sites: Lorca and Viator" },
    { value: "03", label: "Temperatures: frozen, chilled and ambient" },
  ],
  origin: {
    kicker: "01 · Origin",
    title: "A company founded in 1966. Two sites. One way of working.",
    lead: "We were born in Lorca and grew with hospitality in the south-east. Today Lorca and Viator coordinate so product, order and route speak the same language.",
    points: [
      {
        title: "Lorca, 1966",
        text: "The company was founded in Lorca, where its main site remains. The building, the warehouse and the team are the starting point of every order.",
      },
      {
        title: "Two sites",
        text: "Lorca (Murcia) and Viator (Almería) share warehouse, routes and customer service. One team, two departure points.",
      },
      {
        title: "Three temperatures",
        text: "Frozen, chilled and ambient products live together in the daily operation. Each family has its own way of being stored and served.",
      },
    ],
  },
  system: {
    kicker: "02 · How we work",
    title: "The order comes in. The route goes out. Your kitchen keeps moving.",
    lead: "We do not sell a box: we organise product, preparation and delivery so your service does not stop.",
    steps: [
      {
        index: "01",
        title: "Conversation",
        text: "Tell us which family you need, for which service and in which town. The conversation starts with your kitchen, not a code.",
      },
      {
        index: "02",
        title: "Preparation",
        text: "The order is prepared in the cold room and organised by route. The Lorca warehouse coordinates departure with the Viator branch.",
      },
      {
        index: "03",
        title: "Route",
        text: "Delivery is arranged around the area and the venue's schedule. The team confirms the plan before leaving.",
      },
      {
        index: "04",
        title: "Delivery",
        text: "Delivery note, signature and incident tracking. What happens at the door is part of the service too.",
      },
    ],
    action: "Check my area",
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
      maps: "https://maps.google.com/?q=Granja+Maripepa+Avd+Francisco+Jimeno+Sola+3+Lorca",
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

export function getHomeEditorialCopy(locale: Locale | string): HomeEditorialCopy {
  return locale === "es" ? es : en;
}
