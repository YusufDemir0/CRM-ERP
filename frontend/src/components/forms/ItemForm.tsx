import React, { useMemo, memo } from 'react';
import { FiCheck } from 'react-icons/fi';
import { Item } from '../../types';
import { FormField } from '../common/FormField';
import { PremiumNumberInput } from '../common/PremiumNumberInput';
import { SearchableSelect } from '../common/SearchableSelect';
import { useItemForm } from '../../hooks/useItemForm';
import { useQuickCreateStore } from '../../store/useQuickCreateStore';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../services/queryKeys';
import toast from 'react-hot-toast';
import { Controller } from 'react-hook-form';

interface ItemFormProps {
  initialData?: Partial<Item>;
  editingId?: string | number | null;
  onSuccess: (data: unknown) => void;
  onCancel: () => void;
}

const KdvSelect = memo(({ control, register, customKdv, setCustomKdv }: { control: any, register: any, customKdv: number | null, setCustomKdv: (val: number) => void }) => {
  const kdvValue = useWatch({ control, name: 'kdv' });
  
  return (
    <FormField label="KDV Oranı">
      <select className="input-premium font-black" {...register('kdv')}>
        <option value="0">%0</option>
        <option value="1">%1</option>
        <option value="10">%10</option>
        <option value="20">%20</option>
        <option value="custom">Özel</option>
      </select>
      {kdvValue === 'custom' && (
        <input 
          type="number" 
          className="input-premium font-black tabular-nums mt-2" 
          value={customKdv || ''} 
          onKeyDown={(e) => {
            if (['e', 'E', '+', '-'].includes(e.key)) {
              e.preventDefault();
            }
          }}
          onChange={e => setCustomKdv(Number(e.target.value))} 
          placeholder="Özel KDV %" 
        />
      )}
    </FormField>
  );
});

import { useWatch } from 'react-hook-form';

export const ItemForm: React.FC<ItemFormProps> = memo(({
  initialData,
  editingId,
  onSuccess,
  onCancel
}) => {
  const {
    lookups,
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    saveDraft,
    customKdv,
    setCustomKdv,
    cacheKey,
    clearCache
  } = useItemForm(initialData, editingId, onSuccess);

  const { openCreate } = useQuickCreateStore();
  const queryClient = useQueryClient();

  const handleRefreshLookups = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.items.lookup });
    toast.success("Listeler güncellendi.");
  };

  const itemTypeOptions = useMemo(() => 
    lookups.itemTypes.map(t => ({ id: t.id, label: t.name.toUpperCase() })),
    [lookups.itemTypes]
  );

  const itemCodeGroupOptions = useMemo(() => 
    lookups.itemCodeGroups.map(g => ({ id: g.id, label: `${g.prefix} - ${g.name.toUpperCase()}` })),
    [lookups.itemCodeGroups]
  );

  const quantityTypeOptions = useMemo(() => 
    lookups.quantityTypes.map(q => ({ id: q.id, label: `${q.name.toUpperCase()} (${q.abbreviation})` })),
    [lookups.quantityTypes]
  );

  const currencyOptions = useMemo(() => 
    lookups.currencies.map(c => ({ id: c.id, label: `${c.code} - ${c.name.toUpperCase()}` })),
    [lookups.currencies]
  );

  return (
    <form onSubmit={handleSubmit} onBlur={saveDraft} className="flex flex-col gap-6 animate-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          name="itemTypeId"
          control={control}
          render={({ field }) => (
            <SearchableSelect 
              label="Ürün Türü"
              required
              placeholder="Tür seçin..."
              options={itemTypeOptions}
              value={field.value}
              onChange={(opt) => field.onChange(opt ? String(opt.id) : '')}
              onQuickAdd={() => openCreate('item-type', { onSuccess: handleRefreshLookups })}
            />
          )}
        />
        <Controller
          name="itemCodeGroupId"
          control={control}
          render={({ field }) => (
            <SearchableSelect 
              label="Kod Grubu"
              required
              placeholder="Grup seçin..."
              options={itemCodeGroupOptions}
              value={field.value}
              onChange={(opt) => field.onChange(opt ? String(opt.id) : '')}
              onQuickAdd={() => openCreate('code-group', { onSuccess: handleRefreshLookups })}
            />
          )}
        />
      </div>

      <FormField label="Ürün Adı" required>
        <input 
          required 
          className="input-premium uppercase-input font-black tracking-tight" 
          {...register('name')} 
          onInput={(e) => { e.currentTarget.value = e.currentTarget.value.toLocaleUpperCase('tr-TR'); }}
          placeholder="ÖR: POLİESTER İPLİK 150/48" 
        />
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Controller
          name="quantityTypeId"
          control={control}
          render={({ field }) => (
            <SearchableSelect 
              label="Birim"
              required
              placeholder="Birim seçin..."
              options={quantityTypeOptions}
              value={field.value}
              onChange={(opt) => field.onChange(opt ? String(opt.id) : '')}
              onQuickAdd={() => openCreate('quantity-type', { onSuccess: handleRefreshLookups })}
            />
          )}
        />
        <FormField label="Kritik Limit">
          <div className="flex flex-col gap-2">
            <Controller
              name="criticalLimit"
              control={control}
              render={({ field }) => (
                <PremiumNumberInput 
                  value={Number(field.value)} 
                  onChange={val => field.onChange(String(val))} 
                  className="h-12"
                />
              )}
            />
            <div className="flex gap-1">
              {[-10000, -1000, 1000, 10000].map(val => (
                <button 
                  key={val}
                  type="button" 
                  className="flex-1 h-8 rounded-lg bg-slate-50 border border-slate-200 text-[10px] font-black text-slate-600 hover:bg-[var(--primary)] hover:text-white transition-all"
                  onClick={() => {
                    const current = Number(getValues('criticalLimit') || 0);
                    setValue('criticalLimit', String(Math.max(0, current + val)));
                  }}
                >
                  {val > 0 ? `+${val/1000}K` : `${val/1000}K`}
                </button>
              ))}
            </div>
          </div>
        </FormField>
        <KdvSelect control={control} register={register} customKdv={customKdv} setCustomKdv={setCustomKdv} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField label="Alış Fiyatı">
          <Controller
            name="purchasePrice"
            control={control}
            render={({ field }) => (
              <PremiumNumberInput 
                value={Number(field.value)} 
                onChange={val => field.onChange(String(val))} 
                step={1}
                className="h-12"
              />
            )}
          />
        </FormField>
        <FormField label="Satış Fiyatı">
          <Controller
            name="salePrice"
            control={control}
            render={({ field }) => (
              <PremiumNumberInput 
                value={Number(field.value)} 
                onChange={val => field.onChange(String(val))} 
                step={1}
                className="h-12"
              />
            )}
          />
        </FormField>
        <Controller
          name="currencyId"
          control={control}
          render={({ field }) => (
            <SearchableSelect 
              label="Para Birimi"
              required
              placeholder="Döviz seçin..."
              options={currencyOptions}
              value={field.value}
              onChange={(opt) => field.onChange(opt ? String(opt.id) : '')}
            />
          )}
        />
      </div>

      <FormField label="Açıklama">
        <textarea 
          className="input-premium uppercase-input min-h-[100px] font-medium" 
          {...register('description')} 
          onInput={(e) => { e.currentTarget.value = e.currentTarget.value.toLocaleUpperCase('tr-TR'); }}
          placeholder="Üretim veya satış birimi için ek notlar..." 
        />
      </FormField>

      <FormField label="Notlar">
        <textarea 
          className="input-premium min-h-[100px] font-medium" 
          {...register('notes')} 
          placeholder="İşletme içi özel notlar..." 
        />
      </FormField>

      <div className="flex flex-col sm:flex-row gap-4 mt-4 pt-6 border-t border-slate-100">
        <button type="submit" className="btn btn-primary btn-lg flex-1 shadow-2xl shadow-[var(--primary-glow)]">
          <FiCheck size={20} /> {editingId ? 'GÜNCELLEMELERİ KAYDET' : 'YENİ ÜRÜNÜ SİSTEME KAYDET'}
        </button>
        <button type="button" className="btn bg-slate-100 text-slate-500 btn-lg px-10 font-black hover:bg-slate-200" onClick={() => { clearCache(cacheKey); onCancel(); }}>
          İPTAL
        </button>
      </div>
    </form>
  );
});