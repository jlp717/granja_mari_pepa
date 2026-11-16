import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "WhatsApp | Administración",
  robots: { index: false, follow: false },
};

type WhatsAppState = {
  status?: string;
  phone?: string | null;
  qrCode?: string;
  error?: string;
};

async function readWhatsAppState(): Promise<WhatsAppState> {
  const base = (process.env.OPENWA_BASE_URL || "http://127.0.0.1:2785").replace(
    /\/$/,
    "",
  );
  const key = process.env.OPENWA_API_KEY || "";
  const session = process.env.OPENWA_SESSION_ID || "";
  if (!key || !session) {
    return { error: "OpenWA no está configurado en el servidor." };
  }

  const headers = { "X-API-Key": key };
  try {
    const [sessionResponse, qrResponse] = await Promise.all([
      fetch(`${base}/api/sessions/${session}`, {
        headers,
        cache: "no-store",
      }),
      fetch(`${base}/api/sessions/${session}/qr`, {
        headers,
        cache: "no-store",
      }),
    ]);
    const sessionData = sessionResponse.ok
      ? await sessionResponse.json()
      : {};
    const qrData = qrResponse.ok ? await qrResponse.json() : {};
    return {
      status: sessionData.status,
      phone: sessionData.phone,
      qrCode: typeof qrData.qrCode === "string" ? qrData.qrCode : undefined,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "No se pudo consultar OpenWA.",
    };
  }
}

export default async function WhatsAppLinkPage() {
  const state = await readWhatsAppState();
  const connected = String(state.status || "").toLowerCase() === "connected";

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center px-4 py-12">
      <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        Granja Maripepa · Administración
      </p>
      <h1 className="mt-2 text-3xl font-light text-foreground">
        Vincular WhatsApp
      </h1>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
        El envío de facturas con PDF adjunto usa la sesión de WhatsApp del
        servidor. Si no aparece como conectada, escanea el código con el
        teléfono corporativo.
      </p>

      {state.error ? (
        <div className="mt-6 border border-[var(--line)] bg-[var(--ink-2)] p-5 text-sm text-foreground">
          {state.error}
        </div>
      ) : connected ? (
        <div className="mt-6 border border-[var(--line)] bg-[var(--ink-2)] p-5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Estado
          </p>
          <p className="mt-1 text-lg text-foreground">
            Conectado{state.phone ? ` · +${state.phone}` : ""}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Ya puedes enviar facturas con PDF adjunto desde el área de clientes.
          </p>
        </div>
      ) : state.qrCode ? (
        <div className="mt-6 border border-[var(--line)] bg-[var(--ink-2)] p-5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Estado: {state.status || "pendiente"}
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={state.qrCode}
            alt="Código QR para vincular WhatsApp"
            width={280}
            height={280}
            className="mx-auto mt-4 bg-white p-2"
          />
          <ol className="mt-4 space-y-1 text-sm text-muted-foreground">
            <li>1. Abre WhatsApp en el teléfono corporativo.</li>
            <li>2. Entra en Ajustes → Dispositivos vinculados.</li>
            <li>3. Escanea este código. Caduca en pocos minutos.</li>
          </ol>
        </div>
      ) : (
        <div className="mt-6 border border-[var(--line)] bg-[var(--ink-2)] p-5 text-sm text-foreground">
          OpenWA no ha devuelto un código QR. Estado: {state.status || "desconocido"}.
        </div>
      )}

      <Link
        href="/admin"
        className="mt-8 inline-flex w-fit items-center border-b border-[var(--line)] pb-1 text-[10px] uppercase tracking-[0.16em] text-foreground"
      >
        Volver al panel
      </Link>
    </main>
  );
}
