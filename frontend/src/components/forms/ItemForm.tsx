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

import {
  useQuickCreateStore
} from '../../store/useQuickCreateStore';

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

  const [currencies, setCurrencies] =
    useState<Currency[]>([]);

  /* 🔥 FORM */
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues
  } = useForm<ItemFormData>({

    defaultValues:
      (getCache(cacheKey) as ItemFormData) || {

        name:
          initialData?.name ?? '',

        itemTypeId:
          initialData?.itemTypeId
            ? String(initialData.itemTypeId)
            : '',

        itemCodeGroupId:
          initialData?.itemCodeGroupId
            ? String(initialData.itemCodeGroupId)
            : '',

        criticalLimit:
          initialData?.criticalLimit
            ? String(initialData.criticalLimit)
            : '0',

        purchasePrice:
          initialData?.purchasePrice
            ? String(initialData.purchasePrice)
            : '0',

        salePrice:
          initialData?.salePrice
            ? String(initialData.salePrice)
            : '0',

        currencyId:
          initialData?.currencyId
            ? String(initialData.currencyId)
            : '',

        quantityTypeId:
          initialData?.quantityTypeId
            ? String(initialData.quantityTypeId)
            : '',

        kdv:
          initialData?.kdv
            ? String(initialData.kdv)
            : '20',

        image:
          initialData?.image ?? '',

        description:
          initialData?.description ?? '',

        notes:
          initialData?.notes ?? ''
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

              currenciesAPI.getAll(
                {},
                {
                  signal:
                    controller.signal
                }
              )

            ]);

          setItemTypes(types.data);
          setItemCodeGroups(groups.data);
          setQuantityTypes(qtys.data);
          setCurrencies(curs.data);

          const current =
            getValues(
              'currencyId'
            );

          if (
            !current &&
            curs.data.length > 0
          ) {

            const def =
              curs.data.find(
                (
                  c: Currency
                ) =>
                  c.isDefault === 1
              );

            if (def)
              setValue(
                'currencyId',
                String(def.id)
              );
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

    return () =>
      controller.abort();

  }, [setValue, getValues]);

  /* 🔥 SUBMIT */
  const onSubmit:
    SubmitHandler<ItemFormData> =
    async (data) => {

      const payload:
        Partial<Item> = {

        name:
          data.name,

        itemTypeId:
          Number(
            data.itemTypeId
          ),

        itemCodeGroupId:
          Number(
            data.itemCodeGroupId
          ),

        currencyId:
          Number(
            data.currencyId
          ),

        quantityTypeId:
          Number(
            data.quantityTypeId
          ),

        kdv:
          data.kdv === 'custom'
            ? Number(customKdv)
            : Number(data.kdv),

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

        description:
          data.description,

        notes:
          data.notes

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
    <form onSubmit={handleSubmit(onSubmit)} onBlur={saveDraft} className="login-form">
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label>Ürün Türü *</label>
          <select required className="uppercase-input" {...register('itemTypeId')}>
            <option value="">Seçiniz</option>
            {itemTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Kod Grubu *</label>
          <select required className="uppercase-input" {...register('itemCodeGroupId')}>
            <option value="">Seçiniz</option>
            {itemCodeGroups.map(g => <option key={g.id} value={g.id}>{g.prefix} - {g.name}</option>)}
          </select>
        </div>
      </div>

      <div className="form-group mt-4">
        <label>Ürün Adı *</label>
        <input 
          required 
          className="uppercase-input" 
          {...register('name')} 
          onInput={(e) => { e.currentTarget.value = e.currentTarget.value.toLocaleUpperCase('tr-TR'); }}
          placeholder="ÜRÜN ADI" 
        />
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="form-group">
          <label>Birim *</label>
          <select required className="uppercase-input" {...register('quantityTypeId')}>
            <option value="">Seçiniz</option>
            {quantityTypes.map(q => <option key={q.id} value={q.id}>{q.name} ({q.abbreviation})</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Kritik Limit</label>
          <input 
            type="number" 
            className="uppercase-input tabular-nums" 
            {...register('criticalLimit')} 
          />
        </div>
        <div className="form-group">
          <label>KDV Oranı</label>
          <select className="uppercase-input" {...register('kdv')}>
            <option value="0">%0</option>
            <option value="1">%1</option>
            <option value="10">%10</option>
            <option value="20">%20</option>
            <option value="custom">Özel</option>
          </select>
          {kdvValue === 'custom' && (
            <input 
              type="number" 
              className="uppercase-input tabular-nums mt-2" 
              value={customKdv || ''} 
              onChange={e => setCustomKdv(Number(e.target.value))} 
              placeholder="Özel KDV %" 
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="form-group">
          <label>Alış Fiyatı</label>
          <input 
            type="number" 
            step="0.01"
            className="uppercase-input tabular-nums" 
            {...register('purchasePrice')} 
          />
        </div>
        <div className="form-group">
          <label>Satış Fiyatı</label>
          <input 
            type="number" 
            step="0.01"
            className="uppercase-input tabular-nums" 
            {...register('salePrice')} 
          />
        </div>
        <div className="form-group">
          <label>Para Birimi *</label>
          <select required className="uppercase-input" {...register('currencyId')}>
            <option value="">Seçiniz</option>
            {currencies.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
          </select>
        </div>
      </div>

      <div className="form-group mt-4">
        <label>Açıklama</label>
        <textarea 
          className="uppercase-input min-h-[80px]" 
          {...register('description')} 
          onInput={(e) => { e.currentTarget.value = e.currentTarget.value.toLocaleUpperCase('tr-TR'); }}
          placeholder="Açıklama..." 
        />
      </div>

      <div className="form-group mt-4">
        <label>Notlar</label>
        <textarea 
          className="uppercase-input min-h-[80px]" 
          {...register('notes')} 
          placeholder="İç Notlar..." 
        />
      </div>

      <div className="flex gap-4 mt-8">
        <button type="submit" className="btn btn-primary flex-1 h-[50px]">
          <FiCheck /> {editingId ? 'GÜNCELLE' : 'ÜRÜNÜ KAYDET'}
        </button>
        <button type="button" className="btn bg-slate-200 flex-[0.5] h-[50px]" onClick={onCancel}>
          İPTAL
        </button>
      </div>
    </form>
  );

};