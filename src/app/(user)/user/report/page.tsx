import React from 'react';

export default function ReportIssuePage() {
  return (
    <div className="max-w-md mx-auto p-6 bg-surface rounded-lg shadow-md mt-10">
      <h1 className="text-2xl font-bold mb-4 text-ink">แจ้งปัญหาอาคารสถานที่</h1>
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">เลือกอาคาร</label>
          <select className="w-full border border-line rounded p-2 focus:outline-none focus:ring-2 focus:ring-primary">
            <option>อาคาร E4</option>
            <option>M-Square</option>
            <option>หอพัก F1</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">หมวดหมู่ปัญหา</label>
          <select className="w-full border border-line rounded p-2 focus:outline-none focus:ring-2 focus:ring-primary">
            <option>แอร์/ประปา</option>
            <option>ไฟฟ้า</option>
            <option>อินเทอร์เน็ต</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">รายละเอียด</label>
          <textarea 
            className="w-full border border-line rounded p-2 focus:outline-none focus:ring-2 focus:ring-primary"
            rows={4} 
            placeholder="ระบุห้องหรือจุดที่พบปัญหา..."
          ></textarea>
        </div>
        <button 
          type="button" 
          className="w-full bg-primary text-ink font-bold py-2 rounded hover:bg-primary-hover transition-colors"
        >
          ส่งเรื่องแจ้งซ่อม
        </button>
      </form>
    </div>
  );
}
