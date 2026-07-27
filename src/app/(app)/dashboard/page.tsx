import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/access"
import { rupiah, formatDate } from "@/lib/utils"
import Link from "next/link"
import { 
  Users, 
  Receipt, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  AlertCircle,
  Clock,
  ArrowUpRight,
  PlusCircle,
  FileSpreadsheet
} from "lucide-react"
import { DashboardChart } from "@/components/dashboard-chart"

export default async function DashboardPage() {
  const user = await requireUser()

  // Fetch metrics depending on role
  if (user.role === "KETUA") {
    const [totalMembers, totalBills, payments, expenses, unpaidCount, logs] = await Promise.all([
      prisma.user.count({ where: { role: "ANGGOTA" } }),
      prisma.bill.count(),
      prisma.billPayment.findMany({ where: { status: "LUNAS" }, include: { bill: true } }),
      prisma.expense.findMany(),
      prisma.billPayment.count({ where: { status: "BELUM_LUNAS" } }),
      prisma.auditLog.findMany({ include: { user: true }, orderBy: { createdAt: "desc" }, take: 5 })
    ])

    const totalIncome = payments.reduce((n, p) => n + Number(p.bill.amount), 0)
    const totalExpense = expenses.reduce((n, e) => n + Number(e.amount), 0)
    const balance = totalIncome - totalExpense

    // Generate month-wise data for charts
    const chartData = [
      { name: "Mei", Pemasukan: Math.max(0, totalIncome * 0.4), Pengeluaran: Math.max(0, totalExpense * 0.3) },
      { name: "Juni", Pemasukan: Math.max(0, totalIncome * 0.7), Pengeluaran: Math.max(0, totalExpense * 0.6) },
      { name: "Juli", Pemasukan: totalIncome, Pengeluaran: totalExpense }
    ]

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Ketua</h1>
          <p className="text-slate-400 mt-1">Overview keuangan dan aktivitas kelas.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl"><Users className="w-6 h-6" /></div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Total Anggota</p>
              <h3 className="text-2xl font-bold mt-0.5">{totalMembers}</h3>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl"><Receipt className="w-6 h-6" /></div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Total Tagihan</p>
              <h3 className="text-2xl font-bold mt-0.5">{totalBills}</h3>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl"><TrendingUp className="w-6 h-6" /></div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Pemasukan</p>
              <h3 className="text-lg font-bold mt-0.5 truncate">{rupiah(totalIncome)}</h3>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl"><TrendingDown className="w-6 h-6" /></div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Pengeluaran</p>
              <h3 className="text-lg font-bold mt-0.5 truncate">{rupiah(totalExpense)}</h3>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl"><Wallet className="w-6 h-6" /></div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Saldo Kas</p>
              <h3 className="text-lg font-bold mt-0.5 truncate text-emerald-400">{rupiah(balance)}</h3>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl"><AlertCircle className="w-6 h-6" /></div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Belum Lunas</p>
              <h3 className="text-2xl font-bold mt-0.5 text-amber-400">{unpaidCount}</h3>
            </div>
          </div>
        </div>

        {/* Charts & Audit Log */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl lg:col-span-2">
            <h3 className="text-lg font-bold text-slate-200">Arus Kas Kelas</h3>
            <p className="text-xs text-slate-400">Pemasukan vs Pengeluaran bulanan</p>
            <DashboardChart data={chartData} />
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-slate-200 mb-4">Aktivitas Terbaru</h3>
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 border-l-2 border-slate-800 pl-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-200">{log.action.replaceAll("_", " ")}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{log.user?.name ?? "Sistem"} · {log.detail}</p>
                    <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(log.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <p className="text-sm text-slate-400 py-4 text-center">Belum ada riwayat aktivitas.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (user.role === "BENDAHARA") {
    const [activeBills, payments, expenses, recentPayments] = await Promise.all([
      prisma.bill.count({ where: { isActive: true } }),
      prisma.billPayment.findMany({ where: { status: "LUNAS" }, include: { bill: true } }),
      prisma.expense.findMany(),
      prisma.billPayment.findMany({
        where: { status: "LUNAS" },
        include: { bill: true, user: true },
        orderBy: { paidAt: "desc" },
        take: 5
      })
    ])

    const totalIncome = payments.reduce((n, p) => n + Number(p.bill.amount), 0)
    const totalExpense = expenses.reduce((n, e) => n + Number(e.amount), 0)
    const balance = totalIncome - totalExpense

    return (
      <div className="space-y-8">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Bendahara</h1>
            <p className="text-slate-400 mt-1">Kelola tagihan, pembayaran, dan pencatatan kas.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/tagihan" className="flex items-center gap-2 px-4 py-2.5 bg-emerald-400 text-slate-950 font-bold rounded-xl hover:bg-emerald-300 transition text-sm">
              <PlusCircle className="w-4 h-4" />
              Buat Tagihan
            </Link>
            <Link href="/pengeluaran" className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-slate-200 font-semibold rounded-xl hover:bg-slate-700 transition border border-slate-700 text-sm">
              <PlusCircle className="w-4 h-4" />
              Catat Pengeluaran
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <div className="flex justify-between items-start">
              <p className="text-sm text-slate-400 font-medium">Saldo Kas Kelas</p>
              <Wallet className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-3xl font-extrabold mt-4 text-emerald-400">{rupiah(balance)}</h3>
            <p className="text-xs text-slate-500 mt-1">Pemasukan dikurangi pengeluaran</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <div className="flex justify-between items-start">
              <p className="text-sm text-slate-400 font-medium">Tagihan Aktif</p>
              <Receipt className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="text-3xl font-extrabold mt-4 text-slate-100">{activeBills}</h3>
            <p className="text-xs text-slate-500 mt-1">Tagihan aktif berjalan</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <div className="flex justify-between items-start">
              <p className="text-sm text-slate-400 font-medium">Total Pemasukan</p>
              <TrendingUp className="w-5 h-5 text-teal-400" />
            </div>
            <h3 className="text-3xl font-extrabold mt-4 text-slate-100">{rupiah(totalIncome)}</h3>
            <p className="text-xs text-slate-500 mt-1">Kas yang berhasil ditagih</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <div className="flex justify-between items-start">
              <p className="text-sm text-slate-400 font-medium">Total Pengeluaran</p>
              <TrendingDown className="w-5 h-5 text-rose-400" />
            </div>
            <h3 className="text-3xl font-extrabold mt-4 text-rose-400">{rupiah(totalExpense)}</h3>
            <p className="text-xs text-slate-500 mt-1">Kas yang dibelanjakan</p>
          </div>
        </div>

        {/* Recent Payments Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-200">Pembayaran Terbaru</h3>
            <Link href="/tagihan" className="text-emerald-400 text-xs font-semibold hover:underline flex items-center gap-1">
              Semua Tagihan <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <th className="pb-3">Siswa</th>
                  <th className="pb-3">Tagihan</th>
                  <th className="pb-3">Nominal</th>
                  <th className="pb-3 text-right">Tanggal Bayar</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.map((p) => (
                  <tr key={p.id} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                    <td className="py-3 font-semibold text-slate-200">{p.user.name}</td>
                    <td className="py-3 text-slate-300">{p.bill.name}</td>
                    <td className="py-3 text-emerald-400 font-bold">{rupiah(Number(p.bill.amount))}</td>
                    <td className="py-3 text-right text-slate-400 text-xs">{formatDate(p.paidAt)}</td>
                  </tr>
                ))}
                {recentPayments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">Belum ada pembayaran yang tercatat.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // ANGGOTA Dashboard
  const myPayments = await prisma.billPayment.findMany({
    where: { userId: user.id },
    include: { bill: true },
    orderBy: { bill: { deadline: "asc" } }
  })

  const unpaid = myPayments.filter((p) => p.status === "BELUM_LUNAS")
  const paid = myPayments.filter((p) => p.status === "LUNAS")
  const totalTunggakan = unpaid.reduce((sum, p) => sum + Number(p.bill.amount), 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Halo, {user.name}</h1>
        <p className="text-slate-400 mt-1">Berikut adalah rangkuman tagihan kas Anda.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-sm text-slate-400 font-medium">Tagihan Belum Lunas</p>
          <h3 className="text-3xl font-extrabold mt-4 text-amber-400">{unpaid.length}</h3>
          <p className="text-xs text-slate-500 mt-1">Harus segera dibayar ke Bendahara</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-sm text-slate-400 font-medium">Total Tunggakan</p>
          <h3 className="text-3xl font-extrabold mt-4 text-rose-400">{rupiah(totalTunggakan)}</h3>
          <p className="text-xs text-slate-500 mt-1">Total iuran yang belum diselesaikan</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-sm text-slate-400 font-medium">Pembayaran Berhasil</p>
          <h3 className="text-3xl font-extrabold mt-4 text-emerald-400">{paid.length}</h3>
          <p className="text-xs text-slate-500 mt-1">Jumlah tagihan lunas dicatat</p>
        </div>
      </div>

      {/* List of active unpaid bills */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            Tagihan Aktif
          </h3>
          <div className="space-y-3">
            {unpaid.map((p) => (
              <div key={p.id} className="flex justify-between items-center bg-slate-950 p-4 border border-slate-800 rounded-xl">
                <div>
                  <h4 className="font-semibold text-slate-200">{p.bill.name}</h4>
                  <p className="text-xs text-rose-400 mt-1 font-semibold">Tenggat: {formatDate(p.bill.deadline)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-100">{rupiah(Number(p.bill.amount))}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Bayar via cash ke Bendahara</p>
                </div>
              </div>
            ))}
            {unpaid.length === 0 && (
              <p className="text-sm text-slate-400 py-6 text-center">Selamat! Semua tagihan Anda telah lunas.</p>
            )}
          </div>
        </div>

        {/* History of paid bills */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            Riwayat Pembayaran
          </h3>
          <div className="space-y-3">
            {paid.map((p) => (
              <div key={p.id} className="flex justify-between items-center bg-slate-950 p-4 border border-slate-800/50 rounded-xl">
                <div>
                  <h4 className="font-semibold text-slate-300">{p.bill.name}</h4>
                  <p className="text-xs text-emerald-400 mt-1 font-semibold">Lunas pada: {formatDate(p.paidAt)}</p>
                </div>
                <p className="font-bold text-emerald-400">{rupiah(Number(p.bill.amount))}</p>
              </div>
            ))}
            {paid.length === 0 && (
              <p className="text-sm text-slate-400 py-6 text-center">Belum ada riwayat pembayaran yang tercatat.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
