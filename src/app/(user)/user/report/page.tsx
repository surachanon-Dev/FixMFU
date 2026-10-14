import { ReportCategorySelect } from '../../../../components/report-category-select';
import { ReportBuildingSelect } from '../../../../components/report-building-select';
import { ReportPhotoUpload } from '../../../../components/report-photo-upload';

export default function ReportIssuePage() {
  return (
    <div className="max-w-md mx-auto p-6 bg-surface rounded-lg shadow-md mt-10">
      <h1 className="text-2xl font-semibold mb-4 text-ink">แจ้งปัญหาอาคารสถานที่</h1>
      <form className="space-y-4">
        <div>
          <label htmlFor="report-building" className="block text-sm font-medium mb-1">เลือกอาคาร</label>
          <ReportBuildingSelect />
        </div>
        <div>
          <label htmlFor="report-category" className="block text-sm font-medium mb-1">หมวดหมู่ปัญหา</label>
          <ReportCategorySelect />
        </div>
        <div>
          <label htmlFor="report-details" className="block text-sm font-medium mb-1">รายละเอียด</label>
          <textarea 
            id="report-details"
            name="details"
            className="w-full border border-line rounded p-2 focus:outline-none focus:ring-2 focus:ring-primary"
            rows={4} 
            placeholder="ระบุห้องหรือจุดที่พบปัญหา..."
          ></textarea>
        </div>
        <ReportPhotoUpload />
        <button 
          type="button" 
          className="w-full bg-primary text-ink font-semibold py-2 rounded hover:bg-primary-hover transition-colors"
        >
          ส่งเรื่องแจ้งซ่อม
        </button>
      </form>
    </div>
  );
}
