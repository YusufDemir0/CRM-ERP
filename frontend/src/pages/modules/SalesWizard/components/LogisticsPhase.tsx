import React, { memo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { SearchableSelect } from '../../../../components/common/SearchableSelect';
import { FormField } from '../../../../components/common/FormField';
import { useSalesWizardStore } from '../../../../store/useSalesWizardStore';
import { Staff, Account } from '../../../../types';
import { SalesWizardFormData } from '../schema';

export const LogisticsPhase = memo(({ staff, accounts }: { staff: Staff[], accounts: Account[] }) => {
  const store = useSalesWizardStore();
  const { register, setValue, control, formState: { errors }, watch } = useFormContext<SalesWizardFormData>();
  const isTaxed = useWatch({ control, name: 'isTaxed' });
  const staffId = useWatch({ control, name: 'staffId' });
  const paymentAccountId = useWatch({ control, name: 'paymentAccountId' });

  return (
    <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 transition-all hover:shadow-md">
       <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
         <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
         SATIŞ VE LOJİSTİK
       </h3>
       
       <div className="grid grid-cols-2 gap-2">
          <FormField label="İŞLEM TARİHİ" className="!mb-0">
            <input type="date" className="input-premium h-8 text-xs font-bold" {...register('date')} />
          </FormField>
          <FormField label="TESLİMAT TARİHİ" className="!mb-0">
            <input type="date" className="input-premium h-8 text-xs font-bold" {...register('deliveryDate')} />
          </FormField>
       </div>

       <div className="grid grid-cols-2 gap-2">
          <FormField label="ALINAN KAPORA" className="!mb-0">
            <div className="relative">
              <input 
                type="number"
                className="input-premium h-9 w-full pr-8 text-sm font-black text-[var(--success)] tabular-nums"
                placeholder="0.00"
                {...register('deposit', { valueAsNumber: true })}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">₺</span>
            </div>
          </FormField>
          <div className="relative">
            <SearchableSelect
              label="SATIŞ TEMSİLCİSİ"
              placeholder="Temsilci"
              options={(staff || []).map(s => ({ id: String(s.id), label: `${s.firstName} ${s.lastName}` }))}
              value={staffId ? String(staffId) : null}
              onChange={(opt) => setValue('staffId', opt ? String(opt.id) : '', { shouldValidate: true })}
            />
            {errors.staffId && <span className="text-[10px] text-[var(--error)] font-bold mt-1 block">{errors.staffId.message}</span>}
          </div>
       </div>

       <div className="relative">
          <SearchableSelect
            label="ÖDEME HESABI / KASA"
            placeholder="Tahsilat yapılacak hesap"
            options={(accounts || []).map(a => ({ id: String(a.id), label: a.name }))}
            value={paymentAccountId ? String(paymentAccountId) : null}
            onChange={(opt) => {
              const id = opt ? String(opt.id) : '';
              setValue('paymentAccountId', id, { shouldValidate: true });
              const account = accounts.find(a => String(a.id) === id) || null;
              store.setDraftData({ ...store.draftData, paymentAccount: account });
            }}
          />
          {errors.paymentAccountId && <span className="text-[10px] text-[var(--error)] font-bold mt-1 block">{errors.paymentAccountId.message}</span>}
       </div>

       <div className="grid grid-cols-2 gap-2">
          <FormField label="REFERANS / KAYNAK" className="!mb-0">
            <select className="input-premium h-8 text-xs font-black" {...register('source')}>
              <option value="">SEÇİNİZ...</option>
              <option value="INSTAGRAM">INSTAGRAM</option>
              <option value="SAHIBINDEN">SAHİBİNDEN</option>
              <option value="TAVSIYE">TAVSİYE</option>
            </select>
          </FormField>
          <div className="flex bg-slate-100/50 p-0.5 mt-5 rounded-lg border border-slate-200 h-8">
            <button 
              type="button"
              onClick={() => setValue('isTaxed', true)}
              className={`flex-1 py-1 rounded-md font-black text-[9px] transition-all ${isTaxed ? 'bg-white shadow-sm text-[var(--primary)]' : 'text-slate-400 hover:text-slate-600'}`}
            >
              FATURALI
            </button>
            <button 
              type="button"
              onClick={() => setValue('isTaxed', false)}
              className={`flex-1 py-1 rounded-md font-black text-[9px] transition-all ${!isTaxed ? 'bg-white shadow-sm text-[var(--primary)]' : 'text-slate-400 hover:text-slate-600'}`}
            >
              PERAKENDE
            </button>
          </div>
       </div>

       <FormField label="SATIŞ NOTLARI" className="!mb-0">
          <textarea 
            className="input-premium w-full p-2 rounded-xl min-h-[50px] text-xs font-bold"
            placeholder="Dahili notlar..."
            {...register('description')}
          />
        </FormField>
    </div>
  );
});
