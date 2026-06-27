import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const STAFF_POSITIONS = [
  "property_manager",
  "receptionist",
  "caretaker",
  "accountant",
  "security",
  "maintenance",
];

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // ── Not logged in → send to login ──────────────────────────────────────────
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = token.role as string;

  // ── /admin → admin only ────────────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  // ── /staff → staff positions only ─────────────────────────────────────────
  if (pathname.startsWith("/staff")) {
    if (!STAFF_POSITIONS.includes(role)) {
      // Admin trying to access /staff → send them to /admin instead
      if (role === "admin") {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Protect all /admin and /staff routes, including nested pages
  matcher: ["/admin/:path*", "/staff/:path*"],
};