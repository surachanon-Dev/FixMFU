# การเสริมความปลอดภัยของเว็บ

การปรับชุดนี้ไม่เพิ่มตาราง ไม่เปลี่ยนบทบาท และไม่ต้องรัน SQL เพิ่ม ระบบยังตรวจ Google identity ของ `lamduan.mfu.ac.th` และบทบาทจาก `profiles` ฝั่งเซิร์ฟเวอร์ พร้อม RLS เดิม

## HTTP headers

กำหนดทุกเส้นทางใน `next.config.mjs`:

- `X-Content-Type-Options: nosniff` ให้เบราว์เซอร์ใช้ชนิดเนื้อหาที่เซิร์ฟเวอร์ระบุ
- `X-Frame-Options: DENY` และ CSP `frame-ancestors 'none'` ป้องกันเว็บอื่นฝังหน้าระบบเพื่อหลอกคลิก
- CSP `base-uri 'self'` และ `object-src 'none'` จำกัดการเปลี่ยน base URL และเนื้อหาแบบ object/embed
- `Referrer-Policy: strict-origin-when-cross-origin` ไม่ส่ง path/query ของเรื่องแจ้งไปเว็บภายนอก ส่วน OAuth callback ใช้ `no-referrer` ที่เข้มกว่า
- ปิด microphone, payment และ USB ผ่าน Permissions Policy โดยยังใช้ช่องแนบรูปได้ตามเดิม
- ปิด `X-Powered-By`

CSP นี้ยังไม่จำกัด script, style, image หรือ network connection จึงใช้ Next.js, Motion, รูปพรีวิว และ Supabase ได้ตามเดิม และไม่ใช่ CSP แบบเต็มสำหรับป้องกัน XSS

## Session และการตั้งค่า

`src/lib/supabase/cookie-options.ts` ใช้ร่วมกันระหว่าง Browser Client, Server Client และ Proxy เมื่อ `NEXT_PUBLIC_SITE_URL` เป็น HTTPS จะกำหนด session cookie เป็น `Secure` พร้อม `SameSite=Lax` และ path `/` แบบไม่กำหนด domain ส่วน HTTP localhost ยังใช้งานระหว่างพัฒนาได้

คงการอ่าน cookie ในเบราว์เซอร์ตามรูปแบบของ Supabase SSR เพื่อให้การจัดการ session ฝั่ง client ใช้งานได้ ไม่ตั้ง `HttpOnly` ทับโดยพลการ ดู [แนวทาง Supabase SSR](https://supabase.com/docs/guides/auth/server-side/advanced-guide)

Supabase Project URL ต้องใช้ HTTPS เว้นแต่เป็น HTTP loopback สำหรับพัฒนา และไม่รับ username/password, path เพิ่มเติม, query หรือ fragment ป้องกันส่งข้อมูลยืนยันตัวตนผ่านปลายทางที่ตั้งค่าผิด

OAuth callback ส่งกลับเฉพาะ origin ที่ตั้งค่าไว้และเส้นทางตามบทบาทจากฐานข้อมูล เมื่อแลกรหัสสำเร็จแต่เกิดข้อผิดพลาดระหว่างตรวจบัญชีหรือโปรไฟล์ จะพยายามออกจาก session ใหม่นั้นก่อนส่งกลับหน้าล็อกอิน แม้บริการออกจากระบบไม่ตอบสนองก็ยังไม่อนุญาตให้ callback เข้าระบบสำเร็จ ตัวตรวจสิทธิ์ของหน้าจริงยังทำงานแยกต่างหาก

Proxy ยังคงส่ง `Cache-Control: private, no-store, max-age=0` สำหรับพื้นที่ User, Admin และ Auth รวมถึงกรณี refresh cookie และ Auth ขัดข้อง การทดสอบครอบคลุมการส่ง cookie หลายชุดโดยไม่ทำให้ชุดก่อนหน้าหาย ดู [ข้อควรระวังเรื่อง cache ของ Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client)

## ตรวจสอบ

```sh
node --test tests/auth.test.mjs tests/security.test.mjs
```

ชุดทดสอบตรวจผู้ใช้ทั่วไปเข้า Admin ไม่ได้, การอ้าง role/identity ที่ไม่ถูกต้อง, redirect/callback, cookie policy, private cache และ headers โดยใช้ข้อมูลจำลอง ไม่มีการส่งข้อมูลไป Supabase จริง

ก่อนเผยแพร่ต้องตั้ง HTTPS และ `NEXT_PUBLIC_SITE_URL` ให้ตรงกับโฮสต์จริง ตรวจ allowlist ของ Supabase/Google OAuth และตั้งค่า CDN ไม่ให้ cache หน้า User/Admin/Auth การจำกัดอัตราคำขอระดับโฮสต์ การสำรอง/กู้คืน และการตั้งค่าภายในบัญชี Supabase ยังต้องตรวจตามสภาพแวดล้อมที่นำขึ้นใช้งาน ไม่ได้เปลี่ยนจากโค้ดชุดนี้
