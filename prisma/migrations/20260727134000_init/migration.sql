-- CreateEnum
CREATE TYPE "Role" AS ENUM ('KETUA', 'BENDAHARA', 'ANGGOTA');
CREATE TYPE "PaymentStatus" AS ENUM ('BELUM_LUNAS', 'LUNAS');

CREATE TABLE "User" ("id" TEXT NOT NULL, "name" TEXT NOT NULL, "whatsapp" TEXT NOT NULL, "username" TEXT NOT NULL, "passwordHash" TEXT NOT NULL, "role" "Role" NOT NULL DEFAULT 'ANGGOTA', "mustChangePassword" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "User_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Bill" ("id" TEXT NOT NULL, "name" TEXT NOT NULL, "category" TEXT NOT NULL, "amount" DECIMAL(12,2) NOT NULL, "description" TEXT, "deadline" TIMESTAMP(3) NOT NULL, "isActive" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Bill_pkey" PRIMARY KEY ("id"));
CREATE TABLE "BillPayment" ("id" TEXT NOT NULL, "billId" TEXT NOT NULL, "userId" TEXT NOT NULL, "status" "PaymentStatus" NOT NULL DEFAULT 'BELUM_LUNAS', "paidAt" TIMESTAMP(3), CONSTRAINT "BillPayment_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Expense" ("id" TEXT NOT NULL, "name" TEXT NOT NULL, "amount" DECIMAL(12,2) NOT NULL, "category" TEXT NOT NULL, "date" TIMESTAMP(3) NOT NULL, "description" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Expense_pkey" PRIMARY KEY ("id"));
CREATE TABLE "AuditLog" ("id" TEXT NOT NULL, "userId" TEXT, "action" TEXT NOT NULL, "detail" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Setting" ("id" TEXT NOT NULL, "key" TEXT NOT NULL, "value" TEXT NOT NULL, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Setting_pkey" PRIMARY KEY ("id"));

CREATE UNIQUE INDEX "User_whatsapp_key" ON "User"("whatsapp");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "Bill_isActive_deadline_idx" ON "Bill"("isActive", "deadline");
CREATE INDEX "BillPayment_billId_status_idx" ON "BillPayment"("billId", "status");
CREATE INDEX "BillPayment_userId_status_idx" ON "BillPayment"("userId", "status");
CREATE UNIQUE INDEX "BillPayment_billId_userId_key" ON "BillPayment"("billId", "userId");
CREATE INDEX "Expense_date_idx" ON "Expense"("date");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");

ALTER TABLE "BillPayment" ADD CONSTRAINT "BillPayment_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BillPayment" ADD CONSTRAINT "BillPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
