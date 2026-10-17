import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const notoSansThai = localFont({
  src: "./fonts/NotoSansThai-Variable.ttf",
  variable: "--font-noto-sans-thai",
  weight: "100 900",
  style: "normal",
  display: "swap",
  fallback: ["Tahoma", "Arial", "sans-serif"],
});

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
      <body className={`${notoSansThai.variable} bg-background font-sans text-base text-ink leading-relaxed antialiased min-h-screen flex flex-col`}>
        {children}
      </body>
    </html>
  );
}
