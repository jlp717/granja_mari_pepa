import { NextResponse } from "next/server";
import { createAdminAccessToken } from "@/lib/admin-access";

export const dynamic = "force-dynamic";

/**
 * Device enrolment. Reachable only from the LAN/VPN because `/admin/*` is
 * gated by the network check in proxy.ts. It mints the cookie token and hands
 * it to the public host, where the browser stores it for 30 days.
 */
export async function GET() {
  const secret = process.env.ADMIN_ACCESS_SECRET || "";
  if (secret.length < 32) {
    return new NextResponse("Falta ADMIN_ACCESS_SECRET en el servidor.", {
      status: 500,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const token = await createAdminAccessToken(secret);
  const target = new URL("/admin-access", "https://www.mari-pepa.com");
  target.searchParams.set("t", token);

  const response = NextResponse.redirect(target);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
