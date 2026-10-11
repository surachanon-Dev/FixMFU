"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Building2, 
  Briefcase, 
  Check, 
  Settings, 
  Image as ImageIcon,
  Zap,
  Droplets,
  Wind,
  Armchair,
  Wifi,
  KeyRound,
  CloudRain,
  Lightbulb,
  ShieldAlert
} from 'lucide-react';

// ประเภทข้อมูล (Types)
export type CategoryType = 
  | 'air' 
  | 'electrical' 
  | 'plumbing' 
  | 'furniture' 
  | 'network' 
  | 'door' 
  | 'roof' 
  | 'lighting';

export interface TimelineStep {
  id: number;
  title: string;
  detail?: string;
  time?: string;
  status: 'completed' | 'current' | 'pending';
}

export interface TicketData {
  id: string;
  building: string;
  category: string;
  categoryType: CategoryType;
  statusText: string;
  statusBadgeClass: string;
  description: string;
  imageUrl?: string;
  timeline: TimelineStep[];
}

// ข้อมูลจำลองสำหรับทดสอบ (Mock Data)
const MOCK_TICKETS: Record<string, TicketData> = {
  'TIC-001': {
    id: 'TIC-001',
    building: 'อาคาร E4 - ห้อง E4-301',
    category: 'แอร์/ระบบความเย็น',
    categoryType: 'air',
    statusText: 'กำลังดำเนินการ',
    statusBadgeClass: 'bg-[#FFF9F0] text-[#F4A300] border-[#F4A300]',
    description: 'แอร์มีแต่ลมร้อนออกมา เปิดมา 2 ชั่วโมงแล้วก็ยังไม่เย็นครับ รบกวนช่างเข้ามาดูให้หน่อยครับ ช่วงบ่ายมีเรียนต่อครับ',
    imageUrl: 'https://images.unsplash.com/photo-1621020295191-2364c7e6c0c2?auto=format&fit=crop&q=80&w=200&h=200',
    timeline: [
      { id: 1, title: 'รับเรื่องแจ้งซ่อมเข้าสู่ระบบ', time: '11 ต.ค. 2026 - 10:30 น.', status: 'completed' },
      { id: 2, title: 'กำลังดำเนินการ', detail: 'ช่างกำลังเบิกกุญแจและเดินทางไปตรวจสอบที่ห้องครับ', time: '11 ต.ค. 2026 - 13:45 น.', status: 'current' },
      { id: 3, title: 'เสร็จสิ้นการซ่อมบำรุง', status: 'pending' },
    ]
  },
  'TIC-002': {
    id: 'TIC-002',
    building: 'หอพักนักศึกษาหญิง F1 - ห้อง 312',
    category: 'ประตู/ลูกบิด/ระบบล็อก',
    categoryType: 'door',
    statusText: 'รอดำเนินการ',
    statusBadgeClass: 'bg-red-50 text-red-600 border-red-300',
    description: 'ลูกบิดประตูห้องนอนหมุนฟรี ไขกุญแจจากข้างนอกลำบากมาก ล็อกห้องไม่ได้ กังวลเรื่องความปลอดภัยช่วงออกไปเรียนค่ะ',
    imageUrl: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&q=80&w=200&h=200',
    timeline: [
      { id: 1, title: 'รับเรื่องแจ้งซ่อมเข้าสู่ระบบ', time: '11 ต.ค. 2026 - 15:20 น.', status: 'current' },
      { id: 2, title: 'เบิกอะไหล่ชุดตลับแม่กุญแจใหม่', status: 'pending' },
      { id: 3, title: 'เสร็จสิ้นการซ่อมบำรุง', status: 'pending' },
    ]
  },
  'TIC-003': {
    id: 'TIC-003',
    building: 'อาคาร C2 - ห้องปฏิบัติการคอมพิวเตอร์ C2-205',
    category: 'ระบบเครือข่าย/อินเทอร์เน็ต',
    categoryType: 'network',
    statusText: 'กำลังดำเนินการ',
    statusBadgeClass: 'bg-[#FFF9F0] text-[#F4A300] border-[#F4A300]',
    description: 'สัญญาณ MFU-WiFi ดับแถบโซนหน้าห้อง และสาย LAN ที่เครื่องอาจารย์หัวล็อกแตก ทำให้หลุดบ่อยขณะทำการสอน',
    timeline: [
      { id: 1, title: 'รับเรื่องแจ้งซ่อมเข้าสู่ระบบ', time: '11 ต.ค. 2026 - 09:15 น.', status: 'completed' },
      { id: 2, title: 'กำลังดำเนินการ', detail: 'เจ้าหน้าที่ IT อยู่ระหว่างเข้าตรวจสอบ Access Point และเข้าหัวสาย LAN ใหม่', time: '11 ต.ค. 2026 - 11:00 น.', status: 'current' },
      { id: 3, title: 'เสร็จสิ้นการซ่อมบำรุง', status: 'pending' },
    ]
  },
  'TIC-004': {
    id: 'TIC-004',
    building: 'อาคาร S1 (วิทยบริการ) - ชั้น 2 โซนอ่านหนังสือ',
    category: 'อาคารสถานที่/เพดานรั่วซึม',
    categoryType: 'roof',
    statusText: 'รับเรื่องแล้ว',
    statusBadgeClass: 'bg-blue-50 text-blue-600 border-blue-300',
    description: 'ช่วงฝนตกหนักมีน้ำหยดลงมาจากแผ่นฝ้าเพดาน หยดใส่โต๊ะอ่านหนังสือและพื้นเริ่มเจิ่งนอง รบกวนส่งเจ้าหน้าที่มาตั้งถังและซ่อมฝ้าครับ',
    imageUrl: 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&q=80&w=200&h=200',
    timeline: [
      { id: 1, title: 'รับเรื่องแจ้งซ่อมเข้าสู่ระบบ', time: '11 ต.ค. 2026 - 16:00 น.', status: 'current' },
      { id: 2, title: 'ประสานงานช่างโครงสร้างขึ้นตรวจดาดฟ้า', status: 'pending' },
      { id: 3, title: 'เสร็จสิ้นการซ่อมบำรุง', status: 'pending' },
    ]
  },
  'TIC-005': {
    id: 'TIC-005',
    building: 'ทางเดินเท้าเชื่อมระหว่าง ลานจอดรถ M-Square - หอพักพึงพาย',
    category: 'ระบบไฟฟ้าภายนอก/แสงสว่าง',
    categoryType: 'lighting',
    statusText: 'เสร็จสิ้น',
    statusBadgeClass: 'bg-emerald-50 text-emerald-600 border-emerald-300',
    description: 'ไฟกิ่งทางเดินมืดไป 3 ต้นติดต่อกัน ช่วงกลางคืนมืดมาก เกรงว่าจะไม่ปลอดภัยสำหรับนักศึกษาที่เดินกลับหอพักดึกๆ',
    timeline: [
      { id: 1, title: 'รับเรื่องแจ้งซ่อมเข้าสู่ระบบ', time: '09 ต.ค. 2026 - 19:30 น.', status: 'completed' },
      { id: 2, title: 'ตรวจสอบและเปลี่ยนหลอดไฟ LED พร้อมเบรกเกอร์', time: '10 ต.ค. 2026 - 10:00 น.', status: 'completed' },
      { id: 3, title: 'เสร็จสิ้นการซ่อมบำรุง', detail: 'เปลี่ยนหลอดไฟทางเดินทั้ง 3 จุดและทดสอบการเปิดอัตโนมัติเรียบร้อยแล้ว', time: '10 ต.ค. 2026 - 11:30 น.', status: 'completed' },
    ]
  }
};

export default function TicketDetailPage() {
  const params = useParams();
  
  // จัดการ Type ของ params.id ให้ปลอดภัย
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const initialTicketId = rawId || 'TIC-001';

  const [selectedId, setSelectedId] = useState<string>(initialTicketId);
  const currentTicket = MOCK_TICKETS[selectedId] || MOCK_TICKETS['TIC-001'];

  const renderCategoryIcon = (type: CategoryType) => {
    switch (type) {
      case 'air':
        return <Wind className="w-6 h-6 text-[#F4A300]" strokeWidth={1.5} />;
      case 'door':
        return <KeyRound className="w-6 h-6 text-rose-500" strokeWidth={1.5} />;
      case 'network':
        return <Wifi className="w-6 h-6 text-indigo-500" strokeWidth={1.5} />;
      case 'roof':
        return <CloudRain className="w-6 h-6 text-sky-500" strokeWidth={1.5} />;
      case 'lighting':
        return <Lightbulb className="w-6 h-6 text-amber-500" strokeWidth={1.5} />;
      case 'plumbing':
        return <Droplets className="w-6 h-6 text-blue-500" strokeWidth={1.5} />;
      case 'electrical':
        return <Zap className="w-6 h-6 text-amber-500" strokeWidth={1.5} />;
      case 'furniture':
        return <Armchair className="w-6 h-6 text-purple-500" strokeWidth={1.5} />;
      default:
        return <Briefcase className="w-6 h-6 text-[#F4A300]" strokeWidth={1.5} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F2E9] py-10 px-4 sm:px-6 font-sans">
      <div className="max-w-[700px] mx-auto">
        
        {/* เมนูสำหรับทดสอบ UI */}
        <div className="mb-6 p-4 bg-white rounded-2xl border border-[#E4E7EC] shadow-sm">
          <p className="text-xs font-semibold text-[#667085] mb-2.5 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-[#F4A300]" />
            เลือกเคสตัวอย่างปัญหาประเภทต่างๆ (สำหรับ Preview):
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.keys(MOCK_TICKETS).map((id) => (
              <button
                key={id}
                onClick={() => setSelectedId(id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  selectedId === id
                    ? 'bg-[#171717] text-white shadow-sm'
                    : 'bg-[#F6F2E9] text-[#667085] hover:bg-gray-200'
                }`}
              >
                {id}: {MOCK_TICKETS[id].category.split('/')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* ปุ่มย้อนกลับ */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 bg-white border border-[#E4E7EC] text-blue-600 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition-colors mb-4 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับไปหน้าประวัติการแจ้งซ่อม
        </Link>
        
        {/* กล่องรายละเอียด */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#E4E7EC] overflow-hidden">
          <div className="h-2 w-full bg-[#F4A300]"></div>
          
          <div className="p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-4 mb-8">
              <div>
                <h1 className="text-[22px] font-bold text-[#171717] mb-1">
                  รายละเอียดใบแจ้งซ่อม
                </h1>
                <p className="text-[#667085] text-sm">
                  รหัสอ้างอิง: {currentTicket.id}
                </p>
              </div>
              <span className={`border px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${currentTicket.statusBadgeClass}`}>
                {currentTicket.statusText}
              </span>
            </div>

            <div className="flex flex-col md:flex-row gap-6 mb-6">
              <div className="flex items-center gap-3 md:w-1/2">
                <div className="w-12 h-12 rounded-xl bg-[#F2F4F7] flex items-center justify-center shrink-0">
                  <Building2 className="w-6 h-6 text-[#667085]" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-xs text-[#667085] mb-0.5">อาคาร/สถานที่</h3>
                  <p className="text-[#171717] font-medium text-sm">{currentTicket.building}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 md:w-1/2">
                <div className="w-12 h-12 rounded-xl bg-[#FFF4E5] flex items-center justify-center shrink-0">
                  {renderCategoryIcon(currentTicket.categoryType)}
                </div>
                <div>
                  <h3 className="text-xs text-[#667085] mb-0.5">หมวดหมู่ปัญหา</h3>
                  <p className="text-[#171717] font-medium text-sm">{currentTicket.category}</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="bg-[#F6F2E9] p-4 rounded-xl border border-[#E4E7EC] mb-4">
                <p className="text-[#171717] text-sm leading-relaxed">
                  {currentTicket.description}
                </p>
              </div>
              
              <div className="flex gap-3">
                {currentTicket.imageUrl ? (
                  <div className="w-[72px] h-[72px] bg-gray-100 rounded-lg border border-[#E4E7EC] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={currentTicket.imageUrl} 
                      alt="รูปปัญหา" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                ) : null}
                <div className="w-[72px] h-[72px] bg-[#F9FAFB] rounded-lg border border-[#E4E7EC] flex items-center justify-center text-[#D0D5DD]">
                  <ImageIcon className="w-8 h-8" strokeWidth={1.5} />
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-[18px] font-bold text-[#171717] mb-6">สถานะการดำเนินงาน</h3>
              
              <div className="relative ml-4">
                <div className="absolute left-4 top-4 bottom-0 w-[2px] bg-[#E4E7EC] -translate-x-1/2"></div>
                
                <div className="space-y-6 relative">
                  {currentTicket.timeline.map((step) => {
                    if (step.status === 'completed') {
                      return (
                        <div key={step.id} className="flex gap-4">
                          <div className="relative z-10 w-8 h-8 rounded-full bg-[#3B82F6] flex items-center justify-center shrink-0 mt-0.5 border-4 border-white">
                            <Check className="w-4 h-4 text-white" strokeWidth={3} />
                          </div>
                          <div>
                            <h4 className="font-bold text-[#171717] text-[15px]">{step.title}</h4>
                            {step.detail && <p className="text-sm text-[#171717] mt-0.5">{step.detail}</p>}
                            {step.time && <p className="text-sm text-[#667085] mt-0.5">{step.time}</p>}
                          </div>
                        </div>
                      );
                    }

                    if (step.status === 'current') {
                      return (
                        <div key={step.id} className="flex gap-4 relative">
                          <div className="absolute -inset-y-3 -inset-x-2 left-[20px] bg-gradient-to-r from-[#FFF4E5] to-transparent rounded-r-xl z-0 pointer-events-none"></div>
                          <div className="relative z-10 w-8 h-8 rounded-full bg-[#F4A300] flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_0_4px_white]">
                            <Settings className="w-4 h-4 text-white animate-spin" />
                          </div>
                          <div className="relative z-10 py-1">
                            <h4 className="font-bold text-[#171717] text-[15px]">{step.title}</h4>
                            {step.detail && <p className="text-sm text-[#171717] mt-1">{step.detail}</p>}
                            {step.time && <p className="text-xs text-[#667085] mt-1">{step.time}</p>}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={step.id} className="flex gap-4 opacity-50">
                        <div className="relative z-10 w-8 h-8 rounded-full bg-white border-[2px] border-[#E4E7EC] flex items-center justify-center shrink-0 mt-0.5"></div>
                        <div>
                          <h4 className="font-bold text-[#171717] text-[15px]">{step.title}</h4>
                          <p className="text-xs text-[#667085] mt-0.5">รอการอัปเดต</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}