import Link from "next/link"
import { signOut } from "@/auth"
import type { AppRole } from "@/lib/access"
import { 
  LayoutDashboard, 
  Receipt, 
  TrendingDown, 
  FileText, 
  Users, 
  Activity, 
  Settings, 
  LogOut,
  AlertTriangle
} from "lucide-react"

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tagihan", label: "Tagihan & Kas", icon: Receipt },
  { href: "/pengeluaran", label: "Pengeluaran", icon: TrendingDown },
  { href: "/laporan", label: "Laporan Kas", icon: FileText },
  { href: "/anggota", label: "Kelola Anggota", icon: Users },
  { href: "/audit-log", label: "Audit Log", icon: Activity },
  { href: "/pengaturan", label: "Pengaturan", icon: Settings },
] as const

export function AppShell({
  children,
  role,
  name,
  mustChangePassword
}: {
  children: React.ReactNode
  role: AppRole
  name: string
  mustChangePassword: boolean
}) {
  const allowed = (href: string) => {
    // If user must change password, they can ONLY access settings
    if (mustChangePassword) {
      return href === "/pengaturan"
    }
    if (href === "/anggota" || href === "/audit-log") {
      return role === "KETUA"
    }
    if (href === "/pengeluaran" || href === "/laporan") {
      return role !== "ANGGOTA"
    }
    return true
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900/60 backdrop-blur-md border-b md:border-b-0 md:border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-2 text-xl font-black tracking-wider text-emerald-400">
            <span className="bg-emerald-500/10 text-emerald-400 p-1.5 rounded-lg border border-emerald-500/20">
              💎
            </span>
            CLASSPAY
          </Link>
          <p className="mt-1 text-xs text-slate-400">Sistem Kas & Tagihan Kelas</p>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible">
          {links.filter((l) => allowed(l.href)).map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800/80 hover:text-emerald-400 transition-all duration-200 whitespace-nowrap"
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{link.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer/Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/40 flex items-center justify-between md:flex-col md:items-stretch gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-bold text-emerald-400 uppercase">
              {name.charAt(0)}
            </div>
            <div className="hidden md:block overflow-hidden">
              <p className="text-sm font-semibold truncate text-slate-200">{name}</p>
              <p className="text-xs text-emerald-400 font-medium capitalize">{role.toLowerCase()}</p>
            </div>
          </div>

          <form
            action={async () => {
              "use server"
              await signOut({ redirectTo: "/login" })
            }}
          >
            <button className="flex w-full items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-all duration-200 cursor-pointer">
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Keluar</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Banner Alert for Password Change */}
        {mustChangePassword && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-300 px-6 py-3 text-sm font-medium flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 animate-pulse text-amber-400" />
            <span>
              <strong>Perhatian:</strong> Anda harus mengganti password default Anda di halaman Pengaturan sebelum dapat mengakses fitur lain.
            </span>
          </div>
        )}

        <main className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
