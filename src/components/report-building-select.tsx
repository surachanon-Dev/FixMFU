"use client";

import { useState } from "react";
import GlideSelect from "./glide-select";
import type { GlideSelectOption } from "./glide-select";

export function ReportBuildingSelect({ options, value, onChange, invalid, describedBy }: { options: readonly GlideSelectOption[]; value?: string; onChange?: (value: string) => void; invalid?: boolean; describedBy?: string }) {
  const [building, setBuilding] = useState("");
  return <GlideSelect id="report-building" name="building" ariaLabel="อาคารที่พบปัญหา" placeholder="เลือกอาคารที่พบปัญหา" options={options} value={value ?? building} onChange={next => { setBuilding(next); onChange?.(next); }} required invalid={invalid} describedBy={describedBy} />;
}
