# FixMFU
🛠️ FixMFU (MFU Facility Issue Tracking System)

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

FixMFU is a streamlined facility management and issue tracking platform designed specifically for Mae Fah Luang University (MFU). It modernizes the way students and staff report infrastructure problems (e.g., broken AC, plumbing issues) by providing a user-friendly mobile web interface, while offering a Kanban-style dashboard for maintenance staff to efficiently track and resolve tasks.

✨ Key Features

👤 For Students & Staff (Reporters)

Easy Reporting: Submit issues quickly via a mobile-responsive web form.

Photo Evidence: Upload photos of the problem for better clarity.

Location Tagging: Select specific buildings and rooms (e.g., E4, M-Square).

Real-time Tracking: Check the status of your reported tickets (Pending 🟡 -> In Progress 🔵 -> Resolved 🟢).

🧑‍🔧 For Maintenance Staff & Admins

Kanban Dashboard: Manage incoming tickets using a drag-and-drop or status-update board.

Instant Notifications: Get notified immediately via LINE Notify when a new issue is reported.

Proof of Resolution: Upload post-repair photos before closing a ticket.

Analytics (Executive View): View statistics on frequent issues, categorized by building and type, to help with budget planning.

💻 Tech Stack

Frontend: Next.js (React Framework), Tailwind CSS for styling.

Backend & Database: Supabase (PostgreSQL & Storage) or equivalent BaaS.

Integration: LINE Notify API for real-time alerts.

Deployment: Vercel (Frontend).

🚀 Getting Started

Follow these instructions to set up the project locally on your machine.

Prerequisites

Node.js (v18 or higher)

npm or yarn

Git

Installation

Clone the repository

git clone https://github.com/surachanon-Dev/FixMFU.git
cd FixMFU



Install dependencies

npm install
# or
yarn install



Set up Environment Variables
Create a .env.local file in the root directory and add your keys (Example for Supabase & LINE):

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
LINE_NOTIFY_TOKEN=your_line_notify_token



Run the development server

npm run dev
# or
yarn dev



Open http://localhost:3000 with your browser to see the result.

👥 Team Members

This project is developed by a team of 5 members for the Software Project course.

[Surachanon Thongkliang 1] - Project Manager / SA

[Sirawich Muaksungnoen] - Frontend Developer (Admin Dashboard)

[Athikan konsila] - Frontend Developer (User App)

[Athich Kaweekijudom] - Backend & Database Developer

[Sirapat Thammapattanakit] - System Integrator / QA

Designed and built with passion at Mae Fah Luang University. 🎓
