"use client";

import { useState } from "react";
import GlideSelect from "./glide-select";
import type { GlideSelectOption } from "./glide-select";

const BUILDINGS: readonly GlideSelectOption[] = [
  { value: "อาคาร E4", label: "อาคาร E4" },
  { value: "M-Square", label: "M-Square" },
  { value: "หอพัก F1", label: "หอพัก F1" },
];

export function ReportBuildingSelect() {
  const [building, setBuilding] = useState(BUILDINGS[0].value);
  return <GlideSelect id="report-building" name="building" ariaLabel="เลือกอาคาร" placeholder="เลือกอาคาร" options={BUILDINGS} value={building} onChange={setBuilding} />;
}
