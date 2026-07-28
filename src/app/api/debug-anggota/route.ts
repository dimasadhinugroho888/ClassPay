import { NextResponse } from "next/server"

export async function GET() {
  const errors: string[] = []
  const steps: string[] = []

  try {
    steps.push("1. importing auth...")
    const { auth } = await import("@/auth")
    steps.push("2. calling auth()...")
    const session = await auth()
    steps.push(`3. session role = ${session?.user?.role ?? "null"}`)

    steps.push("4. importing prisma...")
    const { prisma } = await import("@/lib/prisma")
    steps.push("5. querying users...")
    const members = await prisma.user.findMany({ orderBy: { name: "asc" } })
    steps.push(`6. got ${members.length} users`)

    steps.push("7. importing server actions...")
    await import("@/actions/classpay")
    steps.push("8. actions imported OK")

    return NextResponse.json({ ok: true, steps })
  } catch (err) {
    const e = err as Error
    errors.push(e.message)
    if (e.stack) errors.push(e.stack)
    return NextResponse.json({ ok: false, steps, error: e.message, stack: e.stack }, { status: 500 })
  }
}
