"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { AlertCircle, Loader2 } from "lucide-react"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await signIn("credentials", {
        username,
        password,
        redirect: false
      })

      if (res?.error) {
        setError("Username atau password salah.")
      } else {
        // Successful login, redirect to dashboard
        window.location.href = "/dashboard"
      }
    } catch (err) {
      console.error(err)
      setError("Koneksi database atau server bermasalah.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-8 shadow-2xl space-y-6">
        <div className="text-center md:text-left">
          <p className="text-xs font-bold text-emerald-450 uppercase tracking-widest">◉ CLASSPAY</p>
          <h1 className="text-3xl font-black mt-2 text-slate-100">Masuk Kas Kelas</h1>
          <p className="mt-1 text-xs text-slate-400">Gunakan akun yang didaftarkan oleh ketua kelas.</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Username</label>
            <input 
              name="username" 
              required 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:border-emerald-400 outline-none" 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Password</label>
            <input 
              name="password" 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:border-emerald-400 outline-none" 
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-emerald-450 hover:bg-emerald-400 disabled:bg-emerald-500/50 text-slate-950 font-bold py-3 rounded-xl transition duration-200 text-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Menghubungkan...
            </>
          ) : (
            "Masuk Sekarang"
          )}
        </button>

        <div className="p-3 bg-slate-950/80 border border-slate-850 rounded-xl text-[10px] text-slate-450 space-y-1 text-center">
          <p className="font-semibold text-slate-350">Informasi Akun Demo:</p>
          <p>Ketua: <code className="text-emerald-400">ketua</code> / <code className="text-emerald-400">classpay123</code></p>
          <p>Bendahara: <code className="text-emerald-400">bendahara</code> / <code className="text-emerald-450">classpay123</code></p>
        </div>
      </form>
    </main>
  )
}
