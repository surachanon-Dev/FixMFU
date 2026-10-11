import React from 'react';

export default function SettingsPage() {
  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">ตั้งค่าระบบ</h1>
        <p className="text-gray-500 mt-2">จัดการข้อมูลพื้นฐาน รายชื่ออาคาร และหมวดหมู่ปัญหา</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* กล่องจัดการอาคาร */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">🏢 จัดการอาคาร</h2>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors">
              + เพิ่มอาคาร
            </button>
          </div>
          <ul className="divide-y divide-gray-100">
            <li className="py-3 flex justify-between items-center">
              <span className="text-gray-700 font-medium">อาคาร E4</span>
              <button className="text-red-500 hover:text-red-700 text-sm font-semibold">ลบ</button>
            </li>
            <li className="py-3 flex justify-between items-center">
              <span className="text-gray-700 font-medium">M-Square</span>
              <button className="text-red-500 hover:text-red-700 text-sm font-semibold">ลบ</button>
            </li>
            <li className="py-3 flex justify-between items-center">
              <span className="text-gray-700 font-medium">หอพัก F1</span>
              <button className="text-red-500 hover:text-red-700 text-sm font-semibold">ลบ</button>
            </li>
          </ul>
        </div>

        {/* กล่องจัดการหมวดหมู่ */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">🏷️ หมวดหมู่ปัญหา</h2>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors">
              + เพิ่มหมวดหมู่
            </button>
          </div>
          <ul className="divide-y divide-gray-100">
            <li className="py-3 flex justify-between items-center">
              <span className="text-gray-700 font-medium">แอร์/ประปา</span>
              <button className="text-red-500 hover:text-red-700 text-sm font-semibold">ลบ</button>
            </li>
            <li className="py-3 flex justify-between items-center">
              <span className="text-gray-700 font-medium">ไฟฟ้า</span>
              <button className="text-red-500 hover:text-red-700 text-sm font-semibold">ลบ</button>
            </li>
            <li className="py-3 flex justify-between items-center">
              <span className="text-gray-700 font-medium">อินเทอร์เน็ต</span>
              <button className="text-red-500 hover:text-red-700 text-sm font-semibold">ลบ</button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
