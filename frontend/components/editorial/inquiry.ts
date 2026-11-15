export type InquiryValues = {
  nombre: string;
  empresa: string;
  email: string;
  telefono: string;
  mensaje: string;
};
export type InquiryLabels = {
  name: string;
  company: string;
  email: string;
  phone: string;
  message: string;
};
export function inquiryText(values: InquiryValues, labels: InquiryLabels) {
  return [
    [labels.name, values.nombre],
    [labels.company, values.empresa],
    [labels.email, values.email],
    [labels.phone, values.telefono],
    [labels.message, values.mensaje],
  ]
    .map(([label, value]) => `${label.replace(/\s*\*$/u, "")}: ${value.trim()}`)
    .join("\n");
}
