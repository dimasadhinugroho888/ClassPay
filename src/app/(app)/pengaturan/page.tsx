import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/access"
import { changePassword, updateReminder } from "@/actions/classpay"
import { ShieldCheck, MessageSquareCode, Key, AlertTriangle } from "lucide-react"

const defaultMessage = "Halo {Nama},\n\nIni adalah pengingat bahwa tagihan \"{Nama Tagihan}\" sebesar Rp{Nominal} masih berstatus BELUM LUNAS. Silakan melakukan pembayaran langsung kepada Bendahara kelas.\n\nTerima kasih."

export default async function SettingsPage({
  searchParams
}: {
  searchParams: Promise<{ force?: string }>
}) {
  const user = await requireUser()
  const { force } = await searchParams

  const setting = await prisma.setting.findUnique({
    where: { key: "whatsapp_reminder" }
  })

  const isForced = force === "true" || user.mustChangePassword

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-slate-400 mt-1">Ubah kata sandi akun Anda atau konfigurasikan template pesan kelas.</p>
      </div>

      {isForced && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-5 rounded-2xl flex gap-3 text-sm">
          <AlertTriangle className="w-6 h-6 shrink-0 text-amber-400 animate-pulse" />
          <div>
            <strong className="font-bold">Keamanan Akun:</strong> Anda terdeteksi menggunakan kata sandi awal (default) atau sistem mengharuskan pergantian sandi. Ganti kata sandi Anda sekarang untuk membuka akses penuh ke menu lainnya.
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Change Password Form */}
        <section className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
          <div className="border-b border-slate-800 pb-4 flex items-center gap-2">
            <Key className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-200">Ganti Password</h2>
          </div>

          <form action={changePassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Password Baru</label>
              <input
                name="password"
                type="password"
                minLength={8}
                placeholder="Minimal 8 karakter"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none"
              />
              <p className="text-[10px] text-slate-500">Gunakan kombinasi huruf, angka, dan simbol untuk kekuatan terbaik.</p>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold py-3 px-4 rounded-xl transition duration-200 text-sm mt-4 cursor-pointer"
            >
              Ubah Password
            </button>
          </form>
        </section>

        {/* WhatsApp Message Template Form (Treasurer & Chairman only) */}
        {user.role !== "ANGGOTA" && (
          <section className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
            <div className="border-b border-slate-800 pb-4 flex items-center gap-2">
              <MessageSquareCode className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-slate-200">Template WhatsApp Reminder</h2>
            </div>

            <form action={updateReminder} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 font-medium">Isi Pesan WhatsApp</label>
                <textarea
                  name="message"
                  defaultValue={setting?.value ?? defaultMessage}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:border-emerald-400 outline-none min-h-48 resize-y"
                />
              </div>

              <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-slate-300">Variabel yang Tersedia:</h4>
                <ul className="text-[11px] text-slate-450 space-y-1 list-disc list-inside">
                  <li><code className="text-emerald-450 font-semibold">{`{Nama}`}</code> : Diganti nama lengkap siswa bersangkutan.</li>
                  <li><code className="text-emerald-455 font-semibold">{`{Nama Tagihan}`}</code> : Diganti nama tagihan kas terkait.</li>
                  <li><code className="text-emerald-450 font-semibold">{`{Nominal}`}</code> : Diganti nominal iuran terformat (misal: 25.000).</li>
                </ul>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-705 border border-slate-700 text-slate-200 font-bold py-3 px-4 rounded-xl transition duration-200 text-sm cursor-pointer"
              >
                Simpan Template
              </button>
            </form>
          </section>
        )}
      </div>
    </div>
  )
}
