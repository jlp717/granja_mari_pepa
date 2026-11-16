// Source: CONTENIDO-FUENTE F01–F04, F06, F08–F10. Published channels are not delivery guarantees.
export const EDITORIAL_FACTS = {
  name: "Maripepa",
  phone: "968 46 75 14",
  phoneHref: "tel:+34968467514",
  mobile: "639 77 86 55",
  mobileHref: "tel:+34639778655",
  email: "pedidos@granjamaripepa.com",
  lorcaEmail: "pedidos@mari-pepa.com",
  almeriaPhone: "950 97 34 29",
  almeriaPhoneHref: "tel:+34950973429",
  almeriaMobile: "670 49 01 47",
  almeriaMobileHref: "tel:+34670490147",
  address:
    "Avd. Francisco Jimeno Sola, 3 · Pol. Industrial Saprelorca · 30817 Lorca, Murcia",
  schedule: "Lunes a viernes · 08:00–13:00 y 16:00–19:00",
  mapHref:
    "https://www.google.com/maps/search/?api=1&query=Maripepa+Avd+Francisco+Jimeno+Sola+3+Lorca",
} as const;

export function gmailCompose(to: string, subject = "", body = "") {
  const params = [
    "view=cm",
    "fs=1",
    `to=${encodeURIComponent(to)}`,
    subject ? `su=${encodeURIComponent(subject)}` : "",
    body ? `body=${encodeURIComponent(body)}` : "",
  ].filter(Boolean);
  return `https://mail.google.com/mail/?${params.join("&")}`;
}

export function inquiryGmail(subject: string, body: string) {
  return gmailCompose(EDITORIAL_FACTS.email, subject, body);
}

export function inquiryWhatsApp(body: string) {
  return `https://wa.me/34639778655?text=${encodeURIComponent(body)}`;
}
