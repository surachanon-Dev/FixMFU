"use client";

import { useState } from "react";
import GlideSelect from "./glide-select";
import type { GlideSelectOption } from "./glide-select";

const CATEGORIES: readonly GlideSelectOption[] = [
  { value: "แอร์/ประปา", label: "แอร์/ประปา" },
  { value: "ไฟฟ้า", label: "ไฟฟ้า" },
  { value: "อินเทอร์เน็ต", label: "อินเทอร์เน็ต" },
];

export function ReportCategorySelect() {
  const [category, setCategory] = useState(CATEGORIES[0].value);
  return <GlideSelect id="report-category" name="category" ariaLabel="หมวดหมู่ปัญหา" options={CATEGORIES} value={category} onChange={setCategory} />;
}
