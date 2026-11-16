import { webcrypto } from "node:crypto";
import { TextDecoder, TextEncoder } from "node:util";
import {
  createAdminAccessToken,
  verifyAdminAccessToken,
} from "./admin-access";

const SECRET = "test-secret-with-at-least-32-characters";

beforeAll(() => {
  if (typeof globalThis.TextEncoder === "undefined") {
    Object.defineProperty(globalThis, "TextEncoder", { value: TextEncoder });
  }
  if (typeof globalThis.TextDecoder === "undefined") {
    Object.defineProperty(globalThis, "TextDecoder", { value: TextDecoder });
  }
  if (!globalThis.crypto?.subtle) {
    Object.defineProperty(globalThis, "crypto", { value: webcrypto });
  }
});

describe("admin access tokens", () => {
  it("accepts a token it just created", async () => {
    const token = await createAdminAccessToken(SECRET, 1);
    await expect(verifyAdminAccessToken(token, SECRET)).resolves.toBe(true);
  });

  it("rejects a tampered signature", async () => {
    const token = await createAdminAccessToken(SECRET, 1);
    const tampered = `${token.slice(0, -1)}${token.endsWith("0") ? "1" : "0"}`;
    await expect(verifyAdminAccessToken(tampered, SECRET)).resolves.toBe(
      false,
    );
  });

  it("rejects an expired token", async () => {
    const now = Date.now();
    const token = await createAdminAccessToken(SECRET, 1);
    const spy = jest.spyOn(Date, "now").mockReturnValue(now + 2 * 86400 * 1000);
    await expect(verifyAdminAccessToken(token, SECRET)).resolves.toBe(false);
    spy.mockRestore();
  });

  it("rejects a secret that is too short", async () => {
    const token = await createAdminAccessToken("short", 1);
    await expect(verifyAdminAccessToken(token, "short")).resolves.toBe(false);
  });
});
