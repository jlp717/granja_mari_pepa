import React from "react";
import { describe, it, expect, jest } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "./button";
import { Progress } from "./progress";

describe("GMP controls preserve action semantics", () => {
  it("submits an enabled native button without adding a decorative arrow", () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Guardar</Button>);
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button").textContent).toBe("Guardar");
  });
  it.each(["disabled", "loading"] as const)(
    "prevents activation for %s and keeps its label",
    (state) => {
      const onClick = jest.fn();
      render(
        <Button {...{ [state]: true }} onClick={onClick}>
          Enviar
        </Button>,
      );
      const button = screen.getByRole("button", {
        name: "Enviar",
      }) as HTMLButtonElement;
      fireEvent.click(button);
      expect(button.disabled).toBe(true);
      expect(onClick).not.toHaveBeenCalled();
      if (state === "loading")
        expect(button.getAttribute("aria-busy")).toBe("true");
    },
  );
  it("keeps normal asChild links and their callback", () => {
    const callback = jest.fn();
    render(
      <Button asChild>
        <a href="#destino" onClick={callback}>
          Ver
        </a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Ver" });
    expect(link.getAttribute("href")).toBe("#destino");
    fireEvent.click(link);
    expect(callback).toHaveBeenCalledTimes(1);
  });
  it.each(["disabled", "loading"] as const)(
    "removes slotted href and child callback while %s",
    (state) => {
      const callback = jest.fn();
      const keys = jest.fn();
      render(
        <Button asChild {...{ [state]: true }} onKeyDownCapture={keys}>
          <a href="/destino" onClick={callback}>
            <span>Continuar</span>
          </a>
        </Button>,
      );
      const link = screen.getByRole("link", { name: "Continuar" });
      expect(link.hasAttribute("href")).toBe(false);
      expect(link.getAttribute("aria-disabled")).toBe("true");
      fireEvent.click(link);
      fireEvent.keyDown(link, { key: "Enter" });
      fireEvent.keyDown(link, { key: " " });
      expect(callback).not.toHaveBeenCalled();
      expect(keys).not.toHaveBeenCalled();
      fireEvent.keyDown(link, { key: "Tab" });
      fireEvent.keyDown(link, { key: "Escape" });
      expect(keys).toHaveBeenCalledTimes(2);
    },
  );
});
describe("Progress has a truthful initial value", () => {
  it("uses value/max for the initial bar and ARIA", () => {
    const { container } = render(
      <Progress value={5} max={20} aria-label="Carga" />,
    );
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe(
      "5",
    );
    expect(screen.getByRole("progressbar").getAttribute("aria-valuemax")).toBe(
      "20",
    );
    expect(
      (container.querySelector(".gmp-progress-value") as HTMLElement).style
        .transform,
    ).toBe("scaleX(0.25)");
  });
  it("clamps a completed value", () => {
    render(<Progress value={150} />);
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe(
      "100",
    );
  });
  it("does not invent a percentage for indeterminate progress", () => {
    render(<Progress value={null} />);
    expect(screen.getByRole("progressbar").hasAttribute("aria-valuenow")).toBe(
      false,
    );
  });
});
