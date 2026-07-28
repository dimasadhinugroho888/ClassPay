"use client"

import { LogOut } from "lucide-react"
import { signOutAction } from "@/actions/auth"

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-all duration-200 cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        <span className="hidden md:inline">Keluar</span>
      </button>
    </form>
  )
}
