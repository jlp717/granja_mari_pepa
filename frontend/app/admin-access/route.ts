import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_ACCESS_COOKIE,
  ADMIN_ACCESS_DAYS,
  verifyAdminAccessToken,
} from "@/lib/admin-access";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("t") || "";
  const secret = process.env.ADMIN_ACCESS_SECRET || "";
  const valid = await verifyAdminAccessToken(token, secret);

  if (!valid) {
    return new NextResponse("Enlace no válido o caducado.", {
      status: 403,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

  const response = NextResponse.redirect(new URL("/admin", request.url));
  response.cookies.set(ADMIN_ACCESS_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: ADMIN_ACCESS_DAYS * 86400,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
