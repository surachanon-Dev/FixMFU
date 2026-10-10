import React from 'react';

export default function AdminDashboard() {
  const mockTickets = [
    { id: 'FIX-001', location: 'อาคาร E4', category: 'แอร์/ประปา', status: 'รอรับเรื่อง' },
    { id: 'FIX-002', location: 'M-Square', category: 'ไฟฟ้า', status: 'กำลังดำเนินการ' },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">ระบบจัดการแจ้งซ่อม (Admin)</h1>
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="p-4 font-semibold text-gray-600">Ticket ID</th>
              <th className="p-4 font-semibold text-gray-600">สถานที่</th>
              <th className="p-4 font-semibold text-gray-600">หมวดหมู่</th>
              <th className="p-4 font-semibold text-gray-600">สถานะ</th>
              <th className="p-4 font-semibold text-gray-600">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {mockTickets.map((ticket) => (
              <tr key={ticket.id} className="border-b hover:bg-gray-50">
                <td className="p-4 text-gray-800">{ticket.id}</td>
                <td className="p-4 text-gray-800">{ticket.location}</td>
                <td className="p-4 text-gray-800">{ticket.category}</td>
                <td className="p-4">
                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-yellow-200 text-yellow-800">
                    {ticket.status}
                  </span>
                </td>
                <td className="p-4">
                  <button className="text-blue-600 hover:underline font-medium">อัปเดต</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}