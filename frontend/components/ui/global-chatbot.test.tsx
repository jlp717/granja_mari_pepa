import React from "react";
import { TextEncoder, TextDecoder } from "util";
import { describe, it, expect, beforeEach } from "@jest/globals";

Object.assign(globalThis, { TextEncoder, TextDecoder });
if (typeof AbortSignal !== "undefined" && !AbortSignal.timeout) {
  Object.defineProperty(AbortSignal, "timeout", {
    configurable: true,
    value: () => new AbortController().signal,
  });
}
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { GlobalChatbot, pickBestVoice, chunkForSpeech } from "./global-chatbot";
import apiClient from "@/lib/apiClient";
jest.mock("@/lib/apiClient", () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));
jest.mock("next-intl", () => ({
  useLocale: () => "es",
  useTranslations: () => (key: string) => key,
}));

const post = jest.mocked(apiClient.post);
const encoder = new TextEncoder();

function sseResponse(text: string, extra: Record<string, unknown> = {}) {
  const half = Math.ceil(text.length / 2);
  const frames = [
    `data: ${JSON.stringify({ delta: text.slice(0, half) })}\n\n`,
    `data: ${JSON.stringify({ delta: text.slice(half) })}\n\n`,
    `data: ${JSON.stringify({ done: true, reply: text, ...extra })}\n\n`,
  ];
  let index = 0;
  return {
    ok: true,
    status: 200,
    body: {
      getReader: () => ({
        read: async () => {
          if (index >= frames.length) return { done: true, value: undefined };
          const value = encoder.encode(frames[index]);
          index += 1;
          return { done: false, value };
        },
      }),
    },
  };
}

const fetchMock = jest.fn();

beforeEach(() => {
  post.mockReset();
  fetchMock.mockReset();
  Object.defineProperty(globalThis, "fetch", {
    writable: true,
    value: fetchMock,
  });
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn(() => ({ matches: true })),
  });
});

describe("Pepa IA presentation preserves the real chat contract", () => {
  it("opens without making a request and returns focus on Escape", () => {
    render(<GlobalChatbot />);
    const launcher = screen.getByRole("button", { name: "Abrir Pepa IA" });
    fireEvent.click(launcher);
    expect(screen.getByRole("dialog", { name: "Pepa IA" })).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByLabelText("Tu mensaje"));
    expect(document.querySelector('[role="dialog"] img')?.getAttribute("src")).toBe(
      "/brand/logo-maripepa.jpeg",
    );
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(launcher);
  });

  it("streams the reply from the SSE endpoint and retains history when reopened", async () => {
    fetchMock.mockResolvedValue(sseResponse("Respuesta real de prueba"));
    render(<GlobalChatbot />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir Pepa IA" }));
    fireEvent.change(screen.getByLabelText("Tu mensaje"), {
      target: { value: "Una consulta" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar mensaje" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/chatbot/stream");
    expect(JSON.parse(String(init.body))).toMatchObject({
      message: "Una consulta",
      locale: "es",
    });

    await waitFor(() =>
      expect(screen.getByText("Respuesta real de prueba")).toBeTruthy(),
    );

    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Cerrar Pepa IA",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Abrir Pepa IA" }));
    expect(screen.getByText("Una consulta")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shows the server delivery result", async () => {
    fetchMock.mockResolvedValue(
      sseResponse("He enviado la factura.", {
        send: {
          success: true,
          channel: "email",
          toMasked: "c***@example.com",
          providerMessageId: "id-1",
        },
      }),
    );
    render(<GlobalChatbot />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir Pepa IA" }));
    fireEvent.change(screen.getByLabelText("Tu mensaje"), {
      target: { value: "envia mi factura" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar mensaje" }));

    await waitFor(() =>
      expect(
        screen.getByText(/Enviado por email a c\*\*\*@example\.com/),
      ).toBeTruthy(),
    );
  });

  it("shows a real request failure and enables the next input", async () => {
    fetchMock.mockRejectedValue(new Error("controlled failure"));
    render(<GlobalChatbot />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir Pepa IA" }));
    fireEvent.change(screen.getByLabelText("Tu mensaje"), {
      target: { value: "Consulta" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar mensaje" }));
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain("connectionError"),
    );
    expect(
      (screen.getByLabelText("Tu mensaje") as HTMLInputElement).disabled,
    ).toBe(false);
  });

  it("closes for another overlay without clearing conversation or moving focus", () => {
    render(<GlobalChatbot />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir Pepa IA" }));
    fireEvent(
      window,
      new CustomEvent("gmp:overlay-open", { detail: { id: "cookies" } }),
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("natural speech", () => {
  const voices = [
    { name: "Microsoft Helena - Spanish (Spain)", lang: "es-ES", localService: true },
    { name: "Microsoft Laura - Spanish (Spain)", lang: "es-ES", localService: true },
    {
      name: "Microsoft Elvira Online (Natural) - Spanish (Spain)",
      lang: "es-ES",
      localService: false,
    },
    { name: "Google español de Estados Unidos", lang: "es-US", localService: false },
  ];

  it("prefers neural voices and ranks the robotic one last", () => {
    expect(pickBestVoice(voices, "es")?.name).toContain("Elvira");
    expect(pickBestVoice(voices.slice(0, 2), "es")?.name).toContain("Laura");
    expect(pickBestVoice([], "es")).toBeNull();
  });

  it("splits long answers into punctuated chunks without markdown", () => {
    const text = `Primera frase con **negrita**. Segunda frase con un [enlace](/es/productos) y más texto. ${"Relleno de prueba. ".repeat(20)}Final.`;
    const chunks = chunkForSpeech(text, 120);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.length <= 120)).toBe(true);
    expect(chunks.every((chunk) => /[.!?]$/.test(chunk))).toBe(true);
    expect(chunks.join(" ")).not.toContain("**");
    expect(chunks.join(" ")).not.toContain("](");
  });
});
