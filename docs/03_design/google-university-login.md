# Google Login เฉพาะ @lamduan.mfu.ac.th

ใช้ฐานข้อมูลเดิมของ Supabase ไม่ติดตั้ง PostgreSQL เพิ่ม หน้า `/login` ใช้ Google OAuth ผ่าน Supabase SSR และ PKCE โดยต้องตั้งค่าภายนอกด้านล่างก่อนจึงจะล็อกอินจริงได้

## 1. เพิ่มกฎฐานข้อมูล

หลัง `01_initial_schema.sql` และชุดทดสอบเดิมผ่านแล้ว เปิด SQL Editor → New query แล้วรัน **ทั้งไฟล์** `supabase/sql/02_university_google_auth.sql` หนึ่งครั้ง สคริปต์นี้ไม่ลบบัญชีเดิม แต่บัญชีนอกมหาลัย/session รหัสผ่านจะอ่านหรือเขียนตารางแอปผ่าน client ไม่ได้อีก

ใช้ `supabase/tests/02_university_google_auth.test.sql` ตรวจในโปรเจกต์พัฒนา ผลสุดท้ายต้องเป็น `PASS: university Google access restrictions` ข้อมูลทดสอบทั้งหมด rollback ไม่ส่งอีเมล หลังติดตั้งกฎ 02 แล้วให้ใช้ชุดทดสอบ 02 แทนชุด 01 ที่ออกแบบไว้สำหรับช่วงอีเมล/รหัสผ่าน

## 2. เปิด hook ป้องกันการสร้างบัญชีผิดโดเมน

Supabase → Authentication → Hooks → เลือก **Before User Created** แล้วตั้งเป็น Postgres function:

- Schema: `public`
- Function: `hook_lamduan_google_signup`
- บันทึกและเปิดใช้งาน hook

สคริปต์ SQL สร้าง function ให้แล้ว แต่ไม่เปิด hook ใน Dashboard อัตโนมัติ ต้องทำขั้นนี้ด้วย จึงจะป้องกันการสร้าง Auth user ที่ไม่ใช่ Google มหาลัยได้

## 3. ดู Callback URL ของ Supabase

เปิด Authentication → Sign In / Providers → Google แล้วคัดลอก **Callback URL** ที่แสดงอยู่ เก็บไว้ใส่ Google Cloud ในขั้นถัดไป ค่านี้เป็น URL ของ Supabase รูปแบบ `https://<project-ref>.supabase.co/auth/v1/callback` ใช้ค่าจริงที่ Dashboard แสดง ไม่ใช่ `/auth/callback` ของเว็บ

## 4. สร้าง OAuth client ใน Google Cloud

1. เปิด https://console.cloud.google.com/ และเลือก/สร้างโปรเจกต์สำหรับ FixMFU
2. เปิด **Google Auth Platform** ตั้ง Branding (ชื่อแอป/อีเมลติดต่อ) และ Audience
3. หากโปรเจกต์ไม่ได้อยู่ใน Google Workspace organization ที่คุณจัดการ ให้ใช้ External และ Testing แล้วเพิ่มอีเมลมหาลัยของบัญชีที่จะทดสอบใน Test users การจำกัดผู้ใช้จริงยังบังคับที่ Supabase/เว็บตามกฎที่เตรียมไว้
4. Data Access ใช้เฉพาะ `openid`, `userinfo.email`, `userinfo.profile`
5. Clients → Create client → ชนิด **Web application**
6. Authorized JavaScript origins ใส่ต้นทางเว็บจริง เช่น `http://localhost:3000`
7. Authorized redirect URIs ใส่ **Supabase Callback URL จากขั้น 3** แล้วสร้าง client
8. นำ Client ID และ Client Secret ไปกรอกโดยตรงใน Google provider ของ Supabase แล้วเปิด Enable/บันทึก ไม่ใส่ Google Client Secret ในตัวแปร `NEXT_PUBLIC_*` ของเว็บ

## 5. ตั้ง URL กลับมายังเว็บ

Supabase → Authentication → URL Configuration:

- Site URL: `http://localhost:3000`
- Redirect URLs: เพิ่ม `http://localhost:3000/auth/callback`

ใน `.env.local` ของเว็บต้องมี:

```dotenv
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

ใช้ URL/port ของเว็บที่เปิดจริง โดย `npm run dev` ใช้พอร์ต 3000 ตามค่าเริ่มต้น หากเปลี่ยนพอร์ต ให้เปลี่ยนทั้ง `.env.local`, JavaScript origin ใน Google Cloud และ URL ใน Supabase ให้ตรงกัน จากนั้นเริ่ม Next.js ใหม่ เมื่อ deploy ใช้ต้นทาง HTTPS จริงโดยไม่มี path/query/hash

URL สองแห่งมีหน้าที่ต่างกัน: Google ส่งกลับ **Supabase `/auth/v1/callback`** และ Supabase ส่งกลับ **เว็บ `/auth/callback`** เพื่อแลก code เป็น cookie session

## 6. ปิดวิธีเข้าสู่ระบบอื่น

ใน Authentication → Sign In / Providers ปิด Email และ provider อื่นที่ไม่ใช้ ให้เหลือ Google สำหรับแอปนี้ โค้ดเว็บไม่มีฟอร์มรหัสผ่านแล้ว และกฎฐานข้อมูลตรวจว่าเป็น session OAuth ด้วย จึงไม่ให้ session รหัสผ่านเดิมใช้ข้อมูลแอป แม้บัญชีจะเคยเชื่อม Google ไว้

## 7. ทดสอบจริงด้วยบัญชีมหาลัย

1. เปิด `/login` → เข้าสู่ระบบด้วย Google → เลือกบัญชี `@lamduan.mfu.ac.th` และดำเนินการยินยอมด้วยตัวเอง
2. กลับเข้า `/user` ได้ และเกิดแถว `profiles` ที่มี role `user` อัตโนมัติ
3. บัญชีมหาลัยปกติเปิด `/admin/dashboard` ต้องถูกปฏิเสธ
4. ลอง Google ส่วนตัว ต้องถูกปฏิเสธจาก hook และหากเป็นบัญชีเดิมที่สร้างไว้ก่อนติด hook ก็ยังเข้า portal/ข้อมูลแอปไม่ได้
5. ออกจากระบบแล้วเปิด `/user` อีกครั้งต้องกลับ `/login`

การทดสอบอัตโนมัติใช้ PostgreSQL/Auth จำลอง ยังไม่แทนการทดสอบ OAuth จริงกับ Google/Supabase และบัญชีมหาลัย หลังตั้งค่าครบต้องยืนยันผลจริงตามขั้นนี้

## การกำหนด Admin

ให้บัญชีที่ตั้งใจเป็น Admin ล็อกอิน Google มหาลัยครั้งแรกก่อน จากนั้นเจ้าของโปรเจกต์เลือก UUID ที่ตรงกันจาก Authentication Users และรัน:

```sql
update public.profiles
set role = 'admin'
where id = 'UUID_OF_CHOSEN_ADMIN'::uuid
returning id, role;
```

Admin ก็ต้องเป็นบัญชี Google `@lamduan.mfu.ac.th` เช่นเดียวกัน ไม่มีข้อยกเว้นโดเมนสำหรับ Admin

## กฎตรวจบัญชี

- ใช้ `hd` ในคำขอเป็นเพียงตัวช่วยเลือกบัญชี ไม่ใช้เป็นหลักฐานให้สิทธิ์
- ตรวจ session ที่ยืนยันแล้วว่ามีวิธี `oauth` และอ่านบัญชีผ่าน Supabase `getUser()`
- ตรวจ **identity_data ของ provider Google** ว่าอีเมลยืนยันแล้ว ตรงกับอีเมลบัญชี มี issuer ของ Google และ `custom_claims.hd` ตรง `lamduan.mfu.ac.th` แบบเต็ม
- ไม่ใช้ `user_metadata` ที่ผู้ใช้แก้ได้เป็นหลักฐานให้สิทธิ์ในเว็บหรือกฎอ่าน/เขียนข้อมูล
- Hook ก่อนสร้างบัญชีอ่าน claims ที่ Supabase รับจาก Google และบล็อก provider ที่ไม่ใช่ Google ด้วย
- SQL 02 เพิ่ม policy แบบ **restrictive** ครบ 6 ตาราง ให้ทำงานร่วมกับกฎเจ้าของเรื่อง/Admin เดิม ไม่แทนที่กฎเดิมหรือเปิดข้อมูลให้ทุกคน
- API/RPC แบบ security definer ที่เพิ่มในอนาคตต้องตรวจ `fixmfu_private.is_university_google_user()` พร้อมบทบาทด้วย เพราะ function เจ้าของฐานข้อมูลและ service role สามารถข้าม RLS ได้

อ้างอิง: [Supabase Google OAuth](https://supabase.com/docs/guides/auth/social-login/auth-google), [Before User Created Hook](https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook), [Google: การตรวจ hd claim](https://developers.google.com/identity/openid-connect/openid-connect#validatinganidtoken)
