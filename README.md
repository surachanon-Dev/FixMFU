```markdown
# 🛠️ FixMFU (ระบบแจ้งปัญหาอาคารสถานที่)

โปรเจกต์พัฒนาระบบแจ้งซ่อมและรายงานปัญหาอาคารสถานที่ สำหรับมหาวิทยาลัยแม่ฟ้าหลวง (กลุ่ม 6)

## 💻 Tech Stack (เทคโนโลยีที่ใช้)
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (v4)
- **Database / Auth:** Supabase

---

## 👥 สมาชิกและหน้าที่รับผิดชอบ (Group 6)
เพื่อให้ทีมทำงานร่วมกันได้อย่างมีประสิทธิภาพ และลดความซ้ำซ้อนของงาน:

1. **นายสุรชานนท์ ทองเกลี้ยง (Lead/DevOps):** ดูแลการตั้งค่าโปรเจกต์เริ่มต้น (Project Setup), โครงสร้าง Next.js, จัดการ Version Control (GitHub) และตรวจสอบโครงสร้างรวม
2. **[ชื่อเพื่อนคนที่ 1] (Frontend - User Side):** รับผิดชอบ UI/UX ฝั่งผู้ใช้งานที่โฟลเดอร์ `(user)` เช่น หน้าฟอร์มแจ้งปัญหา, ระบบติดตามสถานะ
3. **[ชื่อเพื่อนคนที่ 2] (Frontend - Admin Side):** รับผิดชอบ UI/UX ฝั่งช่าง/ผู้ดูแลระบบที่โฟลเดอร์ `(admin)` เช่น หน้า Dashboard จัดการคิวงาน, อัปเดตสถานะ
4. **[ชื่อเพื่อนคนที่ 3] (Backend & Database):** รับผิดชอบการออกแบบ Table ใน Supabase, การเขียน API เชื่อมต่อข้อมูล และระบบ Authentication

*(หมายเหตุ: สามารถปรับเปลี่ยนชื่อและหน้าที่ได้ตามความเหมาะสมของทีม)*

---

## 📂 โครงสร้างโปรเจกต์ (Project Structure)
โปรเจกต์นี้ใช้สถาปัตยกรรม **App Router** โดยใช้ **Route Groups** (โฟลเดอร์ที่มีวงเล็บ) เพื่อแยกโค้ดฝั่ง User และ Admin ไม่ให้ปะปนกัน และป้องกันไม่ให้ชื่อโฟลเดอร์ไปโผล่ใน URL

```text
FixMFU/
├── docs/                       # 📂 โฟลเดอร์สำหรับเอกสารวิชา Software Project (PM/SA ดูแล)
│   ├── 01_requirements/        # ไฟล์ Requirement List (Excel/PDF)
│   ├── 02_project_plan/        # ไฟล์ Project Management Plan
│   ├── 03_design/              # ไฟล์ System Design, ER-Diagram, UI Mockups
│   └── 04_testing/             # ไฟล์ Test Case & Test Summary
│
├── src/
│   ├── app/                    # 🚀 Next.js App Router (Pages & Routing)
│   │   ├── (user)/             # 👤 Route Group: ฝั่งนักศึกษา/บุคลากรแจ้งปัญหา
│   │   │   ├── report/         # หน้าฟอร์มแจ้งซ่อม (หน้าจอที่ 3)
│   │   │   ├── ticket/         # หน้าดูรายละเอียดและติดตามสถานะงานของตัวเอง
│   │   │   └── page.tsx        # หน้า Home ฝั่ง User (My Tickets)
│   │   │
│   │   ├── (admin)/            # 🛠️ Route Group: ฝั่งช่างซ่อมบำรุง/ผู้บริหาร
│   │   │   ├── dashboard/      # หน้าสรุปสถิติ (กราฟตึกไหนพังบ่อย)
│   │   │   ├── kanban/         # หน้าจัดการตั๋วแจ้งซ่อม (ลากวางเปลี่ยนสถานะ)
│   │   │   └── settings/       # หน้าจัดการข้อมูล Master Data (เพิ่มตึก, เพิ่มหมวดหมู่)
│   │   │
│   │   ├── api/                # ⚙️ Backend API Routes
│   │   │   ├── notify/         # API สำหรับยิง LINE Notify
│   │   │   └── webhooks/       # Webhooks อื่นๆ (ถ้ามี)
│   │   │
│   │   ├── login/              # 🔑 หน้า Login (ใช้ร่วมกันทั้ง User และ Admin)
│   │   ├── layout.tsx          # โครงสร้าง Layout หลักของเว็บ
│   │   └── globals.css         # ไฟล์ CSS หลัก (Tailwind)
│   │
│   ├── components/             # 🧩 UI Components ที่ใช้ซ้ำ (ปุ่ม, ฟอร์ม, Navbar)
│   │   ├── ui/                 # (แนะนำให้เก็บพวก Shadcn UI ไว้ที่นี่)
│   │   └── shared/             # Components ที่เขียนเองและใช้หลายที่
│   │
│   ├── lib/                    # 🛠️ Utility Functions & Config
│   │   ├── supabase.ts         # ไฟล์ตั้งค่าการเชื่อมต่อ Supabase Client
│   │   └── utils.ts            # ฟังก์ชันตัวช่วยต่างๆ (เช่น แปลงฟอร์แมตวันที่)
│   │
│   └── types/                  # 🏷️ TypeScript Types/Interfaces (ถ้าใช้ TS)
│       └── database.types.ts   # โครงสร้าง Type ของ Database
│
├── public/                     # 🖼️ รูปภาพ Static (Logo มหาลัย, Icon ต่างๆ)
├── .env.local                  # 🔐 ไฟล์เก็บ API Keys (ห้าม Push ขึ้น GitHub)
├── .env.example                # 📄 ไฟล์ตัวอย่าง .env ให้เพื่อนในทีมดูว่าต้องใส่อะไรบ้าง
├── .gitignore                  # 🚫 กำหนดไฟล์ที่ไม่ต้อง Push ขึ้น GitHub (เช่น node_modules)
├── next.config.mjs             # ตั้งค่า Next.js
├── tailwind.config.ts          # ตั้งค่า Tailwind CSS
└── README.md                   # 📖 อธิบายโปรเจกต์ วิธีติดตั้ง และวิธีรัน

```

---

## 🤖 AI Context & Developer Rules (คำสั่งสำหรับ AI)

**[ATTENTION AI]:** หากคุณ (AI) ได้รับไฟล์ `README.md` นี้ไปวิเคราะห์เพื่อช่วยเขียนโค้ด กรุณาปฏิบัติตามกฎของโปรเจกต์อย่างเคร่งครัดดังนี้:

1. **Architecture:** โปรเจกต์นี้ใช้ `Next.js App Router` ห้ามเขียนโค้ดด้วยรูปแบบ Pages Router แบบเก่าเด็ดขาด
2. **Language & Types:** เขียนโค้ดด้วย `TypeScript` (`.tsx`, `.ts`) เสมอ และต้องกำหนด Interface/Type ให้ชัดเจน
3. **Styling:** ตกแต่ง UI ด้วย `Tailwind CSS` เท่านั้น ห้ามใช้ Inline CSS หรือสร้างไฟล์ `.css` เพิ่มเติมหากไม่จำเป็น
4. **Component State:** หาก Component ไหนต้องมีการโต้ตอบกับผู้ใช้ (เช่น มีฟอร์มกรอกข้อมูล, กดปุ่ม `onClick`, ใช้ `useState`) ต้องบังคับใส่ `"use client";` ไว้ที่บรรทัดบนสุดของไฟล์เสมอ
5. **Localization:** ข้อความที่แสดงผลบนหน้าเว็บไซต์ (UI Text) ต้องเป็น **ภาษาไทย** ทั้งหมด
6. **No Turbopack in Dev:** เนื่องจากระบบมีปัญหากับการประมวลผลภาษาไทยในโหมด Turbopack ให้หลีกเลี่ยงการแนะนำคำสั่งที่มี `--turbo`

---

## 🚀 วิธีการรันโปรเจกต์ (สำหรับทีม)

1. ดึงโค้ดล่าสุดจาก GitHub:
```bash
git pull origin main

```


2. ติดตั้ง Packages ทั้งหมด (ทำทุกครั้งที่มีคนเพิ่ม Library ใหม่):
```bash
npm install

```


3. รันระบบเซิร์ฟเวอร์จำลอง:
```bash
npm run dev

```


4. เปิดดูผลลัพธ์ที่ `http://localhost:3000`

```

```
