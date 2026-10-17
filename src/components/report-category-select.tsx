"use client";

import { useState } from "react";
import GlideSelect from "./glide-select";
import type { GlideSelectOption } from "./glide-select";

export function ReportCategorySelect({ options }: { options: readonly GlideSelectOption[] }) {
  const [category, setCategory] = useState(options[0]?.value ?? "");
  return <GlideSelect id="report-category" name="category" ariaLabel="หมวดหมู่ปัญหา" options={options} value={category} onChange={setCategory} />;
}
