"use server"

import { hash } from "bcryptjs"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { requireRole, requireUser } from "@/lib/access"
import { prisma } from "@/lib/prisma"
import { normalizeWhatsApp } from "@/lib/utils"

const money = z.coerce.number().positive()
const date = z.coerce.date()
const value = (form: FormData, key: string) => String(form.get(key) ?? "").trim()

async function audit(userId: string, action: string, detail?: string) {
  await prisma.auditLog.create({ data: { userId, action, detail } })
}

// MEMBER ACTIONS
export async function createMember(form: FormData) {
  const actor = await requireRole("KETUA")
  const data = z.object({
    name: z.string().min(3),
    username: z.string().min(3).regex(/^[a-zA-Z0-9_]+$/),
    password: z.string().min(8),
    whatsapp: z.string().min(8),
    role: z.enum(["ANGGOTA", "BENDAHARA"]).default("ANGGOTA")
  }).parse({
    name: value(form, "name"),
    username: value(form, "username"),
    password: value(form, "password"),
    whatsapp: value(form, "whatsapp"),
    role: value(form, "role") || "ANGGOTA"
  })

  // Check unique username
  const existingUsername = await prisma.user.findUnique({ where: { username: data.username } })
  if (existingUsername) throw new Error("Username sudah terdaftar.")

  // Check unique whatsapp
  const normalizedWa = normalizeWhatsApp(data.whatsapp)
  const existingWa = await prisma.user.findUnique({ where: { whatsapp: normalizedWa } })
  if (existingWa) throw new Error("Nomor WhatsApp sudah terdaftar.")

  const member = await prisma.user.create({
    data: {
      name: data.name,
      username: data.username,
      passwordHash: await hash(data.password, 12),
      whatsapp: normalizedWa,
      role: data.role,
      mustChangePassword: true
    }
  })

  if (data.role === "BENDAHARA") {
    // Demote any other treasurer
    await prisma.user.updateMany({
      where: { id: { not: member.id }, role: "BENDAHARA" },
      data: { role: "ANGGOTA" }
    })
  }

  // Create empty payments for all existing active bills for the new user
  const activeBills = await prisma.bill.findMany({ where: { isActive: true }, select: { id: true } })
  if (activeBills.length > 0) {
    await prisma.billPayment.createMany({
      data: activeBills.map(b => ({
        billId: b.id,
        userId: member.id,
        status: "BELUM_LUNAS"
      }))
    })
  }

  await audit(actor.id, "TAMBAH_ANGGOTA", `${member.name} (${member.role})`)
  revalidatePath("/anggota")
}

export async function editMember(form: FormData) {
  const actor = await requireRole("KETUA")
  const id = value(form, "id")
  const data = z.object({
    name: z.string().min(3),
    username: z.string().min(3).regex(/^[a-zA-Z0-9_]+$/),
    password: z.string().optional(),
    whatsapp: z.string().min(8),
    role: z.enum(["ANGGOTA", "BENDAHARA", "KETUA"]).default("ANGGOTA")
  }).parse({
    name: value(form, "name"),
    username: value(form, "username"),
    password: value(form, "password") || undefined,
    whatsapp: value(form, "whatsapp"),
    role: value(form, "role") || "ANGGOTA"
  })

  const normalizedWa = normalizeWhatsApp(data.whatsapp)

  // Verify unique username
  const existingUsername = await prisma.user.findFirst({ where: { username: data.username, id: { not: id } } })
  if (existingUsername) throw new Error("Username sudah digunakan.")

  // Verify unique whatsapp
  const existingWa = await prisma.user.findFirst({ where: { whatsapp: normalizedWa, id: { not: id } } })
  if (existingWa) throw new Error("Nomor WhatsApp sudah digunakan.")

  const updateData: any = {
    name: data.name,
    username: data.username,
    whatsapp: normalizedWa,
    role: data.role
  }

  if (data.password) {
    updateData.passwordHash = await hash(data.password, 12)
    updateData.mustChangePassword = true
  }

  const member = await prisma.user.update({
    where: { id },
    data: updateData
  })

  if (data.role === "BENDAHARA") {
    // Demote any other treasurer
    await prisma.user.updateMany({
      where: { id: { not: member.id }, role: "BENDAHARA" },
      data: { role: "ANGGOTA" }
    })
    await audit(actor.id, "GANTI_BENDAHARA", member.name)
  } else {
    await audit(actor.id, "EDIT_ANGGOTA", member.name)
  }

  revalidatePath("/anggota")
}

export async function deleteMember(form: FormData) {
  const actor = await requireRole("KETUA")
  const id = value(form, "id")
  const member = await prisma.user.delete({ where: { id } })
  await audit(actor.id, "HAPUS_ANGGOTA", member.name)
  revalidatePath("/anggota")
}

export async function designateTreasurer(form: FormData) {
  const actor = await requireRole("KETUA")
  const id = value(form, "id")
  
  const member = await prisma.user.update({
    where: { id },
    data: { role: "BENDAHARA" }
  })

  await prisma.user.updateMany({
    where: { id: { not: id }, role: "BENDAHARA" },
    data: { role: "ANGGOTA" }
  })

  await audit(actor.id, "GANTI_BENDAHARA", member.name)
  revalidatePath("/anggota")
}

// BILL ACTIONS
export async function createBill(form: FormData) {
  const actor = await requireRole("BENDAHARA")
  const data = z.object({
    name: z.string().min(3),
    category: z.string().min(2),
    amount: money,
    deadline: date,
    description: z.string().optional()
  }).parse({
    name: value(form, "name"),
    category: value(form, "category"),
    amount: value(form, "amount"),
    deadline: value(form, "deadline"),
    description: value(form, "description")
  })

  const bill = await prisma.bill.create({ data })

  // Assign payment to all users with role ANGGOTA
  const users = await prisma.user.findMany({
    where: { role: "ANGGOTA" },
    select: { id: true }
  })

  if (users.length > 0) {
    await prisma.billPayment.createMany({
      data: users.map(user => ({
        billId: bill.id,
        userId: user.id,
        status: "BELUM_LUNAS"
      }))
    })
  }

  await audit(actor.id, "BUAT_TAGIHAN", bill.name)
  revalidatePath("/tagihan")
  revalidatePath("/dashboard")
}

export async function editBill(form: FormData) {
  const actor = await requireRole("BENDAHARA")
  const id = value(form, "id")
  const data = z.object({
    name: z.string().min(3),
    category: z.string().min(2),
    amount: money,
    deadline: date,
    description: z.string().optional(),
    isActive: z.preprocess((val) => val === "true", z.boolean())
  }).parse({
    name: value(form, "name"),
    category: value(form, "category"),
    amount: value(form, "amount"),
    deadline: value(form, "deadline"),
    description: value(form, "description"),
    isActive: value(form, "isActive")
  })

  const bill = await prisma.bill.update({
    where: { id },
    data
  })

  await audit(actor.id, "EDIT_TAGIHAN", bill.name)
  revalidatePath("/tagihan")
  revalidatePath(`/tagihan/${id}`)
  revalidatePath("/dashboard")
}

export async function deleteBill(form: FormData) {
  const actor = await requireRole("BENDAHARA")
  const id = value(form, "id")
  const bill = await prisma.bill.delete({ where: { id } })
  await audit(actor.id, "HAPUS_TAGIHAN", bill.name)
  revalidatePath("/tagihan")
  revalidatePath("/dashboard")
}

export async function togglePayment(form: FormData) {
  const actor = await requireRole("BENDAHARA")
  const id = value(form, "id")
  const payment = await prisma.billPayment.findUniqueOrThrow({
    where: { id },
    include: { user: true, bill: true }
  })
  
  const next = payment.status === "LUNAS" ? "BELUM_LUNAS" : "LUNAS"
  await prisma.billPayment.update({
    where: { id },
    data: {
      status: next,
      paidAt: next === "LUNAS" ? new Date() : null
    }
  })

  await audit(
    actor.id, 
    next === "LUNAS" ? "TANDAI_LUNAS" : "BATAL_LUNAS", 
    `Siswa: ${payment.user.name}, Tagihan: ${payment.bill.name}`
  )

  revalidatePath("/tagihan")
  revalidatePath(`/tagihan/${payment.billId}`)
  revalidatePath("/dashboard")
}

// EXPENSE ACTIONS
export async function createExpense(form: FormData) {
  const actor = await requireRole("BENDAHARA")
  const data = z.object({
    name: z.string().min(3),
    category: z.string().min(2),
    amount: money,
    date: date,
    description: z.string().optional()
  }).parse({
    name: value(form, "name"),
    category: value(form, "category"),
    amount: value(form, "amount"),
    date: value(form, "date"),
    description: value(form, "description")
  })

  const e = await prisma.expense.create({ data })
  await audit(actor.id, "BUAT_PENGELUARAN", e.name)
  revalidatePath("/pengeluaran")
  revalidatePath("/dashboard")
}

export async function editExpense(form: FormData) {
  const actor = await requireRole("BENDAHARA")
  const id = value(form, "id")
  const data = z.object({
    name: z.string().min(3),
    category: z.string().min(2),
    amount: money,
    date: date,
    description: z.string().optional()
  }).parse({
    name: value(form, "name"),
    category: value(form, "category"),
    amount: value(form, "amount"),
    date: value(form, "date"),
    description: value(form, "description")
  })

  const e = await prisma.expense.update({
    where: { id },
    data
  })

  await audit(actor.id, "EDIT_PENGELUARAN", e.name)
  revalidatePath("/pengeluaran")
  revalidatePath("/dashboard")
}

export async function deleteExpense(form: FormData) {
  const actor = await requireRole("BENDAHARA")
  const id = value(form, "id")
  const e = await prisma.expense.delete({ where: { id } })
  await audit(actor.id, "HAPUS_PENGELUARAN", e.name)
  revalidatePath("/pengeluaran")
  revalidatePath("/dashboard")
}

// SETTINGS & OTHER ACTIONS
export async function updateReminder(form: FormData) {
  const actor = await requireRole("BENDAHARA", "KETUA")
  const message = value(form, "message")
  await prisma.setting.upsert({
    where: { key: "whatsapp_reminder" },
    update: { value: message },
    create: { key: "whatsapp_reminder", value: message }
  })
  await audit(actor.id, "UBAH_PENGATURAN", "WhatsApp reminder template")
  revalidatePath("/pengaturan")
}

export async function changePassword(form: FormData) {
  const user = await requireUser()
  const password = z.string().min(8).parse(value(form, "password"))
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hash(password, 12),
      mustChangePassword: false
    }
  })
  await audit(user.id, "GANTI_PASSWORD")
  redirect("/dashboard")
}
