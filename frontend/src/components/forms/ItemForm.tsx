import React, { useState, useEffect, useCallback } from 'react';
import { itemsAPI, currenciesAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { FiCheck } from 'react-icons/fi';

import { Item, ItemType, ItemCodeGroup, QuantityType, Currency } from '../../types';
import { useQuickCreateStore } from '../../store/useQuickCreateStore';

interface ItemFormProps {
  initialData?: Partial<Item>;
  editingId?: number | null;
  onSuccess: (data: unknown) => void;
  onCancel: () => void;
}

export const ItemForm: React.FC<ItemFormProps> = ({
  initialData,
  editingId,
  onSuccess,
  onCancel,
}) => {
  const { updateCache, getCache, clearCache } = useQuickCreateStore();
  const cacheKey = editingId ? `item_edit_${editingId}` : 'item_create';

  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [itemCodeGroups, setItemCodeGroups] = useState<ItemCodeGroup[]>([]);
  const [quantityTypes, setQuantityTypes] = useState<QuantityType[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  
  const [formData, setFormData] = useState<Record<string, string | number>>(() => {
    const cached = getCache(cacheKey) as Record<string, string | number> | null;
    return cached || {
      name: (initialData?.name as string) || '',
      itemTypeId: (initialData?.itemTypeId as number) || '',
      itemCodeGroupId: (initialData?.itemCodeGroupId as number) || '',
      criticalLimit: (initialData?.criticalLimit as string | number) || 0,
      purchasePrice: (initialData?.purchasePrice as string | number) || 0,
      salePrice: (initialData?.salePrice as string | number) || 0,
      currencyId: (initialData?.currencyId as number) || '',
      quantityTypeId: (initialData?.quantityTypeId as number) || '',
      kdv: initialData?.kdv !== undefined ? Number(initialData.kdv) : 20,
      image: (initialData?.image as string) || '',
      description: (initialData?.description as string) || '',
      notes: (initialData?.notes as string) || ''
    };
  });

  // Caching strategy: Update only on blur or unmount to prevent re-render loops
  const saveDraft = useCallback(() => {
    updateCache(cacheKey, formData);
  }, [formData, cacheKey, updateCache]);

  const [customKdv, setCustomKdv] = useState<number | null>(
    [0, 1, 10, 20].includes(Number(formData.kdv)) ? null : Number(formData.kdv)
  );

  useEffect(() => {
    const controller = new AbortController();
    const loadDependencies = async () => {
      try {
        const [types, groups, qtys, curs] = await Promise.all([
          itemsAPI.getTypes({ signal: controller.signal }),
          itemsAPI.getCodeGroups({ signal: controller.signal }),
          itemsAPI.getQuantityTypes({ signal: controller.signal }),
          currenciesAPI.getAll({}, { signal: controller.signal })
        ]);
        setItemTypes(types.data);
        setItemCodeGroups(groups.data);
        setQuantityTypes(qtys.data);
        setCurrencies(curs.data);

        if (!formData.currencyId && curs.data.length > 0) {
          const def = curs.data.find((c: Currency) => c.isDefault === 1);
          if (def) setFormData((p) => ({ ...p, currencyId: String(def.id) }));
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error("Dependency loading failed", error);
        }
      }
    };
    loadDependencies();
    return () => controller.abort();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      itemTypeId: Number(formData.itemTypeId),
      itemCodeGroupId: Number(formData.itemCodeGroupId),
      kdv: formData.kdv === 'custom' ? Number(customKdv) : Number(formData.kdv),
      currencyId: Number(formData.currencyId),
      quantityTypeId: Number(formData.quantityTypeId),
      purchasePrice: Number(formData.purchasePrice),
      salePrice: Number(formData.salePrice),
      criticalLimit: Number(formData.criticalLimit)
    } as any;

    try {
      if (editingId) {
        const res = await itemsAPI.update(editingId, payload);
        clearCache(cacheKey);
        onSuccess(res.data);
      } else {
        const res = await itemsAPI.create(payload);
        clearCache(cacheKey);
        onSuccess(res.data);
      }
    } catch (error: unknown) {
      toast.error("İşlem başarısız");
    }
  };

  return (
    <form onSubmit={handleSubmit} onBlur={saveDraft} className="login-form">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '15px' }}>
        <div className="form-group">
          <label>Ürün Türü</label>
          <select required value={formData.itemTypeId} onChange={e => setFormData({ ...formData, itemTypeId: e.target.value })}>
            <option value="">Seçiniz</option>
            {itemTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Ürün Adı</label>
          <input required className="uppercase-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value.toLocaleUpperCase('tr-TR').replace(/[0-9]/g, '') })} />
        </div>
        <div className="form-group">
          <label>Kod Grubu</label>
          <select required value={formData.itemCodeGroupId} onChange={e => setFormData({ ...formData, itemCodeGroupId: e.target.value })}>
            <option value="">Seçiniz</option>
            {itemCodeGroups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.prefix})</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
        <div className="form-group">
          <label>Alış Fiyatı</label>
          <input type="number" step="0.01" value={formData.purchasePrice} onChange={e => setFormData({ ...formData, purchasePrice: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Satış Fiyatı</label>
          <input type="number" step="0.01" value={formData.salePrice} onChange={e => setFormData({ ...formData, salePrice: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Döviz</label>
          <select required value={formData.currencyId} onChange={e => setFormData({ ...formData, currencyId: e.target.value })}>
            <option value="">Seçiniz</option>
            {currencies.map(c => <option key={c.id} value={c.id}>{c.code} ({c.symbol})</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '15px' }}>
        <div className="form-group">
          <label>Birim</label>
          <select required value={formData.quantityTypeId} onChange={e => setFormData({ ...formData, quantityTypeId: e.target.value })}>
            <option value="">Seçiniz</option>
            {quantityTypes.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>KDV (%)</label>
          <div style={{ display: 'flex', gap: '5px' }}>
            <select style={{ flex: 1 }} value={formData.kdv} onChange={e => {
              const val = e.target.value;
              setFormData({ ...formData, kdv: val });
              if (val !== 'custom') setCustomKdv(null);
            }}>
              <option value={0}>%0</option><option value={1}>%1</option><option value={10}>%10</option><option value={20}>%20</option>
              <option value="custom">Özel</option>
            </select>
            {formData.kdv === 'custom' && (
              <input type="number" style={{ width: '60px' }} value={customKdv || ''} onChange={e => setCustomKdv(Number(e.target.value))} placeholder="%" />
            )}
          </div>
        </div>
        <div className="form-group">
          <label>Kritik Limit (Görüntüleme Eşik Değeri)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button type="button" className="btn btn-sm" style={{ background: '#f8fafc', border: '1px solid var(--border)', padding: '5px 8px', fontSize: '10px' }} onClick={() => setFormData((p) => ({ ...p, criticalLimit: Math.max(0, Number(p.criticalLimit) - 100) }))}>-100</button>
              <button type="button" className="btn btn-sm" style={{ background: '#f8fafc', border: '1px solid var(--border)', padding: '5px 8px', fontSize: '10px' }} onClick={() => setFormData((p) => ({ ...p, criticalLimit: Math.max(0, Number(p.criticalLimit) - 10) }))}>-10</button>
            </div>
            
            <input 
              type="number" 
              className="uppercase-input tabular-nums" 
              style={{ width: '100px', textAlign: 'center', fontWeight: '900', fontSize: '1.4rem', height: '45px', border: '2px solid var(--primary-glow)', borderRadius: '10px' }} 
              value={formData.criticalLimit} 
              onChange={e => setFormData({ ...formData, criticalLimit: e.target.value })} 
            />

            <div style={{ display: 'flex', gap: '4px' }}>
              <button type="button" className="btn btn-sm" style={{ background: '#f8fafc', border: '1px solid var(--border)', padding: '5px 8px', fontSize: '10px' }} onClick={() => setFormData((p) => ({ ...p, criticalLimit: Number(p.criticalLimit) + 10 }))}>+10</button>
              <button type="button" className="btn btn-sm" style={{ background: '#f8fafc', border: '1px solid var(--border)', padding: '5px 8px', fontSize: '10px' }} onClick={() => setFormData((p) => ({ ...p, criticalLimit: Number(p.criticalLimit) + 100 }))}>+100</button>
            </div>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label>Görsel URL</label>
        <input type="url" value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} placeholder="https://..." />
      </div>

      <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
        <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '50px' }}>
          <FiCheck /> {editingId ? 'GÜNCELLE' : 'ÜRÜNÜ KAYDET'}
        </button>
        <button type="button" className="btn" style={{ flex: 0.5, background: '#e2e8f0', height: '50px' }} onClick={onCancel}>İPTAL</button>
      </div>
    </form>
  );
};
