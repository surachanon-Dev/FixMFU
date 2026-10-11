"use client";

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function TicketDetailPage() {
  const params = useParams();
  const ticketId = params.id;

  return (
    <div className="max-w-3xl mx-auto p-6 mt-8">
      {/* ลิงก์กลับหน้าแรก */}
      <Link 
        href="/" 
        className="text-blue-600 hover:text-blue-800 font-medium hover:underline mb-6 inline-block"
      >
        &larr; กลับไปหน้าประวัติการแจ้งซ่อม
      </Link>
      
      {/* กล่องรายละเอียด */}
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-200">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-6 mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">รายละเอียดใบแจ้งซ่อม</h1>
            <p className="text-gray-500 font-mono">รหัสอ้างอิง: {ticketId}</p>
          </div>
          <span className="bg-yellow-100 text-yellow-800 border border-yellow-200 px-4 py-1.5 rounded-full font-semibold text-sm">
            กำลังดำเนินการ
          </span>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-1">อาคาร/สถานที่</h3>
              <p className="text-lg text-gray-800 font-medium">อาคาร E4 - ห้อง E4-301</p>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-1">หมวดหมู่ปัญหา</h3>
              <p className="text-lg text-gray-800 font-medium">แอร์/ประปา</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-2">รายละเอียดเพิ่มเติม</h3>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <p className="text-gray-700 leading-relaxed">
                แอร์มีแต่ลมร้อนออกมา เปิดมา 2 ชั่วโมงแล้วก็ยังไม่เย็นครับ รบกวนช่างเข้ามาดูให้หน่อยครับ ช่วงบ่ายมีเรียนต่อครับ
              </p>
            </div>
          </div>

          {/* ส่วนแสดงไทม์ไลน์ (Timeline) */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-5">สถานะการดำเนินงาน</h3>
            <ul className="space-y-5">
              <li className="flex gap-4">
                <div className="w-8 h-8 shrink-0 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div>
                  <p className="font-semibold text-gray-800">รับเรื่องแจ้งซ่อมเข้าสู่ระบบ</p>
                  <p className="text-sm text-gray-500 mt-0.5">11 ต.ค. 2026 - 10:30 น.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-8 h-8 shrink-0 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center font-bold text-sm border border-yellow-200">
                  2
                </div>
                <div>
                  <p className="font-semibold text-gray-800">กำลังดำเนินการ</p>
                  <p className="text-sm text-gray-600 mt-0.5">ช่างกำลังเบิกกุญแจและเดินทางไปตรวจสอบที่ห้องครับ</p>
                  <p className="text-xs text-gray-500 mt-1">11 ต.ค. 2026 - 13:45 น.</p>
                </div>
              </li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}