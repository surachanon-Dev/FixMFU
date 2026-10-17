import Link from "next/link";
import { logout } from "../actions";

export default function AuthErrorPage() {
  return <main className="mx-auto my-auto w-full max-w-lg p-6"><section className="rounded-2xl border border-line bg-surface p-7">
    <h1 className="text-2xl font-semibold">ยังตรวจสอบบัญชีไม่ได้</h1>
    <p className="my-4 text-sm leading-7 text-muted">กรุณาตรวจการเชื่อมต่อ Supabase และข้อมูลในตาราง profiles หากเพิ่งสร้างบัญชี ให้ตรวจว่ามีโปรไฟล์และบทบาทของบัญชีแล้ว</p>
    <Link href="/login" className="mr-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium">ลองอีกครั้ง</Link>
    <form action={logout} className="mt-4"><button type="submit" className="text-sm underline">ออกจากระบบ</button></form>
  </section></main>;
}
