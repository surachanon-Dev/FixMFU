import Link from 'next/link';

// ข้อมูลจำลอง (Mock Data) สำหรับแสดงผลก่อนต่อ Database จริง
const mockTickets = [
  { 
    id: 'REQ-001', 
    title: 'แอร์ห้องเรียน E4-301 ไม่เย็น', 
    status: 'กำลังดำเนินการ', 
    date: '11 ต.ค. 2026', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200' 
  },
  { 
    id: 'REQ-002', 
    title: 'หลอดไฟทางเดิน M-Square ขาด', 
    status: 'รอดำเนินการ', 
    date: '10 ต.ค. 2026', 
    color: 'bg-red-100 text-red-800 border-red-200' 
  },
  { 
    id: 'REQ-003', 
    title: 'ท่อน้ำซึมในห้องน้ำชั้น 2 หอ F1', 
    status: 'เสร็จสิ้น', 
    date: '08 ต.ค. 2026', 
    color: 'bg-green-100 text-green-800 border-green-200' 
  },
];

export default function UserHomePage() {
  return (
    <div className="max-w-4xl mx-auto p-6 mt-8">
      {/* ส่วนหัวและปุ่มแจ้งปัญหา */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ประวัติการแจ้งซ่อม</h1>
          <p className="text-gray-500 mt-1">ติดตามสถานะปัญหาอาคารสถานที่ที่คุณได้แจ้งไว้</p>
        </div>
        <Link 
          href="/report" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition-colors flex items-center gap-2"
        >
          <span>➕</span> แจ้งปัญหาใหม่
        </Link>
      </div>

      {/* รายการแจ้งซ่อม */}
      <div className="grid gap-4">
        {mockTickets.map((ticket) => (
          <div 
            key={ticket.id} 
            className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center hover:shadow-md transition-all"
          >
            <div className="mb-4 sm:mb-0">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-medium text-gray-500">{ticket.id}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${ticket.color}`}>
                  {ticket.status}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">{ticket.title}</h3>
            </div>
            
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
              <span className="text-sm text-gray-500">📅 {ticket.date}</span>
              <Link 
                href={`/ticket/${ticket.id}`} 
                className="text-blue-600 hover:text-blue-800 font-medium text-sm underline-offset-4 hover:underline"
              >
                ดูรายละเอียด &rarr;
              </Link>
            </div>
          </div>
        ))}
        
        {/* กรณีไม่มีข้อมูล */}
        {mockTickets.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">ยังไม่มีประวัติการแจ้งซ่อม</p>
          </div>
        )}
      </div>
    </div>
  );
}