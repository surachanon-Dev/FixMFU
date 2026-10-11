import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FixMFU - ระบบแจ้งปัญหาอาคารสถานที่",
  description: "ระบบแจ้งซ่อมและรายงานปัญหาอาคารสถานที่ สำหรับมหาวิทยาลัยแม่ฟ้าหลวง",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="bg-gray-100 text-gray-900 antialiased min-h-screen flex flex-col">
        {/* แถบนำทางด้านบน (Navbar) */}
        <nav className="bg-blue-900 text-white shadow-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              
              {/* เมนูฝั่งซ้าย (User) */}
              <div className="flex items-center gap-6">
                <Link href="/" className="text-xl font-bold tracking-wide flex items-center gap-2">
                  <span>🛠️</span> FixMFU
                </Link>
                <div className="hidden md:flex space-x-2">
                  <Link href="/" className="hover:bg-blue-800 px-3 py-2 rounded-md text-sm font-medium transition-colors">ประวัติแจ้งซ่อม</Link>
                  <Link href="/report" className="hover:bg-blue-800 px-3 py-2 rounded-md text-sm font-medium transition-colors">แจ้งปัญหาใหม่</Link>
                </div>
              </div>

              {/* เมนูฝั่งขวา (Admin) */}
              <div className="flex items-center gap-4">
                <div className="hidden md:flex space-x-2 border-l border-blue-700 pl-4">
                  <span className="text-blue-300 px-3 py-2 text-sm font-bold">Admin:</span>
                  <Link href="/dashboard" className="text-blue-100 hover:bg-blue-800 px-3 py-2 rounded-md text-sm font-medium transition-colors">สถิติ</Link>
                  <Link href="/kanban" className="text-blue-100 hover:bg-blue-800 px-3 py-2 rounded-md text-sm font-medium transition-colors">กระดานช่าง</Link>
                  <Link href="/settings" className="text-blue-100 hover:bg-blue-800 px-3 py-2 rounded-md text-sm font-medium transition-colors">ตั้งค่า</Link>
                </div>
              </div>

            </div>
          </div>
        </nav>

        {/* พื้นที่แสดงเนื้อหาของแต่ละหน้า */}
        <main className="flex-1 w-full max-w-7xl mx-auto">
          {children}
        </main>
      </body>
    </html>
  );
}