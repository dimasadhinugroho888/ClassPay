import { NextResponse } from "next/server"
import { auth } from "@/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Test DB connection
    const { prisma } = await import("@/lib/prisma")
    const userCount = await prisma.user.count()

    return NextResponse.json({
      ok: true,
      session: {
        userId: session.user.id,
        role: session.user.role,
        mustChangePassword: session.user.mustChangePassword,
      },
      db: {
        connected: true,
        userCount,
      },
      env: {
        hasAuthSecret: !!process.env.AUTH_SECRET,
        hasAuthUrl: !!process.env.AUTH_URL,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV,
      }
    })
  } catch (err) {
    const error = err as Error
    return NextResponse.json({
      ok: false,
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    }, { status: 500 })
  }
}
