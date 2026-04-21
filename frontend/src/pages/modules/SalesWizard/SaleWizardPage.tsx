import { SaleWizard } from './SaleWizard';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../services/queryKeys';
import { useEffect } from 'react';
import { useSalesWizardStore } from '../../../store/useSalesWizardStore';

export default function SaleWizardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const resetStore = useSalesWizardStore(state => state.reset);

  useEffect(() => {
    resetStore();
  }, [resetStore]);

  return (
    <div className="animate-in max-w-[1600px] mx-auto h-[calc(100vh-var(--header-h)-5rem)]">
      <SaleWizard 
        onCompleted={() => {
          queryClient.invalidateQueries({ queryKey: queryKeys.sales.all({}) });
          navigate('/sales');
        }} 
      />
    </div>
  );
}
