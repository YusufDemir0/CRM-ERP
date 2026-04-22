import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { partiesAPI } from '../../services/api';
import { Party } from '../../types';
import { DataTable } from '../common/DataTable';
import { getPartiesColumns } from '../../pages/modules/Parties/PartiesColumns';
import { FiUsers } from 'react-icons/fi';

import { useNavigate } from 'react-router-dom';
import { useSalesWizardStore } from '../../store/useSalesWizardStore';

interface DepartmentPartiesListProps {
  departmentId: number;
}

export const DepartmentPartiesList: React.FC<DepartmentPartiesListProps> = ({ departmentId }) => {
  const navigate = useNavigate();
  const { data: partiesData, isLoading } = useQuery({
    queryKey: ['parties', { departmentId }],
    queryFn: async () => {
      const res = await partiesAPI.getAll({ departmentId });
      return res.data;
    }
  });

  const parties = partiesData?.data || [];

  const handleQuickSale = (partyId: number) => {
    const party = parties.find(p => p.id === partyId);
    if (party) {
      const salesStore = useSalesWizardStore.getState();
      salesStore.startQuickSale(party);
      navigate('/sales/wizard');
    }
  };

  const columns = useMemo(() => getPartiesColumns(handleQuickSale), [parties]);

  return (
    <div className="space-y-6 animate-in">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">İLGİLİ CARİLER</h3>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {parties.length === 0 && !isLoading ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-100 rounded-3xl text-slate-300 font-bold m-4">
            Bu departmana bağlı personel tarafından oluşturulmuş bir cari bulunmuyor.
          </div>
        ) : (
          <DataTable<Party>
            data={parties}
            columns={columns}
            isLoading={isLoading}
            getRowKey={(p) => p.id}
          />
        )}
      </div>
    </div>
  );
};
