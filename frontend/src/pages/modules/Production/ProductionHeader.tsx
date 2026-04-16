import React from 'react';
import { FiPlus, FiTool } from 'react-icons/fi';
import { getLocalDateString } from '../../../utils/date.helper';

interface ProductionHeaderProps {
  setEditingId: (id: number | null) => void;
  setFormData: (data: any) => void;
  setIsModalOpen: (isOpen: boolean) => void;
}

export const ProductionHeader: React.FC<ProductionHeaderProps> = ({
  setEditingId, setFormData, setIsModalOpen
}) => {
  return (
    <div className="flex justify-between items-end">
      <div>
        <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-3.5 py-1.5 rounded-xl text-xs font-black mb-4 uppercase tracking-tight">
          <FiTool /> ÜRETİM & PLANLAMA MERKEZİ
        </div>
        <h1 className="text-3xl font-black tracking-tighter text-slate-800">
          Üretim <span className="text-primary italic">Emirleri</span>
        </h1>
      </div>
      
      <button 
        className="btn btn-primary h-11 px-6 shadow-lg shadow-primary/20 flex items-center gap-2 font-bold" 
        onClick={() => {
          setEditingId(null); 
          setFormData({ 
            bomId: '', 
            plannedQuantity: 0, 
            startDate: getLocalDateString(), 
            endDate: '', 
            notes: '', 
            status: 'draft', 
            producedQuantity: 0, 
            wastageQuantity: 0, 
            sourceDepartmentId:'', 
            targetDepartmentId:'' 
          }); 
          setIsModalOpen(true);
        }}
      >
        <FiPlus size={18} /> Yeni İş Emri
      </button>
    </div>
  );
};
