"use client";

import { useState } from "react";
import GlideSelect from "./glide-select";
import type { GlideSelectOption } from "./glide-select";

export function ReportCategorySelect({ options, initialValue, value, onChange, invalid, describedBy }: { options: readonly GlideSelectOption[]; initialValue?: string; value?: string; onChange?: (value: string) => void; invalid?: boolean; describedBy?: string }) {
  const [category, setCategory] = useState(options.find(option => option.value === initialValue)?.value ?? "");
  return <GlideSelect id="report-category" name="category" ariaLabel="หมวดหมู่ปัญหา" options={options} value={value ?? category} onChange={next => { setCategory(next); onChange?.(next); }} required invalid={invalid} describedBy={describedBy} />;
}
