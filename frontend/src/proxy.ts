import { NextResponse, type NextRequest } from "next/server";

// Proxy is the Next 16 replacement for the old middleware convention.
// Kept as a pass-through for now — when we re-enable auth guards, add the
// Supabase session refresh + /dashboard check here.

export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
