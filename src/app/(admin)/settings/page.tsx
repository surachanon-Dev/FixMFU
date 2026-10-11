'use client';

import React, { useState } from 'react';

export default function SettingsPage() {
  const [buildings, setBuildings] = useState<string[]>([
    'อาคาร E4',
    'M-Square',
    'หอพัก F1',
    'อาคาร C1',
  ]);

  const [categories, setCategories] = useState<string[]>([
    'แอร์/ระบบประปา',
    'ระบบไฟฟ้า/หลอดไฟ',
    'อินเทอร์เน็ต/เครือข่าย',
    'ครุภัณฑ์/เฟอร์นิเจอร์',
  ]);

  // Modal State
  const [isBuildingModalOpen, setIsBuildingModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  // ฟังก์ชันเพิ่มอาคาร
  const handleAddBuilding = () => {
    if (!newItemName.trim()) return;
    setBuildings([...buildings, newItemName.trim()]);
    setNewItemName('');
    setIsBuildingModalOpen(false);
  };

  // ฟังก์ชันเพิ่มหมวดหมู่
  const handleAddCategory = () => {
    if (!newItemName.trim()) return;
    setCategories([...categories, newItemName.trim()]);
    setNewItemName('');
    setIsCategoryModalOpen(false);
  };

  // ฟังก์ชันลบ
  const handleDeleteBuilding = (idx: number) => {
    if (confirm('คุณต้องการลบรายชื่ออาคารนี้ใช่หรือไม่?')) {
      setBuildings(buildings.filter((_, i) => i !== idx));
    }
  };

  const handleDeleteCategory = (idx: number) => {
    if (confirm('คุณต้องการลบหมวดหมู่นี้ใช่หรือไม่?')) {
      setCategories(categories.filter((_, i) => i !== idx));
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-orange-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">ตั้งค่าระบบ (Settings)</h1>
          <p className="text-gray-500 text-sm mt-1">
            จัดการข้อมูล Master Data สำหรับรายชื่ออาคารและประเภทปัญหาในการแจ้งซ่อม
          </p>
        </div>
        <div className="px-3.5 py-1.5 bg-[#FDFBF7] border border-orange-200/80 rounded-2xl text-xs font-semibold text-orange-700 shrink-0">
          ระบบจัดการข้อมูลหลัก
        </div>
      </div>

      {/* Grid Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Card 1: จัดการอาคาร */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-orange-100 flex flex-col space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-orange-100">
            <div>
              <h2 className="text-lg font-bold text-gray-800">จัดการอาคาร</h2>
              <p className="text-xs text-gray-400 mt-0.5">รายชื่ออาคารและสถานที่ภายในมหาวิทยาลัย</p>
            </div>
            <button
              onClick={() => {
                setNewItemName('');
                setIsBuildingModalOpen(true);
              }}
              className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              + เพิ่มอาคาร
            </button>
          </div>

          <div className="space-y-2.5 flex-1">
            {buildings.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400 border-2 border-dashed border-orange-100 rounded-2xl">
                ไม่มีรายการอาคารในระบบ
              </div>
            ) : (
              buildings.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-[#FDFBF7] border border-orange-100/80 hover:border-orange-200 transition-colors flex justify-between items-center group"
                >
                  <span className="text-sm font-semibold text-gray-700">{item}</span>
                  <button
                    onClick={() => handleDeleteBuilding(idx)}
                    className="text-xs text-red-500 font-semibold opacity-80 hover:opacity-100 hover:underline px-2 py-1 rounded-lg hover:bg-red-50 transition"
                  >
                    ลบ
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Card 2: จัดการหมวดหมู่ปัญหา */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-orange-100 flex flex-col space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-orange-100">
            <div>
              <h2 className="text-lg font-bold text-gray-800">หมวดหมู่ปัญหา</h2>
              <p className="text-xs text-gray-400 mt-0.5">ประเภทการแจ้งซ่อมและงานบำรุงรักษา</p>
            </div>
            <button
              onClick={() => {
                setNewItemName('');
                setIsCategoryModalOpen(true);
              }}
              className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              + เพิ่มหมวดหมู่
            </button>
          </div>

          <div className="space-y-2.5 flex-1">
            {categories.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400 border-2 border-dashed border-orange-100 rounded-2xl">
                ไม่มีรายการหมวดหมู่ในระบบ
              </div>
            ) : (
              categories.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-[#FDFBF7] border border-orange-100/80 hover:border-orange-200 transition-colors flex justify-between items-center group"
                >
                  <span className="text-sm font-semibold text-gray-700">{item}</span>
                  <button
                    onClick={() => handleDeleteCategory(idx)}
                    className="text-xs text-red-500 font-semibold opacity-80 hover:opacity-100 hover:underline px-2 py-1 rounded-lg hover:bg-red-50 transition"
                  >
                    ลบ
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal เพิ่มอาคาร */}
      {isBuildingModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl p-6 border border-orange-100 space-y-4">
            <h3 className="text-lg font-bold text-gray-800">เพิ่มรายชื่ออาคารใหม่</h3>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500">ชื่ออาคาร / สถานที่</label>
              <input
                type="text"
                autoFocus
                placeholder="เช่น อาคาร C2, หอพัก F2"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="w-full p-3 rounded-2xl border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-[#FDFBF7]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsBuildingModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleAddBuilding}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-md transition"
              >
                บันทึกข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal เพิ่มหมวดหมู่ */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl p-6 border border-orange-100 space-y-4">
            <h3 className="text-lg font-bold text-gray-800">เพิ่มหมวดหมู่ปัญหาใหม่</h3>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500">ชื่อหมวดหมู่ปัญหา</label>
              <input
                type="text"
                autoFocus
                placeholder="เช่น ระบบลิฟต์, ภูมิทัศน์/สวน"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="w-full p-3 rounded-2xl border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-[#FDFBF7]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleAddCategory}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-md transition"
              >
                บันทึกข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}