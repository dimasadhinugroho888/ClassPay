import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/access"
import { createMember, editMember, deleteMember, designateTreasurer } from "@/actions/classpay"
import Link from "next/link"
import { Users, UserPlus, Edit, Trash2, ShieldAlert, X } from "lucide-react"

export default async function MembersPage({
  searchParams
}: {
  searchParams: Promise<{ editId?: string }>
}) {
  await requireRole("KETUA")
  const { editId } = await searchParams

  const members = await prisma.user.findMany({
    orderBy: { name: "asc" }
  })

  // If editing, find the member details
  const editingMember = editId
    ? await prisma.user.findUnique({ where: { id: editId } })
    : null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Kelola Anggota</h1>
        <p className="text-slate-400 mt-1">Daftar anggota kelas dan hak akses peran.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Members List */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              Daftar Anggota ({members.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-4">Nama Lengkap</th>
                  <th className="p-4">Username</th>
                  <th className="p-4">WhatsApp</th>
                  <th className="p-4">Peran</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/30 transition duration-150">
                    <td className="p-4 font-semibold text-slate-200">{m.name}</td>
                    <td className="p-4 text-slate-400">@{m.username}</td>
                    <td className="p-4 text-slate-300">{m.whatsapp}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold ${
                        m.role === "KETUA" 
                          ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" 
                          : m.role === "BENDAHARA"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-slate-850 text-slate-400 border border-slate-805"
                      }`}>
                        {m.role}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {m.role === "ANGGOTA" && (
                          <form action={designateTreasurer}>
                            <input type="hidden" name="id" value={m.id} />
                            <button className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 text-[11px] font-bold transition">
                              Jadikan Bendahara
                            </button>
                          </form>
                        )}
                        {m.role !== "KETUA" && (
                          <>
                            <Link
                              href={`/anggota?editId=${m.id}`}
                              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            <form action={deleteMember} onSubmit={(e) => {
                              if (!confirm(`Hapus anggota ${m.name}? Semua data pembayaran terkait akan terhapus.`)) {
                                e.preventDefault()
                              }
                            }}>
                              <input type="hidden" name="id" value={m.id} />
                              <button className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-600 hover:text-white transition cursor-pointer">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </form>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Member Form (Add / Edit) */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 self-start space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-400" />
              {editingMember ? "Edit Anggota" : "Tambah Anggota"}
            </h3>
            {editingMember && (
              <Link href="/anggota" className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </Link>
            )}
          </div>

          <form action={editingMember ? editMember : createMember} className="space-y-4">
            {editingMember && <input type="hidden" name="id" value={editingMember.id} />}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Nama Lengkap</label>
              <input 
                name="name" 
                placeholder="Nama lengkap siswa" 
                defaultValue={editingMember?.name ?? ""} 
                required 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Username</label>
              <input 
                name="username" 
                placeholder="username" 
                defaultValue={editingMember?.username ?? ""} 
                required 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Nomor WhatsApp</label>
              <input 
                name="whatsapp" 
                placeholder="08123456789" 
                defaultValue={editingMember?.whatsapp ?? ""} 
                required 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">
                {editingMember ? "Password Baru (Kosongkan jika tidak diganti)" : "Password Awal"}
              </label>
              <input 
                name="password" 
                type="password" 
                placeholder={editingMember ? "Minimal 8 karakter" : "Password awal siswa"} 
                required={!editingMember} 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Peran Aplikasi</label>
              <select 
                name="role" 
                defaultValue={editingMember?.role ?? "ANGGOTA"}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:border-emerald-400 outline-none"
              >
                <option value="ANGGOTA">Anggota Kelas</option>
                <option value="BENDAHARA">Bendahara Kelas</option>
              </select>
            </div>

            <button 
              type="submit" 
              className="w-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold py-3 px-4 rounded-xl transition duration-200 text-sm mt-4 cursor-pointer"
            >
              {editingMember ? "Simpan Perubahan" : "Simpan Anggota"}
            </button>
          </form>

          {editingMember?.role === "BENDAHARA" && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl flex gap-2 text-xs">
              <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400" />
              <span>Memilih peran Bendahara akan mendemotasi Bendahara kelas sebelumnya menjadi Anggota.</span>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
