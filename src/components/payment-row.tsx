"use client"

import { useTransition, useOptimistic } from "react"
import { togglePayment } from "@/actions/classpay"
import { formatDate, rupiah } from "@/lib/utils"
import { Check, X } from "lucide-react"

interface PaymentRowProps {
  id: string
  studentName: string
  studentUsername: string
  billAmount: number
  initialStatus: "LUNAS" | "BELUM_LUNAS"
  initialPaidAt: Date | string | null
  canManage: boolean
}

export function PaymentRow({
  id,
  studentName,
  studentUsername,
  billAmount,
  initialStatus,
  initialPaidAt,
  canManage
}: PaymentRowProps) {
  const [isPending, startTransition] = useTransition()
  const [optimisticState, setOptimisticState] = useOptimistic(
    { status: initialStatus, paidAt: initialPaidAt },
    (state, nextStatus: "LUNAS" | "BELUM_LUNAS") => ({
      status: nextStatus,
      paidAt: nextStatus === "LUNAS" ? new Date().toISOString() : null
    })
  )

  const handleToggle = () => {
    const nextStatus = optimisticState.status === "LUNAS" ? "BELUM_LUNAS" : "LUNAS"
    startTransition(async () => {
      setOptimisticState(nextStatus)
      try {
        const formData = new FormData()
        formData.append("id", id)
        await togglePayment(formData)
      } catch (err) {
        console.error(err)
      }
    })
  }

  return (
    <tr className="border-t border-slate-800 hover:bg-slate-800/20 transition">
      <td className="p-4">
        <p className="font-semibold text-slate-200">{studentName}</p>
        <p className="text-xs text-slate-500">@{studentUsername}</p>
      </td>
      <td className="p-4 font-bold text-slate-100">{rupiah(billAmount)}</td>
      <td className="p-4">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
          optimisticState.status === "LUNAS"
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            : "bg-amber-500/10 text-amber-305 border-amber-500/20"
        }`}>
          {optimisticState.status === "LUNAS" ? "Lunas" : "Belum Lunas"}
        </span>
      </td>
      <td className="p-4 text-slate-400 text-xs">
        {optimisticState.paidAt ? formatDate(new Date(optimisticState.paidAt)) : "—"}
      </td>
      <td className="p-4">
        {canManage ? (
          <button
            onClick={handleToggle}
            disabled={isPending}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
              optimisticState.status === "LUNAS"
                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-600 hover:text-white"
                : "bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950"
            }`}
          >
            {optimisticState.status === "LUNAS" ? (
              <>
                <X className="w-3.5 h-3.5" /> Batalkan
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" /> Tandai Lunas
              </>
            )}
          </button>
        ) : (
          "―"
        )}
      </td>
    </tr>
  )
}
