import { PrismaClient, Role, PaymentStatus } from "@prisma/client"
import { hash } from "bcryptjs"
const prisma = new PrismaClient()
async function main() {
  const passwordHash = await hash("classpay123", 12)
  const people = [{ name:"Alya Putri", username:"ketua", whatsapp:"628111111111", role:Role.KETUA }, { name:"Bima Pratama", username:"bendahara", whatsapp:"628122222222", role:Role.BENDAHARA }, ...Array.from({length:10},(_,i)=>({ name:`Anggota ${i+1}`, username:`anggota${i+1}`, whatsapp:`62813000000${i+1}`, role:Role.ANGGOTA }))]
  for (const person of people) await prisma.user.upsert({ where:{ username:person.username }, update:{}, create:{...person,passwordHash,mustChangePassword:false} })
  const members = await prisma.user.findMany({ where:{ role:Role.ANGGOTA } })
  const bill = await prisma.bill.upsert({ where:{ id:"seed-kas-bulanan" }, update:{}, create:{ id:"seed-kas-bulanan",name:"Kas Bulanan Juli",category:"Kas",amount:25000,description:"Iuran kas kelas bulan Juli",deadline:new Date("2026-07-31") } })
  await prisma.bill.upsert({ where:{ id:"seed-study-tour" }, update:{}, create:{ id:"seed-study-tour",name:"Study Tour",category:"Kegiatan",amount:150000,description:"Dana kegiatan kelas",deadline:new Date("2026-08-20") } })
  for (const [i, member] of members.entries()) await prisma.billPayment.upsert({ where:{ billId_userId:{ billId:bill.id,userId:member.id } }, update:{}, create:{ billId:bill.id,userId:member.id,status:i<6?PaymentStatus.LUNAS:PaymentStatus.BELUM_LUNAS,paidAt:i<6?new Date():null } })
  await prisma.expense.upsert({ where:{ id:"seed-perlengkapan" }, update:{}, create:{id:"seed-perlengkapan",name:"Perlengkapan kelas",amount:75000,category:"Operasional",date:new Date(),description:"Pembelian alat kebersihan"} })
}
main().finally(()=>prisma.$disconnect())
