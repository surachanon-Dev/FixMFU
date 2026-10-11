import React from 'react';

export default function ReportIssuePage() {
  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
      <h1 className="text-2xl font-bold mb-4 text-blue-900">แจ้งปัญหาอาคารสถานที่</h1>
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">เลือกอาคาร</label>
          <select className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>อาคาร E4</option>
            <option>M-Square</option>
            <option>หอพัก F1</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">หมวดหมู่ปัญหา</label>
          <select className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>แอร์/ประปา</option>
            <option>ไฟฟ้า</option>
            <option>อินเทอร์เน็ต</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">รายละเอียด</label>
          <textarea 
            className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
            rows={4} 
            placeholder="ระบุห้องหรือจุดที่พบปัญหา..."
          ></textarea>
        </div>
        <button 
          type="button" 
          className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 transition-colors"
        >
          ส่งเรื่องแจ้งซ่อม
        </button>
      </form>
    </div>
  );
}
