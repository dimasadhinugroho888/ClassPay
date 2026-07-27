import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/access"
import { formatDate, rupiah } from "@/lib/utils"
import Link from "next/link"
import { redirect } from "next/navigation"
import { PaymentRow } from "@/components/payment-row"
import { 
  ArrowLeft, 
  Search, 
  Send,
  MessageSquare,
  Users, 
  CheckCircle, 
  AlertCircle, 
  DollarSign, 
  TrendingUp,
  Percent
} from "lucide-react"

export default async function BillDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ q?: string; status?: string; sort?: string }>
}) {
  const user = await requireUser()
  const { id } = await params
  const { q = "", status = "SEMUA", sort = "name_asc" } = await searchParams
  
  const canManage = user.role === "BENDAHARA"

  // Fetch the bill
  const bill = await prisma.bill.findUnique({
    where: { id }
  })

  if (!bill) {
    redirect("/tagihan")
  }

  // Build filter query for table
  const whereFilter: any = {
    billId: id
  }

  if (status === "LUNAS" || status === "BELUM_LUNAS") {
    whereFilter.status = status
  }

  if (q) {
    whereFilter.user = {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { username: { contains: q, mode: "insensitive" } }
      ]
    }
  }

  // Build sorting
  let orderBy: any = {}
  if (sort === "name_asc") {
    orderBy = { user: { name: "asc" } }
  } else if (sort === "name_desc") {
    orderBy = { user: { name: "desc" } }
  } else if (sort === "paid_desc") {
    orderBy = { paidAt: "desc" }
  } else if (sort === "paid_asc") {
    orderBy = { paidAt: "asc" }
  }

  // Parallel fetches for statistics, counts and list
  const [
    payments,
    totalCount,
    lunasCount,
    belumLunasCount,
    unpaidForReminders,
    reminderSetting
  ] = await Promise.all([
    prisma.billPayment.findMany({
      where: whereFilter,
      include: { user: true },
      orderBy
    }),
    prisma.billPayment.count({ where: { billId: id } }),
    prisma.billPayment.count({ where: { billId: id, status: "LUNAS" } }),
    prisma.billPayment.count({ where: { billId: id, status: "BELUM_LUNAS" } }),
    prisma.billPayment.findMany({
      where: { billId: id, status: "BELUM_LUNAS" },
      include: { user: true }
    }),
    prisma.setting.findUnique({ where: { key: "whatsapp_reminder" } })
  ])

  const targetAmount = totalCount * Number(bill.amount)
  const collectedAmount = lunasCount * Number(bill.amount)
  const progressPercent = totalCount > 0 ? Math.round((lunasCount / totalCount) * 100) : 0

  // WhatsApp Reminder message builder
  const defaultTemplate = "Halo {Nama},\n\nIni adalah pengingat bahwa tagihan \"{Nama Tagihan}\" sebesar Rp{Nominal} masih berstatus BELUM LUNAS. Silakan melakukan pembayaran langsung kepada Bendahara kelas.\n\nTerima kasih."
  const template = reminderSetting?.value || defaultTemplate

  const getReminderLink = (studentName: string, phone: string) => {
    const text = template
      .replace(/{Nama}/g, studentName)
      .replace(/{Nama Tagihan}/g, bill.name)
      .replace(/{Nominal}/g, Number(bill.amount).toLocaleString("id-ID"))
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/tagihan" 
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-1">
            {bill.category}
          </span>
          <h1 className="text-3xl font-bold tracking-tight">{bill.name}</h1>
          <p className="text-slate-400 text-sm mt-0.5">{bill.description || "Tidak ada deskripsi tagihan."}</p>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-slate-800 text-slate-350 rounded-xl"><Users className="w-6 h-6" /></div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Anggota</p>
            <h3 className="text-xl font-bold mt-0.5">{totalCount}</h3>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl"><CheckCircle className="w-6 h-6" /></div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Lunas</p>
            <h3 className="text-xl font-bold mt-0.5 text-emerald-400">{lunasCount}</h3>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl"><AlertCircle className="w-6 h-6" /></div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Belum Lunas</p>
            <h3 className="text-xl font-bold mt-0.5 text-amber-300">{belumLunasCount}</h3>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl"><DollarSign className="w-6 h-6" /></div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Target Dana</p>
            <h3 className="text-lg font-bold mt-0.5 truncate">{rupiah(targetAmount)}</h3>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl"><TrendingUp className="w-6 h-6" /></div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Dana Terkumpul</p>
            <h3 className="text-lg font-bold mt-0.5 truncate text-emerald-400">{rupiah(collectedAmount)}</h3>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-2">
        <div className="flex justify-between items-center text-sm font-semibold">
          <span className="text-slate-300">Progress Pelunasan Kelas</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <Percent className="w-4 h-4" />
            {progressPercent}%
          </span>
        </div>
        <div className="w-full bg-slate-850 h-3.5 rounded-full overflow-hidden border border-slate-800">
          <div 
            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Payments Tracking Table */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden self-start">
          {/* Controls Bar */}
          <div className="p-6 border-b border-slate-800 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-slate-200">Daftar Pembayaran Siswa</h2>

              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <form className="relative w-full md:w-64">
                  <input
                    name="q"
                    placeholder="Cari nama atau username..."
                    defaultValue={q}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 outline-none focus:border-emerald-400"
                  />
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-550" />
                  <input type="hidden" name="status" value={status} />
                  <input type="hidden" name="sort" value={sort} />
                </form>

                {/* Sorting */}
                <form>
                  <input type="hidden" name="q" value={q} />
                  <input type="hidden" name="status" value={status} />
                  <select
                    name="sort"
                    defaultValue={sort}
                    onChange={(e) => e.target.form?.submit()}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none"
                  >
                    <option value="name_asc">Nama A-Z</option>
                    <option value="name_desc">Nama Z-A</option>
                    <option value="paid_desc">Terbaru Bayar</option>
                    <option value="paid_asc">Terlama Bayar</option>
                  </select>
                </form>
              </div>
            </div>

            {/* Quick Filter Tabs */}
            <div className="flex gap-2 border-b border-slate-800/60 pb-3">
              {[
                { label: "Semua", val: "SEMUA", count: totalCount },
                { label: "Belum Lunas", val: "BELUM_LUNAS", count: belumLunasCount },
                { label: "Lunas", val: "LUNAS", count: lunasCount }
              ].map((tab) => (
                <Link
                  key={tab.val}
                  href={`/tagihan/${id}?q=${q}&sort=${sort}&status=${tab.val}`}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition ${
                    status === tab.val
                      ? "bg-emerald-400 text-slate-950 border-emerald-400 font-bold"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-250 hover:bg-slate-800/40"
                  }`}
                >
                  {tab.label} ({tab.count})
                </Link>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-4">Nama Siswa</th>
                  <th className="p-4">Nominal</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Tanggal Bayar</th>
                  <th className="p-4">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {payments.map((p) => (
                  <PaymentRow
                    key={p.id}
                    id={p.id}
                    studentName={p.user.name}
                    studentUsername={p.user.username}
                    billAmount={Number(bill.amount)}
                    initialStatus={p.status}
                    initialPaidAt={p.paidAt}
                    canManage={canManage}
                  />
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      Tidak ada data pembayaran yang sesuai dengan kriteria filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* WhatsApp Reminder Section */}
        {canManage && (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 self-start space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                Pengingat WhatsApp
              </h3>
              <p className="text-xs text-slate-400 mt-1">Kirim pengingat pembayaran WhatsApp ke nomor wali/siswa secara manual.</p>
            </div>

            {unpaidForReminders.length > 0 ? (
              <div className="space-y-4">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl text-xs flex gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
                  <span>Terdapat <strong>{unpaidForReminders.length} siswa</strong> belum lunas. Kirimkan pengingat satu per satu.</span>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {unpaidForReminders.map((p) => (
                    <div key={p.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate">{p.user.name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{p.user.whatsapp}</p>
                      </div>
                      <a
                        href={getReminderLink(p.user.name, p.user.whatsapp)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950 border border-emerald-500/20 text-emerald-400 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        Kirim
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-slate-400 bg-slate-950 border border-slate-850 rounded-xl">
                Semua siswa sudah melunasi tagihan ini! 🌟
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
