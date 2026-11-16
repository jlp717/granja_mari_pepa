"use client";
import { useState, type FormEvent } from "react";
import { useTranslations, useLocale } from "next-intl";
import { z } from "zod";
import { Link } from "@/lib/navigation";
import { GMPRoute } from "@/components/gmp/GMPRoute";
import { Chapter } from "@/components/gmp/Chapter";
import { WordReveal } from "@/components/gmp/WordReveal";
import type { ContactCopy, UICopy } from "./types";
import {
  EDITORIAL_FACTS as facts,
  gmailCompose,
  inquiryGmail,
  inquiryWhatsApp,
} from "./facts";
import { inquiryText } from "./inquiry";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import styles from "./editorial.module.css";

export function EditorialContact({
  copy,
  ui,
}: {
  copy: ContactCopy;
  ui: UICopy;
}) {
  const t = useTranslations("contact_page");
  const locale = useLocale();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState("");
  const [feedback, setFeedback] = useState("");
  const [sending, setSending] = useState(false);
  const schema = z.object({
    nombre: z.string().min(2, t("form_section.errors.name")),
    empresa: z.string().min(2, t("form_section.errors.company")),
    email: z.string().email(t("form_section.errors.email")),
    telefono: z.string().min(9, t("form_section.errors.phone")),
    mensaje: z.string().min(10, t("form_section.errors.message")),
    privacidad: z
      .boolean()
      .refine((v) => v === true, t("form_section.errors.privacy")),
  });
  async function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    const values = {
      nombre: String(fd.get("nombre") || "").trim(),
      empresa: String(fd.get("empresa") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      telefono: String(fd.get("telefono") || "").trim(),
      mensaje: String(fd.get("mensaje") || "").trim(),
      privacidad: fd.get("privacidad") === "on",
    };
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const key = String(issue.path[0]);
        if (!next[key]) next[key] = issue.message;
      });
      setErrors(next);
      setFeedback(copy.validation);
      const first = form.elements.namedItem(Object.keys(next)[0]);
      if (first instanceof HTMLElement) first.focus();
      return;
    }
    setErrors({});
    const text = inquiryText(parsed.data, {
      name: t("form_section.labels.name"),
      company: t("form_section.labels.company"),
      email: t("form_section.labels.email"),
      phone: t("form_section.labels.phone"),
      message: t("form_section.labels.message"),
    });
    setPreview(text);
    const submitter = (event.nativeEvent as SubmitEvent)
      .submitter as HTMLButtonElement | null;
    const intent = submitter?.value || "copy";
    if (intent === "send") {
      setSending(true);
      setFeedback(locale === "en" ? "Sending…" : "Enviando…");
      try {
        const response = await fetch("/api/public/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
          signal: AbortSignal.timeout(30000),
        });
        const data = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        if (!response.ok) throw new Error(data?.message || "");
        setFeedback(
          locale === "en"
            ? "Message sent. We will reply as soon as possible."
            : "Mensaje enviado. Te responderemos lo antes posible.",
        );
        form.reset();
        setPreview("");
      } catch (failure) {
        setFeedback(
          failure instanceof Error && failure.message
            ? failure.message
            : locale === "en"
              ? "We could not send it. Try again or call 968 46 75 14."
              : "No se pudo enviar. Inténtalo de nuevo o llama al 968 46 75 14.",
        );
      } finally {
        setSending(false);
      }
      return;
    }
    if (intent === "email") {
      window.open(
        inquiryGmail(ui.contactSubject, text),
        "_blank",
        "noopener,noreferrer",
      );
      setFeedback(copy.prepared);
    } else if (intent === "whatsapp") {
      window.open(inquiryWhatsApp(text), "_blank", "noopener,noreferrer");
      setFeedback(copy.prepared);
    } else {
      try {
        if (!navigator.clipboard?.writeText)
          throw new Error("Clipboard unavailable");
        await navigator.clipboard.writeText(text);
        setFeedback(copy.copied);
      } catch {
        setFeedback(copy.copyError);
      }
    }
  }
  const fields = [
    { name: "nombre", label: "name", type: "text", complete: "name" },
    {
      name: "empresa",
      label: "company",
      type: "text",
      complete: "organization",
    },
    { name: "email", label: "email", type: "email", complete: "email" },
    { name: "telefono", label: "phone", type: "tel", complete: "tel" },
  ] as const;
  return (
    <GMPRoute routeId="contacto" mode="ambient" world="gmp">
      <Breadcrumbs
        locale={locale}
        items={[{ name: "Contacto", path: "/contacto" }]}
      />
      <Chapter id="contacto-canales" scene={0} title={ui.channelLink}>
        <div className="sec-head">
          <span className="k">01 — {ui.contact}</span>
          <span className="rule" />
          <a href="#contacto-preparar" className="k" data-cursor>
            {ui.prepareInquiry}
          </a>
        </div>
        <div className="gate-grid">
          <WordReveal as="h1" className={`display h-sec ${styles.storyH1}`}>
            {copy.title}
          </WordReveal>
          <div className="gate-copy">
            <p className="lead" data-rv="up">
              {copy.intro}
            </p>
            <p className="body-lg" data-rv="up">
              {copy.channelTitle}
            </p>
          </div>
        </div>
        <div className={styles.channels}>
          {[
            {
              index: "01 · Lorca",
              name: ui.telephone,
              value: facts.phone,
              href: facts.phoneHref,
            },
            {
              index: `02 · ${ui.mobile}`,
              name: ui.directContact,
              value: facts.mobile,
              href: facts.mobileHref,
            },
            {
              index: `03 · ${ui.emailOrders}`,
              name: ui.emailOrders,
              value: facts.email,
              href: gmailCompose(facts.email),
            },
            {
              index: `04 · ${ui.message}`,
              name: "WhatsApp",
              value: copy.whatsapp,
              href: inquiryWhatsApp(""),
            },
            {
              index: "05 · Viator",
              name: ui.telephone,
              value: facts.almeriaPhone,
              href: facts.almeriaPhoneHref,
            },
            {
              index: "06 · Viator",
              name: ui.mobile,
              value: facts.almeriaMobile,
              href: facts.almeriaMobileHref,
            },
          ].map((channel) => (
            <a
              className={styles.channelRow}
              href={channel.href}
              key={channel.index}
              data-rv="up"
              data-cursor
              {...(channel.href.startsWith("http")
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              <span className={styles.channelIndex}>{channel.index}</span>
              <span className={styles.channelName}>{channel.name}</span>
              <span className={styles.channelValue}>{channel.value}</span>
              <span className={styles.channelArrow} aria-hidden="true">
                <svg viewBox="0 0 14 14" fill="none">
                  <path
                    d="M3 11 11 3M5 3h6v6"
                    stroke="currentColor"
                    strokeWidth="1.3"
                  />
                </svg>
              </span>
            </a>
          ))}
        </div>
      </Chapter>
      <Chapter id="contacto-preparar" scene={4} title={ui.preparation}>
        <div className="sec-head">
          <span className="k">02 — {ui.preparation}</span>
          <span className="rule" />
          <a className="k" href="#contacto-horario" data-cursor>
            {ui.openingHours}
          </a>
        </div>
        <div className="cur-head">
          <WordReveal as="h2" className="display h-sec">
            {copy.prepareTitle}
          </WordReveal>
          <p className="body-lg" data-rv="up">
            {copy.prepareIntro}
          </p>
        </div>
        <form className={styles.form} noValidate onSubmit={prepare}>
          <div className={styles.fields}>
            {fields.map((field) => (
              <div className={styles.field} key={field.name}>
                <label htmlFor={`contacto-${field.name}`}>
                  {t(`form_section.labels.${field.label}`)}
                </label>
                <input
                  id={`contacto-${field.name}`}
                  name={field.name}
                  type={field.type}
                  autoComplete={field.complete}
                  required
                  aria-invalid={!!errors[field.name]}
                  aria-describedby={
                    errors[field.name]
                      ? `contacto-${field.name}-error`
                      : undefined
                  }
                />
                {errors[field.name] && (
                  <p
                    className={`body ${styles.fieldError}`}
                    id={`contacto-${field.name}-error`}
                  >
                    {errors[field.name]}
                  </p>
                )}
              </div>
            ))}
            <div className={`${styles.field} ${styles.wide}`}>
              <label htmlFor="contacto-mensaje">
                {t("form_section.labels.message")}
              </label>
              <textarea
                id="contacto-mensaje"
                name="mensaje"
                rows={5}
                required
                aria-invalid={!!errors.mensaje}
                aria-describedby={
                  errors.mensaje ? "contacto-mensaje-error" : undefined
                }
              />
              {errors.mensaje && (
                <p
                  className={`body ${styles.fieldError}`}
                  id="contacto-mensaje-error"
                >
                  {errors.mensaje}
                </p>
              )}
            </div>
          </div>
          <div className={styles.consent}>
            <input
              id="contacto-privacidad"
              name="privacidad"
              type="checkbox"
              required
              aria-invalid={!!errors.privacidad}
              aria-describedby={
                errors.privacidad ? "contacto-privacidad-error" : undefined
              }
            />
            <div>
              <label htmlFor="contacto-privacidad">
                {t("form_section.labels.privacy")}
              </label>
              <p>
                <Link
                  href="/legal/privacidad"
                  className="arrowlink"
                  data-cursor
                >
                  {copy.privacyLink}
                </Link>
              </p>
              {errors.privacidad && (
                <p
                  id="contacto-privacidad-error"
                  className={`body ${styles.fieldError}`}
                >
                  {errors.privacidad}
                </p>
              )}
            </div>
          </div>
          <p role="status" className={styles.feedback}>
            {feedback}
          </p>
          <div className={styles.actions}>
            <button
              className="cta"
              type="submit"
              name="action"
              value="send"
              data-cursor
              disabled={sending}
            >
              <i />
              {sending
                ? locale === "en"
                  ? "Sending…"
                  : "Enviando…"
                : locale === "en"
                  ? "Send message"
                  : "Enviar mensaje"}
            </button>
            <button
              className="arrowlink"
              type="submit"
              name="action"
              value="whatsapp"
              data-cursor
            >
              {copy.whatsapp}
            </button>
            <button
              className="arrowlink"
              type="submit"
              name="action"
              value="copy"
              data-cursor
            >
              {copy.copy}
            </button>
          </div>
          {preview && (
            <div className={styles.preview}>
              <label htmlFor="contacto-preview">{copy.preview}</label>
              <textarea id="contacto-preview" readOnly value={preview} />
            </div>
          )}
        </form>
      </Chapter>
      <Chapter id="contacto-horario" scene={3} title={ui.openingHours}>
        <div className="sec-head">
          <span className="k">03 — {ui.openingHours}</span>
          <span className="rule" />
          <a className="k" href="#contacto-ubicaciones" data-cursor>
            {ui.location}
          </a>
        </div>
        <div className="gate-grid">
          <WordReveal as="h2" className="display h-sec">
            {copy.hoursTitle}
          </WordReveal>
          <div className="gate-copy">
            <p className="lead" data-rv="up">
              {copy.hoursBody}
            </p>
            <a href={facts.phoneHref} className="arrowlink" data-cursor>
              {copy.call} · {facts.phone}
            </a>
            <a href={facts.mobileHref} className="arrowlink" data-cursor>
              {facts.mobile}
            </a>
          </div>
        </div>
      </Chapter>
      <Chapter id="contacto-ubicaciones" scene={1} title={ui.location}>
        <div className="sec-head">
          <span className="k">04 — Lorca</span>
          <span className="rule" />
          <a className="k" href="#contacto-dudas" data-cursor>
            {ui.questions}
          </a>
        </div>
        <div className="gate-grid">
          <WordReveal as="h2" className="display h-sec">
            {copy.locationsTitle}
          </WordReveal>
          <div className="gate-copy">
            <p className="lead" data-rv="up">
              {copy.locationsBody}
            </p>
            <address className={`body ${styles.address}`}>
              {facts.address}
            </address>
            <a
              className="arrowlink"
              href={facts.mapHref}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor
            >
              {copy.maps}
            </a>
            <Link className="arrowlink" href="/lorca" data-cursor>
              {ui.locationInfo}
            </Link>
          </div>
        </div>
      </Chapter>
      <Chapter id="contacto-dudas" scene={5} title={ui.questions}>
        <div className="sec-head">
          <span className="k">05 — {ui.continue}</span>
          <span className="rule" />
          <a className="k" href="#contacto-canales" data-cursor>
            {ui.channelLink}
          </a>
        </div>
        <WordReveal as="h2" className="display h-sec">
          {copy.questionsTitle}
        </WordReveal>
        <div className={styles.faqGroup}>
          {copy.questions.map((q) => (
            <details key={q.question}>
              <summary data-cursor>{q.question}</summary>
              <p className="body-lg">{q.answer}</p>
            </details>
          ))}
        </div>
        <Link className="arrowlink" href="/preguntas-frecuentes" data-cursor>
          {ui.allQuestions}
        </Link>
      </Chapter>
    </GMPRoute>
  );
}
