import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { itemsAPI, currenciesAPI } from '../services/api';
import { useQuickCreateStore } from '../store/useQuickCreateStore';
import { Item, ItemType, ItemCodeGroup, QuantityType, Currency, PaginatedResult } from '../types';
import toast from 'react-hot-toast';

export type ItemFormData = {
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

export const useItemForm = (
  initialData?: Partial<Item>,
  editingId?: string | number | null,
  onSuccess?: (data: unknown) => void
) => {
  const { updateCache, getCache, clearCache } = useQuickCreateStore();
  const cacheKey = editingId ? `item_edit_${editingId}` : 'item_create';

  const [lookups, setLookups] = useState({
    itemTypes: [] as ItemType[],
    itemCodeGroups: [] as ItemCodeGroup[],
    quantityTypes: [] as QuantityType[],
    currencies: [] as Currency[],
  });

  const { register, handleSubmit, watch, setValue, getValues, reset, control } = useForm<ItemFormData>({
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

  const kdvValue = watch('kdv');
  const [customKdv, setCustomKdv] = useState<number | null>(
    [0, 1, 10, 20].includes(Number(kdvValue)) ? null : Number(kdvValue)
  );

  const loadLookups = useCallback(async (signal: AbortSignal) => {
    try {
      const [types, groups, qtys, curs] = await Promise.all([
        itemsAPI.getTypes({ signal }),
        itemsAPI.getCodeGroups({ signal }),
        itemsAPI.getQuantityTypes({ signal }),
        currenciesAPI.getAll({}, { signal })
      ]);

      const getList = <T,>(res: { data: T[] | PaginatedResult<T> | unknown }) => {
        const typedRes = res as { data: T[] | PaginatedResult<T> };
        return Array.isArray(typedRes.data) ? typedRes.data : (typedRes.data as PaginatedResult<T>)?.data || [];
      };

      setLookups({
        itemTypes: getList(types),
        itemCodeGroups: getList(groups),
        quantityTypes: getList(qtys),
        currencies: getList(curs),
      });
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') console.error(err);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadLookups(controller.signal);
    return () => controller.abort();
  }, [loadLookups]);

  // Memoize initialData primitive key dependencies
  const initialName = initialData?.name;
  const initialTypeId = initialData?.itemTypeId || initialData?.itemType?.id;
  const initialGroupId = initialData?.itemCodeGroupId || initialData?.itemCodeGroup?.id;
  const initialQtyId = initialData?.quantityTypeId || initialData?.quantityType?.id;
  const initialCurId = initialData?.currencyId || initialData?.currency?.id;
  const initialKdv = initialData?.kdv;
  const initialPurchasePrice = initialData?.purchasePrice;
  const initialSalePrice = initialData?.salePrice;
  const initialCriticalLimit = initialData?.criticalLimit;
  const initialImage = initialData?.image;
  const initialDescription = initialData?.description;
  const initialNotes = initialData?.notes;

  // Re-apply initial values once lookups are loaded
  useEffect(() => {
    if (lookups.itemTypes.length > 0 && initialTypeId) {
      setValue('itemTypeId', String(initialTypeId));
    }
  }, [lookups.itemTypes, initialTypeId, setValue]);

  useEffect(() => {
    if (lookups.itemCodeGroups.length > 0 && initialGroupId) {
      setValue('itemCodeGroupId', String(initialGroupId));
    }
  }, [lookups.itemCodeGroups, initialGroupId, setValue]);

  useEffect(() => {
    if (lookups.quantityTypes.length > 0 && initialQtyId) {
      setValue('quantityTypeId', String(initialQtyId));
    }
  }, [lookups.quantityTypes, initialQtyId, setValue]);

  useEffect(() => {
    if (lookups.currencies.length > 0 && initialCurId) {
      setValue('currencyId', String(initialCurId));
    }
  }, [lookups.currencies, initialCurId, setValue]);

  // Handle initialData changes for better hydration
  useEffect(() => {
    if (editingId) {
      if (initialName !== undefined) setValue('name', String(initialName));
      if (initialTypeId !== undefined) setValue('itemTypeId', String(initialTypeId));
      if (initialGroupId !== undefined) setValue('itemCodeGroupId', String(initialGroupId));
      if (initialQtyId !== undefined) setValue('quantityTypeId', String(initialQtyId));
      if (initialCurId !== undefined) setValue('currencyId', String(initialCurId));
      if (initialKdv !== undefined) setValue('kdv', String(initialKdv));
      if (initialPurchasePrice !== undefined) setValue('purchasePrice', String(initialPurchasePrice));
      if (initialSalePrice !== undefined) setValue('salePrice', String(initialSalePrice));
      if (initialCriticalLimit !== undefined) setValue('criticalLimit', String(initialCriticalLimit));
      if (initialImage !== undefined) setValue('image', String(initialImage));
      if (initialDescription !== undefined) setValue('description', String(initialDescription));
      if (initialNotes !== undefined) setValue('notes', String(initialNotes));
    }
  }, [
    editingId,
    initialName,
    initialTypeId,
    initialGroupId,
    initialQtyId,
    initialCurId,
    initialKdv,
    initialPurchasePrice,
    initialSalePrice,
    initialCriticalLimit,
    initialImage,
    initialDescription,
    initialNotes,
    setValue,
  ]);

  // Default currency logic
  useEffect(() => {
    if (lookups.currencies.length > 0 && !editingId) {
      const current = getValues('currencyId');
      if (!current || current === '0' || current === '') {
        const def = lookups.currencies.find(c => c.isDefault === 1);
        if (def) setValue('currencyId', String(def.id));
      }
    }
  }, [lookups.currencies, editingId, getValues, setValue]);

  const saveDraft = useCallback(() => {
    updateCache(cacheKey, getValues());
  }, [getValues, cacheKey, updateCache]);

  const submit = async (data: ItemFormData) => {
    const payload = {
      name: data.name,
      itemTypeId: data.itemTypeId || undefined,
      itemCodeGroupId: data.itemCodeGroupId || undefined,
      currencyId: data.currencyId || undefined,
      quantityTypeId: data.quantityTypeId || undefined,
      kdv: data.kdv === 'custom' ? Number(customKdv || 0) : Number(data.kdv || 0),
      criticalLimit: data.criticalLimit ? Number(data.criticalLimit) : 0,
      purchasePrice: data.purchasePrice ? String(data.purchasePrice) : '0',
      salePrice: data.salePrice ? String(data.salePrice) : '0',
      description: data.description || undefined,
      notes: data.notes || undefined,
      image: data.image || undefined,
    };

    try {
      const res = editingId 
        ? await itemsAPI.update(editingId, payload)
        : await itemsAPI.create(payload);
      
      clearCache(cacheKey);
      if (onSuccess) onSuccess(res.data);
      toast.success(editingId ? 'Ürün güncellendi' : 'Ürün oluşturuldu');
    } catch (error: unknown) {
      console.error(error);
      let errorMsg = 'İşlem başarısız';
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as { response: { data?: { message?: string | string[] } } }).response;
        if (response.data?.message) {
          errorMsg = Array.isArray(response.data.message) ? response.data.message[0] : response.data.message;
        }
      }
      toast.error(errorMsg);
    }
  };

  return {
    lookups,
    register,
    handleSubmit: handleSubmit(submit),
    watch,
    setValue,
    getValues,
    control,
    saveDraft,
    customKdv,
    setCustomKdv,
    cacheKey,
    clearCache
  };
};
