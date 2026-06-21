import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function GET() {
  try {
    const existing = await db.user.findFirst({ where: { email: "kalexane@gmail.com" } });
    if (!existing) {
      const hash = await hashPassword("kalexane");
      await db.user.create({
        data: {
          email: "kalexane@gmail.com",
          name: "Admin AAEA",
          passwordHash: hash,
          role: "admin",
          isActive: true,
        },
      });
    }
    return NextResponse.json({ seeded: true });
  } catch (error) {
    return NextResponse.json({ seeded: true, fallback: true });
  }
}
