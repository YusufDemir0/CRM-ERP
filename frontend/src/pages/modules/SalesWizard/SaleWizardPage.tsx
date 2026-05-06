import { SaleWizard } from './SaleWizard';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../services/queryKeys';
import { useEffect } from 'react';
import { useSalesWizardStore } from '../../../store/useSalesWizardStore';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { salesWizardSchema, SalesWizardFormData } from './schema';

export default function SaleWizardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { draftData, setDraftData } = useSalesWizardStore();

  const methods = useForm<SalesWizardFormData>({
    resolver: zodResolver(salesWizardSchema) as any,
    defaultValues: {
      customerId: draftData.customer?.id || '',
      staffId: draftData.staffId || '',
      paymentAccountId: draftData.paymentAccount?.id || null,
      phone: draftData.phone,
      phone2: draftData.phone2,
      email: draftData.email,
      taxId: draftData.taxId,
      cityId: draftData.cityId || '',
      district: draftData.district,
      address: draftData.address,
      date: draftData.date,
      deliveryDate: draftData.deliveryDate,
      deposit: draftData.deposit,
      discountAmount: draftData.discountAmount,
      source: draftData.source,
      isTaxed: draftData.isTaxed,
      description: draftData.description,
      items: draftData.selectedItems.map(i => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        taxRate: i.taxRate || 20
      }))
    },
    mode: 'onChange' // Validate as user types
  });

  // Auto-save draft on every change
  useEffect(() => {
    const subscription = methods.watch((value) => {
      // Safely update draftData by merging only primitive fields
      // and preserving complex objects like 'customer' and 'paymentAccount'
      // which are handled within the components themselves for accuracy.
      setDraftData({
        ...draftData,
        phone: value.phone || draftData.phone,
        phone2: value.phone2 || draftData.phone2,
        email: value.email || draftData.email,
        taxId: value.taxId || draftData.taxId,
        cityId: value.cityId || draftData.cityId,
        district: value.district || draftData.district,
        address: value.address || draftData.address,
        date: value.date || draftData.date,
        deliveryDate: value.deliveryDate || draftData.deliveryDate,
        deposit: value.deposit !== undefined ? value.deposit : draftData.deposit,
        discountAmount: value.discountAmount !== undefined ? value.discountAmount : draftData.discountAmount,
        source: value.source || draftData.source,
        isTaxed: value.isTaxed !== undefined ? value.isTaxed : draftData.isTaxed,
        description: value.description || draftData.description,
        staffId: value.staffId || draftData.staffId,
        selectedItems: (value.items as any) || draftData.selectedItems // items are complex but we can pass them if they follow the type
      });
    });
    return () => subscription.unsubscribe();
  }, [methods, setDraftData, draftData]);

  return (
    <div className="animate-in max-w-[1600px] mx-auto h-[calc(100vh-var(--header-h)-5rem)]">
      <FormProvider {...methods}>
        <SaleWizard 
          onCompleted={() => {
            queryClient.invalidateQueries({ queryKey: queryKeys.sales.all({}) });
            navigate('/sales');
          }} 
        />
      </FormProvider>
    </div>
  );
}
