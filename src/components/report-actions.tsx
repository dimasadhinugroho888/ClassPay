"use client"

import { useState } from "react"
import { FileSpreadsheet, FileText } from "lucide-react"
import ExcelJS from "exceljs"
import { jsPDF } from "jspdf"
import { rupiah, formatDate } from "@/lib/utils"

interface ReportData {
  payments: {
    id: string
    studentName: string
    studentUsername: string
    billName: string
    amount: number
    paidAt: string
  }[]
  expenses: {
    id: string
    name: string
    amount: number
    category: string
    date: string
    description: string | null
  }[]
  summary: {
    income: number
    expense: number
    balance: number
    startDate: string
    endDate: string
  }
}

export function ReportActions({ data }: { data: ReportData }) {
  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)

  const handleExportExcel = async () => {
    setIsExportingExcel(true)
    try {
      const workbook = new ExcelJS.Workbook()
      const sheet = workbook.addWorksheet("Laporan Kas Kelas")

      // Title
      sheet.mergeCells("A1:E1")
      const titleCell = sheet.getCell("A1")
      titleCell.value = "LAPORAN KAS KELAS (CLASSPAY)"
      titleCell.font = { name: "Arial", size: 16, bold: true }
      titleCell.alignment = { horizontal: "center" }

      // Period
      sheet.mergeCells("A2:E2")
      const periodCell = sheet.getCell("A2")
      periodCell.value = `Periode: ${formatDate(data.summary.startDate)} s/d ${formatDate(data.summary.endDate)}`
      periodCell.font = { name: "Arial", size: 11, italic: true }
      periodCell.alignment = { horizontal: "center" }

      // Empty row
      sheet.addRow([])

      // Summary table
      sheet.addRow(["RINGKASAN KAS"])
      sheet.getRow(4).font = { bold: true }
      sheet.addRow(["Pemasukan (Lunas)", data.summary.income])
      sheet.addRow(["Pengeluaran", data.summary.expense])
      sheet.addRow(["Saldo Kas", data.summary.balance])
      sheet.getCell("B5").numFmt = '"Rp"#,##0'
      sheet.getCell("B6").numFmt = '"Rp"#,##0'
      sheet.getCell("B7").numFmt = '"Rp"#,##0'
      sheet.getRow(7).font = { bold: true }

      sheet.addRow([])
      sheet.addRow([])

      // Payments Header
      const payHeader = sheet.addRow(["DAFTAR PEMASUKAN / PEMBAYARAN"])
      payHeader.font = { bold: true }
      const payTableHeader = sheet.addRow(["No", "Nama Siswa", "Username", "Tagihan", "Nominal", "Tanggal Bayar"])
      payTableHeader.font = { bold: true }
      payTableHeader.eachCell((c) => {
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E2E8F0" } }
      })

      // Payments Rows
      data.payments.forEach((p, idx) => {
        const row = sheet.addRow([
          idx + 1,
          p.studentName,
          `@${p.studentUsername}`,
          p.billName,
          p.amount,
          formatDate(p.paidAt)
        ])
        row.getCell(5).numFmt = '"Rp"#,##0'
      })

      sheet.addRow([])
      sheet.addRow([])

      // Expenses Header
      const expHeader = sheet.addRow(["DAFTAR PENGELUARAN"])
      expHeader.font = { bold: true }
      const expTableHeader = sheet.addRow(["No", "Nama Pengeluaran", "Kategori", "Nominal", "Tanggal Pengeluaran", "Keterangan"])
      expTableHeader.font = { bold: true }
      expTableHeader.eachCell((c) => {
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FEE2E2" } }
      })

      // Expenses Rows
      data.expenses.forEach((e, idx) => {
        const row = sheet.addRow([
          idx + 1,
          e.name,
          e.category,
          e.amount,
          formatDate(e.date),
          e.description || "—"
        ])
        row.getCell(4).numFmt = '"Rp"#,##0'
      })

      // Adjust column widths
      sheet.columns.forEach((col) => {
        col.width = 24
      })
      sheet.getColumn(1).width = 6 // No col

      // Write and save workbook
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `Laporan_Kas_ClassPay_${data.summary.startDate}_to_${data.summary.endDate}.xlsx`
      link.click()
    } catch (e) {
      console.error(e)
    } finally {
      setIsExportingExcel(false)
    }
  }

  const handleExportPdf = () => {
    setIsExportingPdf(true)
    try {
      const doc = new jsPDF()
      
      // Header
      doc.setFont("Helvetica", "bold")
      doc.setFontSize(18)
      doc.text("LAPORAN KEUANGAN KAS KELAS (CLASSPAY)", 105, 15, { align: "center" })

      doc.setFont("Helvetica", "normal")
      doc.setFontSize(10)
      doc.text(`Periode: ${formatDate(data.summary.startDate)} s/d ${formatDate(data.summary.endDate)}`, 105, 22, { align: "center" })

      // Divider line
      doc.setLineWidth(0.5)
      doc.line(15, 26, 195, 26)

      // Summary Box
      doc.setFont("Helvetica", "bold")
      doc.setFontSize(12)
      doc.text("RINGKASAN KAS", 15, 34)
      
      doc.setFont("Helvetica", "normal")
      doc.setFontSize(10)
      doc.text("Total Pemasukan:", 15, 42)
      doc.text(rupiah(data.summary.income), 70, 42)

      doc.text("Total Pengeluaran:", 15, 48)
      doc.text(`-${rupiah(data.summary.expense)}`, 70, 48)

      doc.setFont("Helvetica", "bold")
      doc.text("Saldo Akhir:", 15, 54)
      doc.text(rupiah(data.summary.balance), 70, 54)

      doc.line(15, 58, 195, 58)

      // Payments Table (Pemasukan)
      doc.setFont("Helvetica", "bold")
      doc.text("DAFTAR PEMASUKAN", 15, 66)

      let yPos = 74
      doc.setFontSize(8)
      doc.setFillColor(240, 240, 240)
      doc.rect(15, yPos - 4, 180, 6, "F")
      doc.text("Siswa", 17, yPos)
      doc.text("Tagihan", 70, yPos)
      doc.text("Nominal", 130, yPos)
      doc.text("Tanggal", 165, yPos)

      yPos += 6
      doc.setFont("Helvetica", "normal")
      data.payments.slice(0, 20).forEach((p) => {
        if (yPos > 270) {
          doc.addPage()
          yPos = 20
        }
        doc.text(p.studentName, 17, yPos)
        doc.text(p.billName, 70, yPos)
        doc.text(rupiah(p.amount), 130, yPos)
        doc.text(formatDate(p.paidAt), 165, yPos)
        yPos += 6
      })
      if (data.payments.length > 20) {
        doc.text(`... dan ${data.payments.length - 20} transaksi lainnya`, 17, yPos)
        yPos += 8
      } else {
        yPos += 4
      }

      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }

      // Expenses Table
      doc.setFont("Helvetica", "bold")
      doc.setFontSize(10)
      doc.text("DAFTAR PENGELUARAN", 15, yPos)

      yPos += 8
      doc.setFontSize(8)
      doc.setFillColor(254, 226, 226)
      doc.rect(15, yPos - 4, 180, 6, "F")
      doc.text("Pengeluaran", 17, yPos)
      doc.text("Kategori", 70, yPos)
      doc.text("Nominal", 130, yPos)
      doc.text("Tanggal", 165, yPos)

      yPos += 6
      doc.setFont("Helvetica", "normal")
      data.expenses.slice(0, 20).forEach((e) => {
        if (yPos > 270) {
          doc.addPage()
          yPos = 20
        }
        doc.text(e.name, 17, yPos)
        doc.text(e.category, 70, yPos)
        doc.text(`-${rupiah(e.amount)}`, 130, yPos)
        doc.text(formatDate(e.date), 165, yPos)
        yPos += 6
      })
      if (data.expenses.length > 20) {
        doc.text(`... dan ${data.expenses.length - 20} pengeluaran lainnya`, 17, yPos)
      }

      doc.save(`Laporan_Kas_ClassPay_${data.summary.startDate}_to_${data.summary.endDate}.pdf`)
    } catch (e) {
      console.error(e)
    } finally {
      setIsExportingPdf(false)
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleExportExcel}
        disabled={isExportingExcel}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 font-bold rounded-xl transition text-xs cursor-pointer"
      >
        <FileSpreadsheet className="w-4 h-4" />
        {isExportingExcel ? "Mengekspor..." : "Ekspor Excel"}
      </button>

      <button
        onClick={handleExportPdf}
        disabled={isExportingPdf}
        className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-450 border border-rose-500/20 hover:bg-rose-600 hover:text-white font-bold rounded-xl transition text-xs cursor-pointer"
      >
        <FileText className="w-4 h-4" />
        {isExportingPdf ? "Mengekspor..." : "Ekspor PDF"}
      </button>
    </div>
  )
}
