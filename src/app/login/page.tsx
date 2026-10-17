import { redirect } from "next/navigation";
import { getAuthState } from "../../lib/auth";
import { homeForRole } from "../../lib/auth-policy";
import { LoginForm } from "../../components/login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { profile, error } = await getAuthState();
  const query = await searchParams;
  const message = query.error === "domain" ? "อนุญาตเฉพาะบัญชี Google มหาวิทยาลัย @lamduan.mfu.ac.th กรุณาเลือกบัญชีใหม่" : query.error === "profile" ? "ตรวจสอบข้อมูลบัญชีไม่ได้ กรุณาติดต่อผู้ดูแลระบบ" : query.error ? "เข้าสู่ระบบไม่สำเร็จหรือยกเลิกการเข้าสู่ระบบ กรุณาลองใหม่" : "";
  if (profile) redirect(homeForRole(profile.role));
  return <main className="flex min-h-svh flex-1 items-center justify-center bg-background px-5 py-10 sm:py-14">
    <section aria-labelledby="login-brand" className="flex min-h-[570px] w-full max-w-[460px] flex-col justify-between gap-10 rounded-[2.75rem] border border-white/70 bg-background px-7 py-10 shadow-[16px_16px_45px_#dedad2,-16px_-16px_45px_#ffffff] sm:min-h-[620px] sm:px-11 sm:py-12">
      <header className="text-center">
        <p className="text-[11px] font-medium tracking-wide text-muted">มหาวิทยาลัยแม่ฟ้าหลวง</p>
        <h1 id="login-brand" className="mt-5 text-[58px] font-semibold leading-none tracking-[-0.065em] text-ink sm:text-[66px]">Fix<span className="font-normal">MFU</span></h1>
        <span aria-hidden="true" className="mx-auto mt-5 block h-1 w-7 rounded-full bg-primary" />
      </header>
      <div>
        <div className="text-center">
          <h2 className="text-xl font-medium text-ink">ยินดีต้อนรับ</h2>
          <p className="mt-2 text-sm leading-7 text-muted">แจ้งปัญหาและติดตามงานซ่อม<br />ให้ทุกพื้นที่พร้อมใช้งาน</p>
        </div>
        {error ? <p role="alert" className="mt-5 rounded-2xl bg-red-50 p-4 text-sm leading-relaxed text-red-800">ตรวจสอบการเชื่อมต่อหรือข้อมูลบัญชีไม่ได้ กรุณาลองอีกครั้งหรือติดต่อผู้ดูแลระบบ</p> : null}
        {message ? <p role="alert" className="mt-5 rounded-2xl bg-red-50 p-4 text-sm leading-relaxed text-red-800">{message}</p> : null}
        <LoginForm />
      </div>
      <footer className="text-center">
        <div aria-hidden="true" className="mb-5 h-px bg-line/70 shadow-[0_1px_0_#ffffff]" />
        <p className="text-xs leading-6 text-muted">เข้าใช้งานครั้งแรกได้ทันที<br />ระบบจะสร้างบัญชีให้คุณโดยอัตโนมัติ</p>
      </footer>
    </section>
  </main>;
}
