import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/access"
import { rupiah, formatDate } from "@/lib/utils"
import { ReportActions } from "@/components/report-actions"
import { FileText, Calendar, Filter, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react"

export default async function ReportsPage({
  searchParams
}: {
  searchParams: Promise<{ startDate?: string; endDate?: string }>
}) {
  await requireRole("KETUA", "BENDAHARA")
  const { startDate = "", endDate = "" } = await searchParams

  // Default to past 30 days if not selected
  const defaultStart = new Date()
  defaultStart.setDate(defaultStart.getDate() - 30)
  const start = startDate ? new Date(startDate) : defaultStart
  
  const defaultEnd = new Date()
  const end = endDate ? new Date(endDate) : defaultEnd

  // Normalize dates to full day boundaries
  const startBoundary = new Date(start)
  startBoundary.setHours(0, 0, 0, 0)
  const endBoundary = new Date(end)
  endBoundary.setHours(23, 59, 59, 999)

  // Fetch payments and expenses in the date range
  const [payments, expenses] = await Promise.all([
    prisma.billPayment.findMany({
      where: {
        status: "LUNAS",
        paidAt: {
          gte: startBoundary,
          lte: endBoundary
        }
      },
      include: { bill: true, user: true },
      orderBy: { paidAt: "desc" }
    }),
    prisma.expense.findMany({
      where: {
        date: {
          gte: startBoundary,
          lte: endBoundary
        }
      },
      orderBy: { date: "desc" }
    })
  ])

  const totalIncome = payments.reduce((n, p) => n + Number(p.bill.amount), 0)
  const totalExpense = expenses.reduce((n, e) => n + Number(e.amount), 0)
  const balance = totalIncome - totalExpense

  // Format data for the client export component
  const reportData = {
    payments: payments.map(p => ({
      id: p.id,
      studentName: p.user.name,
      studentUsername: p.user.username,
      billName: p.bill.name,
      amount: Number(p.bill.amount),
      paidAt: p.paidAt?.toISOString() || ""
    })),
    expenses: expenses.map(e => ({
      id: e.id,
      name: e.name,
      amount: Number(e.amount),
      category: e.category,
      date: e.date.toISOString(),
      description: e.description
    })),
    summary: {
      income: totalIncome,
      expense: totalExpense,
      balance: balance,
      startDate: startBoundary.toISOString(),
      endDate: endBoundary.toISOString()
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Laporan Keuangan</h1>
          <p className="text-slate-400 mt-1">Pantau dan unduh berkas laporan arus kas masuk dan keluar.</p>
        </div>
        <ReportActions data={reportData} />
      </div>

      {/* Date Filter Card */}
      <section className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <form className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-slate-450 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Dari Tanggal
            </label>
            <input
              name="startDate"
              type="date"
              defaultValue={startBoundary.toISOString().split("T")[0]}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 outline-none"
            />
          </div>
          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-slate-455 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Sampai Tanggal
            </label>
            <input
              name="endDate"
              type="date"
              defaultValue={endBoundary.toISOString().split("T")[0]}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 outline-none"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-slate-200 hover:bg-slate-705 border border-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            <Filter className="w-4 h-4" />
            Tampilkan
          </button>
        </form>
      </section>

      {/* Cash Flow Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex justify-between items-start">
          <div>
            <p className="text-sm text-slate-400 font-medium">Total Pemasukan</p>
            <h3 className="text-2xl font-black mt-3 text-emerald-400">{rupiah(totalIncome)}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Pembayaran tagihan lunas di periode ini</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl"><ArrowUpRight className="w-5 h-5" /></div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex justify-between items-start">
          <div>
            <p className="text-sm text-slate-400 font-medium">Total Pengeluaran</p>
            <h3 className="text-2xl font-black mt-3 text-rose-455">-{rupiah(totalExpense)}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Pengeluaran kelas di periode ini</p>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl"><ArrowDownRight className="w-5 h-5" /></div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex justify-between items-start">
          <div>
            <p className="text-sm text-slate-400 font-medium">Selisih Saldo Kas</p>
            <h3 className={`text-2xl font-black mt-3 ${balance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {rupiah(balance)}
            </h3>
            <p className="text-[10px] text-slate-500 mt-1">Arus kas bersih periode ini</p>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl"><Wallet className="w-5 h-5" /></div>
        </div>
      </div>

      {/* Details Sections */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Pemasukan / Pembayaran Table */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden self-start">
          <div className="p-5 border-b border-slate-800">
            <h3 className="font-bold text-slate-200 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              Rincian Kas Masuk ({payments.length})
            </h3>
          </div>
          <div className="divide-y divide-slate-800/60 max-h-[500px] overflow-y-auto">
            {payments.map((p) => (
              <div key={p.id} className="p-4 flex justify-between items-center hover:bg-slate-800/10 transition">
                <div>
                  <p className="text-sm font-semibold text-slate-200">{p.user.name}</p>
                  <p className="text-xs text-slate-450 mt-0.5">{p.bill.name} · {formatDate(p.paidAt)}</p>
                </div>
                <span className="text-sm font-bold text-emerald-400">{rupiah(Number(p.bill.amount))}</span>
              </div>
            ))}
            {payments.length === 0 && (
              <p className="text-sm text-slate-400 p-8 text-center">Tidak ada pemasukan tercatat di periode ini.</p>
            )}
          </div>
        </section>

        {/* Pengeluaran Table */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden self-start">
          <div className="p-5 border-b border-slate-800">
            <h3 className="font-bold text-slate-200 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-455" />
              Rincian Kas Keluar ({expenses.length})
            </h3>
          </div>
          <div className="divide-y divide-slate-800/60 max-h-[500px] overflow-y-auto">
            {expenses.map((e) => (
              <div key={e.id} className="p-4 flex justify-between items-center hover:bg-slate-800/10 transition">
                <div>
                  <p className="text-sm font-semibold text-slate-200">{e.name}</p>
                  <p className="text-xs text-slate-450 mt-0.5">{e.category} · {formatDate(e.date)}</p>
                </div>
                <span className="text-sm font-bold text-rose-455">-{rupiah(Number(e.amount))}</span>
              </div>
            ))}
            {expenses.length === 0 && (
              <p className="text-sm text-slate-400 p-8 text-center">Tidak ada pengeluaran tercatat di periode ini.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
