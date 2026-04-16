import React, { useState, useEffect, useCallback } from 'react';
import { bomsAPI, itemsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { FiX, FiCheck, FiPlus } from 'react-icons/fi';
import { useQuickCreateStore } from '../../store/useQuickCreateStore';
import { Item, Bom, BomItem } from '../../types';

export interface BomItemData {
  itemId: number;
  quantity: number;
  description: string;
}

interface BomFormProps {
  initialData?: Partial<Bom>;
  editingId?: number | null;
  onSuccess: (data: unknown) => void;
  onCancel: () => void;
}

export const BomForm: React.FC<BomFormProps> = ({
  initialData,
  editingId,
  onSuccess,
  onCancel,
}) => {
  const { updateCache, getCache, clearCache } = useQuickCreateStore();
  const cacheKey = editingId ? `bom_edit_${editingId}` : 'bom_create';

  const [itemsList, setItemsList] = useState<Item[]>([]);
  const [formData, setFormData] = useState(() => {
    const cached = getCache(cacheKey) as { name: string, targetItemId: string | number, description: string, items: BomItemData[] } | null;
    return cached || {
      name: initialData?.name || '',
      targetItemId: initialData?.targetItemId || '',
      description: initialData?.description || '',
      items: (initialData?.items?.map(i => ({ itemId: i.itemId, quantity: Number(i.quantity), description: i.description })) || []) as BomItemData[]
    };
  });

  // Caching strategy: Update only on blur or unmount to prevent re-render loops
  const saveDraft = useCallback(() => {
    updateCache(cacheKey, formData);
  }, [formData, cacheKey, updateCache]);

  useEffect(() => {
    const loadItems = async () => {
      try {
        const res = await itemsAPI.getAll({ limit: 1000, state: 1 });
        setItemsList(res.data.data);
      } catch (error) {
        console.error("Failed to load items for BOM", error);
      }
    };
    loadItems();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      toast.error("Reçeteye en az 1 hammadde / bileşen eklemelisiniz.");
      return;
    }
    const payload = {
      ...formData,
      targetItemId: formData.targetItemId ? Number(formData.targetItemId) : undefined
    };
    try {
      if (editingId) {
        const res = await bomsAPI.update(editingId, payload as any);
        clearCache(cacheKey);
        onSuccess(res.data);
      } else {
        const res = await bomsAPI.create(payload as any);
        clearCache(cacheKey);
        onSuccess(res.data);
      }
    } catch (error: unknown) {
      toast.error("İşlem başarısız");
    }
  };

  const addBomItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { itemId: Number(itemsList[0]?.id) || 0, quantity: 1, description: '' }]
    }));
  };

  const removeBomItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i: number) => i !== index)
    }));
  };

  const updateBomItem = (index: number, field: keyof BomItemData, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value } as BomItemData;
    setFormData((prev) => ({ ...prev, items: newItems }));
  };

  return (
    <form onSubmit={handleSubmit} onBlur={saveDraft} className="login-form">
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr', gap: '15px' }}>
        <div className="form-group">
          <label>Reçete Adı (Zorunlu)</label>
          <input required className="uppercase-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value.toLocaleUpperCase('tr-TR') })} placeholder="ÖR: ÖZEL ÜRETİM REÇETESİ" />
        </div>
        <div className="form-group">
          <label>Hedef Ürün (Üretilecek)</label>
          <select className="uppercase-input" value={formData.targetItemId} onChange={e => setFormData({ ...formData, targetItemId: Number(e.target.value) })}>
            <option value="">Seçiniz</option>
            {itemsList.map(i => <option key={i.id} value={i.id}>{i.code} - {i.name}</option>)}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>Açıklama</label>
        <input className="uppercase-input" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value.toLocaleUpperCase('tr-TR') })} placeholder="..." />
      </div>

      <div style={{ marginTop: '20px', padding: '15px', background: 'var(--surface-container-low)', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <label style={{ color: 'var(--primary)', fontWeight: 800 }}>Kullanılacak Bileşenler</label>
          <button type="button" className="btn btn-primary btn-sm" onClick={addBomItem}>
            <FiPlus /> Kalem Ekle
          </button>
        </div>

        {formData.items.map((item, idx: number) => (
          <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1.5fr auto', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
            <select required className="uppercase-input" style={{ height: '40px', fontSize: '12px' }} value={item.itemId} onChange={e => updateBomItem(idx, 'itemId', Number(e.target.value))}>
              <option value="">Ürün Seç</option>
              {itemsList.map(i => <option key={i.id} value={i.id}>{i.code} - {i.name}</option>)}
            </select>
            <input type="number" required step="0.0001" className="uppercase-input tabular-nums" style={{ height: '40px' }} value={item.quantity} onChange={e => updateBomItem(idx, 'quantity', Number(e.target.value))} placeholder="Mkt" />
            <input type="text" className="uppercase-input" style={{ height: '40px', fontSize: '12px' }} value={item.description} onChange={e => updateBomItem(idx, 'description', e.target.value.toLocaleUpperCase('tr-TR'))} placeholder="Not..." />
            <button type="button" className="btn-icon circle" style={{ color: 'var(--error)', background: 'var(--error-glow)' }} onClick={() => removeBomItem(idx)}>
              <FiX />
            </button>
          </div>
        ))}

        {formData.items.length === 0 && (
          <div style={{ textAlign: 'center', color: 'gray', padding: '10px' }}>Henüz bileşen eklenmedi.</div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
        <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '50px' }}>
          <FiCheck /> {editingId ? 'GÜNCELLE' : 'REÇETEYİ KAYDET'}
        </button>
        <button type="button" className="btn" style={{ flex: 0.4, background: '#e2e8f0', height: '50px' }} onClick={onCancel}>İPTAL</button>
      </div>
    </form>
  );
};
