export default function UserLoading() {
  return <div role="status" className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8"><span className="sr-only">กำลังโหลดเรื่องแจ้งซ่อมของคุณ</span><div aria-hidden="true" className="h-64 rounded-3xl bg-surface motion-safe:animate-pulse" /><div aria-hidden="true" className="grid gap-4 sm:grid-cols-3">{[0, 1, 2].map(i => <div key={i} className="h-28 rounded-3xl border border-line bg-surface motion-safe:animate-pulse" />)}</div><div aria-hidden="true" className="h-48 rounded-2xl border border-line bg-surface motion-safe:animate-pulse" /></div>;
}
