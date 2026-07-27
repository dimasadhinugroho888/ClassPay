import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/access"
import { formatDate } from "@/lib/utils"
import { Activity, User, ShieldAlert, Clock } from "lucide-react"

export default async function AuditLogPage() {
  await requireRole("KETUA")

  const logs = await prisma.auditLog.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 100
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Log Aktivitas</h1>
        <p className="text-slate-400 mt-1">Riwayat lengkap aktivitas dan transaksi sistem ClassPay.</p>
      </div>

      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
        <h2 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          Aktivitas Sistem Terbaru
        </h2>

        <div className="relative border-l border-slate-800 pl-6 ml-3 space-y-8">
          {logs.map((log) => {
            const isCritical = ["HAPUS_ANGGOTA", "HAPUS_TAGIHAN", "HAPUS_PENGELUARAN"].includes(log.action)
            return (
              <div key={log.id} className="relative">
                {/* Timeline dot */}
                <span className={`absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                  isCritical 
                    ? "bg-rose-500/20 border-rose-500 text-rose-455" 
                    : "bg-slate-950 border-slate-800 text-slate-400"
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isCritical ? "bg-rose-500" : "bg-slate-700"}`} />
                </span>

                <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-2xl hover:border-slate-800 transition">
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase border ${
                      isCritical
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                    }`}>
                      {log.action.replaceAll("_", " ")}
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDate(log.createdAt)}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-slate-200 mt-2 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-slate-400" />
                    Pelaku: <span className="text-slate-350">{log.user?.name ?? "Sistem"}</span>
                  </p>

                  {log.detail && (
                    <p className="text-xs text-slate-400 mt-1.5 bg-slate-900/50 p-2 border border-slate-850 rounded-lg">
                      <strong className="text-slate-450">Detail:</strong> {log.detail}
                    </p>
                  )}
                </div>
              </div>
            )
          })}

          {logs.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              Belum ada riwayat audit log aktivitas di database.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
