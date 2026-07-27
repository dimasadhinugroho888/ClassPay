import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/access"
import { createBill, editBill, deleteBill } from "@/actions/classpay"
import { formatDate, rupiah } from "@/lib/utils"
import Link from "next/link"
import { Receipt, Calendar, PlusCircle, Edit, Trash2, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react"

export default async function BillsPage({
  searchParams
}: {
  searchParams: Promise<{ editId?: string }>
}) {
  const user = await requireUser()
  const { editId } = await searchParams
  const canManage = user.role === "BENDAHARA"

  // Fetch all bills
  const bills = await prisma.bill.findMany({
    orderBy: { createdAt: "desc" }
  })

  // If editing, fetch the bill details
  const editingBill = editId && canManage
    ? await prisma.bill.findUnique({ where: { id: editId } })
    : null

  // If role is ANGGOTA, fetch user's specific payments
  const myPayments = user.role === "ANGGOTA"
    ? await prisma.billPayment.findMany({
        where: { userId: user.id },
        include: { bill: true },
        orderBy: { bill: { createdAt: "desc" } }
      })
    : []

  if (user.role === "ANGGOTA") {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tagihan Saya</h1>
          <p className="text-slate-400 mt-1">Daftar semua iuran dan status pembayaran Anda.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-400" />
              Semua Tagihan
            </h2>
          </div>
          <div className="divide-y divide-slate-800/60">
            {myPayments.map((p) => (
              <div key={p.id} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-800/20 transition">
                <div className="space-y-1">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {p.bill.category}
                  </span>
                  <h3 className="text-base font-bold text-slate-200">{p.bill.name}</h3>
                  <p className="text-xs text-slate-400">{p.bill.description || "Tidak ada deskripsi."}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-2">
                    <Calendar className="w-3.5 h-3.5" />
                    Tenggat Pembayaran: {formatDate(p.bill.deadline)}
                  </p>
                </div>
                <div className="flex sm:flex-col items-start sm:items-end justify-between w-full sm:w-auto gap-2">
                  <span className="text-lg font-extrabold text-slate-100">{rupiah(Number(p.bill.amount))}</span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    p.status === "LUNAS"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                  }`}>
                    {p.status === "LUNAS" ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Lunas
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 animate-pulse" /> Belum Lunas
                      </>
                    )}
                  </span>
                </div>
              </div>
            ))}
            {myPayments.length === 0 && (
              <div className="p-12 text-center text-slate-400">Belum ada tagihan kelas yang ditujukan untuk Anda.</div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tagihan Kelas</h1>
        <p className="text-slate-400 mt-1">Buat tagihan kelas dan pantau pelunasan masing-masing siswa.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Bills List */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-400" />
              Daftar Tagihan ({bills.length})
            </h2>
          </div>
          <div className="divide-y divide-slate-800/60">
            {bills.map((b) => (
              <div key={b.id} className="p-6 hover:bg-slate-800/20 transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {b.category}
                    </span>
                    {!b.isActive && (
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-850 text-slate-400 border border-slate-805">
                        Nonaktif
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-200">{b.name}</h3>
                  <p className="text-xs text-slate-400">{b.description || "Tidak ada deskripsi."}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Tenggat: {formatDate(b.deadline)}
                  </p>
                </div>
                <div className="flex sm:flex-col items-start sm:items-end gap-3 justify-between w-full sm:w-auto">
                  <span className="text-lg font-extrabold text-slate-100">{rupiah(Number(b.amount))}</span>
                  <div className="flex items-center gap-2">
                    {canManage && (
                      <>
                        <Link
                          href={`/tagihan?editId=${b.id}`}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-350 hover:bg-slate-700 hover:text-white transition"
                          title="Edit Tagihan"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <form action={deleteBill} onSubmit={(e) => {
                          if (!confirm(`Hapus tagihan ${b.name}? Semua data pelunasan terkait akan dihapus permanen.`)) {
                            e.preventDefault()
                          }
                        }}>
                          <input type="hidden" name="id" value={b.id} />
                          <button className="p-1.5 rounded-lg bg-rose-500/10 text-rose-450 border border-rose-500/20 hover:bg-rose-600 hover:text-white transition cursor-pointer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </form>
                      </>
                    )}
                    <Link
                      href={`/tagihan/${b.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-400 text-slate-950 font-bold hover:bg-emerald-300 transition text-xs"
                    >
                      Detail
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            {bills.length === 0 && (
              <div className="p-12 text-center text-slate-400">Belum ada tagihan kelas. Silakan buat di form samping.</div>
            )}
          </div>
        </section>

        {/* Bill Form (Create / Edit) */}
        {canManage ? (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 self-start space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-400" />
                {editingBill ? "Edit Tagihan" : "Buat Tagihan"}
              </h3>
              {editingBill && (
                <Link href="/tagihan" className="text-slate-400 hover:text-slate-200">
                  Cancel
                </Link>
              )}
            </div>

            <form action={editingBill ? editBill : createBill} className="space-y-4">
              {editingBill && <input type="hidden" name="id" value={editingBill.id} />}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Nama Tagihan</label>
                <input
                  name="name"
                  placeholder="Misal: Uang Kas Juli, Kaos Kelas"
                  defaultValue={editingBill?.name ?? ""}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Kategori</label>
                <input
                  name="category"
                  placeholder="Misal: Kas, Kegiatan, Seragam"
                  defaultValue={editingBill?.category ?? ""}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Nominal Pembayaran (Rp)</label>
                <input
                  name="amount"
                  type="number"
                  placeholder="25000"
                  defaultValue={editingBill ? Number(editingBill.amount) : ""}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Tenggat Pembayaran (Deadline)</label>
                <input
                  name="deadline"
                  type="date"
                  defaultValue={editingBill ? new Date(editingBill.deadline).toISOString().split('T')[0] : ""}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:border-emerald-400 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Deskripsi (Opsional)</label>
                <textarea
                  name="description"
                  placeholder="Keterangan singkat mengenai tagihan ini..."
                  defaultValue={editingBill?.description ?? ""}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:border-emerald-400 outline-none min-h-24"
                />
              </div>

              {editingBill && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Status Tagihan</label>
                  <select
                    name="isActive"
                    defaultValue={editingBill.isActive ? "true" : "false"}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:border-emerald-400 outline-none"
                  >
                    <option value="true">Aktif</option>
                    <option value="false">Nonaktif / Selesai</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold py-3 px-4 rounded-xl transition duration-200 text-sm mt-4 cursor-pointer"
              >
                {editingBill ? "Simpan Perubahan" : "Buat & Kirim Tagihan"}
              </button>
            </form>
          </section>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-sm text-slate-400 self-start">
            Hanya <strong>Bendahara Kelas</strong> yang dapat mengelola tagihan dan menandai pembayaran. Hubungi Bendahara atau Ketua untuk bantuan.
          </div>
        )}
      </div>
    </div>
  )
}
