import React, { memo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { SearchableSelect } from '../../../../components/common/SearchableSelect';
import { FormField } from '../../../../components/common/FormField';
import { useSalesWizardStore } from '../../../../store/useSalesWizardStore';
import { useQuickCreateStore } from '../../../../store/useQuickCreateStore';
import { useAuthStore } from '../../../../store/useAuthStore';
import { Staff, Account } from '../../../../types';
import { SalesWizardFormData } from '../schema';
import { FiCheck } from 'react-icons/fi';

const today = new Date().toISOString().split('T')[0];

const DepositField = memo(() => {
  const { setValue, watch, formState: { errors } } = useFormContext<SalesWizardFormData>();
  const depositValue = watch('deposit');

  const getDisplayValue = (val: any) => {
    if (val === undefined || val === null || val === '') return '';
    const num = Number(val);
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('tr-TR').format(num);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const clean = raw.replace(/\D/g, '');
    if (clean === '') {
      setValue('deposit', 0, { shouldValidate: true });
      return;
    }
    const num = Number(clean);
    setValue('deposit', num, { shouldValidate: true });
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (depositValue === undefined || depositValue === null || depositValue === '') {
      setValue('deposit', 0, { shouldValidate: true });
    }
    e.target.select();
  };

  const showWarning = !errors.deposit && (depositValue === undefined || depositValue === null || depositValue === '' || isNaN(Number(depositValue)) || Number(depositValue) < 0);

  return (
    <FormField label="ALINAN KAPORA *" className="!mb-0">
      <div className="relative">
        <input 
          type="text"
          className="input-premium h-8 w-full pr-8 text-xs font-bold text-emerald-600 tabular-nums"
          placeholder="Kapora giriniz"
          value={getDisplayValue(depositValue)}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-350">₺</span>
      </div>
      {errors.deposit && (
        <span className="text-[10px] text-red-600 font-black mt-0.5 block uppercase tracking-wide animate-pulse">
          ⚠️ {errors.deposit.message?.toString()}
        </span>
      )}
      {showWarning && (
        <span className="text-[10px] text-red-600 font-black mt-0.5 block uppercase tracking-wide animate-pulse">
          ⚠️ Lütfen kapora giriniz
        </span>
      )}
    </FormField>
  );
});

const StaffSelect = memo(({ options, refreshLookups, disabled }: { options: any[], refreshLookups: () => void, disabled?: boolean }) => {
  const { control, setValue, formState: { errors } } = useFormContext<SalesWizardFormData>();
  const staffId = useWatch({ control, name: 'staffId' });
  const { openCreate } = useQuickCreateStore();

  return (
    <div className="relative">
      <SearchableSelect
        label="SATIŞ TEMSİLCİSİ *"
        placeholder="Temsilci seçin..."
        options={options}
        value={staffId ? String(staffId) : null}
        disabled={disabled}
        onChange={(opt) => setValue('staffId', opt ? String(opt.id) : '', { shouldValidate: true })}
        onQuickAdd={() => openCreate('staff', { 
          mode: 'quick', 
          initialData: { unit: 'MAĞAZA' },
          onSuccess: (res: unknown) => {
            refreshLookups();
            const response = res as { data: Staff } | Staff;
            const newStaff = 'data' in response ? response.data : response;
            if (newStaff?.id) setValue('staffId', String(newStaff.id), { shouldValidate: true });
          }
        })}
      />
      {errors.staffId && <span className="text-[10px] text-[var(--error)] font-bold mt-0.5 block">{errors.staffId.message}</span>}
    </div>
  );
});

const AccountSelect = memo(({ options, accounts }: { options: any[], accounts: Account[] }) => {
  const { control, setValue, formState: { errors } } = useFormContext<SalesWizardFormData>();
  const paymentAccountId = useWatch({ control, name: 'paymentAccountId' });
  const store = useSalesWizardStore();

  return (
    <div className="relative">
      <SearchableSelect
        label="ÖDEME HESABI / KASA *"
        placeholder="Tahsilat yapılacak hesap seçin..."
        options={options}
        value={paymentAccountId ? String(paymentAccountId) : null}
        onChange={(opt) => {
          const id = opt ? String(opt.id) : '';
          setValue('paymentAccountId', id, { shouldValidate: true });
          const account = accounts.find(a => String(a.id) === id) || null;
          store.setDraftData({ ...store.draftData, paymentAccount: account });
        }}
      />
      {errors.paymentAccountId && (
        <span className="text-[10px] text-red-600 font-black mt-0.5 block uppercase tracking-wide">
          ⚠️ {errors.paymentAccountId.message?.toString()}
        </span>
      )}
    </div>
  );
});

export const LogisticsPhase = memo(({ staff, accounts, refreshLookups }: { staff: Staff[], accounts: Account[], refreshLookups: () => void }) => {
  const { register, control, setValue } = useFormContext<SalesWizardFormData>();

  // Watch step values to drive sequential appearance
  const deliveryDate = useWatch({ control, name: 'deliveryDate' });
  const deposit = useWatch({ control, name: 'deposit' });
  const staffId = useWatch({ control, name: 'staffId' });
  const paymentAccountId = useWatch({ control, name: 'paymentAccountId' });
  const source = useWatch({ control, name: 'source' });

  const isEdit = !!useSalesWizardStore(s => s.draftData.id);
  const loggedInUserDeptAccountId = useAuthStore(s => s.user?.department?.commercialAccountId);
  const user = useAuthStore(s => s.user);

  // Find matching staff for current logged in user
  const matchingStaff = React.useMemo(() => {
    if (!user) return null;
    const cleanFullName = user.fullName.toLowerCase().replace(/\s+/g, '');
    return staff.find(s => `${s.firstName}${s.lastName}`.toLowerCase().replace(/\s+/g, '') === cleanFullName);
  }, [staff, user]);

  const deptAccountId = React.useMemo(() => {
    if (staffId) {
      const selectedStaffObj = staff.find(s => String(s.id) === String(staffId));
      if (selectedStaffObj?.department?.commercialAccountId) {
        return selectedStaffObj.department.commercialAccountId;
      }
    }
    return loggedInUserDeptAccountId;
  }, [staffId, staff, loggedInUserDeptAccountId]);

  const userDepartmentId = useAuthStore(s => s.user?.departmentId);

  const staffOptions = React.useMemo(() => {
    return (staff || []).map(s => {
      const isDifferentDept = userDepartmentId && Number(s.departmentId) !== Number(userDepartmentId);
      const isCurrentSelected = String(s.id) === String(staffId);
      return {
        id: String(s.id),
        label: `${s.firstName} ${s.lastName}`,
        disabled: !!isDifferentDept && !isCurrentSelected
      };
    });
  }, [staff, userDepartmentId, staffId]);

  const accountOptions = React.useMemo(() => {
    const sorted = [...(accounts || [])].sort((a, b) => {
      const aIsDept = deptAccountId && String(a.id) === String(deptAccountId);
      const bIsDept = deptAccountId && String(b.id) === String(deptAccountId);
      if (aIsDept && !bIsDept) return -1;
      if (!aIsDept && bIsDept) return 1;
      return 0;
    });
    return sorted.map(a => {
      const isDept = deptAccountId && String(a.id) === String(deptAccountId);
      return { id: String(a.id), label: a.name, isGreen: isDept };
    });
  }, [accounts, deptAccountId]);

  // Auto-fill deliveryDate to today if empty
  React.useEffect(() => {
    if (!deliveryDate) {
      setValue('deliveryDate', today, { shouldValidate: true });
    }
  }, [deliveryDate, setValue]);

  // Auto-fill paymentAccountId to department account if empty
  React.useEffect(() => {
    if (!paymentAccountId && deptAccountId) {
      setValue('paymentAccountId', String(deptAccountId), { shouldValidate: true });
      const account = accounts.find(a => String(a.id) === String(deptAccountId)) || null;
      useSalesWizardStore.getState().setDraftData({ paymentAccount: account });
    }
  }, [paymentAccountId, deptAccountId, accounts, setValue]);

  // Auto-fill staffId to logged-in user's matching staff if empty
  React.useEffect(() => {
    if (!staffId && matchingStaff) {
      setValue('staffId', String(matchingStaff.id), { shouldValidate: true });
      useSalesWizardStore.getState().setDraftData({ staffId: String(matchingStaff.id) });
    }
  }, [staffId, matchingStaff, setValue]);

  // Step completion flags
  const isStep3Complete = !!deliveryDate;
  const isStep4And5Complete = isStep3Complete && !!paymentAccountId && !!source;
  const isStep6Complete = isStep4And5Complete && !!staffId && deposit !== undefined && deposit !== '' && Number(deposit) >= 0;

  return (
    <div className="space-y-2.5">
      {/* ADIM 3: Teslimat Tarihi */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2.5 transition-all hover:shadow-md">
        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
          <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-[var(--primary)] text-white text-[9px] flex items-center justify-center font-bold">3</span>
            TESLİMAT TARİHİ SEÇİMİ
          </h3>
          {isStep3Complete && (
            <span className="text-[9px] font-black text-emerald-600 flex items-center gap-1">
              <FiCheck /> TAMAMLANDI
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
            <FormField label="İŞLEM TARİHİ" className="!mb-0">
              <input 
                type="date" 
                readOnly
                disabled
                className="input-premium h-8 text-xs font-bold bg-slate-100 text-slate-400 cursor-not-allowed" 
                {...register('date')} 
              />
            </FormField>
            <FormField label="TESLİMAT TARİHİ *" className="!mb-0">
              <input 
                type="date" 
                className="input-premium h-8 text-xs font-bold" 
                min={today}
                onKeyDown={(e) => e.preventDefault()}
                {...register('deliveryDate')} 
                onFocus={(e) => {
                  if (!e.target.value) {
                    setValue('deliveryDate', today, { shouldValidate: true });
                  }
                }}
              />
            </FormField>
        </div>
      </div>

      {/* ADIM 4+5: Kasa/Hesap Seçimi + Referans/Kaynak (Adım 3 tamamlanınca belirir) */}
      {isStep3Complete && (
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2.5 transition-all hover:shadow-md animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-[var(--primary)] text-white text-[9px] flex items-center justify-center font-bold">4</span>
              <span className="w-4 h-4 rounded-full bg-[var(--primary)] text-white text-[9px] flex items-center justify-center font-bold">5</span>
              KASA SEÇİMİ VE REFERANS
            </h3>
            {isStep4And5Complete && (
              <span className="text-[9px] font-black text-emerald-600 flex items-center gap-1">
                <FiCheck /> TAMAMLANDI
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <AccountSelect options={accountOptions} accounts={accounts} />
            <FormField label="REFERANS / KAYNAK *" className="!mb-0">
              <select className="input-premium h-8 text-xs font-bold" {...register('source')}>
                <option value="">SEÇİNİZ...</option>
                <option value="INSTAGRAM">INSTAGRAM</option>
                <option value="SAHIBINDEN">SAHİBİNDEN</option>
                <option value="LETGO">LETGO</option>
                <option value="GEÇERKEN UĞRAYAN">GEÇERKEN UĞRAYAN (VİTRİN / MAĞAZA)</option>
                <option value="TAVSIYE">TAVSİYE</option>
              </select>
            </FormField>
          </div>
        </div>
      )}

      {/* ADIM 6: Kapora & Satış Temsilcisi (Adım 4+5 tamamlanınca belirir) */}
      {isStep4And5Complete && (
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2.5 transition-all hover:shadow-md animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-[var(--primary)] text-white text-[9px] flex items-center justify-center font-bold">6</span>
              KAPORA VE SATIŞ TEMSİLCİSİ
            </h3>
            {isStep6Complete && (
              <span className="text-[9px] font-black text-emerald-600 flex items-center gap-1">
                <FiCheck /> TAMAMLANDI
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
             <DepositField />
             <StaffSelect options={staffOptions} refreshLookups={refreshLookups} disabled={isEdit} />
          </div>
        </div>
      )}

      {/* ADIM 7: Satış Notları (Adım 6 tamamlanınca belirir) */}
      {isStep6Complete && (
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2.5 transition-all hover:shadow-md animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-[var(--primary)] text-white text-[9px] flex items-center justify-center font-bold">7</span>
              SATIŞ NOTLARI
            </h3>
            <span className="text-[9px] font-black text-emerald-600 flex items-center gap-1">
              <FiCheck /> AKTİF
            </span>
          </div>
          <FormField label="İÇ NOTLAR (OPSİYONEL)" className="!mb-0">
             <textarea 
               className="input-premium w-full p-2 rounded-xl min-h-[36px] text-xs font-bold"
               placeholder="Dahili notlar..."
               {...register('description')}
             />
           </FormField>
        </div>
      )}
    </div>
  );
});
