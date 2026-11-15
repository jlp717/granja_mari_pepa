import test from "node:test";
import assert from "node:assert/strict";
const load = (name) => import(new URL(name, import.meta.url).href);

test("preparing a consultation preserves the five fields and user characters", async () => {
  const { inquiryText } = await load("inquiry.ts");
  const values = {
    nombre: "  Ana & Ñ  ",
    empresa: "Cocina #1",
    email: "ana+consulta@example.test",
    telefono: "123456789",
    mensaje: "Primera línea\nFormato: A&B?",
  };
  const original = JSON.stringify(values);
  const text = inquiryText(values, {
    name: "Nombre *",
    company: "Empresa *",
    email: "Email *",
    phone: "Teléfono *",
    message: "Mensaje *",
  });
  assert.equal(
    text,
    "Nombre: Ana & Ñ\nEmpresa: Cocina #1\nEmail: ana+consulta@example.test\nTeléfono: 123456789\nMensaje: Primera línea\nFormato: A&B?",
  );
  assert.equal(JSON.stringify(values), original);
});

test("mailto encodes a subject and multiline body without adding query parameters", async () => {
  const { inquiryMailto } = await load("facts.ts");
  const subject = "Consulta & formato #Ñ";
  const body = "Empresa: A&B\nDuda: ¿formato? #1 = 2";
  const url = new URL(inquiryMailto(subject, body));
  assert.equal(url.protocol, "mailto:");
  assert.equal(url.searchParams.get("subject"), subject);
  assert.equal(url.searchParams.get("body"), body);
  assert.deepEqual([...url.searchParams.keys()], ["subject", "body"]);
});

test("WhatsApp uses the published channel and preserves the full consultation", async () => {
  const { inquiryWhatsApp } = await load("facts.ts");
  const body = "Necesidad: mar & carne\nLocalidad: prueba #2";
  const url = new URL(inquiryWhatsApp(body));
  assert.equal(url.origin, "https://wa.me");
  assert.equal(url.pathname, "/34639778655");
  assert.equal(url.searchParams.get("text"), body);
  assert.deepEqual([...url.searchParams.keys()], ["text"]);
});
