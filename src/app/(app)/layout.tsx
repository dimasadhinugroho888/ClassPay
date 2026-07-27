import { AppShell } from "@/components/app-shell"
import { requireUser } from "@/lib/access"

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  return (
    <AppShell
      role={user.role}
      name={user.name ?? "Pengguna"}
      mustChangePassword={!!user.mustChangePassword}
    >
      {children}
    </AppShell>
  )
}
