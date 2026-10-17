import { redirect } from "next/navigation";
import { getAuthState } from "../../lib/auth";
import { homeForRole } from "../../lib/auth-policy";
import { LoginForm } from "../../components/login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { profile, error } = await getAuthState();
  const query = await searchParams;
  const message = query.error === "domain" ? "อนุญาตเฉพาะบัญชี Google มหาวิทยาลัย @lamduan.mfu.ac.th กรุณาเลือกบัญชีใหม่" : query.error === "profile" ? "ตรวจสอบข้อมูลบัญชีไม่ได้ กรุณาติดต่อผู้ดูแลระบบ" : query.error ? "เข้าสู่ระบบไม่สำเร็จหรือยกเลิกการเข้าสู่ระบบ กรุณาลองใหม่" : "";
  if (profile) redirect(homeForRole(profile.role));
  return <main className="flex flex-1 items-center justify-center px-4 py-12">
    <section className="w-full max-w-md rounded-3xl border border-line bg-surface p-6 shadow-sm sm:p-9">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-2xl" aria-hidden="true">🛠️</span>
      <p className="mb-1 mt-6 text-sm font-medium text-muted">FixMFU · มหาวิทยาลัยแม่ฟ้าหลวง</p>
      <h1 className="text-3xl font-semibold tracking-tight">ยินดีต้อนรับกลับ</h1>
      <p className="mt-3 text-sm leading-6 text-muted">เข้าสู่ระบบเพื่อแจ้งปัญหาและติดตามการแก้ไข</p>
      {error ? <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-800">ตรวจสอบการเชื่อมต่อหรือข้อมูลบัญชีไม่ได้ กรุณาลองอีกครั้งหรือติดต่อผู้ดูแลระบบ</p> : null}
      {message ? <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-800">{message}</p> : null}
      <LoginForm />
    </section>
  </main>;
}
