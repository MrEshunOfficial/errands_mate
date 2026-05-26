import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { SystemRole } from "@/types/user.types";

// ─── JWT Payload ──────────────────────────────────────────────────────────────

interface JWTPayload {
  userId: string;
  systemRole: SystemRole;
  isEmailVerified: boolean;
}

// ─── Route Configuration ──────────────────────────────────────────────────────

// Grouped by intent — avoids the fragile boolean arithmetic in the original.
const routes = {
  // Redirect to dashboard if already authenticated
  auth: [
    "/login",
    "/register",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
  ],

  // Any authenticated user (email-verified)
  protected: ["/profile", "/settings", "/services-offered"],

  // SystemRole.ADMIN or SUPER_ADMIN
  admin: ["/admin"],

  // SystemRole.SUPER_ADMIN only (checked before /admin to avoid overlap)
  superAdmin: ["/admin/super"],

  // Authenticated but email not yet verified
  emailVerification: ["/verify-email", "/resend-verification"],
} as const;

// ─── Role Helpers ─────────────────────────────────────────────────────────────

const hasAdminAccess = (role: SystemRole) =>
  role === SystemRole.ADMIN || role === SystemRole.SUPER_ADMIN;

const hasSuperAdminAccess = (role: SystemRole) =>
  role === SystemRole.SUPER_ADMIN;

// ─── Token Verification ───────────────────────────────────────────────────────

async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET is not configured");

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
    );

    return {
      userId: payload.userId as string,
      systemRole: (payload.systemRole as SystemRole) ?? SystemRole.USER,
      isEmailVerified: (payload.isEmailVerified as boolean) ?? false,
    };
  } catch {
    return null;
  }
}

// ─── Redirect Helpers ─────────────────────────────────────────────────────────

const redirectTo = (path: string, request: NextRequest, clearToken = false) => {
  const response = NextResponse.redirect(new URL(path, request.url));
  if (clearToken) response.cookies.delete("token");
  return response;
};

const redirectToLogin = (request: NextRequest, reason?: string) => {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
  if (reason) loginUrl.searchParams.set("error", reason);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete("token");
  return response;
};

// ─── Middleware ───────────────────────────────────────────────────────────────

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  // ── Route Classification ──────────────────────────────────────────────────

  // Check most-specific first to avoid overlap (superAdmin ⊂ admin)
  const isSuperAdminRoute = routes.superAdmin.some((r) =>
    pathname.startsWith(r),
  );
  const isAdminRoute =
    !isSuperAdminRoute && routes.admin.some((r) => pathname.startsWith(r));
  const isProtectedRoute = routes.protected.some((r) => pathname.startsWith(r));
  const isAuthRoute = routes.auth.some((r) => pathname.startsWith(r));

  const requiresAuth = isProtectedRoute || isAdminRoute || isSuperAdminRoute;

  // ── Protected / Admin Routes ──────────────────────────────────────────────

  if (requiresAuth) {
    if (!token) return redirectToLogin(request);

    const payload = await verifyToken(token);

    // Invalid or expired token — clear cookie and force re-login
    if (!payload) return redirectToLogin(request, "session_expired");

    // ── Email verification gate (mirrors backend requireVerification) ─────
    if (!payload.isEmailVerified) {
      return redirectTo("/verify-email", request);
    }

    // ── Role gates ────────────────────────────────────────────────────────
    if (isSuperAdminRoute && !hasSuperAdminAccess(payload.systemRole)) {
      return redirectTo("/unauthorized", request);
    }

    if (isAdminRoute && !hasAdminAccess(payload.systemRole)) {
      return redirectTo("/unauthorized", request);
    }

    // ── Forward identity headers to server components / route handlers ────
    const response = NextResponse.next();
    response.headers.set("x-user-id", payload.userId);
    response.headers.set("x-user-role", payload.systemRole);
    response.headers.set("x-user-authenticated", "true");
    response.headers.set("x-email-verified", String(payload.isEmailVerified));
    return response;
  }

  // ── Auth Routes — redirect authenticated users to their dashboard ─────────

  if (isAuthRoute && token) {
    const payload = await verifyToken(token);

    if (payload) {
      // Unverified users stay on auth/verify routes; don't redirect them away
      if (!payload.isEmailVerified) return NextResponse.next();

      if (hasSuperAdminAccess(payload.systemRole))
        return redirectTo("/admin/super/dashboard", request);

      if (hasAdminAccess(payload.systemRole))
        return redirectTo("/admin/dashboard", request);

      return redirectTo("/profile", request);
    }

    // Bad token on an auth route — clear it and let them through
    const response = NextResponse.next();
    response.cookies.delete("token");
    return response;
  }

  return NextResponse.next();
}

// ─── Matcher ──────────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|gif|webp)$).*)",
  ],
};
