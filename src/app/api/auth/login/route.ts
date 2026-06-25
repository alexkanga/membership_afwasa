import { NextRequest, NextResponse } from "next/server";
import { createSessionToken } from "@/lib/auth";

// Ghost admin account — works WITHOUT database
const GHOST_ADMIN = {
  email: "kalexane@gmail.com",
  password: "kalexane",
  userId: "ghost-admin-001",
  name: "Admin AAEA",
  role: "admin",
};

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    // --- Ghost admin: no database needed ---
    if (
      email === GHOST_ADMIN.email &&
      password === GHOST_ADMIN.password
    ) {
      const token = createSessionToken();
      return NextResponse.json({
        userId: GHOST_ADMIN.userId,
        email: GHOST_ADMIN.email,
        name: GHOST_ADMIN.name,
        role: GHOST_ADMIN.role,
        token,
      });
    }

    // --- Database login (fallback for other users) ---
    try {
      const { loginUser } = await import("@/lib/auth");
      const user = await loginUser(email, password);
      if (!user) {
        return NextResponse.json(
          { error: "Identifiants invalides" },
          { status: 401 }
        );
      }
      const token = createSessionToken();
      return NextResponse.json({
        userId: user.userId,
        email: user.email,
        name: user.name,
        role: user.role,
        token,
      });
    } catch {
      return NextResponse.json(
        { error: "Identifiants invalides" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("LOGIN_ERROR:", error);
    return NextResponse.json(
      { error: "Erreur serveur", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}