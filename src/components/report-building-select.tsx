"use client";

import { useState } from "react";
import GlideSelect from "./glide-select";
import type { GlideSelectOption } from "./glide-select";

export function ReportBuildingSelect({ options }: { options: readonly GlideSelectOption[] }) {
  const [building, setBuilding] = useState(options[0]?.value ?? "");
  return <GlideSelect id="report-building" name="building" ariaLabel="เลือกอาคาร" placeholder="เลือกอาคาร" options={options} value={building} onChange={setBuilding} />;
}
