import { signIn } from "@/auth"
import { redirect } from "next/navigation"

export default function LoginPage() {
  async function login(formData: FormData) { "use server"; await signIn("credentials", { username: formData.get("username"), password: formData.get("password"), redirectTo: "/dashboard" }) }
  return <main className="grid min-h-screen place-items-center bg-slate-950 p-6"><form action={login} className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-8 shadow-2xl"><p className="mb-2 text-sm font-semibold text-emerald-400">CLASSPAY</p><h1 className="text-3xl font-bold">Masuk ke kas kelas</h1><p className="mt-2 text-sm text-slate-400">Gunakan akun yang dibuat oleh ketua kelas.</p><label className="mt-7 block text-sm">Username<input name="username" required className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 outline-none focus:border-emerald-400" /></label><label className="mt-4 block text-sm">Password<input name="password" type="password" required className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 outline-none focus:border-emerald-400" /></label><button className="mt-7 w-full rounded-xl bg-emerald-400 p-3 font-bold text-slate-950">Masuk</button><p className="mt-5 text-xs text-slate-500">Demo: ketua / classpay123</p></form></main>
}
