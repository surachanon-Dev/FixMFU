"use client";

import { useActionState } from "react";
import { loginWithGoogle } from "../app/auth/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginWithGoogle, { error: "" });
  return <form action={action} className="mt-7 space-y-5" aria-busy={pending}>
    <button disabled={pending} type="submit" className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-line bg-surface px-4 font-medium text-ink transition hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60">
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.23c1.89-1.74 2.99-4.3 2.99-7.36Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.61-2.41l-3.23-2.51c-.9.6-2.04.96-3.38.96-2.6 0-4.81-1.76-5.6-4.13H3.06v2.59A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 13.91a6 6 0 0 1 0-3.82V7.5H3.06a10 10 0 0 0 0 9l3.34-2.59Z"/><path fill="#EA4335" d="M12 5.96c1.47 0 2.79.51 3.82 1.51l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.94 5.5l3.34 2.59A5.98 5.98 0 0 1 12 5.96Z"/></svg>
      {pending ? "กำลังไปยัง Google…" : "เข้าสู่ระบบด้วย Google"}
    </button>
    {state.error ? <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{state.error}</p> : null}
    <div className="rounded-xl bg-primary/10 px-4 py-3 text-center text-sm leading-7"><p className="font-medium">ใช้บัญชี Google ของมหาวิทยาลัย</p><p className="break-all text-muted">เฉพาะ @lamduan.mfu.ac.th</p></div>
    <p className="text-center text-xs leading-6 text-muted">ครั้งแรกระบบจะสร้างบัญชีผู้ใช้ให้โดยอัตโนมัติ<br />สิทธิ์ผู้ดูแลกำหนดโดยผู้รับผิดชอบระบบ</p>
  </form>;
}
