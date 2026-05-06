import { FiCheck } from 'react-icons/fi';
import { Item } from '../../types';
import { FormField } from '../common/FormField';
import { PremiumNumberInput } from '../common/PremiumNumberInput';
import { SearchableSelect } from '../common/SearchableSelect';
import { useItemForm } from '../../hooks/useItemForm';

interface ItemFormProps {
  initialData?: Partial<Item>;
  editingId?: string | number | null;
  onSuccess: (data: unknown) => void;
  onCancel: () => void;
}

export const ItemForm: React.FC<ItemFormProps> = ({
  initialData,
  editingId,
  onSuccess,
  onCancel
}) => {
  const {
    lookups,
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    saveDraft,
    customKdv,
    setCustomKdv,
    cacheKey,
    clearCache
  } = useItemForm(initialData, editingId, onSuccess);

  const kdvValue = watch('kdv');

  return (
    <form onSubmit={handleSubmit} onBlur={saveDraft} className="flex flex-col gap-6 animate-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SearchableSelect 
          label="Ürün Türü"
          required
          placeholder="Tür seçin..."
          options={lookups.itemTypes.map(t => ({ id: t.id, label: t.name.toUpperCase() }))}
          value={watch('itemTypeId')}
          onChange={(opt) => setValue('itemTypeId', opt ? String(opt.id) : '')}
        />
        <SearchableSelect 
          label="Kod Grubu"
          required
          placeholder="Grup seçin..."
          options={lookups.itemCodeGroups.map(g => ({ id: g.id, label: `${g.prefix} - ${g.name.toUpperCase()}` }))}
          value={watch('itemCodeGroupId')}
          onChange={(opt) => setValue('itemCodeGroupId', opt ? String(opt.id) : '')}
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
        <SearchableSelect 
          label="Birim"
          required
          placeholder="Birim seçin..."
          options={lookups.quantityTypes.map(q => ({ id: q.id, label: `${q.name.toUpperCase()} (${q.abbreviation})` }))}
          value={watch('quantityTypeId')}
          onChange={(opt) => setValue('quantityTypeId', opt ? String(opt.id) : '')}
        />
        <FormField label="Kritik Limit">
          <div className="flex flex-col gap-2">
            <PremiumNumberInput 
              value={watch('criticalLimit')} 
              onChange={val => setValue('criticalLimit', String(val))} 
              className="h-12"
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
              onChange={e => setCustomKdv(Number(e.target.value))} 
              placeholder="Özel KDV %" 
            />
          )}
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField label="Alış Fiyatı">
          <PremiumNumberInput 
            value={watch('purchasePrice')} 
            onChange={val => setValue('purchasePrice', String(val))} 
            step={1}
            className="h-12"
          />
        </FormField>
        <FormField label="Satış Fiyatı">
          <PremiumNumberInput 
            value={watch('salePrice')} 
            onChange={val => setValue('salePrice', String(val))} 
            step={1}
            className="h-12"
          />
        </FormField>
        <SearchableSelect 
          label="Para Birimi"
          required
          placeholder="Döviz seçin..."
          options={lookups.currencies.map(c => ({ id: c.id, label: `${c.code} - ${c.name.toUpperCase()}` }))}
          value={watch('currencyId')}
          onChange={(opt) => setValue('currencyId', opt ? String(opt.id) : '')}
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
};