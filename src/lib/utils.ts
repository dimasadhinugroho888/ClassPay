export const rupiah = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value)
export const formatDate = (value?: Date | string | null) => value ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(value)) : "—"
export const normalizeWhatsApp = (value: string) => value.replace(/\D/g, "").replace(/^0/, "62")
