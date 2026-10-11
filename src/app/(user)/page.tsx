"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// ==========================================
// 1. Mock Data (จำลองข้อมูลจาก Database)
// ==========================================
const mockUser = {
  name: 'สมชาย ใจดี',
  email: 'somchai.jai@lamduan.mfu.ac.th',
  avatar: 'https://ui-avatars.com/api/?name=Somchai+J&background=F4A300&color=fff',
};

const mockTicket = {
  id: 'REQ-001',
  title: 'แอร์ห้องเรียน E4-301 ไม่เย็น',
  category: 'ระบบปรับอากาศ',
  location: 'อาคาร E4 ชั้น 3 ห้อง 301',
  description: 'แอร์มีแต่ลมร้อนออกมา เปิดมาตั้งแต่เช้าแล้วรบกวนช่วยตรวจสอบให้หน่อยครับ',
  submittedAt: '11 ต.ค. 2026, 08:30 น.',
  beforeImage: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=600&auto=format&fit=crop', 
  currentStatus: 'เสร็จสิ้น', 
  
  // ประวัติความคืบหน้า (Timeline)
  timeline: [
    {
      status: 'รอรับเรื่อง',
      date: '11 ต.ค. 2026, 08:30 น.',
      note: 'ระบบได้รับข้อมูลการแจ้งซ่อมของคุณแล้ว',
    },
    {
      status: 'รับเรื่องแล้ว',
      date: '11 ต.ค. 2026, 09:15 น.',
      note: 'เจ้าหน้าที่รับทราบปัญหาและเตรียมจัดคิวช่างเข้าตรวจสอบ',
    },
    {
      status: 'กำลังดำเนินการ',
      date: '11 ต.ค. 2026, 10:30 น.',
      note: 'ช่างเทคนิคกำลังเข้าตรวจสอบที่ห้อง E4-301',
    },
    {
      status: 'เสร็จสิ้น',
      date: '11 ต.ค. 2026, 13:00 น.',
      note: 'ทำการเติมน้ำยาแอร์และทำความสะอาดฟิลเตอร์เรียบร้อย แอร์กลับมาเย็นปกติ',
      afterImage: 'https://images.unsplash.com/photo-1527689638836-411945a2b57c?q=80&w=600&auto=format&fit=crop', 
    },
  ],
};

// ==========================================
// 2. Component หลัก
// ==========================================
export default function TicketDetailPage() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    setIsLoggingOut(true);
    
    // TODO: ใส่ Logic ลบ Session/Token ของ Supabase ที่นี่
    // ตัวอย่าง: await supabase.auth.signOut();
    
    // จำลองการออกจากระบบและ Redirect ไปหน้า Home ('/')
    setTimeout(() => {
      router.push('/');
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#F6F2E9]">
      
      {/* --- ส่วนที่ 1: Navbar (Profile & Logout) --- */}
      <nav className="bg-[#FFFFFF] border-b border-[#E4E7EC] sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-[#F4A300]">
            🛠️ FixMFU
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold text-[#171717]">{mockUser.name}</span>
              <span className="text-xs text-[#667085]">{mockUser.email}</span>
            </div>
            <img 
              src={mockUser.avatar} 
              alt="User Profile" 
              className="w-10 h-10 rounded-full border border-[#E4E7EC]"
            />
            <div className="w-px h-8 bg-[#E4E7EC] mx-2"></div>
            <button 
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
            >
              {isLoggingOut ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ'}
            </button>
          </div>
        </div>
      </nav>

      {/* --- ส่วนที่ 2: รายละเอียดการแจ้งซ่อม --- */}
      <div className="max-w-5xl mx-auto p-4 sm:p-6 mt-4">
        
        {/* ปุ่มย้อนกลับ */}
        <Link href="/" className="inline-flex items-center text-[#667085] hover:text-[#F4A300] mb-6 transition-colors font-medium">
          &larr; กลับไปหน้าประวัติการแจ้งซ่อม
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* คอลัมน์ซ้าย: ข้อมูลที่ผู้ใช้แจ้ง (Original Report) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#FFFFFF] p-6 rounded-xl border border-[#E4E7EC] shadow-sm">
              <div className="mb-4">
                <span className="text-xs font-semibold text-[#F4A300] bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                  {mockTicket.id}
                </span>
              </div>
              <h1 className="text-xl font-bold text-[#171717] mb-2">{mockTicket.title}</h1>
              
              <div className="space-y-3 mt-4 text-sm">
                <div>
                  <p className="text-[#667085]">หมวดหมู่</p>
                  <p className="font-medium text-[#171717]">{mockTicket.category}</p>
                </div>
                <div>
                  <p className="text-[#667085]">สถานที่</p>
                  <p className="font-medium text-[#171717]">{mockTicket.location}</p>
                </div>
                <div>
                  <p className="text-[#667085]">รายละเอียด</p>
                  <p className="text-[#171717] bg-[#F6F2E9] p-3 rounded-md mt-1">{mockTicket.description}</p>
                </div>
                <div>
                  <p className="text-[#667085]">วันที่แจ้ง</p>
                  <p className="font-medium text-[#171717]">{mockTicket.submittedAt}</p>
                </div>
              </div>

              {/* รูปภาพที่ผู้ใช้ส่ง */}
              <div className="mt-6">
                <p className="text-[#667085] text-sm mb-2">รูปภาพประกอบปัญหา</p>
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-[#E4E7EC]">
                  <img src={mockTicket.beforeImage} alt="ปัญหาที่แจ้ง" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>

          {/* คอลัมน์ขวา: สถานะและประวัติความคืบหน้า (Timeline) */}
          <div className="lg:col-span-2">
            <div className="bg-[#FFFFFF] p-6 rounded-xl border border-[#E4E7EC] shadow-sm h-full">
              <h2 className="text-lg font-bold text-[#171717] mb-6 border-b border-[#E4E7EC] pb-4">
                ประวัติความคืบหน้า (Timeline)
              </h2>

              <div className="relative border-l-2 border-[#E4E7EC] ml-3 space-y-8">
                {mockTicket.timeline.map((item, index) => {
                  // เช็คสถานะเพื่อเปลี่ยนสีจุดวงกลม
                  let dotColor = "bg-gray-300";
                  if (item.status === 'รอรับเรื่อง') dotColor = "bg-yellow-400";
                  if (item.status === 'รับเรื่องแล้ว') dotColor = "bg-blue-400";
                  if (item.status === 'กำลังดำเนินการ') dotColor = "bg-[#F4A300]";
                  if (item.status === 'เสร็จสิ้น') dotColor = "bg-green-500";

                  return (
                    <div key={index} className="relative pl-8">
                      {/* จุดวงกลม Timeline */}
                      <span className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full ${dotColor} ring-4 ring-[#FFFFFF]`}></span>
                      
                      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-1 gap-1 sm:gap-4">
                        <h3 className="text-base font-bold text-[#171717]">{item.status}</h3>
                        <time className="text-xs font-medium text-[#667085]">{item.date}</time>
                      </div>
                      
                      {/* หมายเหตุจากเจ้าหน้าที่ */}
                      <div className="text-sm text-[#171717] bg-[#F6F2E9] p-3 rounded-lg border border-[#E4E7EC] inline-block mt-2 w-full">
                        {item.note}
                      </div>

                      {/* แสดงรูปหลังซ่อม (ถ้ามี และสถานะเสร็จสิ้น) */}
                      {item.afterImage && (
                        <div className="mt-4">
                          <p className="text-xs font-semibold text-green-700 mb-2">📸 ผลการแก้ไข / รูปหลังซ่อม</p>
                          <div className="aspect-video sm:w-2/3 bg-gray-100 rounded-lg overflow-hidden border border-[#E4E7EC]">
                            <img src={item.afterImage} alt="ผลการแก้ไข" className="w-full h-full object-cover" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}