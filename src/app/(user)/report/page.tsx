// src/app/(user)/report/page.tsx
"use client";

import React, { useState, ChangeEvent, FormEvent } from 'react';

// 1. Interface ข้อมูลฟอร์ม
interface ReportFormData {
  category: string;
  building: string;
  floor: string;
  room: string;
  details: string;
  image: File | null;
}

// ตัวเลือกประเภทปัญหาพร้อมไอคอน
const CATEGORIES = [
  { id: 'แอร์/ประปา', label: 'แอร์ / ประปา', icon: '❄️' },
  { id: 'ไฟฟ้า', label: 'ระบบไฟฟ้า', icon: '⚡' },
  { id: 'อินเทอร์เน็ต', label: 'อินเทอร์เน็ต', icon: '🌐' },
  { id: 'โครงสร้างอาคาร', label: 'โครงสร้างอาคาร', icon: '🏢' },
  { id: 'อื่นๆ', label: 'อื่นๆ', icon: '🔧' },
];

export default function ReportPage() {
  const [formData, setFormData] = useState<ReportFormData>({
    category: 'แอร์/ประปา',
    building: 'อาคาร E4',
    floor: '',
    room: '',
    details: '',
    image: null,
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCategorySelect = (categoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      category: categoryId,
    }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, image: null }));
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Submitting issue to FixMFU:', formData);
    alert('ส่งเรื่องแจ้งซ่อมเรียบร้อยแล้ว!');

    setFormData({
      category: 'แอร์/ประปา',
      building: 'อาคาร E4',
      floor: '',
      room: '',
      details: '',
      image: null,
    });
    setPreviewUrl(null);
  };

  return (
    /* พื้นหลังเว็บ: ครีมอ่อน #F6F2E9 */
    <div className="min-h-screen bg-[#F6F2E9] py-8 px-4 sm:px-6 flex items-center justify-center">
      
      {/* การ์ดฟอร์มหลัก: ขาว #FFFFFF & ขอบ: เทาอ่อน #E4E7EC */}
      <div className="w-full max-w-xl bg-[#FFFFFF] rounded-2xl shadow-sm border border-[#E4E7EC] overflow-hidden">
        
        {/* Header ส่วนหัวฟอร์ม */}
        <div className="p-6 sm:p-8 border-b border-[#E4E7EC] bg-[#FFFFFF]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F6F2E9] text-[#171717] text-xs font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-[#F4A300]"></span>
            ระบบแจ้งซ่อมออนไลน์ FixMFU
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171717]">
            แจ้งปัญหาอาคารสถานที่
          </h1>
          <p className="text-sm text-[#667085] mt-1">
            กรอกข้อมูลรายละเอียดด้านล่าง เจ้าหน้าที่จะเร่งดำเนินการแก้ไขให้เร็วที่สุด
          </p>
        </div>

        {/* ฟอร์มกรอกข้อมูล */}
        <form className="p-6 sm:p-8 space-y-6" onSubmit={handleSubmit}>
          
          {/* 1. เลือกประเภทปัญหา (Visual Cards) */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-[#171717]">
              เลือกประเภทปัญหา <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {CATEGORIES.map((cat) => {
                const isSelected = formData.category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all ${
                      isSelected
                        ? 'border-[#F4A300] bg-[#F6F2E9] text-[#171717] ring-2 ring-[#F4A300]'
                        : 'border-[#E4E7EC] bg-[#FFFFFF] text-[#667085] hover:border-[#F4A300]/50 hover:bg-[#F6F2E9]/50'
                    }`}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. เลือกสถานที่ (อาคาร, ชั้น, ห้อง) */}
          <div className="space-y-4 pt-2">
            <div>
              <label htmlFor="building" className="block text-sm font-semibold mb-1.5 text-[#171717]">
                อาคารสถานที่ <span className="text-red-500">*</span>
              </label>
              <select
                id="building"
                name="building"
                value={formData.building}
                onChange={handleChange}
                className="w-full border border-[#E4E7EC] text-[#171717] bg-[#FFFFFF] rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F4A300] focus:border-[#F4A300] transition-all"
              >
                <option value="อาคาร E4">อาคาร E4 (กลุ่มอาคารเรียน)</option>
                <option value="M-Square">M-Square</option>
                <option value="หอพัก F1">หอพัก F1</option>
                <option value="อาคาร C1">อาคาร C1</option>
                <option value="อาคาร S1">อาคาร S1</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="floor" className="block text-sm font-semibold mb-1.5 text-[#171717]">
                  ชั้น
                </label>
                <input
                  type="text"
                  id="floor"
                  name="floor"
                  value={formData.floor}
                  onChange={handleChange}
                  placeholder="เช่น ชั้น 3"
                  className="w-full border border-[#E4E7EC] text-[#171717] placeholder-[#667085] bg-[#FFFFFF] rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F4A300] focus:border-[#F4A300] transition-all"
                />
              </div>
              <div>
                <label htmlFor="room" className="block text-sm font-semibold mb-1.5 text-[#171717]">
                  เลขห้อง / จุดสังเกต
                </label>
                <input
                  type="text"
                  id="room"
                  name="room"
                  value={formData.room}
                  onChange={handleChange}
                  placeholder="เช่น ห้อง 301 / หน้าโถง"
                  className="w-full border border-[#E4E7EC] text-[#171717] placeholder-[#667085] bg-[#FFFFFF] rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F4A300] focus:border-[#F4A300] transition-all"
                />
              </div>
            </div>
          </div>

          {/* 3. รายละเอียดปัญหา */}
          <div>
            <label htmlFor="details" className="block text-sm font-semibold mb-1.5 text-[#171717]">
              รายละเอียดปัญหา <span className="text-red-500">*</span>
            </label>
            <textarea
              id="details"
              name="details"
              value={formData.details}
              onChange={handleChange}
              required
              rows={3}
              placeholder="อธิบายอาการเสีย หรือจุดที่ต้องการให้ช่างเข้าซ่อมแซม..."
              className="w-full border border-[#E4E7EC] text-[#171717] placeholder-[#667085] bg-[#FFFFFF] rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F4A300] focus:border-[#F4A300] transition-all"
            ></textarea>
          </div>

          {/* 4. แนบรูปภาพ (Modern Drag and Drop Upload) */}
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-[#171717]">
              แนบรูปภาพประกอบ
            </label>

            {!previewUrl ? (
              <label
                htmlFor="image"
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#E4E7EC] rounded-xl bg-[#F6F2E9]/40 hover:bg-[#F6F2E9] hover:border-[#F4A300] cursor-pointer transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-[#FFFFFF] border border-[#E4E7EC] flex items-center justify-center text-xl mb-2 group-hover:scale-110 transition-transform">
                  📷
                </div>
                <p className="text-xs font-semibold text-[#171717]">
                  คลิกเพื่อเลือกรูปภาพ หรือลากไฟล์มาวางที่นี่
                </p>
                <p className="text-[11px] text-[#667085] mt-1">
                  รองรับไฟล์ PNG, JPG หรือ WEBP
                </p>
                <input
                  type="file"
                  id="image"
                  name="image"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative rounded-xl border border-[#E4E7EC] overflow-hidden bg-[#F6F2E9] p-2 flex items-center gap-3">
                <img
                  src={previewUrl}
                  alt="ตัวอย่างรูปภาพ"
                  className="w-20 h-20 object-cover rounded-lg border border-[#E4E7EC]"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#171717] truncate">
                    {formData.image?.name}
                  </p>
                  <p className="text-[11px] text-[#667085] mt-0.5">
                    {formData.image?.size ? (formData.image.size / 1024 / 1024).toFixed(2) + ' MB' : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-white border border-[#E4E7EC] rounded-lg hover:bg-red-50 transition-colors mr-2"
                >
                  ลบรูป
                </button>
              </div>
            )}
          </div>

          {/* 5. ปุ่มส่งเรื่อง (ส้มอำพัน #F4A300) */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-[#F4A300] text-white font-bold py-3 px-4 rounded-xl hover:brightness-95 active:scale-[0.99] transition-all shadow-sm flex items-center justify-center gap-2 text-base"
            >
              <span>ส่งเรื่องแจ้งซ่อม</span>
              <span className="text-lg">➔</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}