export default function AdminLoading() {
  return <div role="status" aria-label="กำลังโหลดพื้นที่ผู้ดูแลระบบ" className="space-y-5 p-4 sm:p-6 lg:p-8">
    <span className="sr-only">กำลังโหลดข้อมูล กรุณารอสักครู่…</span>
    <div aria-hidden="true" className="space-y-5 motion-safe:animate-pulse">
      <div className="h-9 w-56 rounded-lg bg-line" /><div className="h-5 max-w-md rounded bg-line/60" />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{[0, 1, 2, 3].map(value => <div key={value} className="h-32 rounded-2xl border border-line bg-surface p-5"><div className="mb-4 h-4 w-2/3 rounded bg-line/60" /><div className="h-8 w-1/3 rounded bg-line" /></div>)}</div>
      <div className="space-y-5 rounded-2xl border border-line bg-surface p-5">{[0, 1, 2, 3, 4].map(value => <div key={value} className="h-8 rounded-lg bg-line/40" />)}</div>
    </div>
  </div>;
}
