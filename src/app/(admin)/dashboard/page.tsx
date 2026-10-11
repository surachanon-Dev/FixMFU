'use client';

import React, { useState } from 'react';

// 1. นิยามประเภทข้อมูล Task (เพิ่มฟิลด์ image_url)
export interface Task {
  id: string;
  title: string;
  desc: string;
  category: string;
  building: string;
  reporter_name: string;
  created_at: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  image_url?: string;
}

interface DashboardProps {
  tasks?: Task[];
}

// 2. ข้อมูลจำลองเริ่มต้นพร้อมรูปภาพตัวอย่าง
const defaultTasks: Task[] = [
  {
    id: 'REQ-001',
    title: 'แอร์ห้องเรียน E4-301 ไม่เย็น',
    desc: 'เปิดมา 2 ชั่วโมงแล้วก็ยังไม่เย็นครับ มีเสียงดังแปลกๆ ออกมาจากเครื่อง',
    category: 'แอร์/ประปา',
    building: 'อาคาร E4',
    reporter_name: 'สมชาย ใจดี',
    created_at: '11 ต.ค. 2026',
    status: 'in_progress',
    image_url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=400&auto=format&fit=crop',
  },
  {
    id: 'REQ-002',
    title: 'หลอดไฟทางเดิน M-Square ขาด',
    desc: 'หลอดไฟตรงทางเดินชั้น 2 ฝั่งห้องน้ำชายขาดไป 2 ดวง มืดมากตอนเย็น',
    category: 'ไฟฟ้า',
    building: 'M-Square',
    reporter_name: 'สมหญิง รักเรียน',
    created_at: '10 ต.ค. 2026',
    status: 'pending',
    image_url: 'https://images.unsplash.com/photo-1550985616-10810253b84d?q=80&w=400&auto=format&fit=crop',
  },
  {
    id: 'REQ-003',
    title: 'ท่อน้ำซึมห้องน้ำชั้น 2',
    desc: 'เปลี่ยนซีลยางและซ่อมจุดรั่วซึมใต้ซิงค์ล้างมือเรียบร้อยแล้ว',
    category: 'แอร์/ประปา',
    building: 'หอพัก F1',
    reporter_name: 'กิตติพงษ์',
    created_at: '08 ต.ค. 2026',
    status: 'completed',
    image_url: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?q=80&w=400&auto=format&fit=crop',
  },
  {
    id: 'REQ-004',
    title: 'Wi-Fi หอพัก F1 สัญญาณสวิง',
    desc: 'เชื่อมต่อได้แต่เล่นเน็ตไม่ได้ตั้งแต่ช่วงหัวค่ำ',
    category: 'อินเทอร์เน็ต',
    building: 'หอพัก F1',
    reporter_name: 'อนันต์',
    created_at: '07 ต.ค. 2026',
    status: 'pending',
  },
];

export default function DashboardPage({ tasks = defaultTasks }: DashboardProps) {
  // State สำหรับพรีวิวรูปภาพขนาดใหญ่ (Modal)
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // คำนวณสถิติต่างๆ
  const totalCount = tasks.length;
  const pendingCount = tasks.filter((t) => t.status === 'pending').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Helper สำหรับป้ายสถานะ
  const getStatusBadge = (status: Task['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            รอรับเรื่อง
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
            กำลังดำเนินการ
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            เสร็จสิ้น
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
            ยกเลิก
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 text-white p-8 rounded-3xl shadow-lg border border-orange-200">
        <div className="max-w-2xl">
          <span className="bg-orange-700/50 text-orange-100 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">
            Admin Management System
          </span>
          <h1 className="text-3xl font-extrabold mt-3 tracking-tight">
            ระบบจัดการปัญหาอาคารสถานที่ (FixMFU)
          </h1>
          <p className="text-orange-100 text-sm mt-2 leading-relaxed">
            ภาพรวมสถิติการแจ้งซ่อม และสถานะการดำเนินงานของทีมช่างบำรุงรักษา
          </p>
        </div>
      </div>

      {/* 2. Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 hover:shadow-md transition-shadow">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">เรื่องแจ้งทั้งหมด</p>
          <h3 className="text-3xl font-black text-gray-800 mt-2">{totalCount}</h3>
          <div className="mt-4 pt-3 border-t border-gray-50 text-xs text-gray-500">
            รายการรับเรื่องในระบบ
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 hover:shadow-md transition-shadow">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">รอรับเรื่อง</p>
          <h3 className="text-3xl font-black text-amber-600 mt-2">{pendingCount}</h3>
          <div className="mt-4 pt-3 border-t border-gray-50 text-xs text-amber-700">
            รอดำเนินการจัดสรรช่าง
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 hover:shadow-md transition-shadow">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">กำลังดำเนินการ</p>
          <h3 className="text-3xl font-black text-blue-600 mt-2">{inProgressCount}</h3>
          <div className="mt-4 pt-3 border-t border-gray-50 text-xs text-blue-700">
            ช่างกำลังเข้าตรวจสอบ/ซ่อมแซม
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 hover:shadow-md transition-shadow">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">เสร็จสิ้นแล้ว</p>
          <h3 className="text-3xl font-black text-emerald-600 mt-2">{completedCount}</h3>
          <div className="mt-4 pt-3 border-t border-gray-50 text-xs text-emerald-700 font-medium">
            อัตราความสำเร็จ {completionRate}%
          </div>
        </div>
      </div>

      {/* 3. Section: Analytics & Recent Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ฝั่งซ้าย: รายการแจ้งซ่อมล่าสุด พร้อมรูปภาพเหตุการณ์ */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-orange-100 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-orange-100">
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                รายการแจ้งซ่อมล่าสุด
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">รายการที่มีการอัปเดตหรือแจ้งเข้ามาล่าสุดในระบบ</p>
            </div>
            <a href="/kanban" className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline">
              ดูทั้งหมด →
            </a>
          </div>

          <div className="space-y-3">
            {tasks.slice(0, 4).map((task) => (
              <div
                key={task.id}
                className="p-4 rounded-2xl bg-[#FDFBF7] border border-orange-100/70 hover:border-orange-300 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                {/* ข้อมูลรายการ + รูปภาพ */}
                <div className="flex items-start gap-3.5">
                  {/* Thumbnail รูปภาพเหตุการณ์ */}
                  {task.image_url ? (
                    <div
                      onClick={() => setPreviewImage(task.image_url || null)}
                      className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 border border-orange-200/80 shrink-0 cursor-pointer hover:opacity-90 transition group relative"
                    >
                      <img
                        src={task.image_url}
                        alt={task.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                        ขยาย
                      </div>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-orange-100/60 border border-orange-200/50 shrink-0 flex flex-col items-center justify-center text-orange-400 text-[10px] font-medium text-center p-1">
                      <span>ไม่มีรูป</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-orange-600">{task.id}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-800 font-medium">
                        {task.building}
                      </span>
                      <span className="text-xs text-gray-400">• {task.category}</span>
                    </div>
                    <h4 className="font-bold text-gray-800 text-sm">{task.title}</h4>
                    <p className="text-xs text-gray-500 line-clamp-1">{task.desc}</p>
                    <p className="text-[11px] text-gray-400">ผู้แจ้ง: {task.reporter_name}</p>
                  </div>
                </div>

                {/* สถานะและวันที่ */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-orange-100/50">
                  {getStatusBadge(task.status)}
                  <span className="text-[11px] text-gray-400 font-mono">{task.created_at}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ฝั่งขวา: สรุปหมวดหมู่ปัญหา */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-orange-100 space-y-5">
          <div className="pb-3 border-b border-orange-100">
            <h2 className="text-lg font-bold text-gray-800">
              สัดส่วนประเภทปัญหา
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">แยกตามหมวดหมู่งานซ่อมบำรุง</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-gray-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                  แอร์ / ระบบประปา
                </span>
                <span className="text-gray-500">50% (2 เรื่อง)</span>
              </div>
              <div className="w-full bg-orange-50 h-2.5 rounded-full overflow-hidden">
                <div className="bg-orange-500 h-full rounded-full" style={{ width: '50%' }}></div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-gray-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  ระบบไฟฟ้า / หลอดไฟ
                </span>
                <span className="text-gray-500">25% (1 เรื่อง)</span>
              </div>
              <div className="w-full bg-amber-50 h-2.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: '25%' }}></div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-gray-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  อินเทอร์เน็ต / เครือข่าย
                </span>
                <span className="text-gray-500">25% (1 เรื่อง)</span>
              </div>
              <div className="w-full bg-blue-50 h-2.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: '25%' }}></div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-[#FDFBF7] border border-orange-200/80 text-xs text-orange-950 space-y-1">
            <p className="font-bold text-orange-800">
              ข้อแนะนำสำหรับช่าง
            </p>
            <p className="text-orange-900/80 leading-relaxed">
              อาคารที่มีการแจ้งปัญหาบ่อยที่สุดในสัปดาห์นี้คือ <strong className="text-orange-900">หอพัก F1</strong> และ <strong className="text-orange-900">อาคาร E4</strong>
            </p>
          </div>
        </div>
      </div>

      {/* 4. Modal พรีวิวรูปภาพขนาดใหญ่ */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[90vh] bg-white p-2 rounded-2xl shadow-2xl overflow-hidden">
            <img
              src={previewImage}
              alt="รูปภาพเหตุการณ์"
              className="max-w-full max-h-[80vh] rounded-xl object-contain"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 bg-black/60 hover:bg-black text-white px-3 py-1 rounded-full text-xs font-bold transition"
            >
              ปิด (Esc)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}