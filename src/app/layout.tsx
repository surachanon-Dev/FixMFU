import type { Metadata } from "next";
import "./globals.css";

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
      <body className="bg-background text-ink antialiased min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
