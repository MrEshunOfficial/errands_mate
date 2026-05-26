import { NextRequest, NextResponse } from "next/server";

// ─── Route Definitions ────────────────────────────────────────────────────────

const AUTH_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/resend-verification",
  "/delete-account",
];

// Prefixes that require an authenticated session
const PROTECTED_PREFIXES = [
  "/profile",
  "/provider",
  "/client",
  "/tasks",
  "/my-requests",
  "/requests",
];

const ADMIN_PREFIX = "/admin";


// ─── JWT Helpers ──────────────────────────────────────────────────────────────

interface JWTPayload {
  exp?: number;
  systemRole?: string;
  [key: string]: unknown;
}

function decodeJWT(token: string): JWTPayload | null {
  try {
    const segment = token.split(".")[1];
    const json = Buffer.from(segment, "base64url").toString("utf-8");
    return JSON.parse(json) as JWTPayload;
  } catch {
    return null;
  }
}

function isExpired(payload: JWTPayload): boolean {
  if (!payload.exp) return false;
  return Math.floor(Date.now() / 1000) > payload.exp;
}

function isAdmin(payload: JWTPayload): boolean {
  return (
    payload.systemRole === "admin" || payload.systemRole === "super_admin"
  );
}

// ─── Token Resolution ─────────────────────────────────────────────────────────

function getToken(request: NextRequest): string | null {
  return (
    request.cookies.get("authToken")?.value ??
    request.cookies.get("token")?.value ??
    null
  );
}

// ─── Middleware Logic ─────────────────────────────────────────────────────────

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  const raw = getToken(request);

  // Validate the token when present
  let payload: JWTPayload | null = null;
  if (raw) {
    payload = decodeJWT(raw);

    if (!payload || isExpired(payload)) {
      // Clear stale cookies and send to login
      const expired = NextResponse.redirect(new URL("/login", request.url));
      expired.cookies.delete("authToken");
      expired.cookies.delete("token");
      return expired;
    }
  }

  const authenticated = payload !== null;

  // ── Admin routes ────────────────────────────────────────────────────────────
  if (pathname.startsWith(ADMIN_PREFIX)) {
    if (!authenticated) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (!isAdmin(payload!)) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
    return NextResponse.next();
  }

  // ── Auth pages — bounce authenticated users to home ─────────────────────────
  const onAuthPage = AUTH_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`),
  );
  if (onAuthPage && authenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // ── Protected pages — require authentication ────────────────────────────────
  const onProtectedPage = PROTECTED_PREFIXES.some((p) =>
    pathname.startsWith(p),
  );
  if (onProtectedPage && !authenticated) {
    const dest = new URL("/login", request.url);
    dest.searchParams.set("redirect", pathname);
    return NextResponse.redirect(dest);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except Next.js internals and static assets.
     * API routes are handled by the rewrite in next.config.ts and never
     * reach this middleware.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
