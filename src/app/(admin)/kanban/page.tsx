'use client';

import React, { useState } from 'react';

// 1. นิยามโครงสร้างข้อมูล Task
export interface Task {
  id: string;
  title: string;
  desc: string;
  category: string;
  building: string;
  reporter_name: string;
  reporter_role: string;
  created_at: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  image_url?: string;
  note?: string;
  timeline?: { status: string; date: string; by: string }[];
}

interface KanbanProps {
  tasks?: Task[];
  onTaskClick?: (task: Task) => void;
}

// 2. ข้อมูลจำลองเริ่มต้น
const defaultTasks: Task[] = [
  {
    id: 'REQ-001',
    title: 'แอร์ห้องเรียน E4-301 ไม่เย็น',
    desc: 'เปิดมา 2 ชั่วโมงแล้วก็ยังไม่เย็นครับ รบกวนช่างเข้ามาดูให้หน่อย',
    category: 'แอร์/ประปา',
    building: 'อาคาร E4',
    reporter_name: 'สมชาย ใจดี',
    reporter_role: 'นักศึกษา',
    created_at: '11 ต.ค. 2026',
    status: 'in_progress',
    image_url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=400&auto=format&fit=crop',
    note: 'ประสานงานช่างแอร์แล้ว กำลังรออะไหล่ชั่วคราว',
    timeline: [
      { status: 'ส่งเรื่องแจ้งซ่อม', date: '11 ต.ค. 10:00 น.', by: 'สมชาย ใจดี' },
      { status: 'รับเรื่อง / กำลังดำเนินการ', date: '11 ต.ค. 11:30 น.', by: 'Admin กิตติ' },
    ],
  },
  {
    id: 'REQ-002',
    title: 'หลอดไฟทางเดิน M-Square ขาด',
    desc: 'หลอดไฟตรงทางเดินชั้น 2 ฝั่งห้องน้ำชายขาดไป 2 ดวง มืดมากตอนเย็น',
    category: 'ไฟฟ้า',
    building: 'M-Square',
    reporter_name: 'สมหญิง รักเรียน',
    reporter_role: 'อาจารย์',
    created_at: '10 ต.ค. 2026',
    status: 'pending',
    image_url: 'https://images.unsplash.com/photo-1550985616-10810253b84d?q=80&w=400&auto=format&fit=crop',
    timeline: [
      { status: 'ส่งเรื่องแจ้งซ่อม', date: '10 ต.ค. 16:45 น.', by: 'สมหญิง รักเรียน' },
    ],
  },
  {
    id: 'REQ-003',
    title: 'ท่อน้ำซึมห้องน้ำชั้น 2',
    desc: 'เปลี่ยนซีลยางและซ่อมจุดรั่วซึมเรียบร้อยแล้ว',
    category: 'แอร์/ประปา',
    building: 'หอพัก F1',
    reporter_name: 'กิตติพงษ์',
    reporter_role: 'เจ้าหน้าที่',
    created_at: '08 ต.ค. 2026',
    status: 'completed',
    image_url: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?q=80&w=400&auto=format&fit=crop',
    note: 'ดำเนินการเปลี่ยนซีลยางให้เรียบร้อยแล้ว',
    timeline: [
      { status: 'ส่งเรื่องแจ้งซ่อม', date: '08 ต.ค. 09:00 น.', by: 'กิตติพงษ์' },
      { status: 'กำลังดำเนินการ', date: '08 ต.ค. 10:15 น.', by: 'ช่างสมศักดิ์' },
      { status: 'เสร็จสิ้น', date: '08 ต.ค. 14:00 น.', by: 'ช่างสมศักดิ์' },
    ],
  },
];

export default function KanbanPage({ tasks = defaultTasks }: KanbanProps) {
  const [taskList, setTaskList] = useState<Task[]>(tasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Form State ใน Modal
  const [modalStatus, setModalStatus] = useState<Task['status']>('pending');
  const [modalNote, setModalNote] = useState('');

  // คอลัมน์สถานะ Kanban
  const columns: { id: Task['status']; title: string; color: string; countBg: string; borderTop: string }[] = [
    { id: 'pending', title: 'รอดำเนินการ', color: 'bg-amber-500', countBg: 'bg-amber-100 text-amber-800', borderTop: 'border-t-amber-500' },
    { id: 'in_progress', title: 'กำลังดำเนินการ', color: 'bg-blue-500', countBg: 'bg-blue-100 text-blue-800', borderTop: 'border-t-blue-500' },
    { id: 'completed', title: 'เสร็จสิ้น', color: 'bg-emerald-500', countBg: 'bg-emerald-100 text-emerald-800', borderTop: 'border-t-emerald-500' },
  ];

  // เปิด Modal รายละเอียด
  const handleOpenDetail = (task: Task) => {
    setSelectedTask(task);
    setModalStatus(task.status);
    setModalNote(task.note || '');
  };

  // บันทึกการอัปเดตข้อมูลจาก Modal
  const handleSaveDetail = () => {
    if (!selectedTask) return;

    setTaskList((prev) =>
      prev.map((item) => {
        if (item.id === selectedTask.id) {
          const newTimeline = [...(item.timeline || [])];
          if (item.status !== modalStatus) {
            newTimeline.push({
              status: `เปลี่ยนสถานะเป็น ${getStatusLabel(modalStatus)}`,
              date: 'เมื่อสักครู่',
              by: 'Admin',
            });
          }
          return {
            ...item,
            status: modalStatus,
            note: modalNote,
            timeline: newTimeline,
          };
        }
        return item;
      })
    );
    setSelectedTask(null);
  };

  const getStatusLabel = (status: Task['status']) => {
    switch (status) {
      case 'pending': return 'รอดำเนินการ';
      case 'in_progress': return 'กำลังดำเนินการ';
      case 'completed': return 'เสร็จสิ้น';
      case 'cancelled': return 'ยกเลิก';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-orange-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">กระดานจัดการงานซ่อม (Kanban)</h1>
          <p className="text-gray-500 text-sm mt-1">
            การ์ดรายการตั๋วแจ้งซ่อมแยกระดับสถานะ คลิกที่การ์ดเพื่อดูและอัปเดตรายละเอียด
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#FDFBF7] px-4 py-2 rounded-2xl border border-orange-200/60 shrink-0">
          <span className="text-xs text-gray-500 font-medium">รวมทั้งหมด:</span>
          <span className="text-sm font-bold text-orange-600">{taskList.length} รายการ</span>
        </div>
      </div>

      {/* 2. Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((col) => {
          const colTasks = taskList.filter((t) => t.status === col.id);
          return (
            <div
              key={col.id}
              className={`bg-[#FDFBF7] p-4 rounded-3xl border border-orange-100 border-t-4 ${col.borderTop} min-h-[550px] flex flex-col shadow-sm`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-orange-100/80">
                <div className="flex items-center space-x-2">
                  <span className={`w-3 h-3 rounded-full ${col.color}`}></span>
                  <h3 className="font-bold text-gray-800">{col.title}</h3>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${col.countBg}`}>
                  {colTasks.length}
                </span>
              </div>

              {/* Task Cards List */}
              <div className="space-y-3 flex-1">
                {colTasks.length === 0 ? (
                  <div className="h-32 border-2 border-dashed border-orange-200/50 rounded-2xl flex items-center justify-center text-xs text-gray-400 font-medium">
                    ไม่มีรายการในสถานะนี้
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleOpenDetail(task)}
                      className="bg-white p-4 rounded-2xl shadow-sm border border-orange-100 hover:shadow-md hover:border-orange-300 transition-all cursor-pointer group space-y-3"
                    >
                      {/* Top Info */}
                      <div className="flex justify-between items-start text-xs">
                        <span className="font-mono font-bold text-orange-600">{task.id}</span>
                        <span className="text-gray-400 font-mono text-[11px]">{task.created_at}</span>
                      </div>

                      {/* Content + Thumbnail */}
                      <div className="flex gap-3">
                        {task.image_url && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImage(task.image_url || null);
                            }}
                            className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 border border-orange-100 shrink-0 relative group/img"
                          >
                            <img
                              src={task.image_url}
                              alt={task.title}
                              className="w-full h-full object-cover group-hover/img:scale-105 transition-transform"
                            />
                          </div>
                        )}
                        <div className="space-y-1 flex-1">
                          <h4 className="font-bold text-gray-800 text-sm group-hover:text-orange-600 transition-colors">
                            {task.title}
                          </h4>
                          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                            {task.desc}
                          </p>
                        </div>
                      </div>

                      {/* Footer Info */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-50 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-orange-100/70 text-orange-800 text-[11px] rounded-lg font-medium">
                            {task.building}
                          </span>
                          <span className="text-gray-400 text-[11px]">• {task.category}</span>
                        </div>
                        <button className="text-orange-600 font-semibold text-xs hover:underline">
                          รายละเอียด
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Modal รายละเอียดเรื่องแจ้งซ่อม (สำหรับ Admin) */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-2xl w-full rounded-3xl shadow-2xl overflow-hidden border border-orange-100 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-orange-500 to-amber-500 text-white flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-orange-100 mb-1">
                  <span>{selectedTask.id}</span>
                  <span>•</span>
                  <span>{selectedTask.created_at}</span>
                </div>
                <h3 className="text-xl font-bold">{selectedTask.title}</h3>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm text-gray-700">
              {/* รายละเอียด + รูปภาพ */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-3">
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase">รายละเอียดปัญหา</span>
                    <p className="mt-1 font-medium text-gray-800 leading-relaxed bg-[#FDFBF7] p-3 rounded-2xl border border-orange-100">
                      {selectedTask.desc}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    <div>
                      <span className="font-semibold text-gray-700">สถานที่:</span> {selectedTask.building}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">หมวดหมู่:</span> {selectedTask.category}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">ผู้แจ้ง:</span> {selectedTask.reporter_name} ({selectedTask.reporter_role})
                    </div>
                  </div>
                </div>

                {/* รูปภาพประกอบ */}
                {selectedTask.image_url && (
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-gray-400 uppercase">รูปภาพแนบ</span>
                    <div
                      onClick={() => setPreviewImage(selectedTask.image_url || null)}
                      className="w-full h-32 rounded-2xl overflow-hidden border border-orange-200 cursor-pointer hover:opacity-90 transition relative group"
                    >
                      <img
                        src={selectedTask.image_url}
                        alt="ภาพประกอบ"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold">
                        ขยายรูปภาพ
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* การอัปเดตสถานะ */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <label className="block font-bold text-gray-800">อัปเดตสถานะงานซ่อม</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['pending', 'in_progress', 'completed', 'cancelled'] as Task['status'][]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setModalStatus(st)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                        modalStatus === st
                          ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-orange-50'
                      }`}
                    >
                      {getStatusLabel(st)}
                    </button>
                  ))}
                </div>
              </div>

              {/* ใส่หมายเหตุส่งให้นักศึกษา/ผู้แจ้ง */}
              <div className="space-y-2">
                <label className="block font-bold text-gray-800">
                  หมายเหตุแจ้งผู้แจ้ง (เช่น "ประสานงานช่างแล้ว อยู่ระหว่างรออะไหล่")
                </label>
                <textarea
                  rows={2}
                  value={modalNote}
                  onChange={(e) => setModalNote(e.target.value)}
                  placeholder="พิมพ์ข้อความถึงผู้แจ้ง..."
                  className="w-full p-3 rounded-2xl border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-[#FDFBF7]"
                />
              </div>

              {/* ประวัติการเปลี่ยนสถานะ (Timeline) */}
              {selectedTask.timeline && selectedTask.timeline.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <span className="text-xs font-bold text-gray-400 uppercase">ประวัติการดำเนินการ</span>
                  <div className="space-y-2 pl-2">
                    {selectedTask.timeline.map((item, idx) => (
                      <div key={idx} className="flex items-center text-xs space-x-3 text-gray-600">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        <span className="font-semibold text-gray-800">{item.status}</span>
                        <span className="text-gray-400">• {item.date}</span>
                        <span className="text-gray-400">({item.by})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-200 transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveDetail}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-md transition"
              >
                บันทึกการเปลี่ยนแปลง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal พรีวิวรูปภาพใหญ่ */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[90vh] bg-white p-2 rounded-2xl shadow-2xl overflow-hidden">
            <img
              src={previewImage}
              alt="รูปภาพพรีวิว"
              className="max-w-full max-h-[80vh] rounded-xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}