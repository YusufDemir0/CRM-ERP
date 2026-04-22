import { useState, useEffect, useCallback } from 'react';
import {
  useForm,
  SubmitHandler
} from 'react-hook-form';

import {
  itemsAPI,
  currenciesAPI
} from '../../services/api';

import toast from 'react-hot-toast';
import { FiCheck } from 'react-icons/fi';

import {
  Item,
  ItemType,
  ItemCodeGroup,
  QuantityType,
  Currency
} from '../../types';

import { useQuickCreateStore } from '../../store/useQuickCreateStore';
import { FormField } from '../common/FormField';
import { PremiumNumberInput } from '../common/PremiumNumberInput';
import { SearchableSelect } from '../common/SearchableSelect';

interface ItemFormProps {
  initialData?: Partial<Item>;
  editingId?: number | null;
  onSuccess: (data: unknown) => void;
  onCancel: () => void;
}

/* 🔥 FORM STRING TABANLI OLUR */
type ItemFormData = {

  name: string;

  itemTypeId: string;
  itemCodeGroupId: string;

  criticalLimit: string;
  purchasePrice: string;
  salePrice: string;

  currencyId: string;
  quantityTypeId: string;

  kdv: string;

  image: string;
  description: string;
  notes: string;
};

export const ItemForm: React.FC<ItemFormProps> = ({
  initialData,
  editingId,
  onSuccess,
  onCancel
}) => {

  const {
    updateCache,
    getCache,
    clearCache
  } = useQuickCreateStore();

  const cacheKey =
    editingId
      ? `item_edit_${editingId}`
      : 'item_create';

  const [itemTypes, setItemTypes] =
    useState<ItemType[]>([]);

  const [itemCodeGroups, setItemCodeGroups] =
    useState<ItemCodeGroup[]>([]);

  const [quantityTypes, setQuantityTypes] =
    useState<QuantityType[]>([]);

  const [currencies, setCurrencies] = useState<Currency[]>([]);

  /* 🔥 FORM */
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset
  } = useForm<ItemFormData>({
    defaultValues: (!editingId ? getCache(cacheKey) as ItemFormData : null) || {
      name: initialData?.name ?? '',
      itemTypeId: initialData?.itemTypeId ? String(initialData.itemTypeId) : (initialData?.itemType?.id ? String(initialData.itemType.id) : ''),
      itemCodeGroupId: initialData?.itemCodeGroupId ? String(initialData.itemCodeGroupId) : (initialData?.itemCodeGroup?.id ? String(initialData.itemCodeGroup.id) : ''),
      criticalLimit: initialData?.criticalLimit ? String(initialData.criticalLimit) : '0',
      purchasePrice: initialData?.purchasePrice ? String(initialData.purchasePrice) : '0',
      salePrice: initialData?.salePrice ? String(initialData.salePrice) : '0',
      currencyId: initialData?.currencyId ? String(initialData.currencyId) : (initialData?.currency?.id ? String(initialData.currency.id) : ''),
      quantityTypeId: initialData?.quantityTypeId ? String(initialData.quantityTypeId) : (initialData?.quantityType?.id ? String(initialData.quantityType.id) : ''),
      kdv: initialData?.kdv ? String(initialData.kdv) : '20',
      image: initialData?.image ?? '',
      description: initialData?.description ?? '',
      notes: initialData?.notes ?? ''
    }
  });

  /* 🔥 CACHE SAVE */
  const saveDraft =
    useCallback(() => {

      updateCache(
        cacheKey,
        getValues()
      );

    }, [
      getValues,
      cacheKey,
      updateCache
    ]);

  const kdvValue =
    watch('kdv');

  const [customKdv, setCustomKdv] =
    useState<number | null>(
      [0, 1, 10, 20].includes(
        Number(kdvValue)
      )
        ? null
        : Number(kdvValue)
    );

  /* 🔥 LOAD LOOKUPS */
  useEffect(() => {

    const controller =
      new AbortController();

    const load =
      async () => {

        try {

          const [
            types,
            groups,
            qtys,
            curs
          ] =
            await Promise.all([

              itemsAPI.getTypes({
                signal:
                  controller.signal
              }),

              itemsAPI.getCodeGroups({
                signal:
                  controller.signal
              }),

              itemsAPI.getQuantityTypes({
                signal:
                  controller.signal
              }),

              currenciesAPI.getAll({}, { signal: controller.signal })
            ]);

          // 🛡️ Veri yapısını sağlama al (Hem [..] hem de { data: [..] } formatını destekle)
          const typesList = Array.isArray(types.data) ? types.data : (types.data as any).data || [];
          const groupsList = Array.isArray(groups.data) ? groups.data : (groups.data as any).data || [];
          const qtysList = Array.isArray(qtys.data) ? qtys.data : (qtys.data as any).data || [];
          const cursList = Array.isArray(curs.data) ? curs.data : (curs.data as any).data || [];

          setItemTypes(typesList);
          setItemCodeGroups(groupsList);
          setQuantityTypes(qtysList);
          setCurrencies(cursList);

          // 🔥 Edit modunda listeler yüklenince değerleri tekrar set et
          if (editingId && initialData) {
            const i = initialData as any;
            setValue('itemTypeId', String(i.itemTypeId ?? i.itemType?.id ?? ''));
            setValue('itemCodeGroupId', String(i.itemCodeGroupId ?? i.itemCodeGroup?.id ?? ''));
            setValue('quantityTypeId', String(i.quantityTypeId ?? i.quantityType?.id ?? ''));
            setValue('currencyId', String(i.currencyId ?? i.currency?.id ?? ''));
          }

        } catch (err: unknown) {

          if (
            err instanceof Error &&
            err.name !==
            'AbortError'
          ) {

            console.error(
              err
            );

          }

        }

      };

    load();

    return () => controller.abort();
  }, []); // Lookups should only load once on mount
  
  /* 🔥 DEFAULT CURRENCY SELECTION */
  useEffect(() => {
    if (currencies.length > 0 && !editingId) {
      const current = getValues('currencyId');
      if (!current || current === '0' || current === '') {
        const def = currencies.find(c => c.isDefault === 1);
        if (def) setValue('currencyId', String(def.id));
      }
    }
  }, [currencies, editingId, getValues, setValue]);

  /* 🔥 SUBMIT */
  const onSubmit:
    SubmitHandler<ItemFormData> =
    async (data) => {

      const payload:
        Partial<Item> = {

        name:
          data.name,

        itemTypeId:
          data.itemTypeId ? Number(data.itemTypeId) : undefined,
          
        itemCodeGroupId:
          data.itemCodeGroupId ? Number(data.itemCodeGroupId) : undefined,

        currencyId:
          data.currencyId ? Number(data.currencyId) : undefined,

        quantityTypeId:
          data.quantityTypeId ? Number(data.quantityTypeId) : undefined,

        kdv:
          data.kdv === 'custom'
            ? Number(customKdv || 0)
            : Number(data.kdv || 0),

        /* ⚠️ string bırakıyoruz */
        purchasePrice:
          data.purchasePrice,

        salePrice:
          data.salePrice,

        criticalLimit:
          Number(
            data.criticalLimit
          ),

        image:
          data.image,

        description: data.description,
        notes: data.notes
      };

      try {

        let res;

        if (editingId) {

          res =
            await itemsAPI.update(
              editingId,
              payload
            );

        } else {

          res =
            await itemsAPI.create(
              payload
            );

        }

        clearCache(cacheKey);

        onSuccess(
          res.data
        );

      } catch {

        toast.error(
          'İşlem başarısız'
        );

      }

    };

  return (
    <form onSubmit={handleSubmit(onSubmit)} onBlur={saveDraft} className="flex flex-col gap-6 animate-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SearchableSelect 
          label="Ürün Türü"
          required
          placeholder="Tür seçin..."
          options={itemTypes.map(t => ({ id: t.id, label: t.name.toUpperCase() }))}
          value={watch('itemTypeId')}
          onChange={(opt) => setValue('itemTypeId', opt ? String(opt.id) : '')}
        />
        <SearchableSelect 
          label="Kod Grubu"
          required
          placeholder="Grup seçin..."
          options={itemCodeGroups.map(g => ({ id: g.id, label: `${g.prefix} - ${g.name.toUpperCase()}` }))}
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
          options={quantityTypes.map(q => ({ id: q.id, label: `${q.name.toUpperCase()} (${q.abbreviation})` }))}
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
          options={currencies.map(c => ({ id: c.id, label: `${c.code} - ${c.name.toUpperCase()}` }))}
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