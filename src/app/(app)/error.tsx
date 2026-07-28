"use client"

import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[ClassPay Error]", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
      <div className="p-4 rounded-full bg-rose-500/10 border border-rose-500/20">
        <AlertTriangle className="w-10 h-10 text-rose-400" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-slate-200">Terjadi Kesalahan</h2>
        <p className="text-slate-400 text-sm max-w-md">
          {error.message || "Server mengalami error. Silakan coba lagi."}
        </p>
        {error.digest && (
          <p className="text-xs text-slate-600 font-mono">Error ID: {error.digest}</p>
        )}
      </div>
      <button
        onClick={reset}
        className="px-6 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl transition text-sm"
      >
        Coba Lagi
      </button>
    </div>
  )
}
