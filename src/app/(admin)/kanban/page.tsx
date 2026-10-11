import React from 'react';

export default function KanbanBoardPage() {
  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">กระดานจัดการงานซ่อม (Kanban)</h1>
        <p className="text-gray-500 mt-2">ลากและวางเพื่อเปลี่ยนสถานะงาน หรือคลิกเพื่อดูรายละเอียด</p>
      </div>

      {/* Kanban Board Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Column 1: รอดำเนินการ (To Do) */}
        <div className="bg-gray-100 p-4 rounded-xl border border-gray-200 flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-gray-700 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-400"></span>
              รอดำเนินการ
            </h2>
            <span className="bg-gray-200 text-gray-600 text-sm px-2 py-1 rounded font-bold">1</span>
          </div>
          
          {/* Ticket Card */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-grab">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-gray-500">REQ-002</span>
              <span className="text-xs text-gray-400">10 ต.ค.</span>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">หลอดไฟทางเดิน M-Square ขาด</h3>
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              หลอดไฟตรงทางเดินชั้น 2 ฝั่งห้องน้ำชายขาดไป 2 ดวงครับ มืดมากตอนเย็น
            </p>
            <div className="flex items-center justify-between mt-auto">
              <span className="text-xs font-medium bg-blue-50 text-blue-600 px-2 py-1 rounded">ไฟฟ้า</span>
              <button className="text-sm text-blue-600 font-medium hover:underline">อัปเดต</button>
            </div>
          </div>
        </div>

        {/* Column 2: กำลังดำเนินการ (In Progress) */}
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-blue-800 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-400"></span>
              กำลังดำเนินการ
            </h2>
            <span className="bg-blue-200 text-blue-800 text-sm px-2 py-1 rounded font-bold">1</span>
          </div>
          
          {/* Ticket Card */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-blue-300 transition-shadow cursor-grab">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-gray-500">REQ-001</span>
              <span className="text-xs text-gray-400">11 ต.ค.</span>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">แอร์ห้องเรียน E4-301 ไม่เย็น</h3>
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              เปิดมา 2 ชั่วโมงแล้วก็ยังไม่เย็นครับ รบกวนช่างเข้ามาดูให้หน่อย
            </p>
            <div className="flex items-center justify-between mt-auto">
              <span className="text-xs font-medium bg-cyan-50 text-cyan-600 px-2 py-1 rounded">แอร์/ประปา</span>
              <button className="text-sm text-blue-600 font-medium hover:underline">อัปเดต</button>
            </div>
          </div>
        </div>

        {/* Column 3: เสร็จสิ้น (Done) */}
        <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-green-800 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-400"></span>
              เสร็จสิ้น
            </h2>
            <span className="bg-green-200 text-green-800 text-sm px-2 py-1 rounded font-bold">1</span>
          </div>
          
          {/* Ticket Card */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 opacity-70">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-gray-500">REQ-003</span>
              <span className="text-xs text-gray-400">08 ต.ค.</span>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2 text-decoration-line: line-through">ท่อน้ำซึมห้องน้ำชั้น 2</h3>
            <p className="text-sm text-gray-500 mb-3">เปลี่ยนซีลยางให้เรียบร้อยแล้ว</p>
          </div>
        </div>

      </div>
    </div>
  );
}