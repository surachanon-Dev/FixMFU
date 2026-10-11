import React from 'react';

export default function AdminDashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">ภาพรวมระบบจัดการงานซ่อม</h1>
      <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
        <p className="text-gray-600">ยินดีต้อนรับสู่หน้าระบบจัดการของช่างซ่อมบำรุง</p>
        {/* เดี๋ยวเราค่อยมาเพิ่มตารางหรือ Kanban กันต่อที่นี่ครับ */}
      </div>
    </div>
  );
}
