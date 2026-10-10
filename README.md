# FixMFU
🛠️ FixMFU (MFU Facility Issue Tracking System)

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

[Name 1] - Project Manager / SA

[Name 2] - Frontend Developer (Admin Dashboard)

[Name 3] - Frontend Developer (User App)

[Name 4] - Backend & Database Developer

[Name 5] - System Integrator / QA

Designed and built with passion at Mae Fah Luang University. 🎓
