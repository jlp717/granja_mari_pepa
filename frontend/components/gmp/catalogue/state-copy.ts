import { notFound } from "next/navigation";
const copies = {
  es: {
    loading: "Preparando la lectura de la gama",
    errorTitle: "No hemos podido mostrar esta página.",
    error:
      "Vuelve a intentarlo o utiliza los canales de contacto. Este aviso no confirma ni modifica ningún pedido.",
    retry: "Volver a intentarlo",
    contact: "Hablar con el equipo",
  },
  en: {
    loading: "Preparing the range information",
    errorTitle: "We could not display this page.",
    error:
      "Try again or use the contact channels. This notice does not confirm or change any order.",
    retry: "Try again",
    contact: "Talk to the team",
  },
  de: {
    loading: "Die Sortimentsinformationen werden vorbereitet",
    errorTitle: "Diese Seite konnte nicht angezeigt werden.",
    error:
      "Versuchen Sie es erneut oder nutzen Sie die Kontaktkanäle. Dieser Hinweis bestätigt und verändert keine Bestellung.",
    retry: "Erneut versuchen",
    contact: "Mit dem Team sprechen",
  },
  it: {
    loading: "Preparazione delle informazioni sulla gamma",
    errorTitle: "Non è stato possibile mostrare questa pagina.",
    error:
      "Riprova oppure utilizza i canali di contatto. Questo avviso non conferma e non modifica alcun ordine.",
    retry: "Riprova",
    contact: "Parla con il team",
  },
  zh: {
    loading: "正在准备产品范围信息",
    errorTitle: "暂时无法显示此页面。",
    error: "请重试或通过公开渠道联系我们。此提示不会确认或修改任何订单。",
    retry: "重试",
    contact: "联系团队",
  },
};
export function getCatalogueStateCopy(locale: string) {
  if (!Object.prototype.hasOwnProperty.call(copies, locale)) notFound();
  return copies[locale as keyof typeof copies];
}
