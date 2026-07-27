import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/access"
import { createExpense, editExpense, deleteExpense } from "@/actions/classpay"
import { formatDate, rupiah } from "@/lib/utils"
import Link from "next/link"
import { TrendingDown, Calendar, PlusCircle, Edit, Trash2, X } from "lucide-react"

export default async function ExpensesPage({
  searchParams
}: {
  searchParams: Promise<{ editId?: string }>
}) {
  const user = await requireRole("KETUA", "BENDAHARA")
  const { editId } = await searchParams
  const canManage = user.role === "BENDAHARA"

  // Fetch all expenses
  const expenses = await prisma.expense.findMany({
    orderBy: { date: "desc" }
  })

  // If editing, find the expense details
  const editingExpense = editId && canManage
    ? await prisma.expense.findUnique({ where: { id: editId } })
    : null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pengeluaran Kas</h1>
        <p className="text-slate-400 mt-1">Daftar pengeluaran operasional dan dana kelas.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Expenses List */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden self-start">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-rose-400" />
              Daftar Pengeluaran ({expenses.length})
            </h2>
          </div>
          <div className="divide-y divide-slate-800/60">
            {expenses.map((e) => (
              <div key={e.id} className="p-6 hover:bg-slate-800/20 transition flex justify-between items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      {e.category}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-200">{e.name}</h3>
                  {e.description && <p className="text-xs text-slate-400">{e.description}</p>}
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Tanggal: {formatDate(e.date)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-base font-extrabold text-rose-455">-{rupiah(Number(e.amount))}</span>
                  {canManage && (
                    <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
                      <Link
                        href={`/pengeluaran?editId=${e.id}`}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-350 hover:bg-slate-700 hover:text-white transition"
                        title="Edit Pengeluaran"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <form action={deleteExpense} onSubmit={(evt) => {
                        if (!confirm(`Hapus pengeluaran ${e.name}?`)) {
                          evt.preventDefault()
                        }
                      }}>
                        <input type="hidden" name="id" value={e.id} />
                        <button className="p-1.5 rounded-lg bg-rose-500/10 text-rose-450 border border-rose-500/20 hover:bg-rose-600 hover:text-white transition cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {expenses.length === 0 && (
              <div className="p-12 text-center text-slate-400">Belum ada catatan pengeluaran kas kelas.</div>
            )}
          </div>
        </section>

        {/* Expense Form (Create / Edit) */}
        {canManage ? (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 self-start space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-rose-400" />
                {editingExpense ? "Edit Pengeluaran" : "Catat Pengeluaran"}
              </h3>
              {editingExpense && (
                <Link href="/pengeluaran" className="text-slate-400 hover:text-slate-200">
                  <X className="w-4 h-4" />
                </Link>
              )}
            </div>

            <form action={editingExpense ? editExpense : createExpense} className="space-y-4">
              {editingExpense && <input type="hidden" name="id" value={editingExpense.id} />}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Nama Pengeluaran</label>
                <input
                  name="name"
                  placeholder="Misal: Spidol & Penghapus, Fotokopi Soal"
                  defaultValue={editingExpense?.name ?? ""}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Kategori</label>
                <input
                  name="category"
                  placeholder="Misal: Operasional, ATK, Sosial"
                  defaultValue={editingExpense?.category ?? ""}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Nominal Pengeluaran (Rp)</label>
                <input
                  name="amount"
                  type="number"
                  placeholder="75000"
                  defaultValue={editingExpense ? Number(editingExpense.amount) : ""}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Tanggal Pengeluaran</label>
                <input
                  name="date"
                  type="date"
                  defaultValue={editingExpense ? new Date(editingExpense.date).toISOString().split('T')[0] : ""}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:border-emerald-400 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Keterangan (Opsional)</label>
                <textarea
                  name="description"
                  placeholder="Keterangan singkat mengenai pengeluaran..."
                  defaultValue={editingExpense?.description ?? ""}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:border-emerald-400 outline-none min-h-24"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold py-3 px-4 rounded-xl transition duration-200 text-sm mt-4 cursor-pointer"
              >
                {editingExpense ? "Simpan Perubahan" : "Catat Pengeluaran"}
              </button>
            </form>
          </section>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-sm text-slate-400 self-start">
            Hanya <strong>Bendahara Kelas</strong> yang dapat mencatat atau mengedit pengeluaran kas.
          </div>
        )}
      </div>
    </div>
  )
}
